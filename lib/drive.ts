import "server-only";
import { google, type drive_v3 } from "googleapis";
import { Readable } from "node:stream";

/**
 * Google Drive integration for ceremony photos.
 *
 * Files live in Drive; the database records which file belongs to which
 * graduate. That mapping is what enforces "only their own photos" — Drive
 * itself cannot express per-graduate access.
 *
 * Credentials come from a Google Cloud service account. Nothing here runs
 * until they are set, and `isDriveConfigured()` lets callers degrade
 * gracefully instead of throwing.
 */

const SCOPES = ["https://www.googleapis.com/auth/drive"];

/** Folder tree created under the configured root. */
export const FOLDERS = {
  root: "Laureate 2K26",
  allMedia: "All Media",
  stage: "Stage",
  booth: "Photo Booth",
  candid: "Candid",
  group: "Group",
  /* One sub-folder per graduate, created on their first photo. */
  graduates: "Graduates",
} as const;

/**
 * Whether any Drive credential exists at all.
 *
 * Either route counts: OAuth (which can upload) or a service account
 * (which can read and create folders but never store a file).
 */
export function isDriveConfigured() {
  return Boolean(
    (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) ||
      (process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET),
  );
}

/**
 * The Drive client to use for writes.
 *
 * Prefers the connected Google account: a service account has no storage
 * quota and cannot upload to My Drive at all. Falls back to the service
 * account, which still works for reading and for folder creation.
 */
async function getWriteClient(): Promise<drive_v3.Drive> {
  try {
    const { canUploadToDrive, driveAsUser } = await import("./google-oauth");
    if (await canUploadToDrive()) return await driveAsUser();
  } catch {
    // OAuth unavailable; use the service account below.
  }
  return getClient();
}

function getClient(): drive_v3.Drive {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!email || !rawKey) {
    throw new Error("Google Drive is not configured.");
  }

  // Env vars store the PEM with literal \n; restore real newlines.
  const key = rawKey.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({ email, key, scopes: SCOPES });
  return google.drive({ version: "v3", auth });
}

/** Finds a folder by name under a parent, creating it when absent. */
async function ensureFolder(
  drive: drive_v3.Drive,
  name: string,
  parentId?: string,
): Promise<string> {
  const clauses = [
    "mimeType = 'application/vnd.google-apps.folder'",
    `name = '${name.replace(/'/g, "\\'")}'`,
    "trashed = false",
  ];
  if (parentId) clauses.push(`'${parentId}' in parents`);

  /*
   * corpora "allDrives" is needed for Shared Drives: without it the search
   * only covers the service account's own (empty) Drive, so an existing
   * folder inside a Shared Drive is not found and a duplicate is created.
   */
  const existing = await drive.files.list({
    q: clauses.join(" and "),
    fields: "files(id, name)",
    pageSize: 1,
    corpora: "allDrives",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const found = existing.data.files?.[0]?.id;
  if (found) return found;

  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      ...(parentId ? { parents: [parentId] } : {}),
    },
    fields: "id",
    supportsAllDrives: true,
  });

  if (!created.data.id) throw new Error(`Could not create folder "${name}"`);
  return created.data.id;
}

export interface DriveFolders {
  root: string;
  allMedia: string;
  stage: string;
  booth: string;
  candid: string;
  group: string;
  graduates: string;
}

/**
 * Builds (or finds) the event folder tree.
 *
 * A service account has no storage quota of its own, so `rootFolderId`
 * should be a folder in your Drive that you have shared with the service
 * account address as Editor.
 */
export async function ensureEventFolders(rootFolderId?: string): Promise<DriveFolders> {
  const drive = await getWriteClient();
  const parent = rootFolderId || process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

  const root = await ensureFolder(drive, FOLDERS.root, parent);
  const [allMedia, stage, booth, candid, group, graduates] = await Promise.all([
    ensureFolder(drive, FOLDERS.allMedia, root),
    ensureFolder(drive, FOLDERS.stage, root),
    ensureFolder(drive, FOLDERS.booth, root),
    ensureFolder(drive, FOLDERS.candid, root),
    ensureFolder(drive, FOLDERS.group, root),
    ensureFolder(drive, FOLDERS.graduates, root),
  ]);

  return { root, allMedia, stage, booth, candid, group, graduates };
}

/**
 * The folder that holds one graduate's photos, created on first capture.
 *
 * Named "NAME (REGNO)" so the folder list reads alphabetically by name
 * while staying unique - two graduates can share a name, but not a
 * register number.
 *
 * Concurrency is the real hazard here. Several photos of the same
 * graduate can be uploading at once, and ensureFolder is a list-then-
 * create with no atomicity, so two callers can both miss and both
 * create. Requests for the same graduate are therefore funnelled through
 * one in-flight promise, and after creating we re-check for a duplicate
 * that appeared in the gap and adopt the oldest.
 */
const folderInFlight = new Map<string, Promise<string>>();

export async function ensureStudentFolder(input: {
  name: string;
  regNo: string;
  parentId: string;
}): Promise<string> {
  const key = `${input.parentId}:${input.regNo}`;
  const running = folderInFlight.get(key);
  if (running) return running;

  const task = (async () => {
    const drive = await getWriteClient();
    // Drive treats "/" as a path separator in some clients; strip it.
    const safeName = `${input.name} (${input.regNo})`.replace(/[/\\]/g, "-").trim();
    const id = await ensureFolder(drive, safeName, input.parentId);

    /*
     * If a concurrent run created a second folder with the same name,
     * settle on the oldest so every caller agrees on one.
     */
    const dupes = await drive.files.list({
      q: [
        "mimeType = 'application/vnd.google-apps.folder'",
        `name = '${safeName.replace(/'/g, "\\'")}'`,
        `'${input.parentId}' in parents`,
        "trashed = false",
      ].join(" and "),
      fields: "files(id, createdTime)",
      orderBy: "createdTime",
      pageSize: 2,
      corpora: "allDrives",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    return dupes.data.files?.[0]?.id ?? id;
  })().finally(() => folderInFlight.delete(key));

  folderInFlight.set(key, task);
  return task;
}

export interface UploadedFile {
  id: string;
  viewUrl: string;
  thumbUrl: string;
  folderId: string;
}

/**
 * Uploads one photo and returns the links stored against the graduate.
 *
 * The file is made readable by link but is never listed publicly, and the
 * folder is not shared — so the only route to a photo is through a hub
 * that already knows the graduate's token.
 */
export async function uploadPhoto(input: {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  folderId: string;
  /** Second home for the "all media of the event" archive folder. */
  alsoInFolderId?: string;
}): Promise<UploadedFile> {
  const drive = await getWriteClient();

  /*
   * Create with exactly one parent. Drive no longer accepts multiple
   * parents at creation — it rejects the call with "Increasing the number
   * of parents is not allowed" — so the archive folder is added afterwards
   * with addParents, which is still supported.
   */
  const created = await drive.files.create({
    requestBody: { name: input.filename, parents: [input.folderId] },
    media: { mimeType: input.mimeType, body: Readable.from(input.buffer) },
    fields: "id, webViewLink, thumbnailLink",
    supportsAllDrives: true,
  });

  const id = created.data.id;
  if (!id) throw new Error("Drive did not return a file id");

  if (input.alsoInFolderId && input.alsoInFolderId !== input.folderId) {
    try {
      await drive.files.update({
        fileId: id,
        addParents: input.alsoInFolderId,
        fields: "id",
        supportsAllDrives: true,
      });
    } catch {
      // The photo is filed in its category folder either way; a missing
      // archive link is not worth failing the upload over.
    }
  }

  await drive.permissions.create({
    fileId: id,
    requestBody: { role: "reader", type: "anyone" },
    supportsAllDrives: true,
  });

  return {
    id,
    viewUrl: created.data.webViewLink ?? `https://drive.google.com/file/d/${id}/view`,
    // Stable render URL — thumbnailLink expires, this one does not.
    thumbUrl: `https://drive.google.com/thumbnail?id=${id}&sz=w1000`,
    folderId: input.folderId,
  };
}

/** Confirms credentials work and the root folder is reachable. */
export async function testDriveConnection(): Promise<{
  ok: boolean;
  error?: string;
  rootName?: string;
}> {
  if (!isDriveConfigured()) {
    return { ok: false, error: "No service account credentials set." };
  }

  try {
    const drive = getClient();
    const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

    if (rootId) {
      const meta = await drive.files.get({
        fileId: rootId,
        fields: "name, driveId",
        supportsAllDrives: true,
      });

      /*
       * Reachability is not enough. A service account has zero storage
       * quota, so it can only write into a Shared Drive, which owns its
       * own files. A shared personal folder accepts the share but refuses
       * every upload — worth saying plainly rather than failing later.
       */
      if (!meta.data.driveId) {
        return {
          ok: false,
          rootName: meta.data.name ?? undefined,
          error:
            "That folder is in a personal My Drive. A service account has no storage quota there, so photo uploads will be refused. Use a Shared Drive instead.",
        };
      }

      return { ok: true, rootName: meta.data.name ?? undefined };
    }

    await drive.files.list({ pageSize: 1, fields: "files(id)" });
    return { ok: true, rootName: "My Drive" };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes("invalid_grant")) {
      return { ok: false, error: "Credentials rejected — check the private key." };
    }
    if (message.includes("File not found")) {
      return {
        ok: false,
        error: "Root folder not found. Share it with the service account email as Editor.",
      };
    }
    return { ok: false, error: message };
  }
}
