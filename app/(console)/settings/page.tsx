import { Page, PageHeader } from "@/components/shell/app-shell";
import { getDriveStatus } from "@/lib/drive-actions";
import { getOAuthStatus, redirectUri } from "@/lib/google-oauth";
import { SettingsForm } from "./form";
import { getDepartments, getEventSettings } from "@/lib/queries";
import { getCurrentVolunteer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ drive?: string }>;
}) {
  // The OAuth callback redirects back here with ?drive=<result>.
  const sp = await searchParams;

  const [settings, departments, volunteer, drive, googleAuth] = await Promise.all([
    getEventSettings(),
    getDepartments(),
    getCurrentVolunteer(),
    getDriveStatus(),
    getOAuthStatus(),
  ]);

  return (
    <Page>
      <PageHeader title="Settings" description="Event configuration, appearance, station rules and integrations." />

      <SettingsForm
        settings={settings}
        departments={departments}
        isAdmin={volunteer?.role === "admin"}
        drive={drive}
        googleAuth={googleAuth}
        googleRedirectUri={redirectUri()}
        driveResult={typeof sp?.drive === "string" ? sp.drive : undefined} />
    </Page>
  );
}
