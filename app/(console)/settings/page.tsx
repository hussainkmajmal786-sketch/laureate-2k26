import { Page, PageHeader } from "@/components/shell/app-shell";
import { getDriveStatus } from "@/lib/drive-actions";
import { SettingsForm } from "./form";
import { getDepartments, getEventSettings } from "@/lib/queries";
import { getCurrentVolunteer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [settings, departments, volunteer, drive] = await Promise.all([
    getEventSettings(),
    getDepartments(),
    getCurrentVolunteer(),
    getDriveStatus(),
  ]);

  return (
    <Page>
      <PageHeader title="Settings" description="Event configuration, appearance, station rules and integrations." />

      <SettingsForm
        settings={settings}
        departments={departments}
        isAdmin={volunteer?.role === "admin"}
        drive={drive} />
    </Page>
  );
}
