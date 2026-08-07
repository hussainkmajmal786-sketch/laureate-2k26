import Link from "next/link";
import { Page } from "@/components/shell/app-shell";
import { CardContent, BlockPanel, SectionTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/kpi-card";
import { Timeline, ActivityFeed } from "@/components/timeline";
import { BranchDonut, FlowChart } from "@/components/charts";
import { LiveBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { CompletionRing } from "@/components/completion-ring";
import { QueueBars } from "@/components/queue-bars";
import {
  getAnnouncements,
  getBoothStatus,
  getDepartmentStats,
  getEventSettings,
  getEventStats,
  getHourlyFlow,
  getRecentActivity,
  getTimeline,
} from "@/lib/queries";
import { formatNumber } from "@/lib/utils";

// Live console — never serve a cached snapshot of the ceremony.
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [settings, stats, deptStats, booths, timeline, activity, flow, announcements] =
    await Promise.all([
      getEventSettings(),
      getEventStats(),
      getDepartmentStats(),
      getBoothStatus(),
      getTimeline(),
      getRecentActivity(8),
      getHourlyFlow(),
      getAnnouncements(),
    ]);

  const total = stats?.total ?? 0;
  const completion = total ? Math.round(((stats?.certificate_done ?? 0) / total) * 100) : 0;

  const kpis = [
    { label: "Total Graduates", value: total, icon: "GraduationCap" as const, tone: "neutral" as const, hint: `Across ${deptStats.length} departments` },
    { label: "Checked In", value: stats?.checked_in ?? 0, total, icon: "UserCheck" as const, tone: "ok" as const, hint: "Attendance" },
    { label: "Waiting", value: stats?.waiting ?? 0, icon: "Hourglass" as const, tone: "warn" as const, hint: "In holding area" },
    { label: "On Stage", value: stats?.on_stage ?? 0, icon: "Award" as const, tone: "accent" as const, hint: "Live right now" },
    { label: "Photos Captured", value: stats?.photos ?? 0, icon: "Camera" as const, tone: "accent" as const, hint: "Stage and booth" },
    { label: "Booth Queue", value: booths.reduce((s, b) => s + (b.waiting ?? 0), 0), icon: "Users" as const, tone: "warn" as const, hint: `Across ${booths.length} booths` },
    { label: "Lunch Completed", value: stats?.lunch_done ?? 0, total, icon: "UtensilsCrossed" as const, tone: "ok" as const, hint: "Coupons redeemed" },
    { label: "Certificates", value: stats?.certificate_done ?? 0, total, icon: "ScrollText" as const, tone: "ok" as const, hint: "Distributed" },
  ];

  return (
    <Page wide>
      {/* ── Hero ─────────────────────────────────────────── */}
      <div className="grain relative mb-7 overflow-hidden rule drop-3 bg-[#0B0D14] px-6 py-9 sm:px-10 sm:py-12">
        <div className="animate-bob absolute -top-1/3 -left-20 h-[420px] w-[420px]  bg-[#3B4FD8]/22 blur-[110px]" />
        <div className="animate-bob absolute -right-20 -bottom-1/3 h-[380px] w-[380px]  bg-[#7C3AED]/16 blur-[100px]" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2  bg-[#232B44] px-2.5 py-1 text-[11.5px] font-medium text-[#E8EDF9]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping  bg-[#4ADE80] opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5  bg-[#4ADE80]" />
                </span>
                {settings?.status ?? "Live"}
              </span>
              <span className="text-[11.5px] text-[#9AA8C7]">{settings?.event_date}</span>
            </div>

            <h1 className="headline text-[clamp(3rem,12vw,9rem)] mt-4 text-white">
              Laureate{" "}
              <span className="bg-gradient-to-r from-[#7DA2FF] via-[#A78BFA] to-[#22D3EE] bg-clip-text text-transparent">
                2K26
              </span>
            </h1>
            <p className="mt-4 max-w-lg text-[14.5px] leading-relaxed text-[#B9C4E0] text-pretty">
              {settings?.college} — {settings?.tagline}. {formatNumber(total)} graduates across{" "}
              {deptStats.length} departments.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-5">
            <CompletionRing value={completion} />
            <div>
              <p className="text-[13px] font-medium text-[#E8EDF9]">Ceremony complete</p>
              <p className="mt-0.5 text-[12px] text-[#9AA8C7]">
                {formatNumber(stats?.certificate_done ?? 0)} of {formatNumber(total)} graduates
              </p>
              <Link href="/reports">
                <Button size="sm" variant="glass" className="mt-3 text-white">
                  View reports
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPIs ─────────────────────────────────────────── */}
      <SectionTitle title="Live metrics" subtitle="Straight from the database — every scan updates these"
        action={<LiveBadge />} />
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <KpiCard key={k.label} index={i} {...k} />
        ))}
      </div>

      {/* ── Main grid ────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <BlockPanel label="Event progress" tone="accent" className="lg:col-span-1 lg:row-span-2">
          <div className="p-5">
            <Timeline items={timeline} />
          </div>
        </BlockPanel>

        <BlockPanel label="Throughput by hour" tone="pop"
          className="lg:col-span-2"
          action={
            <div className="hidden gap-3 text-[11.5px] sm:flex">
              {[["Check-in", "#4f46e5"], ["Stage", "#10b981"], ["Booth", "#f59e0b"]].map(([l, c]) => (
                <span key={l} className="inline-flex items-center gap-1.5 text-ink-3">
                  <span className="h-2 w-2 " style={{ backgroundColor: c }} />
                  {l}
                </span>
              ))}
            </div>
          } >
          <div className="p-5">
            {flow.length > 0 ? (
              <FlowChart data={flow} />
            ) : (
              <div className="flex h-[260px] flex-col items-center justify-center text-center">
                <p className="text-[14px] font-medium text-ink-2">No scans logged yet</p>
                <p className="mt-1.5 max-w-xs text-[12.5px] text-ink-3">
                  This chart is built from the live scan log. Check in a graduate and it starts
                  filling in.
                </p>
              </div>
            )}
          </div>
        </BlockPanel>

        <BlockPanel label="Branch distribution" tone="neutral">
          <div className="p-5">
            <BranchDonut data={deptStats} height={200} />
            <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
              {deptStats.map((d) => (
                <li key={d.code} className="flex items-center gap-2 text-[12px]">
                  <span
                    className="h-2 w-2 shrink-0 "
                    style={{ backgroundColor: d.color ?? "#4f46e5" }} />
                  <span className="truncate text-ink-3">{d.code}</span>
                  <span className="figure ml-auto text-ink">{d.total}</span>
                </li>
              ))}
            </ul>
          </div>
        </BlockPanel>

        <BlockPanel label="Booth status" tone="warn"
          action={
            <Link href="/queue" className="text-[12.5px] font-medium text-accent hover:underline">
              Monitor
            </Link>
          } >
          <div className="space-y-3 p-5">
            {booths.map((b) => (
              <div key={b.id} className=" bg-paper-2 p-3.5 rule">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-ink">Booth {b.id}</p>
                  <LiveBadge label="Active" />
                </div>
                {b.current_name && (
                  <div className="mt-2.5 flex items-center gap-2.5">
                    <Avatar name={b.current_name} hue={b.current_hue ?? 220} size="xs" ring={false} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium text-ink">{b.current_name}</p>
                      <p className="font-mono text-[11px] text-ink-3">{b.current_token}</p>
                    </div>
                  </div>
                )}
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[rgb(var(--rule))] pt-2.5 text-center">
                  <div>
                    <p className="figure text-[16px] text-ink">{b.waiting}</p>
                    <p className="text-[10.5px] text-ink-3">In queue</p>
                  </div>
                  <div>
                    <p className="figure text-[16px] text-warn">{b.est_wait}m</p>
                    <p className="text-[10.5px] text-ink-3">Est. wait</p>
                  </div>
                  <div>
                    <p className="figure text-[16px] text-ok">{b.served_today}</p>
                    <p className="text-[10.5px] text-ink-3">Served</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </BlockPanel>

        <BlockPanel label="Queue status" tone="bad">
          <div className="space-y-4 p-5">
            <QueueBars
              rows={[
                { label: "Stage holding area", count: stats?.waiting ?? 0, cap: settings?.holding_capacity ?? 300, tone: "warn" },
                ...booths.map((b) => ({
                  label: `Photo Booth ${b.id}`,
                  count: b.waiting ?? 0,
                  cap: settings?.queue_warn_at ?? 25,
                  tone: (b.waiting ?? 0) > (settings?.queue_warn_at ?? 25) ? ("bad" as const) : ("ok" as const),
                })),
              ]} />
            {announcements[0] && (
              <div className=" bg-accent p-3.5">
                <p className="text-[12.5px] leading-relaxed text-accent">{announcements[0].body}</p>
              </div>
            )}
          </div>
        </BlockPanel>

        <BlockPanel label="Recent activity" tone="ok"
          className="lg:col-span-2"
          action={
            <Link href="/students" className="text-[12.5px] font-medium text-accent hover:underline">
              Student database
            </Link>
          } >
          <CardContent className="pt-5">
            {activity.length > 0 ? (
              <ActivityFeed items={activity} />
            ) : (
              <div className="py-10 text-center">
                <p className="text-[14px] font-medium text-ink-2">No activity yet</p>
                <p className="mt-1.5 text-[12.5px] text-ink-3">
                  Every check-in, stage walk and collection appears here as it happens.
                </p>
              </div>
            )}
          </CardContent>
        </BlockPanel>
      </div>
    </Page>
  );
}
