/**
 * Full-system test against the live database.
 *
 * Exercises the whole ceremony chain the way the day actually runs, then
 * restores every record it touched. Read-only checks are done first so a
 * failure early on does not leave state behind.
 *
 * Run: node --env-file=.env.local scripts/test-full-system.mjs
 */
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SITE = process.env.TEST_SITE ?? "http://localhost:4400";

let pass = 0;
let fail = 0;
const failures = [];

function check(name, ok, detail = "") {
  if (ok) {
    pass += 1;
    console.log(`  PASS  ${name}${detail ? `  ${detail}` : ""}`);
  } else {
    fail += 1;
    failures.push(name);
    console.log(`  FAIL  ${name}${detail ? `  ${detail}` : ""}`);
  }
}

function section(title) {
  console.log(`\n── ${title} ${"─".repeat(Math.max(0, 46 - title.length))}`);
}

// ── Auth ──────────────────────────────────────────────────
section("AUTH");

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

check("admin can sign in", Boolean(auth.access_token));
if (!auth.access_token) {
  console.log("\nCannot continue without a session.");
  process.exit(1);
}

const H = { apikey: KEY, Authorization: `Bearer ${auth.access_token}` };
const JH = { ...H, "Content-Type": "application/json" };
const ANON = { apikey: KEY, Authorization: `Bearer ${KEY}` };
const ANON_J = { ...ANON, "Content-Type": "application/json" };

const cookie = `sb-${URL_.split("//")[1].split(".")[0]}-auth-token=base64-${Buffer.from(
  JSON.stringify(auth),
).toString("base64")}`;

const [me] = await (
  await fetch(`${URL_}/rest/v1/volunteers?select=role&email=eq.${auth.user.email}`, { headers: H })
).json();
check("admin role assigned", me?.role === "admin", `role=${me?.role}`);

// ── Data ──────────────────────────────────────────────────
section("DATA");

const [count] = await (
  await fetch(`${URL_}/rest/v1/students?select=count`, { headers: { ...H, Prefer: "count=exact" } })
).json();
check("students loaded", count.count === 172, `${count.count} graduates`);

const depts = await (
  await fetch(`${URL_}/rest/v1/departments?select=code`, { headers: H })
).json();
check("departments loaded", depts.length === 5, `${depts.length} departments`);

const noToken = await (
  await fetch(`${URL_}/rest/v1/students?select=count&hub_token=is.null`, {
    headers: { ...H, Prefer: "count=exact" },
  })
).json();
check("every graduate has a QR token", noToken[0].count === 0);

const orphan = await (
  await fetch(`${URL_}/rest/v1/students?select=count&dept_code=not.in.(CS,EC,CE,EE,EL)`, {
    headers: { ...H, Prefer: "count=exact" },
  })
).json();
check("no orphaned departments", orphan[0].count === 0);

// ── Security ──────────────────────────────────────────────
section("SECURITY");

const anonStudents = await (
  await fetch(`${URL_}/rest/v1/students?select=id&limit=1000`, { headers: ANON })
).json();
check(
  "anon cannot enumerate the cohort",
  Array.isArray(anonStudents) && anonStudents.length < 50,
  `${Array.isArray(anonStudents) ? anonStudents.length : "?"} rows visible`,
);

const anonMedia = await (
  await fetch(`${URL_}/rest/v1/media?select=id&limit=100`, { headers: ANON })
).json();
check("anon cannot read the photo index", Array.isArray(anonMedia) && anonMedia.length === 0);

const anonToken = await fetch(`${URL_}/rest/v1/rpc/student_by_hub_token`, {
  method: "POST",
  headers: ANON_J,
  body: JSON.stringify({ p_token: "00000000-0000-0000-0000-000000000000" }),
});
check("anon cannot use the station lookup", anonToken.status === 401 || anonToken.status === 403);

const badHub = await (
  await fetch(`${URL_}/rest/v1/rpc/get_student_hub`, {
    method: "POST",
    headers: ANON_J,
    body: JSON.stringify({ p_token: "00000000-0000-0000-0000-000000000000" }),
  })
).json();
check("a wrong hub token reveals nothing", badHub === null);

/*
 * RLS filters an unauthorised UPDATE to zero rows and PostgREST still
 * answers 204, so the status code proves nothing. Verify the row itself
 * is unchanged instead.
 */
const [victim] = await (
  await fetch(`${URL_}/rest/v1/students?select=id,name,attendance&limit=1`, { headers: H })
).json();
await fetch(`${URL_}/rest/v1/students?id=eq.${victim.id}`, {
  method: "PATCH",
  headers: ANON_J,
  body: JSON.stringify({ attendance: true, name: "TAMPERED" }),
});
const [afterWrite] = await (
  await fetch(`${URL_}/rest/v1/students?select=name,attendance&id=eq.${victim.id}`, { headers: H })
).json();
check(
  "anon cannot write to students",
  afterWrite.name === victim.name && afterWrite.attendance === victim.attendance,
);

// ── Ceremony chain ────────────────────────────────────────
section("CEREMONY CHAIN");

const [subject] = await (
  await fetch(
    `${URL_}/rest/v1/students?select=id,name,reg_no,hub_token&attendance=eq.false&limit=1`,
    { headers: H },
  )
).json();
console.log(`  using ${subject.name} (${subject.reg_no})`);

const original = { attendance: false, stage_done: false, booth_done: false, lunch_done: false, certificate_done: false };

const rpc = async (fn, body) =>
  fetch(`${URL_}/rest/v1/rpc/${fn}`, { method: "POST", headers: JH, body: JSON.stringify(body) });

check("check in", (await rpc("check_in_student", { p_student_id: subject.id, p_station: "System test" })).ok);
check("stage complete", (await rpc("complete_stage", { p_student_id: subject.id, p_photos: 1 })).ok);

const assign = await rpc("assign_booth", { p_student_id: subject.id });
const assignBody = assign.ok ? await assign.json() : null;
const token = Array.isArray(assignBody) ? assignBody[0]?.token : assignBody?.token;
check("booth token issued", Boolean(token), token ?? "");

check("booth complete", (await rpc("complete_booth", { p_student_id: subject.id, p_photos: 2 })).ok);
check("lunch redeemed", (await rpc("redeem_lunch", { p_student_id: subject.id })).ok);

const dupLunch = await rpc("redeem_lunch", { p_student_id: subject.id });
check("duplicate lunch refused", !dupLunch.ok);

check("certificate collected", (await rpc("collect_certificate", { p_student_id: subject.id })).ok);
const dupCert = await rpc("collect_certificate", { p_student_id: subject.id });
check("duplicate certificate refused", !dupCert.ok);

// ── Graduate hub ──────────────────────────────────────────
section("GRADUATE HUB");

const hub = await (
  await fetch(`${URL_}/rest/v1/rpc/get_student_hub`, {
    method: "POST",
    headers: ANON_J,
    body: JSON.stringify({ p_token: subject.hub_token }),
  })
).json();

check("hub resolves from the QR token", hub?.student?.reg_no === subject.reg_no);
check("hub shows the completed journey", hub?.student?.certificate_done === true);
check("hub carries event details", Boolean(hub?.event?.college));

const [other] = await (
  await fetch(`${URL_}/rest/v1/students?select=hub_token&id=neq.${subject.id}&limit=1`, { headers: H })
).json();
const otherHub = await (
  await fetch(`${URL_}/rest/v1/rpc/get_student_hub`, {
    method: "POST",
    headers: ANON_J,
    body: JSON.stringify({ p_token: other.hub_token }),
  })
).json();
check("one graduate cannot see another", otherHub?.student?.reg_no !== subject.reg_no);

// ── Storage ───────────────────────────────────────────────
section("PHOTO STORAGE");

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const path = `booth/${subject.reg_no}/systemtest-${Date.now()}.jpg`;

const up = await fetch(`${URL_}/storage/v1/object/ceremony-photos/${path}`, {
  method: "POST",
  headers: { ...H, "Content-Type": "image/jpeg" },
  body: png,
});
check("photo uploads", up.ok);

const naked = await fetch(`${URL_}/storage/v1/object/ceremony-photos/${path}`);
check("bucket is private", !naked.ok, `unsigned request ${naked.status}`);

const signed = await (
  await fetch(`${URL_}/storage/v1/object/sign/ceremony-photos/${path}`, {
    method: "POST",
    headers: JH,
    body: JSON.stringify({ expiresIn: 60 }),
  })
).json();
const signedPath = signed.signedURL ?? signed.signedUrl;
check("signed URL issued", Boolean(signedPath));

if (signedPath) {
  const got = await fetch(`${URL_}/storage/v1${signedPath.replace(/^\/storage\/v1/, "")}`);
  check("signed URL is publicly fetchable", got.ok);
}

// ── Web routes ────────────────────────────────────────────
section("WEB ROUTES");

const route = async (p, opts = {}) => {
  try {
    const r = await fetch(`${SITE}${p}`, { redirect: "manual", ...opts });
    return r.status;
  } catch {
    return 0;
  }
};

for (const p of ["/", "/login", "/signup", "/display", "/booth-kiosk"]) {
  check(`public ${p}`, (await route(p)) === 200);
}

for (const p of ["/dashboard", "/students", "/qr-cards", "/photos"]) {
  const s = await route(p);
  check(`protected ${p} redirects`, s === 307 || s === 302, `http ${s}`);
}

for (const p of [
  "/dashboard", "/registration", "/stage", "/booth", "/queue", "/lunch",
  "/certificates", "/gallery", "/students", "/volunteers", "/reports",
  "/settings", "/qr-cards", "/photos",
]) {
  check(`signed-in ${p}`, (await route(p, { headers: { Cookie: cookie } })) === 200);
}

check(`hub /hub/[token]`, (await route(`/hub/${subject.hub_token}`)) === 200);

// ── Cleanup ───────────────────────────────────────────────
section("CLEANUP");

await fetch(`${URL_}/storage/v1/object/ceremony-photos/${path}`, { method: "DELETE", headers: H });
await fetch(`${URL_}/rest/v1/media?storage_path=eq.${encodeURIComponent(path)}`, { method: "DELETE", headers: H });
await fetch(`${URL_}/rest/v1/booth_queue?student_id=eq.${subject.id}`, { method: "DELETE", headers: H });
await fetch(`${URL_}/rest/v1/scans?station=eq.System test`, { method: "DELETE", headers: H });
await fetch(`${URL_}/rest/v1/stage_appearances?student_id=eq.${subject.id}`, { method: "DELETE", headers: H });
const restore = await fetch(`${URL_}/rest/v1/students?id=eq.${subject.id}`, {
  method: "PATCH",
  headers: JH,
  body: JSON.stringify({ ...original, stage: "registered", checked_in_at: null, photo_count: 0 }),
});
check("test graduate restored", restore.ok);

const [finalCount] = await (
  await fetch(`${URL_}/rest/v1/students?select=count`, { headers: { ...H, Prefer: "count=exact" } })
).json();
check("cohort intact", finalCount.count === 172, `${finalCount.count} graduates`);

// ── Result ────────────────────────────────────────────────
console.log(`\n${"═".repeat(52)}`);
console.log(`  ${pass} passed, ${fail} failed`);
if (fail) console.log(`  failures: ${failures.join(", ")}`);
console.log("═".repeat(52));
process.exit(fail ? 1 : 0);
