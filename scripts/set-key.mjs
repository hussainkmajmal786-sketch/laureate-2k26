/**
 * Reads a Google service-account JSON key file and writes its values into
 * .env.local, escaping the PEM onto one line.
 *
 * Usage:  node scripts/set-key.mjs path/to/key.json
 *
 * Use this instead of pasting a key into chat or into the env file by
 * hand: the private key never leaves your machine, and the escaping is
 * done correctly (dotenv reads one line per variable, so a PEM with real
 * newlines is silently truncated and Google rejects it as invalid_grant).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createPrivateKey } from "node:crypto";

const src = process.argv[2];
if (!src) {
  console.error("Usage: node scripts/set-key.mjs <service-account.json>");
  process.exit(1);
}
if (!existsSync(src)) {
  console.error(`No such file: ${src}`);
  process.exit(1);
}

const json = JSON.parse(readFileSync(src, "utf8"));
if (!json.private_key || !json.client_email) {
  console.error("That JSON has no private_key / client_email.");
  process.exit(1);
}

// Fail before writing anything if the key is not usable.
try {
  const k = createPrivateKey(json.private_key);
  console.log(`key parsed: ${k.asymmetricKeyType.toUpperCase()} ${k.asymmetricKeyDetails.modulusLength}-bit`);
} catch (e) {
  console.error("Key did not parse:", e.message);
  process.exit(1);
}

const NL = String.fromCharCode(92) + "n";
const escaped = json.private_key.split("\n").join(NL);

let env = existsSync(".env.local") ? readFileSync(".env.local", "utf8") : "";

/** Replaces a variable in place, or appends it when absent. */
function setVar(text, name, value) {
  // Matches the whole logical line, including a multi-line quoted value.
  const re = new RegExp(`^${name}=(?:"[^"]*"|.*)$`, "ms");
  const line = `${name}=${value}`;
  return re.test(text) ? text.replace(re, line) : `${text.replace(/\s*$/, "")}\n${line}\n`;
}

env = setVar(env, "GOOGLE_SERVICE_ACCOUNT_EMAIL", json.client_email);
env = setVar(env, "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY", `"${escaped}"`);
if (!/^GOOGLE_DRIVE_ROOT_FOLDER_ID=/m.test(env)) {
  env += "GOOGLE_DRIVE_ROOT_FOLDER_ID=\n";
}

writeFileSync(".env.local", env);

console.log(`wrote .env.local for ${json.client_email}`);
console.log(`key id: ${json.private_key_id?.slice(0, 8)}…`);
console.log("\nDelete the JSON file now — it is no longer needed:");
console.log(`  rm "${src}"`);
