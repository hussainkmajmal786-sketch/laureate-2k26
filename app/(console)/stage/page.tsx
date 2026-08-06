import { Page, PageHeader } from "@/components/shell/app-shell";
import { LiveBadge } from "@/components/ui/badge";
import { StatTile } from "@/components/kpi-card";
import { StageStation } from "./station";
import { getEventStats, getStageQueue } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function StagePage() {
  const [stats, queue] = await Promise.all([getEventStats(), getStageQueue(9)]);

  const total = stats?.total ?? 0;
  const done = stats?.stage_done ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <Page>
      <PageHeader title="Stage" description="Call the graduate, capture the handshake, and clear the stage for the next name."
        actions={<LiveBadge label="Conferral · Live" />} />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Crossed the stage" value={done} sub={`${pct}% of cohort`} tone="ok" />
        <StatTile label="Waiting" value={stats?.waiting ?? 0} sub="Holding area" tone="warn" />
        <StatTile label="Checked in" value={stats?.checked_in ?? 0} sub="Eligible to walk" tone="accent" />
        <StatTile label="Photos captured" value={stats?.photos ?? 0} sub="All stations" />
      </div>

      <StageStation initialQueue={queue} position={done + 1} />
    </Page>
  );
}
