"use server";

import exifr from "exifr";
import { revalidatePath } from "next/cache";
import { createClient } from "./supabase/server";
import { ensureEventFolders, isDriveConfigured, uploadPhoto } from "./drive";
import type { MediaCategory } from "./supabase/types";

export interface ImportResult {
  ok: boolean;
  error?: string;
  uploaded: number;
  matched: number;
  unmatched: number;
  /** Per-file outcome so the operator can see what failed and why. */
  details: {
    filename: string;
    matchedTo?: string;
    takenAt?: string;
    reason?: string;
  }[];
}

/** Reads the capture time from EXIF, falling back to file mtime. */
async function captureTime(buffer: Buffer, fallback: number): Promise<Date> {
  try {
    const exif = await exifr.parse(buffer, ["DateTimeOriginal", "CreateDate"]);
    const taken = exif?.DateTimeOriginal ?? exif?.CreateDate;
    if (taken instanceof Date && !Number.isNaN(taken.valueOf())) return taken;
  } catch {
    // Not every file carries EXIF; the file's own timestamp is the fallback.
  }
  return new Date(fallback);
}

/**
 * Bulk-imports a card of ceremony photos after the event.
 *
 * Each photo is matched to whichever graduate was on stage when it was
 * taken, using the `stage_appearances` log. A tolerance window absorbs
 * small clock drift between the camera and the console.
 *
 * Clock drift is the known weak point: if the camera clock is wrong by
 * more than the tolerance, photos attach to the wrong graduate. The
 * `clockOffsetMinutes` argument corrects a known, measured offset.
 */
export async function importCeremonyPhotos(formData: FormData): Promise<ImportResult> {
  const empty: ImportResult = { ok: false, uploaded: 0, matched: 0, unmatched: 0, details: [] };

  if (!isDriveConfigured()) {
    return { ...empty, error: "Google Drive is not connected. Add credentials in Settings." };
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ...empty, error: "You must be signed in." };

  const files = formData.getAll("photos").filter((f): f is File => f instanceof File);
  if (files.length === 0) return { ...empty, error: "No files selected." };

  const category = (String(formData.get("category") ?? "Stage") || "Stage") as MediaCategory;
  const photographer = String(formData.get("photographer") ?? "").trim() || "CEK Media Cell";
  const toleranceMs = Number(formData.get("toleranceSeconds") ?? 45) * 1000;
  const offsetMs = Number(formData.get("clockOffsetMinutes") ?? 0) * 60_000;

  // Stage log, ordered so a photo can be placed between two appearances.
  const { data: appearances, error: apErr } = await supabase
    .from("stage_appearances")
    .select("student_id, started_at, ended_at")
    .order("started_at");

  if (apErr) return { ...empty, error: apErr.message };
  if (!appearances?.length) {
    return {
      ...empty,
      error:
        "No stage appearances recorded, so photos cannot be matched. Run the ceremony through the Stage screen first, or upload per-graduate instead.",
    };
  }

  let folders;
  try {
    folders = await ensureEventFolders();
  } catch (e) {
    return { ...empty, error: e instanceof Error ? e.message : "Drive folders unavailable." };
  }

  const targetFolder =
    category === "Stage" ? folders.stage
      : category === "Booth" ? folders.booth
      : category === "Group" ? folders.group
      : folders.candid;

  const result: ImportResult = { ok: true, uploaded: 0, matched: 0, unmatched: 0, details: [] };

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const takenRaw = await captureTime(buffer, file.lastModified);
    const taken = new Date(takenRaw.getTime() + offsetMs);

    // Whoever was on stage at that instant, else the nearest within tolerance.
    let studentId: string | undefined;
    for (const a of appearances) {
      const start = new Date(a.started_at).getTime();
      const end = a.ended_at ? new Date(a.ended_at).getTime() : start + 60_000;
      if (taken.getTime() >= start - toleranceMs && taken.getTime() <= end + toleranceMs) {
        studentId = a.student_id;
        break;
      }
    }

    if (!studentId) {
      result.unmatched += 1;
      result.details.push({
        filename: file.name,
        takenAt: taken.toISOString(),
        reason: "No graduate was on stage at this time",
      });
      continue;
    }

    try {
      const uploaded = await uploadPhoto({
        buffer,
        filename: file.name,
        mimeType: file.type || "image/jpeg",
        folderId: targetFolder,
        alsoInFolderId: folders.allMedia,
      });

      const { data: student } = await supabase
        .from("students")
        .select("name, dept_code, hue")
        .eq("id", studentId)
        .maybeSingle();

      await supabase.from("media").insert({
        student_id: studentId,
        title: student?.name ?? file.name,
        category,
        dept_code: student?.dept_code ?? null,
        photographer,
        hue: student?.hue ?? 0,
        ratio: 1,
        taken_at: taken.toISOString(),
        captured_at: taken.toISOString(),
        original_name: file.name,
        drive_file_id: uploaded.id,
        drive_view_url: uploaded.viewUrl,
        drive_thumb_url: uploaded.thumbUrl,
        drive_folder_id: uploaded.folderId,
        imported_by: auth.user.id,
      });

      // Keep the graduate's own counter in step with the archive.
      await supabase.rpc("complete_booth", { p_student_id: studentId, p_photos: 0 }).then(
        () => undefined,
        () => undefined,
      );

      result.uploaded += 1;
      result.matched += 1;
      result.details.push({
        filename: file.name,
        matchedTo: student?.name,
        takenAt: taken.toISOString(),
      });
    } catch (e) {
      result.unmatched += 1;
      result.details.push({
        filename: file.name,
        takenAt: taken.toISOString(),
        reason: e instanceof Error ? e.message : "Upload failed",
      });
    }
  }

  revalidatePath("/gallery");
  revalidatePath("/photos");
  return result;
}
