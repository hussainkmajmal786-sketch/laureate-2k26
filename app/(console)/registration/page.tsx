import { Page, PageHeader } from "@/components/shell/app-shell";
import { LiveBadge } from "@/components/ui/badge";
import { StatTile } from "@/components/kpi-card";
import { RegistrationStation } from "./station";
import { getEventStats, getScanCounts } from "@/lib/queries";
import { getCurrentVolunteer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RegistrationPage() {
  const [stats, scans, volunteer] = await Promise.all([
    getEventStats(),
    getScanCounts(),
    getCurrentVolunteer(),
  ]);

  const total = stats?.total ?? 0;
  const checkedIn = stats?.checked_in ?? 0;
  const pct = total ? Math.round((checkedIn / total) * 100) : 0;

  return (
    <Page>
      <PageHeader title="Registration" description="Scan a graduate's QR badge to check them in. Every desk shares the same queue, so check-ins are deduplicated automatically."
        actions={<LiveBadge label={volunteer?.station ?? "Desk · Online"} />} />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Checked in today" value={checkedIn} sub={`${pct}% of cohort`} tone="ok" />
        <StatTile label="Scans logged" value={scans["check-in"] ?? 0} sub="This event" tone="accent" />
        <StatTile label="Awaiting check-in" value={total - checkedIn} sub="Not yet arrived" tone="warn" />
        <StatTile label="Total graduates" value={total} sub="Class of 2026" />
      </div>

      <RegistrationStation station={volunteer?.station ?? null} />
    </Page>
  );
}
