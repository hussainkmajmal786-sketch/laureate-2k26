/**
 * Turns the official compering list into import SQL.
 *
 * Department comes from the register-number prefix (KGR22**CS**042), not the
 * Branch column — that column is blank or "NA" for most rows, while the
 * prefix is present and consistent on every single one.
 */
import XLSX from "xlsx";
import { writeFileSync } from "node:fs";

const DEPTS = {
  CS: { code: "CS", name: "Computer Science & Engineering", short: "Computer Science", color: "#2563eb", order: 1 },
  EC: { code: "EC", name: "Electronics & Communication",    short: "Electronics",      color: "#10b981", order: 2 },
  CE: { code: "CE", name: "Civil Engineering",              short: "Civil",            color: "#ec4899", order: 3 },
  EE: { code: "EE", name: "Electrical & Electronics",       short: "Electrical",       color: "#f59e0b", order: 4 },
  EL: { code: "EL", name: "Electrical & Computer Engineering", short: "Electrical & Computer", color: "#6d28d9", order: 5 },
};

const AWARDS = {
  "PROFICIENCY AWARD": "Proficiency Award",
  "ACADEMIC EXCELLENCE": "Academic Excellence",
  "OUTSTANDING PERFORMANCE": "Outstanding Performance",
};

const q = (v) => (v === null || v === undefined || v === "" ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const yes = (v) => String(v ?? "").trim().toLowerCase() === "yes";

const rows = XLSX.utils.sheet_to_json(
  XLSX.readFile("STUDENTS LIST-COMPERING.xlsx").Sheets.Sheet1,
  { header: 1, blankrows: false },
);

let section = null;
const students = new Map();

for (const [i, r] of rows.entries()) {
  if (i === 0) continue;
  if (r.length === 1) { section = String(r[0]).trim(); continue; }
  if (!(r.length > 3 && r[3])) continue;

  const reg = String(r[3]).replace(/\s+/g, "").toUpperCase();
  const m = reg.match(/([A-Z]{2})\d+$/);
  const dept = m && DEPTS[m[1]] ? m[1] : null;
  if (!dept) { console.warn("skipped, no department:", reg); continue; }

  const cgpaRaw = r[4];
  const cgpa = cgpaRaw !== undefined && cgpaRaw !== null && cgpaRaw !== "" && !isNaN(Number(cgpaRaw))
    ? Number(cgpaRaw) : null;

  const existing = students.get(reg);
  const award = AWARDS[section] ?? null;

  // Award sections list a student before their department block; keep the
  // award but let the department block supply the seat number.
  students.set(reg, {
    reg,
    name: String(r[1] ?? "").replace(/\s+/g, " ").trim(),
    dept,
    cgpa: cgpa ?? existing?.cgpa ?? null,
    honours: yes(r[5]) || existing?.honours || false,
    minor: yes(r[6]) || existing?.minor || false,
    father: String(r[7] ?? "").replace(/\s+/g, " ").trim() || null,
    mother: String(r[8] ?? "").replace(/\s+/g, " ").trim() || null,
    seat: award ? existing?.seat ?? null : Number(r[0]) || null,
    award: award ?? existing?.award ?? null,
  });
}

const list = [...students.values()];
const used = [...new Set(list.map((s) => s.dept))].sort((a, b) => DEPTS[a].order - DEPTS[b].order);

let sql = `-- ─────────────────────────────────────────────────────────────
-- Real cohort — Laureate 2K26
-- Generated from STUDENTS LIST-COMPERING.xlsx (the official
-- compering list). ${list.length} graduates across ${used.length} departments.
--
-- Department is derived from the register-number prefix, not the
-- Branch column: that column is blank or "NA" on most rows while the
-- prefix is present and consistent on all of them.
--
-- CGPA is only published for award winners in the source sheet, so it
-- is null for everyone else and the pass omits the line.
-- ─────────────────────────────────────────────────────────────

begin;

-- Clear the seeded demo cohort and everything derived from it.
delete from booth_queue;
delete from scans;
delete from media;
delete from stage_appearances;
delete from students;
delete from departments;

insert into departments (code, name, short, color, sort_order) values
${used.map((c) => {
  const d = DEPTS[c];
  return `  (${q(d.code)}, ${q(d.name)}, ${q(d.short)}, ${q(d.color)}, ${d.order})`;
}).join(",\n")};

insert into students
  (reg_no, name, dept_code, cgpa, batch, seat_no, honours, minor, award,
   father_name, mother_name, hue, stage, qr_issued)
values
${list.map((s) => `  (${q(s.reg)}, ${q(s.name)}, ${q(s.dept)}, ${s.cgpa ?? "null"}, '2022 - 2026', ${s.seat ?? "null"}, ${s.honours}, ${s.minor}, ${q(s.award)}, ${q(s.father)}, ${q(s.mother)}, ${Math.abs([...s.reg].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) | 0, 0)) % 360}, 'registered', true)`).join(",\n")};

-- Booths start clean for the real event.
update booths set current_student_id = null, current_token = null, served_today = 0;

commit;
`;

writeFileSync("supabase/migrations/20260807020000_real_cohort.sql", sql);

console.log("students:", list.length);
console.log("departments:", used.map((c) => `${c}=${list.filter((s) => s.dept === c).length}`).join(" "));
console.log("with cgpa:", list.filter((s) => s.cgpa !== null).length);
console.log("awards:", list.filter((s) => s.award).length);
console.log("honours:", list.filter((s) => s.honours).length, "minors:", list.filter((s) => s.minor).length);
console.log("sql bytes:", sql.length);
