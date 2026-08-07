/**
 * Proves the ceremony photo bucket works end to end: upload as an admin,
 * mint a signed URL, fetch it, then clean up.
 *
 * Run: node --env-file=.env.local scripts/test-storage.mjs
 */
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const BUCKET = "ceremony-photos";

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

if (!auth.access_token) {
  console.error("sign-in failed:", JSON.stringify(auth).slice(0, 140));
  process.exit(1);
}
console.log("signed in as", auth.user.email);

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const path = `stage/_test/${Date.now()}-connection-test.png`;

const up = await fetch(`${URL_}/storage/v1/object/${BUCKET}/${path}`, {
  method: "POST",
  headers: {
    apikey: KEY,
    Authorization: `Bearer ${auth.access_token}`,
    "Content-Type": "image/png",
  },
  body: png,
});

if (!up.ok) {
  console.error("UPLOAD FAILED:", up.status, (await up.text()).slice(0, 200));
  process.exit(1);
}
console.log("UPLOAD OK —", path);

const signed = await (
  await fetch(`${URL_}/storage/v1/object/sign/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${auth.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn: 60 }),
  })
).json();

if (!signed.signedURL && !signed.signedUrl) {
  console.error("SIGNING FAILED:", JSON.stringify(signed).slice(0, 160));
  process.exit(1);
}
const signedPath = signed.signedURL ?? signed.signedUrl;
console.log("SIGNED URL OK");

// A signed URL must work with no auth header at all — that is how a
// graduate's phone loads it.
const fetched = await fetch(`${URL_}/storage/v1${signedPath.replace(/^\/storage\/v1/, "")}`);
console.log(
  fetched.ok
    ? `PUBLIC FETCH OK — ${fetched.headers.get("content-type")}, ${(await fetched.arrayBuffer()).byteLength} bytes`
    : `PUBLIC FETCH FAILED — ${fetched.status}`,
);

// An unsigned request must be refused, or the bucket is not private.
const naked = await fetch(`${URL_}/storage/v1/object/${BUCKET}/${path}`);
console.log(
  naked.ok
    ? "WARNING: unsigned request succeeded — bucket is not private"
    : `PRIVACY OK — unsigned request refused (${naked.status})`,
);

await fetch(`${URL_}/storage/v1/object/${BUCKET}/${path}`, {
  method: "DELETE",
  headers: { apikey: KEY, Authorization: `Bearer ${auth.access_token}` },
});
console.log("CLEANUP OK");
