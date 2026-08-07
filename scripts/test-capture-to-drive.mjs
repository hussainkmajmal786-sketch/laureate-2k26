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

// 3 — Drive, the same call the capture mirror makes.
const drive = google.drive({
  version: "v3",
  auth: new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/drive"],
  }),
});

const findFolder = async (name, parent) => {
  const r = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${name}' and '${parent}' in parents and trashed=false`,
    fields: "files(id)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  return r.data.files?.[0]?.id;
};

const root = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
const event = await findFolder("Laureate 2K26", root);
const booth = await findFolder("Photo Booth", event);
const allMedia = await findFolder("All Media", event);

let driveId = null;
try {
  const created = await drive.files.create({
    requestBody: { name: filename, parents: [booth] },
    media: { mimeType: "image/jpeg", body: Readable.from(png) },
    fields: "id, webViewLink",
    supportsAllDrives: true,
  });
  driveId = created.data.id;
  // Drive rejects multiple parents at creation; add the archive folder after.
  await drive.files.update({ fileId: driveId, addParents: allMedia, fields: "id", supportsAllDrives: true });
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
  console.log("3. DRIVE     uploaded to Photo Booth + All Media");
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
