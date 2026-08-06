import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { getCurrentVolunteer } from "@/lib/supabase/server";
import { getEventSettings } from "@/lib/queries";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const [volunteer, settings] = await Promise.all([getCurrentVolunteer(), getEventSettings()]);

  // Middleware already gates these routes; this is the belt-and-braces check
  // for any request that reaches the layout without a session.
  if (!volunteer) redirect("/login");

  return (
    <AppShell
      volunteer={volunteer}
      eventStatus={settings?.status ?? "Live"}
      eventMeta={`${settings?.college ?? "CEK Kidangoor"} · ${settings?.event_date ?? ""}`} >
      {children}
    </AppShell>
  );
}
