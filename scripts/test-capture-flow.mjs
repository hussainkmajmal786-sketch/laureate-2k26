/**
 * Walks the whole photo path the way the booth does it:
 * pick a graduate, store a photo under their folder, record the media row,
 * then read it back through the graduate's own hub token.
 *
 * Run: node --env-file=.env.local scripts/test-capture-flow.mjs
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

const H = { apikey: KEY, Authorization: `Bearer ${auth.access_token}` };
const JSON_H = { ...H, "Content-Type": "application/json" };

const [student] = await (
  await fetch(`${URL_}/rest/v1/students?select=id,name,reg_no,dept_code,hue,hub_token&limit=1`, {
    headers: H,
  })
).json();

console.log(`graduate: ${student.name} (${student.reg_no})`);

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const path = `booth/${student.reg_no}/${Date.now()}-flow-test.jpg`;

const up = await fetch(`${URL_}/storage/v1/object/${BUCKET}/${path}`, {
  method: "POST",
  headers: { ...H, "Content-Type": "image/jpeg" },
  body: png,
});
console.log(up.ok ? `1. STORED    ${path}` : `1. STORE FAILED ${up.status}`);
if (!up.ok) process.exit(1);

const row = await fetch(`${URL_}/rest/v1/media`, {
  method: "POST",
  headers: { ...JSON_H, Prefer: "return=representation" },
  body: JSON.stringify({
    student_id: student.id,
    title: student.name,
    category: "Booth",
    dept_code: student.dept_code,
    photographer: "Flow test",
    hue: student.hue,
    ratio: 1,
    storage_path: path,
    storage_bucket: BUCKET,
    captured_at: new Date().toISOString(),
  }),
});
const [media] = await row.json();
console.log(row.ok ? `2. LINKED    media row ${media.id}` : `2. LINK FAILED`);

// The graduate's own view, fetched anonymously with just their token.
const hub = await (
  await fetch(`${URL_}/rest/v1/rpc/get_student_hub`, {
    method: "POST",
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_token: student.hub_token }),
  })
).json();

const mine = (hub?.photos ?? []).find((p) => p.storage_path === path);
console.log(mine ? "3. IN HUB    photo visible to the graduate" : "3. NOT IN HUB");

// Someone else's token must not see it.
const [other] = await (
  await fetch(
    `${URL_}/rest/v1/students?select=hub_token&id=neq.${student.id}&limit=1`,
    { headers: H },
  )
).json();
const otherHub = await (
  await fetch(`${URL_}/rest/v1/rpc/get_student_hub`, {
    method: "POST",
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_token: other.hub_token }),
  })
).json();
const leaked = (otherHub?.photos ?? []).some((p) => p.storage_path === path);
console.log(leaked ? "4. LEAK — another graduate can see it" : "4. PRIVACY OK — invisible to others");

await fetch(`${URL_}/rest/v1/media?id=eq.${media.id}`, { method: "DELETE", headers: H });
await fetch(`${URL_}/storage/v1/object/${BUCKET}/${path}`, { method: "DELETE", headers: H });
console.log("5. CLEANED UP");
