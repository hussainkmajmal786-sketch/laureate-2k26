"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "./supabase/server";
import { ensureEventFolders, isDriveConfigured, uploadPhoto } from "./drive";

export interface SyncResult {
  ok: boolean;
  error?: string;
  copied: number;
  skipped: number;
  failed: number;
  remaining: number;
  details: { title: string; reason?: string }[];
}

/**
 * Copies stored photos into the Google Drive folder tree.
 *
 * Photos are captured into Supabase Storage during the ceremony because a
 * Google service account has no storage quota on My Drive and cannot
 * upload files there at all. This runs afterwards to populate the Drive
 * archive, and is safe to re-run: anything already carrying a
 * `drive_file_id` is skipped.
 *
 * Batched rather than all-at-once so a long ceremony's worth of photos
 * cannot time out the request; press Sync again to continue.
 */
export async function syncPhotosToDrive(batchSize = 25): Promise<SyncResult> {
  const empty: SyncResult = {
    ok: false,
    copied: 0,
    skipped: 0,
    failed: 0,
    remaining: 0,
    details: [],
  };

  if (!isDriveConfigured()) {
    return { ...empty, error: "Google Drive is not connected. Add credentials in Settings." };
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ...empty, error: "You must be signed in." };

  // Only photos that are in storage but not yet in Drive.
  const { data: pending, error } = await supabase
    .from("media")
    .select("id, title, category, storage_path")
    .not("storage_path", "is", null)
    .is("drive_file_id", null)
    .limit(batchSize);

  if (error) return { ...empty, error: error.message };
  if (!pending?.length) {
    return { ...empty, ok: true, remaining: 0 };
  }

  let folders;
  try {
    folders = await ensureEventFolders();
  } catch (e) {
    return { ...empty, error: e instanceof Error ? e.message : "Drive folders unavailable." };
  }

  const result: SyncResult = { ...empty, ok: true };

  for (const row of pending) {
    if (!row.storage_path) {
      result.skipped += 1;
      continue;
    }

    try {
      const { data: blob, error: dlErr } = await supabase.storage
        .from("ceremony-photos")
        .download(row.storage_path);

      if (dlErr || !blob) throw new Error(dlErr?.message ?? "Could not read the stored file.");

      const target =
        row.category === "Stage" ? folders.stage
          : row.category === "Booth" ? folders.booth
          : row.category === "Group" ? folders.group
          : folders.candid;

      const uploaded = await uploadPhoto({
        buffer: Buffer.from(await blob.arrayBuffer()),
        filename: row.storage_path.split("/").pop() ?? `${row.id}.jpg`,
        mimeType: blob.type || "image/jpeg",
        folderId: target,
        alsoInFolderId: folders.allMedia,
      });

      await supabase
        .from("media")
        .update({
          drive_file_id: uploaded.id,
          drive_view_url: uploaded.viewUrl,
          drive_thumb_url: uploaded.thumbUrl,
          drive_folder_id: uploaded.folderId,
        })
        .eq("id", row.id);

      result.copied += 1;
      result.details.push({ title: row.title });
    } catch (e) {
      const reason = e instanceof Error ? e.message : "Upload failed";
      result.failed += 1;
      result.details.push({
        title: row.title,
        reason: reason.includes("storage quota")
          ? "Drive refused the upload: a service account has no storage quota on My Drive. A Shared Drive is required."
          : reason,
      });
    }
  }

  const { count } = await supabase
    .from("media")
    .select("id", { count: "exact", head: true })
    .not("storage_path", "is", null)
    .is("drive_file_id", null);

  result.remaining = count ?? 0;

  revalidatePath("/photos");
  revalidatePath("/gallery");
  return result;
}

/** Counts what is stored versus what has reached Drive. */
export async function getDriveSyncStatus() {
  const supabase = await createClient();

  const [{ count: stored }, { count: synced }] = await Promise.all([
    supabase
      .from("media")
      .select("id", { count: "exact", head: true })
      .not("storage_path", "is", null),
    supabase
      .from("media")
      .select("id", { count: "exact", head: true })
      .not("drive_file_id", "is", null),
  ]);

  return { stored: stored ?? 0, synced: synced ?? 0, pending: (stored ?? 0) - (synced ?? 0) };
}
