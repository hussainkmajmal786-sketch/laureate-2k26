/**
 * Proves the full camera path: capture a photo against a graduate, confirm
 * it reaches Supabase Storage, Google Drive, and that graduate's hub.
 *
 * Run: node --env-file=.env.local scripts/test-capture-to-drive.mjs
 */
import { google } from "googleapis";
import { Readable } from "node:stream";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const auth = await (
  await fetch(`${URL_}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    }),
  })
).json();

const H = { apikey: KEY, Authorization: `Bearer ${auth.access_token}` };
const JH = { ...H, "Content-Type": "application/json" };

const [student] = await (
  await fetch(`${URL_}/rest/v1/students?select=id,name,reg_no,dept_code,hue,hub_token&limit=1`, {
    headers: H,
  })
).json();
console.log(`graduate: ${student.name} (${student.reg_no})\n`);

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const filename = `drivetest-${Date.now()}.jpg`;
const path = `booth/${student.reg_no}/${filename}`;

// 1 — Storage, exactly as the shutter does it.
const up = await fetch(`${URL_}/storage/v1/object/ceremony-photos/${path}`, {
  method: "POST",
  headers: { ...H, "Content-Type": "image/jpeg" },
  body: png,
});
console.log(up.ok ? "1. STORAGE   photo stored" : `1. STORAGE   FAILED ${up.status}`);

const [media] = await (
  await fetch(`${URL_}/rest/v1/media`, {
    method: "POST",
    headers: { ...JH, Prefer: "return=representation" },
    body: JSON.stringify({
      student_id: student.id,
      title: student.name,
      category: "Booth",
      dept_code: student.dept_code,
      photographer: "Drive test",
      hue: student.hue,
      ratio: 1,
      storage_path: path,
      storage_bucket: "ceremony-photos",
      captured_at: new Date().toISOString(),
    }),
  })
).json();
console.log("2. DATABASE  linked to the graduate");

/*
 * 3 — Drive, as the capture mirror actually does it.
 *
 * The connected user account, not the service account: a service account
 * has no storage quota and cannot hold a file at all. Folders are
 * created when missing, exactly like ensureEventFolders, because under
 * the drive.file scope the app only ever sees what it made itself.
 */
const [oauthRow] = await (
  await fetch(`${URL_}/rest/v1/google_oauth?select=refresh_token&id=eq.1`, { headers: H })
).json();

if (!oauthRow?.refresh_token) {
  console.log("3. DRIVE     SKIPPED — no Google account connected");
  process.exitCode = 1;
}

const oauth = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
);
oauth.setCredentials({ refresh_token: oauthRow.refresh_token });
const drive = google.drive({ version: "v3", auth: oauth });

const ensureFolder = async (name, parent) => {
  const q = [
    "mimeType='application/vnd.google-apps.folder'",
    `name='${name.replace(/'/g, "\\'")}'`,
    "trashed=false",
    ...(parent ? [`'${parent}' in parents`] : []),
  ].join(" and ");

  const r = await drive.files.list({
    q,
    fields: "files(id)",
    pageSize: 1,
    corpora: "allDrives",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  if (r.data.files?.[0]?.id) return r.data.files[0].id;

  const c = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      ...(parent ? { parents: [parent] } : {}),
    },
    fields: "id",
    supportsAllDrives: true,
  });
  return c.data.id;
};

const root = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || undefined;
const event = await ensureFolder("Laureate 2K26", root);
const booth = await ensureFolder("Photo Booth", event);
const allMedia = await ensureFolder("All Media", event);
// The graduate's own folder is where the photo primarily lives.
const graduates = await ensureFolder("Graduates", event);
const ownFolder = await ensureFolder(`${student.name} (${student.reg_no})`, graduates);

let driveId = null;
try {
  const created = await drive.files.create({
    requestBody: { name: filename, parents: [ownFolder] },
    media: { mimeType: "image/jpeg", body: Readable.from(png) },
    fields: "id, webViewLink, parents",
    supportsAllDrives: true,
  });
  driveId = created.data.id;
  // Drive rejects multiple parents at creation; add the station folder after.
  await drive.files.update({ fileId: driveId, addParents: booth, fields: "id", supportsAllDrives: true });
  await drive.permissions.create({
    fileId: driveId,
    requestBody: { role: "reader", type: "anyone" },
    supportsAllDrives: true,
  });
  await fetch(`${URL_}/rest/v1/media?id=eq.${media.id}`, {
    method: "PATCH",
    headers: JH,
    body: JSON.stringify({
      drive_file_id: driveId,
      drive_view_url: created.data.webViewLink,
      drive_thumb_url: `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`,
    }),
  });
  const filed = created.data.parents?.[0] === ownFolder;
  console.log(
    filed
      ? `3. DRIVE     filed under "${student.name} (${student.reg_no})" + Photo Booth`
      : "3. DRIVE     uploaded, but NOT in the graduate's folder",
  );
} catch (e) {
  console.log(`3. DRIVE     FAILED — ${e.message.slice(0, 90)}`);
}

// 4 — The graduate's own hub, fetched anonymously with their token.
const hub = await (
  await fetch(`${URL_}/rest/v1/rpc/get_student_hub`, {
    method: "POST",
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_token: student.hub_token }),
  })
).json();

const mine = (hub?.photos ?? []).find((p) => p.storage_path === path);
console.log(mine ? "4. HUB       visible to the graduate" : "4. HUB       NOT VISIBLE");

// 5 — And invisible to anyone else.
const [other] = await (
  await fetch(`${URL_}/rest/v1/students?select=hub_token&id=neq.${student.id}&limit=1`, {
    headers: H,
  })
).json();
const otherHub = await (
  await fetch(`${URL_}/rest/v1/rpc/get_student_hub`, {
    method: "POST",
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_token: other.hub_token }),
  })
).json();
const leaked = (otherHub?.photos ?? []).some((p) => p.storage_path === path);
console.log(leaked ? "5. PRIVACY   LEAKED to another graduate" : "5. PRIVACY   invisible to others");

// Cleanup
if (driveId) await drive.files.delete({ fileId: driveId, supportsAllDrives: true }).catch(() => {});
await fetch(`${URL_}/rest/v1/media?id=eq.${media.id}`, { method: "DELETE", headers: H });
await fetch(`${URL_}/storage/v1/object/ceremony-photos/${path}`, { method: "DELETE", headers: H });
console.log("\ncleaned up");
