"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "./supabase/server";
import type { MediaCategory } from "./supabase/types";
import { ensureEventFolders, uploadPhoto } from "./drive";
import { canUploadToDrive } from "./google-oauth";

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

  const { data: mediaRow, error: rowErr } = await supabase
    .from("media")
    .insert({
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
    })
    .select("id")
    .single();

  if (rowErr) {
    // Do not leave an orphan file if the row could not be written.
    await supabase.storage.from("ceremony-photos").remove([path]);
    return { ok: false, error: rowErr.message };
  }

  const photoCount = (student.photo_count ?? 0) + 1;
  await supabase.from("students").update({ photo_count: photoCount }).eq("id", studentId);

  /*
   * Copy into Drive straight away, but never let it hold up the shutter or
   * fail the capture: the photo is already safe in Storage and the student's
   * hub reads from there. Anything that does not make it across is picked up
   * later by "Sync to Drive" on the Photos screen, which retries whatever is
   * still missing a drive_file_id.
   */
  void mirrorToDrive(mediaRow!.id, path, category, buffer, file.type).catch(() => undefined);

  revalidatePath("/gallery");
  revalidatePath("/booth");
  return { ok: true, path, photoCount };
}

/**
 * Copies one captured photo into the Google Drive folder tree.
 *
 * Best effort by design. Drive is the browsable archive; Supabase Storage
 * is the source of truth that the graduate's hub reads, so a Drive failure
 * must never cost a photo. Anything that does not make it across keeps a
 * null drive_file_id and is retried by the Sync button.
 */
async function mirrorToDrive(
  mediaId: string,
  path: string,
  category: MediaCategory,
  buffer: Buffer,
  mimeType: string,
) {
  if (!(await canUploadToDrive())) return;

  try {
    const folders = await ensureEventFolders();
    const target =
      category === "Stage" ? folders.stage
        : category === "Booth" ? folders.booth
        : category === "Group" ? folders.group
        : folders.candid;

    const uploaded = await uploadPhoto({
      buffer,
      filename: path.split("/").pop() ?? `${mediaId}.jpg`,
      mimeType: mimeType || "image/jpeg",
      folderId: target,
      alsoInFolderId: folders.allMedia,
    });

    const supabase = await createClient();
    await supabase
      .from("media")
      .update({
        drive_file_id: uploaded.id,
        drive_view_url: uploaded.viewUrl,
        drive_thumb_url: uploaded.thumbUrl,
        drive_folder_id: uploaded.folderId,
      })
      .eq("id", mediaId);
  } catch {
    // Left for the Sync button to retry.
  }
}
