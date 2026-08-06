import { Page, PageHeader } from "@/components/shell/app-shell";
import { LiveBadge } from "@/components/ui/badge";
import { StatTile } from "@/components/kpi-card";
import { BoothStation } from "./station";
import { getBoothQueues, getBoothStatus, getEventStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function BoothPage() {
  const [booths, queues, stats] = await Promise.all([
    getBoothStatus(),
    getBoothQueues(),
    getEventStats(),
  ]);

  const waiting = booths.reduce((s, b) => s + (b.waiting ?? 0), 0);
  const served = booths.reduce((s, b) => s + (b.served_today ?? 0), 0);

  return (
    <Page>
      <PageHeader title="Photo Booth" description="Run a graduate's booth session — individual, family and friends frames, then hand off to the next token."
        actions={<LiveBadge label={`${waiting} waiting`} />} />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Served today" value={served} sub="Both booths" tone="ok" />
        <StatTile label="In queue" value={waiting} sub="Awaiting a booth" tone="warn" />
        <StatTile label="Booth complete" value={stats?.booth_done ?? 0} sub="Sessions finished" tone="accent" />
        <StatTile label="Photos captured" value={stats?.photos ?? 0} sub="All stations" />
      </div>

      <BoothStation booths={booths} queues={queues} />
    </Page>
  );
}
