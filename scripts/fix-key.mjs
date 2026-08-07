/**
 * Collapses a multi-line PEM in .env.local into a single escaped line.
 *
 * dotenv reads one line per variable, so a key pasted with real newlines
 * is silently truncated at the first break and Google rejects it with
 * "invalid_grant". This rewrites it with literal \n sequences.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createPrivateKey } from "node:crypto";

const FILE = ".env.local";
const VAR = "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY";
const NL = String.fromCharCode(92) + "n"; // literal backslash-n

let text = readFileSync(FILE, "utf8");

const start = text.indexOf(`${VAR}="`);
if (start === -1) {
  console.error(`${VAR} not found in ${FILE}`);
  process.exit(1);
}

const endMark = "-----END PRIVATE KEY-----";
const endIdx = text.indexOf(endMark, start);
if (endIdx === -1) {
  console.error("No END PRIVATE KEY marker found.");
  process.exit(1);
}

// Everything through the closing quote after the END marker.
let after = text.indexOf('"', endIdx);
if (after === -1) after = endIdx + endMark.length;
const blockEnd = after + 1;

const raw = text
  .slice(start + VAR.length + 2, after)
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean)
  .join(NL);

const escaped = raw.endsWith(NL) ? raw : raw + NL;

text = text.slice(0, start) + `${VAR}="${escaped}"` + text.slice(blockEnd);
writeFileSync(FILE, text);

// Prove it round-trips into a usable key before declaring success.
const pem = escaped.split(NL).join("\n");
try {
  const key = createPrivateKey(pem);
  console.log(
    `VALID ${key.asymmetricKeyType.toUpperCase()} key, ${key.asymmetricKeyDetails.modulusLength}-bit`,
  );
} catch (e) {
  console.error("Key did not parse:", e.message);
  process.exit(1);
}
