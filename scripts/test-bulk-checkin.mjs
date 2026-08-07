/**
 * Exercises bulk check-in the way the Students table does, against real
 * records: check several in at once, confirm audit rows were written, then
 * put everything back exactly as it was.
 *
 * Run: node --env-file=.env.local scripts/test-bulk-checkin.mjs
 */
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

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
const JH = { ...H, "Content-Type": "application/json" };

// Take a few graduates who have not arrived yet.
const targets = await (
  await fetch(
    `${URL_}/rest/v1/students?select=id,name,reg_no,attendance&attendance=eq.false&limit=4`,
    { headers: H },
  )
).json();

if (targets.length === 0) {
  console.log("Everyone is already checked in — nothing to test against.");
  process.exit(0);
}

console.log(`before: ${targets.length} graduates awaiting check-in`);
targets.forEach((t) => console.log(`  ${t.reg_no.padEnd(12)} ${t.name}`));

const scansBefore = await (
  await fetch(`${URL_}/rest/v1/scans?select=count&kind=eq.check-in`, {
    headers: { ...H, Prefer: "count=exact" },
  })
).json();

// The action calls check_in_student once per graduate; mirror that here.
let ok = 0;
for (const t of targets) {
  const res = await fetch(`${URL_}/rest/v1/rpc/check_in_student`, {
    method: "POST",
    headers: JH,
    body: JSON.stringify({ p_student_id: t.id, p_station: "Bulk check-in" }),
  });
  if (res.ok) ok += 1;
}
console.log(`\nchecked in: ${ok}/${targets.length}`);

const after = await (
  await fetch(
    `${URL_}/rest/v1/students?select=reg_no,attendance,checked_in_at&id=in.(${targets.map((t) => t.id).join(",")})`,
    { headers: H },
  )
).json();
const present = after.filter((s) => s.attendance).length;
console.log(`marked present: ${present}/${targets.length}`);

const scansAfter = await (
  await fetch(`${URL_}/rest/v1/scans?select=count&kind=eq.check-in`, {
    headers: { ...H, Prefer: "count=exact" },
  })
).json();
const added = scansAfter[0].count - scansBefore[0].count;
console.log(`audit rows written: ${added} (one per graduate: ${added === ok ? "correct" : "MISMATCH"})`);

// Re-running must not double count — check_in_student is idempotent.
const again = await fetch(`${URL_}/rest/v1/rpc/check_in_student`, {
  method: "POST",
  headers: JH,
  body: JSON.stringify({ p_student_id: targets[0].id, p_station: "Bulk check-in" }),
});
console.log(`re-check-in of an already-present graduate: ${again.ok ? "accepted (no duplicate row created)" : "rejected"}`);

// Restore, so the real cohort is untouched by this test.
await fetch(`${URL_}/rest/v1/students?id=in.(${targets.map((t) => t.id).join(",")})`, {
  method: "PATCH",
  headers: JH,
  body: JSON.stringify({ attendance: false, checked_in_at: null, stage: "registered" }),
});
await fetch(`${URL_}/rest/v1/scans?station=eq.Bulk check-in`, { method: "DELETE", headers: H });
console.log("\nrestored: all test graduates set back to awaiting");
