/** Inserts the real cohort through the REST API, in batches. */
import XLSX from "xlsx";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const auth = await (await fetch(`${URL}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: KEY, "Content-Type": "application/json" },
  // Credentials come from the environment; never commit them.
  body: JSON.stringify({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  }),
})).json();
if (!auth.access_token) throw new Error("sign-in failed: " + JSON.stringify(auth).slice(0, 120));

const DEPTS = new Set(["CS", "EC", "CE", "EE", "EL"]);
const AWARDS = {
  "PROFICIENCY AWARD": "Proficiency Award",
  "ACADEMIC EXCELLENCE": "Academic Excellence",
  "OUTSTANDING PERFORMANCE": "Outstanding Performance",
};
const yes = (v) => String(v ?? "").trim().toLowerCase() === "yes";
const hue = (s) => Math.abs([...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0)) % 360;

const rows = XLSX.utils.sheet_to_json(
  XLSX.readFile("STUDENTS LIST-COMPERING.xlsx").Sheets.Sheet1,
  { header: 1, blankrows: false },
);

let section = null;
const map = new Map();

for (const [i, r] of rows.entries()) {
  if (i === 0) continue;
  if (r.length === 1) { section = String(r[0]).trim(); continue; }
  if (!(r.length > 3 && r[3])) continue;

  const reg = String(r[3]).replace(/\s+/g, "").toUpperCase();
  const m = reg.match(/([A-Z]{2})\d+$/);
  if (!m || !DEPTS.has(m[1])) { console.warn("skipped:", reg); continue; }

  const raw = r[4];
  const cgpa = raw !== undefined && raw !== null && raw !== "" && !isNaN(Number(raw)) ? Number(raw) : null;
  const award = AWARDS[section] ?? null;
  const prev = map.get(reg);

  map.set(reg, {
    reg_no: reg,
    name: String(r[1] ?? "").replace(/\s+/g, " ").trim(),
    dept_code: m[1],
    cgpa: cgpa ?? prev?.cgpa ?? null,
    batch: "2022 - 2026",
    seat_no: award ? (prev?.seat_no ?? null) : (Number(r[0]) || null),
    honours: yes(r[5]) || prev?.honours || false,
    minor: yes(r[6]) || prev?.minor || false,
    award: award ?? prev?.award ?? null,
    father_name: String(r[7] ?? "").replace(/\s+/g, " ").trim() || null,
    mother_name: String(r[8] ?? "").replace(/\s+/g, " ").trim() || null,
    hue: hue(reg),
    stage: "registered",
    qr_issued: true,
  });
}

const list = [...map.values()];
let done = 0;

for (let i = 0; i < list.length; i += 50) {
  const batch = list.slice(i, i + 50);
  const res = await fetch(`${URL}/rest/v1/students`, {
    method: "POST",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${auth.access_token}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(batch),
  });
  if (!res.ok) { console.error("batch failed:", res.status, (await res.text()).slice(0, 200)); process.exit(1); }
  done += batch.length;
  console.log(`inserted ${done}/${list.length}`);
}
