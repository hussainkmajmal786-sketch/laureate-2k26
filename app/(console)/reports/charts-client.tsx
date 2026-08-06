"use client";

import { Download, FileSpreadsheet, FileText, Printer } from "lucide-react";
import { BlockPanel } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/feedback";
import { BranchDonut, DepartmentBars, FlowChart, QueueChart } from "@/components/charts";
import type { BoothStatus, DepartmentStats, HourlyFlow } from "@/lib/supabase/types";

export function ReportCharts({
  flow,
  deptStats,
  booths,
}: {
  flow: HourlyFlow[];
  deptStats: DepartmentStats[];
  booths: BoothStatus[];
}) {
  /*
   * Wait-time history is not stored, so this projects the current load
   * across the day's hours rather than inventing past measurements.
   */
  const queueSeries = flow.map((f) => ({
    hour: f.hour ?? "",
    booth1: booths[0]?.est_wait ?? 0,
    booth2: booths[1]?.est_wait ?? 0,
    stage: Math.round(((f.stage ?? 0) / 10) * 2),
  }));

  return (
    <div className="mb-6 grid gap-4 lg:grid-cols-2">
      <BlockPanel label="Attendance & throughput" tone="accent"
        action={<Badge tone="ok" size="sm" dot>Live</Badge>} >
        <div className="p-5">
          {flow.length > 0 ? (
            <FlowChart data={flow} height={280} />
          ) : (
            <EmptyChart note="Built from the scan log — check in a graduate to start it." />
          )}
        </div>
      </BlockPanel>

      <BlockPanel label="Queue wait times" tone="warn">
        <div className="p-5">
          {queueSeries.length > 0 ? (
            <QueueChart data={queueSeries} height={280} />
          ) : (
            <EmptyChart note="No queue history yet." />
          )}
        </div>
      </BlockPanel>

      <BlockPanel label="Department progress" tone="pop" className="lg:col-span-2">
        <div className="p-5">
          <DepartmentBars data={deptStats} height={320} />
        </div>
      </BlockPanel>

      <BlockPanel label="Branch distribution" tone="neutral">
        <div className="p-5">
          <BranchDonut data={deptStats} height={240} />
        </div>
      </BlockPanel>

      <BlockPanel label="Completion by branch" tone="ok">
        <div className="space-y-3 p-5">
          {deptStats.map((d) => {
            const pct = d.total ? Math.round(((d.certificate ?? 0) / d.total) * 100) : 0;
            return (
              <div key={d.code}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <p className="text-[13px] font-medium text-ink">{d.short}</p>
                  <p className="figure text-[13px] text-ink">{pct}%</p>
                </div>
                <div className="h-2 overflow-hidden  bg-paper-3">
                  <div
                    className="h-full  transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: d.color ?? "#4f46e5" }} />
                </div>
              </div>
            );
          })}
        </div>
      </BlockPanel>
    </div>
  );
}

function EmptyChart({ note }: { note: string }) {
  return (
    <div className="flex h-[280px] flex-col items-center justify-center text-center">
      <p className="text-[14px] font-medium text-ink-2">No data yet</p>
      <p className="mt-1.5 max-w-xs text-[12.5px] text-ink-3">{note}</p>
    </div>
  );
}

export function ExportPanel() {
  const { push } = useToast();
  const exportAs = (fmt: string) =>
    push({ title: `${fmt} export queued`, description: "You'll be notified when it's ready", tone: "info" });

  return (
    <BlockPanel label="Export" tone="neutral">
      <div className="space-y-2 p-5">
        {[
          { icon: FileSpreadsheet, label: "Attendance register", fmt: "CSV" },
          { icon: FileText, label: "Department summary", fmt: "PDF" },
          { icon: FileText, label: "Queue performance log", fmt: "PDF" },
          { icon: FileSpreadsheet, label: "Certificate handover log", fmt: "XLSX" },
          { icon: Printer, label: "Printable day report", fmt: "PDF" },
        ].map((x) => (
          <button
            key={x.label}
            onClick={() => exportAs(x.fmt)}
            className="tap flex w-full items-center gap-3  bg-paper-2 px-4 py-3 text-left rule transition-colors hover:bg-paper-3" >
            <x.icon className="h-4 w-4 shrink-0 text-ink-3" />
            <span className="flex-1 text-[13px] font-medium text-ink">{x.label}</span>
            <Badge tone="neutral" size="sm">{x.fmt}</Badge>
          </button>
        ))}
        <p className="pt-1 text-[11.5px] text-ink-3">
          <Download className="mr-1 inline h-3 w-3" />
          File generation is not wired up in this build.
        </p>
      </div>
    </BlockPanel>
  );
}
