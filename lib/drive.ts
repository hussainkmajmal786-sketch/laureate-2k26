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
} as const;

export function isDriveConfigured() {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
  );
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

  const existing = await drive.files.list({
    q: clauses.join(" and "),
    fields: "files(id, name)",
    pageSize: 1,
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
}

/**
 * Builds (or finds) the event folder tree.
 *
 * A service account has no storage quota of its own, so `rootFolderId`
 * should be a folder in your Drive that you have shared with the service
 * account address as Editor.
 */
export async function ensureEventFolders(rootFolderId?: string): Promise<DriveFolders> {
  const drive = getClient();
  const parent = rootFolderId || process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

  const root = await ensureFolder(drive, FOLDERS.root, parent);
  const [allMedia, stage, booth, candid, group] = await Promise.all([
    ensureFolder(drive, FOLDERS.allMedia, root),
    ensureFolder(drive, FOLDERS.stage, root),
    ensureFolder(drive, FOLDERS.booth, root),
    ensureFolder(drive, FOLDERS.candid, root),
    ensureFolder(drive, FOLDERS.group, root),
  ]);

  return { root, allMedia, stage, booth, candid, group };
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
  const drive = getClient();

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
        fields: "name",
        supportsAllDrives: true,
      });
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
