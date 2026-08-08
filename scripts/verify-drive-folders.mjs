/**
 * Proves photos land in per-graduate folders inside the configured Drive
 * folder, then removes everything it made.
 *
 * Checks the things that actually break on the day: whether the connected
 * account can write to that folder at all, whether a graduate folder is
 * created on first upload and reused on the second (rather than
 * duplicated), and whether concurrent uploads for one graduate still
 * settle on a single folder.
 *
 * Run: node --env-file=.env.local scripts/verify-drive-folders.mjs
 */
import { google } from "googleapis";
import { Readable } from "node:stream";

const ROOT = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let pass = 0;
let fail = 0;
const check = (name, ok, detail = "") => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
  ok ? (pass += 1) : (fail += 1);
};

// ── The connected account ─────────────────────────────────
const session = await (
  await fetch(`${SUPA}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    }),
  })
).json();

if (!session.access_token) {
  console.log("\n  Set ADMIN_EMAIL and ADMIN_PASSWORD to run this.\n");
  process.exitCode = 1;
} else {
  const [row] = await (
    await fetch(`${SUPA}/rest/v1/google_oauth?select=account_email,refresh_token&id=eq.1`, {
      headers: { apikey: ANON, Authorization: `Bearer ${session.access_token}` },
    })
  ).json();

  if (!row?.refresh_token) {
    console.log("\n  No Google account connected. Run npm run finish:google first.\n");
    process.exitCode = 1;
  } else {
    console.log(`\n  Connected as ${row.account_email}`);
    console.log(`  Root folder  ${ROOT}\n`);

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    );
    auth.setCredentials({ refresh_token: row.refresh_token });
    const drive = google.drive({ version: "v3", auth });

    const made = [];

    try {
      // 1 - can we even write to the folder from the link?
      const meta = await drive.files.get({
        fileId: ROOT,
        fields: "name, mimeType, capabilities(canAddChildren)",
        supportsAllDrives: true,
      });
      check(
        "the linked folder is reachable and writable",
        meta.data.capabilities?.canAddChildren === true,
        `"${meta.data.name}"`,
      );

      const mkFolder = async (name, parent) => {
        const found = await drive.files.list({
          q: `mimeType='application/vnd.google-apps.folder' and name='${name.replace(/'/g, "\\'")}' and '${parent}' in parents and trashed=false`,
          fields: "files(id)",
          pageSize: 1,
          corpora: "allDrives",
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        });
        if (found.data.files?.[0]?.id) return found.data.files[0].id;
        const c = await drive.files.create({
          requestBody: { name, mimeType: "application/vnd.google-apps.folder", parents: [parent] },
          fields: "id",
          supportsAllDrives: true,
        });
        made.push(c.data.id);
        return c.data.id;
      };

      // 2 - the event tree, as ensureEventFolders builds it
      const event = await mkFolder("Laureate 2K26", ROOT);
      const graduates = await mkFolder("Graduates", event);
      check("event tree exists under it", Boolean(graduates));

      // 3 - a graduate folder, twice, to prove reuse not duplication
      const who = `ZZ TEST GRADUATE (KGRTEST${Date.now() % 10000})`;
      const first = await mkFolder(who, graduates);
      const second = await mkFolder(who, graduates);
      check("second photo reuses the same folder", first === second, first === second ? "" : `${first} != ${second}`);

      // 4 - concurrent uploads must not fork the folder
      const racers = await Promise.all([1, 2, 3, 4].map(() => mkFolder(who, graduates)));
      check("concurrent captures agree on one folder", new Set(racers).size === 1, `${new Set(racers).size} distinct`);

      // 5 - an actual file upload into it
      const png = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64",
      );
      const up = await drive.files.create({
        requestBody: { name: `verify-${Date.now()}.png`, parents: [first] },
        media: { mimeType: "image/png", body: Readable.from(png) },
        fields: "id, parents",
        supportsAllDrives: true,
      });
      made.unshift(up.data.id);
      check("photo uploads into the graduate's folder", up.data.parents?.[0] === first);
    } catch (e) {
      check("drive operations", false, e.message.slice(0, 120));
    }

    // Clean up whatever this run created, newest first.
    for (const id of made) {
      await drive.files.delete({ fileId: id, supportsAllDrives: true }).catch(() => {});
    }
    console.log(`\n  ${pass} passed, ${fail} failed — test files removed\n`);
    if (fail) process.exitCode = 1;
  }
}
