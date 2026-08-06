import { mulberry32, hueFrom } from "./utils";

/* ─────────────────────────────────────────────────────────────
   Mock data for Laureate 2K26 — College of Engineering Kidangoor
   All generation is seeded so SSR and hydration agree exactly.
   ───────────────────────────────────────────────────────────── */

export type DeptCode = "CSE" | "ECE" | "EEE" | "ME" | "CE" | "IT" | "AIDS";

export interface Department {
  code: DeptCode;
  name: string;
  short: string;
  color: string;
  total: number;
}

export const DEPARTMENTS: Department[] = [
  { code: "CSE", name: "Computer Science & Engineering", short: "Computer Science", color: "#2563EB", total: 468 },
  { code: "ECE", name: "Electronics & Communication", short: "Electronics", color: "#10B981", total: 392 },
  { code: "EEE", name: "Electrical & Electronics", short: "Electrical", color: "#F59E0B", total: 318 },
  { code: "ME", name: "Mechanical Engineering", short: "Mechanical", color: "#8B5CF6", total: 296 },
  { code: "CE", name: "Civil Engineering", short: "Civil", color: "#EC4899", total: 241 },
  { code: "IT", name: "Information Technology", short: "Info. Tech", color: "#06B6D4", total: 187 },
  { code: "AIDS", name: "AI & Data Science", short: "AI & Data Sci.", color: "#EF4444", total: 145 },
];

export const TOTAL_GRADUATES = DEPARTMENTS.reduce((s, d) => s + d.total, 0); // 2047

export type Stage = "registered" | "checked-in" | "waiting" | "on-stage" | "stage-done" | "booth" | "complete";

export interface Student {
  id: string;
  regNo: string;
  name: string;
  dept: DeptCode;
  deptName: string;
  cgpa: number;
  stage: Stage;
  qrIssued: boolean;
  attendance: boolean;
  stageDone: boolean;
  boothDone: boolean;
  lunchDone: boolean;
  certificateDone: boolean;
  checkedInAt: string | null;
  photoCount: number;
  hue: number;
  phone: string;
  batch: string;
}

const FIRST = [
  "Aadhil", "Aarcha", "Abhinav", "Adithyan", "Aiswarya", "Akhil", "Alan", "Aleena", "Amal", "Ananya",
  "Anjana", "Anoop", "Arjun", "Ashna", "Athira", "Bhagya", "Christo", "Devika", "Dhanya", "Fathima",
  "Gautham", "Gopika", "Hari", "Irfan", "Jaseem", "Jishnu", "Joel", "Kavya", "Krishna", "Lakshmi",
  "Manu", "Meenakshi", "Muhammed", "Nandana", "Navaneeth", "Nikhil", "Nithya", "Parvathy", "Praveen", "Rahul",
  "Ravi", "Reshma", "Rohith", "Sandra", "Sanjay", "Sarath", "Shafeeq", "Sneha", "Sreelakshmi", "Sujith",
  "Thejus", "Vaishnav", "Varsha", "Vishnu", "Yadhu", "Zaid", "Nafeesa", "Elizabeth", "Tomy", "Ashwin",
];

const LAST = [
  "Nair", "Menon", "Pillai", "Kurup", "Varma", "Thomas", "Joseph", "Mathew", "George", "Jacob",
  "Rahman", "Basheer", "Salim", "Hussain", "Krishnan", "Raj", "Kumar", "Das", "Panicker", "Warrier",
  "Chandran", "Mohan", "Prasad", "Suresh", "Vijayan", "Anil", "Babu", "Sebastian", "Philip", "Antony",
];

function nameFor(rand: () => number) {
  const f = FIRST[Math.floor(rand() * FIRST.length)];
  const l = LAST[Math.floor(rand() * LAST.length)];
  // ~30% get a middle initial — Kerala naming convention
  const mid = rand() < 0.3 ? ` ${String.fromCharCode(65 + Math.floor(rand() * 26))}.` : "";
  return `${f}${mid} ${l}`;
}

/** Progression funnel — what fraction of the cohort has reached each phase. */
export const FUNNEL = {
  checkedIn: 0.742,
  stageDone: 0.514,
  boothDone: 0.387,
  lunchDone: 0.331,
  certificateDone: 0.286,
};

function buildStudents(): Student[] {
  const out: Student[] = [];
  let serial = 0;

  for (const dept of DEPARTMENTS) {
    for (let i = 0; i < dept.total; i++) {
      serial++;
      const rand = mulberry32(serial * 7919 + dept.code.charCodeAt(0) * 104729);
      const name = nameFor(rand);
      const roll = String(i + 1).padStart(3, "0");
      const regNo = `CEK22${dept.code}${roll}`;

      const r = rand();
      const checkedIn = r < FUNNEL.checkedIn;
      const stageDone = r < FUNNEL.stageDone;
      const boothDone = r < FUNNEL.boothDone;
      const lunchDone = r < FUNNEL.lunchDone;
      const certificateDone = r < FUNNEL.certificateDone;

      let stage: Stage = "registered";
      if (certificateDone) stage = "complete";
      else if (boothDone) stage = "booth";
      else if (stageDone) stage = "stage-done";
      else if (checkedIn && r < FUNNEL.checkedIn - 0.18) stage = "waiting";
      else if (checkedIn) stage = "checked-in";

      // A handful are literally on stage right now
      if (serial % 683 === 0) stage = "on-stage";

      const hour = 8 + Math.floor(rand() * 4);
      const minute = Math.floor(rand() * 60);

      out.push({
        id: `stu-${serial}`,
        regNo,
        name,
        dept: dept.code,
        deptName: dept.short,
        cgpa: Number((6.4 + rand() * 3.5).toFixed(2)),
        stage,
        qrIssued: rand() < 0.966,
        attendance: checkedIn,
        stageDone,
        boothDone,
        lunchDone,
        certificateDone,
        checkedInAt: checkedIn
          ? `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
          : null,
        photoCount: boothDone ? 3 + Math.floor(rand() * 9) : stageDone ? 1 + Math.floor(rand() * 2) : 0,
        hue: hueFrom(name + regNo),
        phone: `+91 ${90000 + Math.floor(rand() * 9999)} ${10000 + Math.floor(rand() * 89999)}`,
        batch: "2022 – 2026",
      });
    }
  }
  return out;
}

let _students: Student[] | null = null;
export function getStudents(): Student[] {
  if (!_students) _students = buildStudents();
  return _students;
}

export function getStudent(id: string): Student | undefined {
  return getStudents().find((s) => s.id === id);
}

/** Deterministic "pick a student" used by scanner simulations. */
export function pickStudent(nth: number, filter?: (s: Student) => boolean): Student {
  const pool = filter ? getStudents().filter(filter) : getStudents();
  return pool[(nth * 137) % pool.length];
}

/* ── Live KPI snapshot ─────────────────────────────────────── */

export interface Kpi {
  key: string;
  label: string;
  value: number;
  total?: number;
  delta: number;
  tone: "accent" | "ok" | "warn" | "bad" | "neutral";
  icon: string;
  hint: string;
}

export const KPIS: Kpi[] = [
  { key: "total", label: "Total Graduates", value: TOTAL_GRADUATES, delta: 0, tone: "neutral", icon: "GraduationCap", hint: "Across 7 departments" },
  { key: "checkedin", label: "Checked In", value: 1519, total: TOTAL_GRADUATES, delta: 4.2, tone: "ok", icon: "UserCheck", hint: "74% attendance" },
  { key: "waiting", label: "Waiting", value: 214, delta: -2.1, tone: "warn", icon: "Hourglass", hint: "In holding area" },
  { key: "onstage", label: "On Stage", value: 3, delta: 0, tone: "accent", icon: "Award", hint: "Live right now" },
  { key: "stagephotos", label: "Stage Photos", value: 1052, delta: 6.8, tone: "accent", icon: "Camera", hint: "Captured & synced" },
  { key: "boothqueue", label: "Booth Queue", value: 47, delta: 1.4, tone: "warn", icon: "Users", hint: "Across 2 booths" },
  { key: "lunch", label: "Lunch Completed", value: 678, total: TOTAL_GRADUATES, delta: 9.3, tone: "ok", icon: "UtensilsCrossed", hint: "Coupons redeemed" },
  { key: "certificates", label: "Certificates", value: 586, total: TOTAL_GRADUATES, delta: 5.6, tone: "ok", icon: "ScrollText", hint: "Distributed" },
];

/* ── Event timeline ────────────────────────────────────────── */

export interface TimelineItem {
  time: string;
  title: string;
  detail: string;
  status: "done" | "active" | "upcoming";
}

export const TIMELINE: TimelineItem[] = [
  { time: "07:30", title: "Venue Setup Complete", detail: "Stage, booths and registration desks live", status: "done" },
  { time: "08:00", title: "Registration Opened", detail: "6 desks · QR check-in active", status: "done" },
  { time: "09:15", title: "Inaugural Address", detail: "Principal Dr. K. Ramachandran", status: "done" },
  { time: "10:00", title: "Degree Conferral — Session I", detail: "CSE · ECE · IT — 1,047 graduates", status: "done" },
  { time: "11:30", title: "Degree Conferral — Session II", detail: "EEE · ME — in progress, 62% complete", status: "active" },
  { time: "13:00", title: "Lunch Service", detail: "Dining hall · 4 counters", status: "upcoming" },
  { time: "14:30", title: "Degree Conferral — Session III", detail: "CE · AIDS — 386 graduates", status: "upcoming" },
  { time: "16:00", title: "Group Photograph", detail: "Main quadrangle, all departments", status: "upcoming" },
  { time: "17:00", title: "Valedictory & Close", detail: "Certificate desk closes at 18:00", status: "upcoming" },
];

/* ── Booths & queues ───────────────────────────────────────── */

export interface QueueEntry {
  token: string;
  student: Student;
  waitMin: number;
}

export interface Booth {
  id: number;
  name: string;
  photographer: string;
  status: "active" | "paused";
  current: Student | null;
  currentToken: string;
  servedToday: number;
  avgMinutes: number;
  queue: QueueEntry[];
}

function buildBooths(): Booth[] {
  const pool = getStudents().filter((s) => s.stageDone && !s.boothDone);
  const mk = (id: number, name: string, photographer: string, offset: number, size: number, avg: number): Booth => {
    const queue: QueueEntry[] = Array.from({ length: size }, (_, i) => ({
      token: `B${id}-${String(offset + i + 2).padStart(3, "0")}`,
      student: pool[(offset + i * 13) % pool.length],
      waitMin: (i + 1) * avg,
    }));
    return {
      id,
      name,
      photographer,
      status: "active",
      current: pool[offset % pool.length],
      currentToken: `B${id}-${String(offset + 1).padStart(3, "0")}`,
      servedToday: id === 1 ? 412 : 379,
      avgMinutes: avg,
      queue,
    };
  };
  return [
    mk(1, "Booth 1 — North Wing", "Arun Photography", 41, 12, 3),
    mk(2, "Booth 2 — Auditorium Foyer", "Frames by Nithin", 233, 9, 4),
  ];
}

let _booths: Booth[] | null = null;
export function getBooths(): Booth[] {
  if (!_booths) _booths = buildBooths();
  return _booths;
}

/* ── Volunteers ────────────────────────────────────────────── */

export interface Volunteer {
  id: string;
  name: string;
  role: string;
  station: string;
  online: boolean;
  scansToday: number;
  avgSeconds: number;
  shiftEnds: string;
  hue: number;
}

export const VOLUNTEERS: Volunteer[] = [
  { id: "v1", name: "Anagha Krishnan", role: "Registration Lead", station: "Desk 1 — Main Gate", online: true, scansToday: 312, avgSeconds: 11, shiftEnds: "14:00", hue: 214 },
  { id: "v2", name: "Rohith Menon", role: "Stage Coordinator", station: "Stage Left", online: true, scansToday: 198, avgSeconds: 24, shiftEnds: "17:00", hue: 158 },
  { id: "v3", name: "Fathima Rahman", role: "Booth Operator", station: "Photo Booth 1", online: true, scansToday: 412, avgSeconds: 9, shiftEnds: "16:30", hue: 38 },
  { id: "v4", name: "Jishnu Pillai", role: "Booth Operator", station: "Photo Booth 2", online: true, scansToday: 379, avgSeconds: 10, shiftEnds: "16:30", hue: 280 },
  { id: "v5", name: "Sneha Varma", role: "Lunch Counter", station: "Dining Hall A", online: true, scansToday: 288, avgSeconds: 7, shiftEnds: "15:00", hue: 330 },
  { id: "v6", name: "Amal Sebastian", role: "Certificate Desk", station: "Hall B", online: false, scansToday: 156, avgSeconds: 19, shiftEnds: "13:00", hue: 190 },
  { id: "v7", name: "Devika Nair", role: "Queue Marshal", station: "Holding Area", online: true, scansToday: 94, avgSeconds: 32, shiftEnds: "17:00", hue: 12 },
  { id: "v8", name: "Thejus Kurup", role: "Media Runner", station: "Roaming", online: false, scansToday: 61, avgSeconds: 45, shiftEnds: "12:30", hue: 260 },
  { id: "v9", name: "Aleena Joseph", role: "Registration", station: "Desk 3 — Main Gate", online: true, scansToday: 267, avgSeconds: 12, shiftEnds: "14:00", hue: 96 },
  { id: "v10", name: "Sarath Chandran", role: "Accessibility Support", station: "Roaming", online: true, scansToday: 38, avgSeconds: 88, shiftEnds: "18:00", hue: 240 },
];

/* ── Activity feeds ────────────────────────────────────────── */

export interface Activity {
  id: string;
  actor: string;
  action: string;
  subject: string;
  minutesAgo: number;
  tone: "accent" | "ok" | "warn" | "neutral";
}

export const VOLUNTEER_ACTIVITY: Activity[] = [
  { id: "a1", actor: "Fathima Rahman", action: "completed booth session for", subject: "Aiswarya Nair · CEK22CSE118", minutesAgo: 0.4, tone: "ok" },
  { id: "a2", actor: "Rohith Menon", action: "marked stage complete for", subject: "Vishnu Prasad · CEK22ME044", minutesAgo: 1.2, tone: "accent" },
  { id: "a3", actor: "Anagha Krishnan", action: "checked in", subject: "12 graduates from ECE", minutesAgo: 2.8, tone: "ok" },
  { id: "a4", actor: "Sneha Varma", action: "redeemed lunch for", subject: "Krishna Menon · CEK22EEE201", minutesAgo: 4.1, tone: "neutral" },
  { id: "a5", actor: "Devika Nair", action: "flagged queue backlog at", subject: "Photo Booth 2 — 9 waiting", minutesAgo: 6.5, tone: "warn" },
  { id: "a6", actor: "Jishnu Pillai", action: "uploaded 4 photos for", subject: "Sandra Thomas · CEK22IT073", minutesAgo: 8.2, tone: "accent" },
  { id: "a7", actor: "Amal Sebastian", action: "handed certificate to", subject: "Nikhil Kumar · CEK22CE092", minutesAgo: 11.7, tone: "ok" },
  { id: "a8", actor: "Anagha Krishnan", action: "reissued QR badge for", subject: "Meenakshi Warrier · CEK22CSE310", minutesAgo: 14.3, tone: "warn" },
];

export const STUDENT_ACTIVITY: Activity[] = [
  { id: "s1", actor: "Athira Pillai", action: "completed", subject: "Photo Booth 1 session", minutesAgo: 0.2, tone: "ok" },
  { id: "s2", actor: "Muhammed Basheer", action: "walked", subject: "the stage — Session II", minutesAgo: 0.9, tone: "accent" },
  { id: "s3", actor: "Gopika Suresh", action: "collected", subject: "degree certificate", minutesAgo: 2.1, tone: "ok" },
  { id: "s4", actor: "Alan George", action: "joined queue for", subject: "Photo Booth 2 — token B2-014", minutesAgo: 3.4, tone: "neutral" },
  { id: "s5", actor: "Nandana Kurup", action: "checked in at", subject: "Registration Desk 3", minutesAgo: 5.0, tone: "ok" },
  { id: "s6", actor: "Yadhu Krishnan", action: "redeemed", subject: "lunch coupon — Counter A", minutesAgo: 7.6, tone: "neutral" },
  { id: "s7", actor: "Reshma Antony", action: "is", subject: "ready for stage — called", minutesAgo: 9.9, tone: "warn" },
];

/* ── Media gallery ─────────────────────────────────────────── */

export interface MediaItem {
  id: string;
  title: string;
  category: "Stage" | "Booth" | "Candid" | "Group";
  dept: DeptCode;
  photographer: string;
  ratio: number; // height / width
  hue: number;
  time: string;
  likes: number;
}

const PHOTOGRAPHERS = ["Arun Photography", "Frames by Nithin", "CEK Media Cell", "Studio Aperture", "Lensfolk Kerala"];

export function getMedia(): MediaItem[] {
  const cats: MediaItem["category"][] = ["Stage", "Booth", "Candid", "Group"];
  const ratios = [0.72, 1.0, 1.28, 1.5, 0.85, 1.15];
  return Array.from({ length: 42 }, (_, i) => {
    const rand = mulberry32(i * 6151 + 17);
    const dept = DEPARTMENTS[Math.floor(rand() * DEPARTMENTS.length)];
    const cat = cats[Math.floor(rand() * cats.length)];
    const stu = pickStudent(i * 3 + 5);
    return {
      id: `m-${i}`,
      title: cat === "Group" ? `${dept.short} — Class of 2026` : stu.name,
      category: cat,
      dept: dept.code,
      photographer: PHOTOGRAPHERS[Math.floor(rand() * PHOTOGRAPHERS.length)],
      ratio: ratios[Math.floor(rand() * ratios.length)],
      hue: hueFrom(stu.name + i),
      time: `${String(9 + Math.floor(rand() * 5)).padStart(2, "0")}:${String(Math.floor(rand() * 60)).padStart(2, "0")}`,
      likes: Math.floor(rand() * 180) + 4,
    };
  });
}

/* ── Analytics series ──────────────────────────────────────── */

export const HOURLY_FLOW = [
  { hour: "08:00", checkin: 186, stage: 0, booth: 0, lunch: 0 },
  { hour: "09:00", checkin: 342, stage: 48, booth: 12, lunch: 0 },
  { hour: "10:00", checkin: 411, stage: 214, booth: 96, lunch: 0 },
  { hour: "11:00", checkin: 298, stage: 341, booth: 204, lunch: 0 },
  { hour: "12:00", checkin: 182, stage: 289, booth: 241, lunch: 118 },
  { hour: "13:00", checkin: 64, stage: 112, booth: 178, lunch: 386 },
  { hour: "14:00", checkin: 36, stage: 48, booth: 61, lunch: 174 },
];

export const QUEUE_TIMES = [
  { hour: "08:00", booth1: 2, booth2: 3, stage: 4 },
  { hour: "09:00", booth1: 5, booth2: 6, stage: 7 },
  { hour: "10:00", booth1: 11, booth2: 14, stage: 12 },
  { hour: "11:00", booth1: 18, booth2: 22, stage: 16 },
  { hour: "12:00", booth1: 14, booth2: 19, stage: 11 },
  { hour: "13:00", booth1: 8, booth2: 10, stage: 6 },
  { hour: "14:00", booth1: 5, booth2: 7, stage: 4 },
];

export function departmentStats() {
  const students = getStudents();
  return DEPARTMENTS.map((d) => {
    const rows = students.filter((s) => s.dept === d.code);
    return {
      code: d.code,
      name: d.short,
      color: d.color,
      total: rows.length,
      checkedIn: rows.filter((s) => s.attendance).length,
      stage: rows.filter((s) => s.stageDone).length,
      booth: rows.filter((s) => s.boothDone).length,
      lunch: rows.filter((s) => s.lunchDone).length,
      certificate: rows.filter((s) => s.certificateDone).length,
    };
  });
}

/* ── Announcements (TV ticker) ─────────────────────────────── */

export const ANNOUNCEMENTS = [
  "Session II degree conferral in progress — EEE and Mechanical graduates please assemble at Holding Area B.",
  "Photo Booth 2 is experiencing a short delay. Estimated wait is 22 minutes.",
  "Lunch service opens at 13:00 in the main dining hall. Please carry your QR badge.",
  "Family members are requested to remain seated during the conferral ceremony.",
  "Certificate collection desk is open at Hall B until 18:00.",
  "Lost and found is located beside Registration Desk 1.",
];

export const EVENT = {
  name: "Laureate 2K26",
  college: "College of Engineering Kidangoor",
  tagline: "Graduation Management System",
  date: "6 August 2026",
  venue: "Main Auditorium & Quadrangle, CEK Campus",
  status: "Session II — Live" as const,
};
