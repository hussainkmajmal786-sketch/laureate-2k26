/**
 * Stores an already-obtained Google refresh token in the database.
 *
 * Recovery path for when consent succeeded but the console sign-in did
 * not: finish-google.mjs writes the token to disk before attempting the
 * database write, and this picks it up from there. Separate script
 * because re-running the consent flow would NOT produce a second refresh
 * token — Google issues one per authorisation.
 *
 * Run: node --env-file=.env.local scripts/store-google.mjs
 */
import { readFileSync, unlinkSync, existsSync } from "node:fs";
import { createInterface } from "node:readline/promises";

const STASH = ".google-refresh-token.json";

/*
 * Stop with a failure code.
 *
 * process.exit() while a TLS socket is still closing trips a libuv
 * assertion on Node 24 for Windows, turning a clean "wrong password" into
 * a crash dump. Setting exitCode and throwing unwinds instead, letting the
 * handle finish closing on its own.
 */
class Halt extends Error {}
const halt = (message) => {
  console.log(message);
  process.exitCode = 1;
  throw new Halt();
};

async function main() {
  if (!existsSync(STASH)) {
    halt(`
  Nothing to store — ${STASH} does not exist.
  Run  npm run finish:google  to authorise an account first.
`);
  }

  const stashed = JSON.parse(readFileSync(STASH, "utf8"));
  if (!stashed.refresh_token) halt(`\n  ${STASH} has no refresh token in it.\n`);

  console.log(`\n  Token for ${stashed.account_email} ready to store.`);

  const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const ANON = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!SUPA || !ANON) {
    halt("\n  Supabase env vars missing — run with --env-file=.env.local\n");
  }

  /*
   * Only open readline if we actually need to prompt. An unused interface
   * still holds stdin open, which keeps the process alive after the work
   * is done.
   */
  const fromEnv = Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
  const rl = fromEnv ? null : createInterface({ input: process.stdin, output: process.stdout });
  const ask = async (q) => (await rl.question(q)).trim();

  let session;
  try {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const email = process.env.ADMIN_EMAIL ?? (await ask("  Console admin email:    "));
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
  } finally {
    rl?.close();
  }

  if (!session?.access_token) {
    halt(`\n  Still could not sign in. ${STASH} is untouched; try again later.\n`);
  }

  const saved = await fetch(`${SUPA}/rest/v1/google_oauth`, {
    method: "POST",
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({ id: 1, ...stashed }),
  });

  if (!saved.ok) {
    halt(`\n  Could not store it: ${saved.status} ${await saved.text()}\n  ${STASH} kept.\n`);
  }

  // In the database now, so the on-disk copy is a liability, not insurance.
  try {
    unlinkSync(STASH);
  } catch {
    // Already gone.
  }
  console.log("\n  Token stored. Drive uploads are live.\n");
}

try {
  await main();
} catch (e) {
  if (!(e instanceof Halt)) throw e;
}
