/**
 * Verifies the Drive service account end to end: authenticate, then list
 * what it can actually see. Run with `node --env-file=.env.local`.
 */
import { google } from "googleapis";

const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

if (!email || !rawKey) {
  console.error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or _PRIVATE_KEY");
  process.exit(1);
}

const auth = new google.auth.JWT({
  email,
  key: rawKey.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/drive"],
});

console.log("service account:", email);

try {
  await auth.authorize();
  console.log("AUTH OK — Google accepted the key");
} catch (e) {
  console.error("AUTH FAILED:", e.message);
  if (String(e.message).includes("invalid_grant")) {
    console.error("  The key is malformed or has been revoked.");
  }
  process.exit(1);
}

const drive = google.drive({ version: "v3", auth });

if (rootId) {
  try {
    const meta = await drive.files.get({
      fileId: rootId,
      fields: "id, name, mimeType",
      supportsAllDrives: true,
    });
    console.log(`ROOT FOLDER OK — "${meta.data.name}"`);
  } catch (e) {
    console.error("ROOT FOLDER NOT REACHABLE:", e.message);
    console.error(`  Share that folder with ${email} as Editor.`);
    process.exit(1);
  }
} else {
  console.log("no GOOGLE_DRIVE_ROOT_FOLDER_ID set");
}

const shared = await drive.files.list({
  q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false",
  fields: "files(id, name)",
  pageSize: 10,
  supportsAllDrives: true,
  includeItemsFromAllDrives: true,
});

const files = shared.data.files ?? [];
console.log(`folders visible to the service account: ${files.length}`);
files.forEach((f) => console.log(`  - ${f.name}  (${f.id})`));

if (files.length === 0 && !rootId) {
  console.log(
    "\nNothing shared yet. Create your event folder in Drive, then share it\n" +
      `with ${email} as Editor and put its id in GOOGLE_DRIVE_ROOT_FOLDER_ID.`,
  );
}
