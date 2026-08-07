"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { StudentRow, TablesUpdate } from "./supabase/types";

export interface ActionResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

/** Turns a Postgres error into something a volunteer can act on. */
function friendly(message: string): string {
  if (message.includes("ALREADY_REDEEMED")) return "This lunch coupon was already redeemed today.";
  if (message.includes("ALREADY_COLLECTED")) return "This certificate was already collected.";
  if (message.includes("Student not found")) return "No graduate matches that badge.";
  if (message.includes("row-level security") || message.includes("permission denied")) {
    return "Your role does not permit this action.";
  }
  if (message.includes("No active booth")) return "No booth is currently active.";
  return message;
}

/* ── Registration ────────────────────────────────────────── */

export async function checkInStudent(studentId: string, station?: string): Promise<ActionResult<StudentRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("check_in_student", {
    p_student_id: studentId,
    p_station: station,
  });

  if (error) return { ok: false, error: friendly(error.message) };

  revalidatePath("/registration");
  revalidatePath("/dashboard");
  revalidatePath("/students");
  return { ok: true, data: data as StudentRow };
}

/* ── Stage ───────────────────────────────────────────────── */

/**
 * Opens a stage appearance window. Bulk photo import matches an EXIF
 * timestamp against these windows, so calling this when a graduate is
 * announced is what makes after-the-fact photo matching possible.
 */
export async function startStageAppearance(studentId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  // Close any window left open by a previous graduate.
  await supabase
    .from("stage_appearances")
    .update({ ended_at: new Date().toISOString() })
    .is("ended_at", null);

  const { error } = await supabase.from("stage_appearances").insert({
    student_id: studentId,
    volunteer_id: auth.user?.id ?? null,
  });

  if (error) return { ok: false, error: friendly(error.message) };
  return { ok: true };
}

export async function completeStage(studentId: string, photos = 1): Promise<ActionResult<StudentRow>> {
  const supabase = await createClient();

  // Close this graduate's appearance window before recording completion.
  await supabase
    .from("stage_appearances")
    .update({ ended_at: new Date().toISOString() })
    .eq("student_id", studentId)
    .is("ended_at", null);

  const { data, error } = await supabase.rpc("complete_stage", {
    p_student_id: studentId,
    p_photos: photos,
  });

  if (error) return { ok: false, error: friendly(error.message) };

  revalidatePath("/stage");
  revalidatePath("/dashboard");
  revalidatePath("/queue");
  return { ok: true, data: data as StudentRow };
}

/* ── Booth ───────────────────────────────────────────────── */

export async function assignBooth(
  studentId: string,
): Promise<ActionResult<{ booth_id: number; token: string; est_wait: number }>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("assign_booth", { p_student_id: studentId });

  if (error) return { ok: false, error: friendly(error.message) };

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { ok: false, error: "Could not assign a booth." };

  revalidatePath("/queue");
  revalidatePath("/booth");
  revalidatePath("/display");
  return { ok: true, data: row };
}

export async function completeBooth(studentId: string, photos = 0): Promise<ActionResult<StudentRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("complete_booth", {
    p_student_id: studentId,
    p_photos: photos,
  });

  if (error) return { ok: false, error: friendly(error.message) };

  revalidatePath("/booth");
  revalidatePath("/queue");
  revalidatePath("/dashboard");
  revalidatePath("/display");
  return { ok: true, data: data as StudentRow };
}

/* ── Lunch & certificates ────────────────────────────────── */

export async function redeemLunch(studentId: string): Promise<ActionResult<StudentRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("redeem_lunch", { p_student_id: studentId });

  if (error) return { ok: false, error: friendly(error.message) };

  revalidatePath("/lunch");
  revalidatePath("/dashboard");
  return { ok: true, data: data as StudentRow };
}

export async function collectCertificate(studentId: string): Promise<ActionResult<StudentRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("collect_certificate", { p_student_id: studentId });

  if (error) return { ok: false, error: friendly(error.message) };

  revalidatePath("/certificates");
  revalidatePath("/dashboard");
  return { ok: true, data: data as StudentRow };
}

/* ── Media ───────────────────────────────────────────────── */

export async function addMedia(input: {
  studentId: string;
  title: string;
  category: "Stage" | "Booth" | "Candid" | "Group";
  deptCode: string;
  photographer: string;
  hue: number;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("media").insert({
    student_id: input.studentId,
    title: input.title,
    category: input.category,
    dept_code: input.deptCode,
    photographer: input.photographer,
    hue: input.hue,
    ratio: 1,
  });

  if (error) return { ok: false, error: friendly(error.message) };

  revalidatePath("/gallery");
  return { ok: true };
}

/* ── Volunteers ──────────────────────────────────────────── */

export type VolunteerRoleValue =
  | "admin"
  | "registration"
  | "stage"
  | "booth"
  | "counter"
  | "media"
  | "viewer";

/**
 * Assign a volunteer's role and station. Only admins may call this — the
 * RLS policy on `volunteers` rejects everyone else, so this is enforced by
 * the database rather than by hiding the button.
 */
export async function updateVolunteer(input: {
  id: string;
  role?: VolunteerRoleValue;
  station?: string | null;
  online?: boolean;
}): Promise<ActionResult> {
  const supabase = await createClient();

  // Typed against the generated schema so a stray column cannot slip in.
  const patch: TablesUpdate<"volunteers"> = {};
  if (input.role !== undefined) patch.role = input.role;
  if (input.station !== undefined) patch.station = input.station || null;
  if (input.online !== undefined) patch.online = input.online;

  if (Object.keys(patch).length === 0) return { ok: true };

  const { error } = await supabase.from("volunteers").update(patch).eq("id", input.id);

  if (error) return { ok: false, error: friendly(error.message) };

  revalidatePath("/volunteers");
  revalidatePath("/settings");
  return { ok: true };
}

/* ── Settings ────────────────────────────────────────────── */

export async function updateEventSettings(input: {
  name?: string;
  college?: string;
  venue?: string;
  event_date?: string;
  stream_url?: string | null;
  stream_live?: boolean;
  drive_root_folder?: string | null;
  auto_assign?: boolean;
  duplicate_block?: boolean;
  tv_ticker?: boolean;
  queue_warn_at?: number;
  holding_capacity?: number;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("event_settings").update(input).eq("id", 1);

  if (error) return { ok: false, error: friendly(error.message) };

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

/* ── Auth ────────────────────────────────────────────────── */

export async function signIn(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { ok: false, error: "Email and password are required." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      ok: false,
      error:
        error.message === "Invalid login credentials"
          ? "That email and password do not match."
          : error.message,
    };
  }

  return { ok: true };
}

export async function signUp(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const station = String(formData.get("station") ?? "").trim();

  if (!email || !password) return { ok: false, error: "Email and password are required." };
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  // Role is intentionally NOT taken from the form — the database trigger
  // assigns 'admin' to the first account and 'viewer' to everyone else,
  // so a signup cannot escalate its own privileges.
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name: name || email.split("@")[0], station } },
  });

  if (error) return { ok: false, error: error.message };

  return { ok: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
