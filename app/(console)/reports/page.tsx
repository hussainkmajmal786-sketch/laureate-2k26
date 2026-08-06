import { Page, PageHeader } from "@/components/shell/app-shell";
import { Card, BlockPanel, SectionTitle } from "@/components/ui/card";
import { StatTile } from "@/components/kpi-card";
import { Badge } from "@/components/ui/badge";
import { FunnelBars } from "./funnel";
import { ReportCharts, ExportPanel } from "./charts-client";
import { getBoothStatus, getDepartmentStats, getEventStats, getHourlyFlow } from "@/lib/queries";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [stats, deptStats, flow, booths] = await Promise.all([
    getEventStats(),
    getDepartmentStats(),
    getHourlyFlow(),
    getBoothStatus(),
  ]);

  const total = stats?.total ?? 0;
  const pctOf = (n: number) => (total ? ((n / total) * 100).toFixed(1) : "0.0");

  const funnel = [
    { label: "Registered", value: total, color: "#94a3b8" },
    { label: "Checked in", value: stats?.checked_in ?? 0, color: "#4f46e5" },
    { label: "Crossed stage", value: stats?.stage_done ?? 0, color: "#10b981" },
    { label: "Booth complete", value: stats?.booth_done ?? 0, color: "#f59e0b" },
    { label: "Lunch redeemed", value: stats?.lunch_done ?? 0, color: "#7c3aed" },
    { label: "Certificate collected", value: stats?.certificate_done ?? 0, color: "#ec4899" },
  ];

  return (
    <Page wide>
      <PageHeader title="Reports" description="Ceremony analytics across attendance, stage throughput, queue health and departmental completion." />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Attendance rate" value={`${pctOf(stats?.checked_in ?? 0)}%`} sub={`${formatNumber(stats?.checked_in ?? 0)} of ${formatNumber(total)}`} tone="ok" />
        <StatTile label="Stage completion" value={`${pctOf(stats?.stage_done ?? 0)}%`} sub={`${formatNumber(stats?.stage_done ?? 0)} graduates`} tone="accent" />
        <StatTile label="Longest queue wait" value={`${Math.max(...booths.map((b) => b.est_wait ?? 0), 0)}m`} sub="Current projection" tone="warn" />
        <StatTile label="Photos captured" value={stats?.photos ?? 0} sub="All stations" tone="accent" />
      </div>

      <SectionTitle title="Ceremony funnel" subtitle="Where the cohort stands across every stage of the day" />
      <Card className="mb-6">
        <div className="p-5">
          <FunnelBars rows={funnel} total={total} />
        </div>
      </Card>

      <ReportCharts flow={flow} deptStats={deptStats} booths={booths} />

      <SectionTitle title="Department statistics" subtitle="Full breakdown by branch" className="mt-6" />
      <Card className="mb-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[rgb(var(--rule))]">
                {["Department", "Total", "Checked in", "Stage", "Booth", "Lunch", "Certificate", "Completion"].map((h) => (
                  <th key={h} className="stencil px-4 py-3 text-ink-3 first:pl-5 last:pr-5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--rule-soft))]">
              {deptStats.map((d) => {
                const pct = d.total ? Math.round(((d.certificate ?? 0) / d.total) * 100) : 0;
                return (
                  <tr key={d.code} className="transition-colors hover:bg-paper-2">
                    <td className="py-3.5 pr-4 pl-5">
                      <div className="flex items-center gap-2.5">
                        <span className="h-7 w-1 " style={{ backgroundColor: d.color ?? "#4f46e5" }} />
                        <div>
                          <p className="text-[13.5px] font-semibold text-ink">{d.name}</p>
                          <p className="text-[11px] text-ink-3">{d.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="figure px-4 py-3.5 text-[13.5px] text-ink">{d.total}</td>
                    <td className="figure px-4 py-3.5 text-[13.5px] text-ink-2">{d.checked_in}</td>
                    <td className="figure px-4 py-3.5 text-[13.5px] text-ink-2">{d.stage}</td>
                    <td className="figure px-4 py-3.5 text-[13.5px] text-ink-2">{d.booth}</td>
                    <td className="figure px-4 py-3.5 text-[13.5px] text-ink-2">{d.lunch}</td>
                    <td className="figure px-4 py-3.5 text-[13.5px] text-ink-2">{d.certificate}</td>
                    <td className="py-3.5 pr-5 pl-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-1.5 w-20 overflow-hidden  bg-paper-3">
                          <div
                            className="h-full "
                            style={{ width: `${pct}%`, backgroundColor: d.color ?? "#4f46e5" }} />
                        </div>
                        <span className="figure w-9 text-[12.5px] text-ink">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <BlockPanel label="Booth performance" tone="warn"
          action={<Badge tone="neutral" size="sm">Live</Badge>} >
          <div className="space-y-3 p-5">
            {booths.map((b) => (
              <div key={b.id} className=" bg-paper-2 p-4 rule">
                <div className="flex items-center justify-between">
                  <p className="text-[13.5px] font-semibold text-ink">Booth {b.id}</p>
                  <span className="text-[12px] text-ink-3">{b.photographer}</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="figure text-[20px] text-ink">{b.served_today}</p>
                    <p className="text-[11px] text-ink-3">Served</p>
                  </div>
                  <div>
                    <p className="figure text-[20px] text-warn">{b.waiting}</p>
                    <p className="text-[11px] text-ink-3">Waiting</p>
                  </div>
                  <div>
                    <p className="figure text-[20px] text-accent">{b.avg_minutes}m</p>
                    <p className="text-[11px] text-ink-3">Avg session</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </BlockPanel>

        <ExportPanel />
      </div>
    </Page>
  );
}
