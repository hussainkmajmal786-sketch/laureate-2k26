import Link from "next/link";
import { MonitorPlay } from "lucide-react";
import { Page, PageHeader } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { LiveBadge } from "@/components/ui/badge";
import { StatTile } from "@/components/kpi-card";
import { QueueMonitor } from "./monitor";
import { getBoothQueues, getBoothStatus, getEventStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const [booths, queues, stats] = await Promise.all([
    getBoothStatus(),
    getBoothQueues(),
    getEventStats(),
  ]);

  const waiting = booths.reduce((s, b) => s + (b.waiting ?? 0), 0);
  const longest = Math.max(...booths.map((b) => b.est_wait ?? 0), 0);
  const served = booths.reduce((s, b) => s + (b.served_today ?? 0), 0);

  return (
    <Page wide>
      <PageHeader title="Queue Monitor" description="Both photo booths at a glance. Scan a graduate and the system routes them to whichever booth will clear them first."
        actions={
          <>
            <LiveBadge label={`${waiting} waiting`} />
            <Link href="/display">
              <Button variant="secondary" size="md">
                <MonitorPlay className="h-4 w-4" />
                TV display
              </Button>
            </Link>
          </>
        } />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total in queue" value={waiting} sub="Across both booths" tone="warn" />
        <StatTile label="Longest wait" value={`${longest}m`} sub="Projected" tone="bad" />
        <StatTile label="Served today" value={served} sub="Both booths" tone="ok" />
        <StatTile label="Awaiting booth" value={(stats?.stage_done ?? 0) - (stats?.booth_done ?? 0)} sub="Cleared the stage" tone="accent" />
      </div>

      <QueueMonitor initialBooths={booths} initialQueues={queues} />
    </Page>
  );
}
