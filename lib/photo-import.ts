"use server";

import exifr from "exifr";
import { revalidatePath } from "next/cache";
import { createClient } from "./supabase/server";
import type { MediaCategory } from "./supabase/types";

/** Only async functions may be exported from a "use server" module. */
const PHOTO_BUCKET = "ceremony-photos";

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

/** Keeps object keys predictable and free of characters Storage dislikes. */
function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
}

/**
 * Bulk-imports a card of ceremony photos after the event.
 *
 * Files go to Supabase Storage rather than Google Drive: a Google service
 * account has no storage quota on My Drive and cannot upload there at all,
 * and Drive cannot express "only this graduate may see this file" anyway.
 * The database row is what ties a photo to a graduate, and the bucket is
 * private — the hub serves photos through short-lived signed URLs.
 *
 * Each photo is matched to whoever was on stage when it was taken, using
 * the `stage_appearances` log. Clock drift is the known weak point: if the
 * camera clock is off by more than the tolerance, photos attach to the
 * wrong graduate, so `clockOffsetMinutes` corrects a measured offset.
 */
export async function importCeremonyPhotos(formData: FormData): Promise<ImportResult> {
  const empty: ImportResult = { ok: false, uploaded: 0, matched: 0, unmatched: 0, details: [] };

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

  const result: ImportResult = { ok: true, uploaded: 0, matched: 0, unmatched: 0, details: [] };

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const takenRaw = await captureTime(buffer, file.lastModified);
    const taken = new Date(takenRaw.getTime() + offsetMs);

    // Whoever was on stage at that instant, within the tolerance window.
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
      const { data: student } = await supabase
        .from("students")
        .select("name, reg_no, dept_code, hue")
        .eq("id", studentId)
        .maybeSingle();

      const path = `${category.toLowerCase()}/${student?.reg_no ?? studentId}/${Date.now()}-${safeName(file.name)}`;

      const { error: upErr } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(path, buffer, {
          contentType: file.type || "image/jpeg",
          upsert: false,
        });

      if (upErr) throw new Error(upErr.message);

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
        storage_path: path,
        storage_bucket: PHOTO_BUCKET,
        imported_by: auth.user.id,
      });

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

/**
 * Short-lived signed URLs for a graduate's own photos.
 *
 * The bucket is private, so this is how the hub displays images without
 * making the archive world-readable.
 */
export async function signPhotoUrls(paths: string[], expiresInSeconds = 3600) {
  if (paths.length === 0) return {};

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(paths, expiresInSeconds);

  if (error || !data) return {};

  const map: Record<string, string> = {};
  for (const row of data) {
    if (row.path && row.signedUrl) map[row.path] = row.signedUrl;
  }
  return map;
}
