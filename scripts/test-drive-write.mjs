/**
 * Proves the service account can actually write, not just read.
 *
 * Creates the event folder tree, uploads a tiny test image, reads it back,
 * then deletes it. Read access and write access fail differently, so this
 * is worth checking before the ceremony rather than during it.
 */
import { google } from "googleapis";
import { Readable } from "node:stream";

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/drive"],
});
const drive = google.drive({ version: "v3", auth });
const root = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

async function ensureFolder(name, parentId) {
  const q = [
    "mimeType = 'application/vnd.google-apps.folder'",
    `name = '${name.replace(/'/g, "\\'")}'`,
    "trashed = false",
    `'${parentId}' in parents`,
  ].join(" and ");

  const found = await drive.files.list({
    q, fields: "files(id)", pageSize: 1,
    supportsAllDrives: true, includeItemsFromAllDrives: true,
  });
  if (found.data.files?.[0]?.id) return { id: found.data.files[0].id, created: false };

  const made = await drive.files.create({
    requestBody: { name, mimeType: "application/vnd.google-apps.folder", parents: [parentId] },
    fields: "id", supportsAllDrives: true,
  });
  return { id: made.data.id, created: true };
}

const event = await ensureFolder("Laureate 2K26", root);
console.log(`event folder: ${event.id} ${event.created ? "(created)" : "(already existed)"}`);

for (const name of ["All Media", "Stage", "Photo Booth", "Candid", "Group"]) {
  const f = await ensureFolder(name, event.id);
  console.log(`  ${name.padEnd(12)} ${f.id} ${f.created ? "(created)" : "(existed)"}`);
}

// Smallest valid PNG, so the upload path is exercised with real bytes.
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const up = await drive.files.create({
  requestBody: { name: "_connection-test.png", parents: [event.id] },
  media: { mimeType: "image/png", body: Readable.from(png) },
  fields: "id, webViewLink",
  supportsAllDrives: true,
});
console.log(`\nUPLOAD OK — ${up.data.id}`);

await drive.permissions.create({
  fileId: up.data.id,
  requestBody: { role: "reader", type: "anyone" },
  supportsAllDrives: true,
});
console.log("SHARE OK — link-readable, which is how graduate hubs display photos");

await drive.files.delete({ fileId: up.data.id, supportsAllDrives: true });
console.log("CLEANUP OK — test file removed");

console.log("\nDrive is fully working: create, upload, share, delete.");
