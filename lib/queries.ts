import "server-only";
import { createClient } from "./supabase/server";
import type {
  AnnouncementRow,
  BoothStatus,
  DepartmentRow,
  DepartmentStats,
  EventSettingsRow,
  EventStats,
  HourlyFlow,
  MediaRow,
  RecentActivity,
  StudentRow,
  TimelineRow,
  VolunteerRow,
} from "./supabase/types";

/* ─────────────────────────────────────────────────────────────
   Read queries. Every one runs as the signed-in volunteer, so RLS
   decides what comes back.
   ───────────────────────────────────────────────────────────── */

export async function getEventSettings(): Promise<EventSettingsRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("event_settings").select("*").eq("id", 1).maybeSingle();
  return data;
}

export async function getDepartments(): Promise<DepartmentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("departments").select("*").order("sort_order");
  return data ?? [];
}

export async function getEventStats(): Promise<EventStats | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("event_stats").select("*").maybeSingle();
  return data;
}

export async function getDepartmentStats(): Promise<DepartmentStats[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("department_stats").select("*").order("sort_order");
  return data ?? [];
}

export async function getBoothStatus(): Promise<BoothStatus[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("booth_status").select("*").order("id");
  return data ?? [];
}

export interface QueueEntryRow {
  id: string;
  booth_id: number;
  token: string;
  position: number;
  student: Pick<StudentRow, "id" | "name" | "reg_no" | "hue" | "dept_code">;
}

export async function getBoothQueues(): Promise<QueueEntryRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("booth_queue")
    .select("id, booth_id, token, position, student:students(id, name, reg_no, hue, dept_code)")
    .eq("served", false)
    .order("booth_id")
    .order("position");
  return (data ?? []) as unknown as QueueEntryRow[];
}

export async function getTimeline(): Promise<TimelineRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("timeline_items").select("*").order("sort_order");
  return data ?? [];
}

export async function getAnnouncements(): Promise<AnnouncementRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select("*")
    .eq("active", true)
    .order("sort_order");
  return data ?? [];
}

export async function getRecentActivity(limit = 12): Promise<RecentActivity[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("recent_activity").select("*").limit(limit);
  return data ?? [];
}

export async function getHourlyFlow(): Promise<HourlyFlow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("hourly_flow").select("*");
  return data ?? [];
}

export async function getVolunteers(): Promise<VolunteerRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("volunteers").select("*").order("name");
  return data ?? [];
}

export interface StudentFilters {
  search?: string;
  dept?: string;
  status?: "all" | "checked-in" | "waiting" | "complete";
  page?: number;
  perPage?: number;
}

export async function getStudents(filters: StudentFilters = {}) {
  const { search, dept, status = "all", page = 1, perPage = 12 } = filters;
  const supabase = await createClient();

  let query = supabase.from("students").select("*", { count: "exact" });

  if (dept && dept !== "all") query = query.eq("dept_code", dept);
  if (status === "checked-in") query = query.eq("attendance", true);
  if (status === "waiting") query = query.eq("attendance", false);
  if (status === "complete") query = query.eq("certificate_done", true);

  if (search?.trim()) {
    const term = search.trim();
    query = query.or(`name.ilike.%${term}%,reg_no.ilike.%${term}%`);
  }

  const from = (page - 1) * perPage;
  const { data, count } = await query
    .order("reg_no")
    .range(from, from + perPage - 1);

  return { students: data ?? [], total: count ?? 0 };
}

/** Resolves a scanned badge. Accepts a register number or a student UUID. */
export async function findStudentByCode(code: string): Promise<StudentRow | null> {
  const supabase = await createClient();
  const term = code.trim();
  if (!term) return null;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(term);
  const { data } = isUuid
    ? await supabase.from("students").select("*").eq("id", term).maybeSingle()
    : await supabase.from("students").select("*").ilike("reg_no", term).maybeSingle();

  return data;
}

export async function getStudentById(id: string): Promise<StudentRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("students").select("*").eq("id", id).maybeSingle();
  return data;
}

/** Next graduates due on stage — checked in but not yet walked. */
export async function getStageQueue(limit = 8): Promise<StudentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("students")
    .select("*")
    .eq("attendance", true)
    .eq("stage_done", false)
    .order("reg_no")
    .limit(limit);
  return data ?? [];
}

export interface MediaFilters {
  category?: string;
  dept?: string;
  photographer?: string;
}

export async function getMedia(filters: MediaFilters = {}): Promise<MediaRow[]> {
  const supabase = await createClient();
  let query = supabase.from("media").select("*").order("captured_at", { ascending: false });

  if (filters.category && filters.category !== "all") {
    query = query.eq("category", filters.category as MediaRow["category"]);
  }
  if (filters.dept && filters.dept !== "all") query = query.eq("dept_code", filters.dept);
  if (filters.photographer && filters.photographer !== "all") {
    query = query.eq("photographer", filters.photographer);
  }

  const { data } = await query.limit(60);
  return data ?? [];
}

export async function getPhotographers(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("media").select("photographer");
  return [...new Set((data ?? []).map((m) => m.photographer))].sort();
}

/** Scan counts by kind for today — used for per-station stat tiles. */
export async function getScanCounts() {
  const supabase = await createClient();
  const { data } = await supabase.from("scans").select("kind");
  const counts: Record<string, number> = {};
  for (const row of data ?? []) counts[row.kind] = (counts[row.kind] ?? 0) + 1;
  return counts;
}
