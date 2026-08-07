"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "./supabase/server";
import type { MediaCategory } from "./supabase/types";

/**
 * Stores a single photo captured at a station against one graduate.
 *
 * Called the moment the shutter fires, so a photo is filed under the
 * student who was scanned rather than matched by timestamp afterwards.
 * The path encodes the register number, which makes the bucket browsable
 * and keeps every graduate's frames together.
 */
export async function uploadStudentPhoto(formData: FormData): Promise<{
  ok: boolean;
  error?: string;
  path?: string;
  photoCount?: number;
}> {
  const file = formData.get("photo");
  const studentId = String(formData.get("studentId") ?? "");
  const category = (String(formData.get("category") ?? "Booth") || "Booth") as MediaCategory;
  const label = String(formData.get("label") ?? "").trim();

  if (!(file instanceof File)) return { ok: false, error: "No photo received." };
  if (!studentId) return { ok: false, error: "No graduate selected." };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: "You must be signed in." };

  const { data: student } = await supabase
    .from("students")
    .select("name, reg_no, dept_code, hue, photo_count")
    .eq("id", studentId)
    .maybeSingle();

  if (!student) return { ok: false, error: "Graduate not found." };

  const buffer = Buffer.from(await file.arrayBuffer());
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const path = `${category.toLowerCase()}/${student.reg_no}/${stamp}.jpg`;

  const { error: upErr } = await supabase.storage
    .from("ceremony-photos")
    .upload(path, buffer, { contentType: file.type || "image/jpeg", upsert: false });

  if (upErr) return { ok: false, error: upErr.message };

  const { error: rowErr } = await supabase.from("media").insert({
    student_id: studentId,
    title: student.name,
    category,
    dept_code: student.dept_code,
    photographer: label || "Station camera",
    hue: student.hue,
    ratio: 1,
    taken_at: new Date().toISOString(),
    captured_at: new Date().toISOString(),
    original_name: file.name || "capture.jpg",
    storage_path: path,
    storage_bucket: "ceremony-photos",
    imported_by: auth.user.id,
  });

  if (rowErr) {
    // Do not leave an orphan file if the row could not be written.
    await supabase.storage.from("ceremony-photos").remove([path]);
    return { ok: false, error: rowErr.message };
  }

  const photoCount = (student.photo_count ?? 0) + 1;
  await supabase.from("students").update({ photo_count: photoCount }).eq("id", studentId);

  revalidatePath("/gallery");
  revalidatePath("/booth");
  return { ok: true, path, photoCount };
}
