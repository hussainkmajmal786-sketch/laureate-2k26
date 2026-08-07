/**
 * Guided Google Drive setup.
 *
 * Everything that can be automated is: validating the credentials,
 * writing .env.local correctly, running the consent flow on a local
 * server, exchanging the code, storing the refresh token, and proving an
 * upload works end to end.
 *
 * The one step no script can do is creating the OAuth client — that needs
 * a signed-in human in the Google Cloud Console. This walks you to it and
 * takes over from there.
 *
 * Run: node --env-file=.env.local scripts/setup-google.mjs
 */
import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { google } from "googleapis";
import { Readable } from "node:stream";

const PORT = 5478;
const REDIRECT = `http://localhost:${PORT}/callback`;
const ENV = ".env.local";

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = async (q) => (await rl.question(q)).trim();

function readEnv() {
  if (!existsSync(ENV)) return {};
  const out = {};
  for (const line of readFileSync(ENV, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^"|"$/g, "");
  }
  return out;
}

function setEnv(key, value) {
  let text = existsSync(ENV) ? readFileSync(ENV, "utf8") : "";
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  text = re.test(text) ? text.replace(re, line) : `${text.replace(/\s*$/, "")}\n${line}\n`;
  writeFileSync(ENV, text);
}

console.log("\n  Google Drive setup for Laureate 2K26");
console.log("  " + "─".repeat(46));

let env = readEnv();
let clientId = env.GOOGLE_OAUTH_CLIENT_ID;
let clientSecret = env.GOOGLE_OAUTH_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.log(`
  One step needs you, because Google requires a signed-in human:

    1. Open  https://console.cloud.google.com/apis/credentials
    2. Make sure the project is  ieee-vc-cek-main
    3. Create credentials  ->  OAuth client ID  ->  Web application
    4. Under "Authorised redirect URIs" add BOTH of these:

         ${REDIRECT}
         http://localhost:3000/api/google/callback

    5. Create, then copy the two values it shows you.

  If it asks you to configure a consent screen first: choose Internal
  if offered, add your email as a test user, and scope drive.file.
`);

  clientId = await ask("  Paste the Client ID:     ");
  clientSecret = await ask("  Paste the Client secret: ");

  if (!clientId || !clientSecret) {
    console.log("\n  Nothing pasted — stopping without changing anything.\n");
    rl.close();
    process.exit(1);
  }

  setEnv("GOOGLE_OAUTH_CLIENT_ID", clientId);
  setEnv("GOOGLE_OAUTH_CLIENT_SECRET", clientSecret);
  console.log("\n  Saved to .env.local");
}

// ── Consent, handled locally ───────────────────────────────
const oauth = new google.auth.OAuth2(clientId, clientSecret, REDIRECT);
const url = oauth.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/userinfo.email",
  ],
});

console.log(`
  Now open this link and sign in as the account that should own the
  photos (mediateam@ce-kgr.org). If Google warns the app is unverified,
  choose Advanced -> Go to Laureate.

  ${url}
`);

const code = await new Promise((resolve) => {
  const server = createServer((req, res) => {
    const got = new URL(req.url, `http://localhost:${PORT}`).searchParams.get("code");
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(
      `<body style="font-family:system-ui;padding:3rem;text-align:center">
         <h2>${got ? "Connected." : "No code received."}</h2>
         <p>You can close this tab and return to the terminal.</p>
       </body>`,
    );
    if (got) {
      server.close();
      resolve(got);
    }
  });
  server.listen(PORT, () => console.log(`  Waiting for you to approve…\n`));
});

const { tokens } = await oauth.getToken(code);
oauth.setCredentials(tokens);

if (!tokens.refresh_token) {
  console.log(`
  Google did not return a refresh token, which happens when this app was
  already authorised. Remove it at https://myaccount.google.com/permissions
  and run this again.
`);
  rl.close();
  process.exit(1);
}

const me = await google.oauth2({ version: "v2", auth: oauth }).userinfo.get();
console.log(`  Signed in as ${me.data.email}`);

// ── Prove it can actually upload ───────────────────────────
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

// ── Store the token where the app reads it ─────────────────
const SUPA = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const email = process.env.ADMIN_EMAIL ?? (await ask("\n  Console admin email:    "));
const password = process.env.ADMIN_PASSWORD ?? (await ask("  Console admin password: "));

const session = await (
  await fetch(`${SUPA}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
).json();

if (!session.access_token) {
  console.log("\n  Could not sign in to the console — token not stored.\n");
  rl.close();
  process.exit(1);
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

console.log(
  saved.ok
    ? "  Token stored. Drive uploads are live."
    : `  Could not store the token: ${saved.status}`,
);

console.log(`
  ${"─".repeat(46)}
  Done. Restart the dev server and photos will upload to Drive.

  Before deploying, add the same two values to Vercel and add
  https://<your-domain>/api/google/callback to the redirect URIs.
`);

rl.close();
