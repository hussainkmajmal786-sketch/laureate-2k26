import { Page, PageHeader } from "@/components/shell/app-shell";
import { StatTile } from "@/components/kpi-card";
import { PhotoImporter } from "./importer";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVolunteer } from "@/lib/supabase/server";
import { isDriveConfigured } from "@/lib/drive";
import { getDriveSyncStatus } from "@/lib/drive-sync";
import { DriveSyncPanel } from "./drive-sync";

export const dynamic = "force-dynamic";

export default async function PhotosPage() {
  const supabase = await createClient();
  const [{ count: mediaCount }, { count: appearanceCount }, { data: settings }, me] =
    await Promise.all([
      supabase.from("media").select("id", { count: "exact", head: true }),
      supabase.from("stage_appearances").select("id", { count: "exact", head: true }),
      supabase.from("event_settings").select("*").eq("id", 1).maybeSingle(),
      getCurrentVolunteer(),
    ]);

  const syncStatus = await getDriveSyncStatus();

  const { count: onDrive } = await supabase
    .from("media")
    .select("id", { count: "exact", head: true })
    .not("drive_file_id", "is", null);

  return (
    <Page>
      <PageHeader
        title="PHOTO IMPORT"
        description="Bulk-import the photographer's card after the ceremony. Each photo is matched to whoever was on stage when it was taken, then filed into your Drive folders."
      />

      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatTile label="PHOTOS INDEXED" value={mediaCount ?? 0} sub="In the archive" tone="accent" />
        <StatTile label="ON GOOGLE DRIVE" value={onDrive ?? 0} sub="Uploaded files" tone="ok" />
        <StatTile label="STAGE APPEARANCES" value={appearanceCount ?? 0} sub="Matchable windows" tone="pop" />
        <StatTile
          label="DRIVE"
          value={isDriveConfigured() ? "READY" : "NOT SET"}
          sub={settings?.drive_root_folder ?? "Laureate 2K26"}
          tone={isDriveConfigured() ? "ok" : "warn"}
        />
      </div>

      <DriveSyncPanel
        stored={syncStatus.stored}
        synced={syncStatus.synced}
        driveConfigured={isDriveConfigured()}
        rootFolderId={process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID} />

      <div className="mt-4" />

      <PhotoImporter
        driveConfigured={isDriveConfigured()}
        canImport={["admin", "media", "booth", "stage"].includes(me?.role ?? "")}
        appearances={appearanceCount ?? 0}
      />
    </Page>
  );
}
