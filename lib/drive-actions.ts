"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "./supabase/server";
import { ensureEventFolders, isDriveConfigured, testDriveConnection } from "./drive";

export interface DriveStatus {
  configured: boolean;
  connected: boolean;
  serviceAccount?: string;
  rootName?: string;
  rootFolderId?: string;
  folders?: { name: string; id: string }[];
  error?: string;
  /** What the operator should do next, in plain language. */
  hint?: string;
}

/**
 * Pulls the folder id out of anything a person is likely to paste: a full
 * Drive URL, a sharing link, or the bare id itself.
 */
export async function parseDriveFolderId(input: string): Promise<string | null> {
  const raw = input.trim();
  if (!raw) return null;

  // https://drive.google.com/drive/folders/<id>?usp=sharing
  const folders = raw.match(/\/folders\/([a-zA-Z0-9_-]{10,})/);
  if (folders) return folders[1];

  // https://drive.google.com/open?id=<id>
  const openId = raw.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (openId) return openId[1];

  // Someone pasted just the id.
  if (/^[a-zA-Z0-9_-]{10,}$/.test(raw)) return raw;

  return null;
}

/** Current Drive state, written for the Settings panel to render directly. */
export async function getDriveStatus(): Promise<DriveStatus> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  if (!isDriveConfigured()) {
    return {
      configured: false,
      connected: false,
      hint: "Add GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY to .env.local, then restart the server.",
    };
  }

  const test = await testDriveConnection();
  if (!test.ok) {
    return {
      configured: true,
      connected: false,
      serviceAccount: email,
      error: test.error,
      hint: test.error?.includes("Root folder")
        ? `Open the folder in Drive, press Share, and give ${email} Editor access.`
        : "Check that the private key was copied whole, including the BEGIN and END lines.",
    };
  }

  return {
    configured: true,
    connected: true,
    serviceAccount: email,
    rootName: test.rootName,
    rootFolderId: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
  };
}

/**
 * Creates the event folder tree and records it against the event.
 *
 * Safe to run repeatedly — `ensureEventFolders` finds existing folders
 * rather than making duplicates.
 */
export async function connectDrive(folderInput: string): Promise<DriveStatus> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  if (!isDriveConfigured()) {
    return {
      configured: false,
      connected: false,
      error: "No service account credentials.",
      hint: "Add the two GOOGLE_SERVICE_ACCOUNT_* values to .env.local first.",
    };
  }

  const folderId = folderInput.trim() ? await parseDriveFolderId(folderInput) : undefined;
  if (folderInput.trim() && !folderId) {
    return {
      configured: true,
      connected: false,
      error: "That does not look like a Drive folder link.",
      hint: "Open the folder in Drive and copy the address bar URL.",
    };
  }

  try {
    const folders = await ensureEventFolders(folderId ?? undefined);

    const supabase = await createClient();
    await supabase
      .from("event_settings")
      .update({ drive_connected: true, drive_root_folder: folders.root })
      .eq("id", 1);

    revalidatePath("/settings");
    revalidatePath("/photos");

    return {
      configured: true,
      connected: true,
      serviceAccount: email,
      rootFolderId: folders.root,
      folders: [
        { name: "All Media", id: folders.allMedia },
        { name: "Stage", id: folders.stage },
        { name: "Photo Booth", id: folders.booth },
        { name: "Candid", id: folders.candid },
        { name: "Group", id: folders.group },
      ],
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      configured: true,
      connected: false,
      serviceAccount: email,
      error: message,
      hint: message.includes("File not found") || message.includes("permission")
        ? `Share that folder with ${email} as Editor — a service account cannot see folders it has not been given.`
        : "Check the Drive API is enabled for the Google Cloud project.",
    };
  }
}
