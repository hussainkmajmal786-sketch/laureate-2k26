/**
 * Completes a half-finished Google connection.
 *
 * The credentials are already in .env.local; only the browser consent is
 * missing. This starts the listener FIRST, then prints the link, so the
 * redirect always has somewhere to land — the usual cause of
 * "localhost refused to connect" is opening the link with nothing running.
 *
 * Run: node --env-file=.env.local scripts/finish-google.mjs
 */
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { google } from "googleapis";
import { Readable } from "node:stream";

const PORT = 5478;
const REDIRECT = `http://localhost:${PORT}/callback`;

const id = process.env.GOOGLE_OAUTH_CLIENT_ID;
const secret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

if (!id || !secret) {
  console.log("\n  No OAuth client in .env.local — run npm run setup:google first.\n");
  process.exit(1);
}

const oauth = new google.auth.OAuth2(id, secret, REDIRECT);

// Listener first. If the port is busy, say so plainly rather than
// printing a link that will fail.
const WAIT_MINUTES = 10;

const codePromise = new Promise((resolve, reject) => {
  const server = createServer((req, res) => {
    const url = new URL(req.url, REDIRECT);
    const code = url.searchParams.get("code");
    const err = url.searchParams.get("error");

    /*
     * Browsers fetch /favicon.ico alongside the callback. Answering that
     * with the success page — or worse, treating it as a failed callback —
     * would be misleading, so anything that is not the redirect is a 404
     * and the server keeps waiting for the real one.
     */
    if (!code && !err) {
      res.writeHead(404).end();
      return;
    }

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(
      `<body style="font-family:system-ui;padding:3rem;text-align:center;background:#0B0D14;color:#E8EDF9">
         <h2>${code ? "Connected." : "Cancelled."}</h2>
         <p style="color:#9AA8C7">Close this tab and return to the terminal.</p>
       </body>`,
    );

    server.close();
    if (code) resolve(code);
    else reject(new Error(err));
  });

  server.on("error", (e) =>
    reject(
      new Error(
        e.code === "EADDRINUSE"
          ? `Port ${PORT} is already in use. Close the other setup run and try again.`
          : e.message,
      ),
    ),
  );

  server.listen(PORT, () => {
    const url = oauth.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
    });

    console.log(`
  Listening on ${REDIRECT}  —  keep this window open.

  Your browser should open automatically. If it does not, paste this in
  and sign in as the account that should own the photos:

  ${url}

  If Google warns the app is unverified: Advanced -> Go to Laureate.
`);

    // Opening it here removes the copy-paste gap where the link was
    // opened after the listener had already gone.
    const opener =
      process.platform === "win32" ? ["cmd", ["/c", "start", "", url.replace(/&/g, "^&")]]
        : process.platform === "darwin" ? ["open", [url]]
        : ["xdg-open", [url]];
    try {
      spawn(opener[0], opener[1], { stdio: "ignore", detached: true }).unref();
    } catch {
      // Fine — the link is printed above.
    }

    let left = WAIT_MINUTES * 60;
    const tick = setInterval(() => {
      left -= 15;
      if (left <= 0) {
        clearInterval(tick);
        server.close();
        reject(new Error(`Timed out after ${WAIT_MINUTES} minutes with no response from Google.`));
      } else if (left % 60 === 0) {
        process.stdout.write(`  waiting… ${left / 60} min left\n`);
      }
    }, 15_000);
    tick.unref?.();
    server.on("close", () => clearInterval(tick));
  });
});

let code;
try {
  code = await codePromise;
} catch (e) {
  console.log(`\n  ${e.message}\n`);
  process.exit(1);
}

const { tokens } = await oauth.getToken(code);
oauth.setCredentials(tokens);

if (!tokens.refresh_token) {
  console.log(`
  Google returned no refresh token, which happens when this app was
  already authorised. Remove it at https://myaccount.google.com/permissions
  then run this again.
`);
  process.exit(1);
}

const me = await google.oauth2({ version: "v2", auth: oauth }).userinfo.get();
console.log(`  Signed in as ${me.data.email}`);

// Prove the account can actually store a file before saving anything.
const drive = google.drive({ version: "v3", auth: oauth });
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const probe = await drive.files.create({
  requestBody: { name: "laureate-connection-test.png" },
  media: { mimeType: "image/png", body: Readable.from(png) },
  fields: "id",
});
await drive.files.delete({ fileId: probe.data.id });
console.log("  Upload test passed — this account can store files.");

const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/*
 * Google issues a refresh token exactly once per authorisation. If storing
 * it fails here — wrong password, network blip — re-running this script
 * gets nothing back until the app is manually revoked in Google account
 * settings. So write it to disk the moment we have it: a mistyped password
 * should cost a retype, not a re-authorisation.
 */
const STASH = ".google-refresh-token.json";
writeFileSync(
  STASH,
  JSON.stringify(
    {
      account_email: me.data.email,
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token ?? null,
      expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      scope: tokens.scope ?? null,
    },
    null,
    2,
  ),
);
console.log(`  Refresh token saved to ${STASH} as a safety net.`);

/*
 * Console sign-in, so the token is stored under the admin's RLS identity.
 * Only open readline if we need to prompt — creating and closing an unused
 * interface trips a libuv assertion on Windows.
 */
const fromEnv = Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
const rl = fromEnv ? null : createInterface({ input: process.stdin, output: process.stdout });
const ask = async (q) => (await rl.question(q)).trim();

let session;
for (let attempt = 1; attempt <= 3; attempt += 1) {
  const email = process.env.ADMIN_EMAIL ?? (await ask("\n  Console admin email:    "));
  const password = process.env.ADMIN_PASSWORD ?? (await ask("  Console admin password: "));

  session = await (
    await fetch(`${SUPA}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
  ).json();

  if (session.access_token) break;

  console.log(`  Sign-in failed${attempt < 3 ? " — try again." : "."}`);
  if (fromEnv) break;
}
rl?.close();

/*
 * Sets exitCode and unwinds rather than calling process.exit(): exiting
 * while a TLS socket is still closing trips a libuv assertion on Node 24
 * for Windows, which would turn a recoverable "wrong password" into a
 * crash dump and hide the recovery instructions.
 */
class Halt extends Error {}

async function store() {
  if (!session?.access_token) {
    console.log(`
  Could not sign in to the console, so the token is not in the database
  yet — but it is safe in ${STASH}. Run  npm run store:google  once you
  have the right password. Do NOT re-run this script; Google will not
  issue a second refresh token.
`);
    process.exitCode = 1;
    throw new Halt();
  }

  const saved = await fetch(`${SUPA}/rest/v1/google_oauth`, {
    method: "POST",
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      id: 1,
      account_email: me.data.email,
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token ?? null,
      expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      scope: tokens.scope ?? null,
    }),
  });

  if (!saved.ok) {
    console.log(`
  Could not store the token: ${saved.status} ${await saved.text()}
  It is still safe in ${STASH} — run  npm run store:google  to retry.
`);
    process.exitCode = 1;
    return;
  }

  // In the database now, so the on-disk copy is a liability, not insurance.
  try {
    unlinkSync(STASH);
  } catch {
    // Never existed or already gone.
  }
  console.log("\n  Token stored. Drive uploads are live.\n");
}

try {
  await store();
} catch (e) {
  if (!(e instanceof Halt)) throw e;
}
