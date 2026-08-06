import { Page, PageHeader } from "@/components/shell/app-shell";
import { LiveBadge } from "@/components/ui/badge";
import { StatTile } from "@/components/kpi-card";
import { CertificateStation } from "./station";
import { getEventSettings, getEventStats, getScanCounts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function CertificatesPage() {
  const [stats, scans, settings] = await Promise.all([
    getEventStats(),
    getScanCounts(),
    getEventSettings(),
  ]);

  const total = stats?.total ?? 0;
  const collected = stats?.certificate_done ?? 0;
  const pct = total ? Math.round((collected / total) * 100) : 0;

  return (
    <Page>
      <PageHeader title="Certificates" description="Hall B distribution desk. Scan the badge, confirm the degree details, and log the handover."
        actions={<LiveBadge label="Desk open · closes 18:00" />} />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Distributed" value={collected} sub={`${pct}% of cohort`} tone="ok" />
        <StatTile label="Pending" value={total - collected} sub="Awaiting collection" tone="warn" />
        <StatTile label="Handovers logged" value={scans["certificate"] ?? 0} sub="This event" tone="accent" />
        <StatTile label="Total graduates" value={total} sub="Class of 2026" />
      </div>

      <CertificateStation college={settings?.college ?? "College of Engineering Kidangoor"} />
    </Page>
  );
}
