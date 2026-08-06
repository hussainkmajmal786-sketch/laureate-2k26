import { Page, PageHeader } from "@/components/shell/app-shell";
import { LiveBadge } from "@/components/ui/badge";
import { StatTile } from "@/components/kpi-card";
import { LunchStation } from "./station";
import { getEventStats, getScanCounts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function LunchPage() {
  const [stats, scans] = await Promise.all([getEventStats(), getScanCounts()]);

  const total = stats?.total ?? 0;
  const redeemed = stats?.lunch_done ?? 0;
  const pct = total ? Math.round((redeemed / total) * 100) : 0;

  return (
    <Page>
      <PageHeader title="Lunch" description="One coupon per graduate. A second scan is rejected by the database itself, so a duplicate can never reach the kitchen."
        actions={<LiveBadge label="Service open" />} />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Redeemed" value={redeemed} sub={`${pct}% of cohort`} tone="ok" />
        <StatTile label="Remaining" value={total - redeemed} sub="Coupons unclaimed" />
        <StatTile label="Scans logged" value={scans["lunch"] ?? 0} sub="This event" tone="accent" />
        <StatTile label="Total graduates" value={total} sub="Class of 2026" />
      </div>

      <LunchStation />
    </Page>
  );
}
