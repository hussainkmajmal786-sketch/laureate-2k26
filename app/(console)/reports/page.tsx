"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Download, FileSpreadsheet, FileText, Printer, TrendingUp } from "lucide-react";
import { Page, PageHeader } from "@/components/shell/app-shell";
import { Card, BlockPanel, SectionTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Segmented } from "@/components/ui/input";
import { useToast } from "@/components/ui/feedback";
import { StatTile } from "@/components/kpi-card";
import { DepartmentBars, FlowChart, QueueChart, BranchDonut, MiniBars } from "@/components/charts";
import { departmentStats, TOTAL_GRADUATES } from "@/lib/data";
import { formatNumber } from "@/lib/utils";

export default function ReportsPage() {
  const stats = React.useMemo(() => departmentStats(), []);
  const [range, setRange] = React.useState<"today" | "session" | "all">("today");
  const { push } = useToast();

  const exportAs = (fmt: string) =>
    push({ title: `${fmt} EXPORT QUEUED`, description: "You'll be notified when ready", tone: "info" });

  const funnel = [
    { label: "REGISTERED", value: TOTAL_GRADUATES, color: "#8c847c" },
    { label: "CHECKED IN", value: 1519, color: "#2563eb" },
    { label: "CROSSED STAGE", value: 1052, color: "#10b981" },
    { label: "BOOTH COMPLETE", value: 791, color: "#f59e0b" },
    { label: "LUNCH REDEEMED", value: 678, color: "#6d28d9" },
    { label: "CERTIFICATE COLLECTED", value: 586, color: "#ec4899" },
  ];

  return (
    <Page wide>
      <PageHeader
        title="REPORTS"
        description="Ceremony analytics across attendance, stage throughput, queue health and departmental completion."
        actions={
          <>
            <Segmented
              value={range}
              onChange={setRange}
              options={[
                { value: "today", label: "TODAY" },
                { value: "session", label: "SESSION II" },
                { value: "all", label: "ALL" },
              ]}
            />
            <Button variant="secondary" size="md" onClick={() => exportAs("PDF")}>
              <Download className="h-4 w-4" strokeWidth={2.6} />
              EXPORT
            </Button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatTile label="ATTENDANCE RATE" value="74.2%" sub="1,519 of 2,047" tone="ok" />
        <StatTile label="STAGE COMPLETION" value="51.4%" sub="1,052 graduates" tone="accent" />
        <StatTile label="AVG. QUEUE WAIT" value="12m" sub="Down 4m from peak" tone="warn" />
        <StatTile label="PHOTOS CAPTURED" value={1052} sub="Across 2 booths" tone="pop" />
      </div>

      {/* Funnel */}
      <SectionTitle title="CEREMONY FUNNEL" subtitle="Where the cohort stands across every stage of the day" />
      <Card className="mb-5">
        <div className="space-y-3.5 p-4">
          {funnel.map((f, i) => {
            const pct = (f.value / TOTAL_GRADUATES) * 100;
            const drop = i > 0 ? funnel[i - 1].value - f.value : 0;
            return (
              <div key={f.label}>
                <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
                  <p className="stencil text-[10px] text-ink">{f.label}</p>
                  <div className="flex items-baseline gap-2.5">
                    {drop > 0 && <span className="stencil text-[9px] text-bad">−{formatNumber(drop)}</span>}
                    <span className="figure text-[16px] text-ink">{formatNumber(f.value)}</span>
                    <span className="stencil w-11 text-right text-[9.5px] text-ink-3">{pct.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="h-4 rule bg-paper-2">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${pct}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06, duration: 0.75, ease: [0.2, 0, 0, 1] }}
                    className="h-full"
                    style={{ backgroundColor: f.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Charts */}
      <div className="mb-5 grid gap-3 lg:grid-cols-2">
        <BlockPanel
          label="ATTENDANCE & THROUGHPUT"
          tone="accent"
          action={<Badge tone="ink" size="sm">ON PACE</Badge>}
        >
          <div className="p-4"><FlowChart height={280} /></div>
        </BlockPanel>

        <BlockPanel label="QUEUE WAIT TIMES" tone="warn" action={<Badge tone="ink" size="sm">PEAK 22M</Badge>}>
          <div className="p-4"><QueueChart height={280} /></div>
        </BlockPanel>

        <BlockPanel label="DEPARTMENT PROGRESS" tone="pop" className="lg:col-span-2">
          <div className="p-4"><DepartmentBars height={320} /></div>
        </BlockPanel>
      </div>

      {/* Department table */}
      <SectionTitle title="DEPARTMENT STATISTICS" subtitle="Full breakdown by branch" />
      <Card className="mb-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left">
            <thead>
              <tr className="bg-[rgb(var(--ink))]">
                {["DEPARTMENT", "TOTAL", "CHECKED IN", "STAGE", "BOOTH", "LUNCH", "CERT", "COMPLETION"].map((h) => (
                  <th key={h} className="stencil px-3 py-2.5 text-[9px] text-[rgb(var(--paper))] first:pl-4 last:pr-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.map((d, i) => {
                const pct = Math.round((d.certificate / d.total) * 100);
                return (
                  <motion.tr
                    key={d.code}
                    initial={{ opacity: 0, y: 5 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                    className="rule-b transition-colors hover:bg-paper-2"
                  >
                    <td className="py-3 pr-3 pl-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="stencil grid h-8 w-10 place-items-center rule text-[9px] text-white"
                          style={{ backgroundColor: d.color }}
                        >
                          {d.code}
                        </span>
                        <p className="text-[13px] font-bold text-ink">{d.name}</p>
                      </div>
                    </td>
                    <td className="figure px-3 py-3 text-[14px] text-ink">{d.total}</td>
                    <td className="figure px-3 py-3 text-[14px] text-ink-2">{d.checkedIn}</td>
                    <td className="figure px-3 py-3 text-[14px] text-ink-2">{d.stage}</td>
                    <td className="figure px-3 py-3 text-[14px] text-ink-2">{d.booth}</td>
                    <td className="figure px-3 py-3 text-[14px] text-ink-2">{d.lunch}</td>
                    <td className="figure px-3 py-3 text-[14px] text-ink-2">{d.certificate}</td>
                    <td className="py-3 pr-4 pl-3">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-20 rule bg-paper-2">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${pct}%` }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.15 + i * 0.03, duration: 0.6 }}
                            className="h-full"
                            style={{ backgroundColor: d.color }}
                          />
                        </div>
                        <span className="figure w-8 text-[12px] text-ink">{pct}%</span>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Distribution + exports */}
      <div className="grid gap-3 lg:grid-cols-3">
        <BlockPanel label="BRANCH DISTRIBUTION" tone="ink">
          <div className="p-4"><BranchDonut height={220} /></div>
        </BlockPanel>

        <BlockPanel
          label="HOURLY MOMENTUM"
          tone="ok"
          action={<TrendingUp className="h-4 w-4 text-ink-black" strokeWidth={2.6} />}
        >
          <div className="space-y-4 p-4">
            {[
              { label: "CHECK-IN", values: [186, 342, 411, 298, 182, 64, 36], color: "#2563eb" },
              { label: "STAGE", values: [0, 48, 214, 341, 289, 112, 48], color: "#10b981" },
              { label: "BOOTH", values: [0, 12, 96, 204, 241, 178, 61], color: "#f59e0b" },
            ].map((s) => (
              <div key={s.label}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <p className="stencil text-[9.5px] text-ink-2">{s.label}</p>
                  <p className="figure text-[13px] text-ink">
                    {formatNumber(s.values.reduce((a, b) => a + b, 0))}
                  </p>
                </div>
                <MiniBars values={s.values} color={s.color} />
              </div>
            ))}
          </div>
        </BlockPanel>

        <BlockPanel label="EXPORT" tone="bad">
          <div className="space-y-2 p-4">
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
                className="press-sm tap flex w-full items-center gap-2.5 rule bg-paper px-3 py-2.5 text-left drop-1"
              >
                <x.icon className="h-4 w-4 shrink-0 text-ink" strokeWidth={2.4} />
                <span className="flex-1 text-[12.5px] font-bold text-ink">{x.label}</span>
                <Badge tone="neutral" size="sm">{x.fmt}</Badge>
              </button>
            ))}
          </div>
        </BlockPanel>
      </div>
    </Page>
  );
}
