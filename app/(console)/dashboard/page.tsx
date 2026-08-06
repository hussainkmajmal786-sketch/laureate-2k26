"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Award,
  Camera,
  GraduationCap,
  Hourglass,
  ScrollText,
  UserCheck,
  Users,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Page } from "@/components/shell/app-shell";
import { Card, CardContent, BlockPanel, SectionTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/kpi-card";
import { KpiSkeleton, Skeleton } from "@/components/ui/feedback";
import { Timeline, ActivityFeed } from "@/components/timeline";
import { BranchDonut, FlowChart } from "@/components/charts";
import { LiveBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  DEPARTMENTS,
  EVENT,
  KPIS,
  STUDENT_ACTIVITY,
  TIMELINE,
  TOTAL_GRADUATES,
  VOLUNTEER_ACTIVITY,
  getBooths,
} from "@/lib/data";
import { formatNumber } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  GraduationCap, UserCheck, Hourglass, Award, Camera, Users, UtensilsCrossed, ScrollText,
};

const TONES = ["neutral", "ok", "warn", "pop", "accent", "warn", "ok", "accent"] as const;

export default function Dashboard() {
  const [loading, setLoading] = React.useState(true);
  const booths = React.useMemo(() => getBooths(), []);

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const completion = Math.round((586 / TOTAL_GRADUATES) * 100);

  return (
    <Page wide>
      {/* ── Masthead ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.2, 0, 0, 1] }}
        className="relative mb-7 overflow-hidden bg-[rgb(var(--ink))] rule-thick drop-4"
      >
        <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgb(var(--paper)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--paper)) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="pointer-events-none absolute -right-12 -bottom-20 h-64 w-64 rotate-12 border-[20px] border-pop opacity-70" />
        <div className="flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="relative min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <LiveBadge label={EVENT.status.toUpperCase()} />
              <span className="stencil text-[9.5px] text-[rgb(var(--paper))]/50">{EVENT.date.toUpperCase()}</span>
            </div>
            <p className="stencil mt-6 text-[9px] text-pop">EVENT OPERATIONS / CONTROL CENTER</p>
            <h1 className="headline mt-4 text-[clamp(2.5rem,8vw,4.5rem)] text-[rgb(var(--paper))]">
              LAUREATE <span className="text-pop">2K26</span>
            </h1>
            <p className="mt-2.5 max-w-lg text-[13px] leading-relaxed text-[rgb(var(--paper))]/55 text-pretty">
              {EVENT.college} — {EVENT.tagline}. {formatNumber(TOTAL_GRADUATES)} graduates across{" "}
              {DEPARTMENTS.length} departments.
            </p>
          </div>

          {/* Completion block */}
          <div className="relative flex shrink-0 items-end gap-4">
            <div className="rule bg-ok px-4 py-3">
              <p className="figure text-[44px] leading-none text-ink-black">{completion}%</p>
              <p className="stencil mt-1.5 text-[9px] text-ink-black/70">COMPLETE</p>
            </div>
            <div>
              <p className="stencil text-[9.5px] text-[rgb(var(--paper))]/50">
                586 / {formatNumber(TOTAL_GRADUATES)} GRADUATES
              </p>
              <div className="mt-2 h-4 w-40 rule border-[rgb(var(--paper))] sm:w-52">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completion}%` }}
                  transition={{ duration: 1.1, delay: 0.2, ease: [0.2, 0, 0, 1] }}
                  className="h-full bg-ok"
                />
              </div>
              <Link href="/reports">
                <Button size="sm" variant="pop" className="mt-3">
                  REPORTS
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={3} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── KPIs ─────────────────────────────────────────── */}
      <SectionTitle title="LIVE METRICS" subtitle="Updating continuously from every station" action={<LiveBadge label="SYNCED NOW" />} />
      <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <KpiSkeleton key={i} />)
          : KPIS.map((k, i) => (
              <KpiCard
                key={k.key}
                index={i}
                label={k.label.toUpperCase()}
                value={k.value}
                total={k.total}
                delta={k.delta}
                tone={TONES[i]}
                icon={ICONS[k.icon] ?? Activity}
                hint={k.hint}
              />
            ))}
      </div>

      {/* ── Main grid ────────────────────────────────────── */}
      <div className="grid gap-3 lg:grid-cols-3">
        <BlockPanel label="EVENT PROGRESS" tone="pop" className="lg:col-span-1 lg:row-span-2">
          <div className="p-4">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-7 w-7" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-2.5 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Timeline items={TIMELINE} />
            )}
          </div>
        </BlockPanel>

        <BlockPanel
          label="THROUGHPUT BY HOUR"
          tone="accent"
          className="lg:col-span-2"
          action={
            <div className="hidden gap-2.5 sm:flex">
              {[["CHECK-IN", "#2563eb"], ["STAGE", "#10b981"], ["BOOTH", "#f59e0b"]].map(([l, c]) => (
                <span key={l} className="stencil inline-flex items-center gap-1 text-[8.5px] text-accent-ink">
                  <span className="h-2 w-2 border border-accent-ink" style={{ backgroundColor: c }} />
                  {l}
                </span>
              ))}
            </div>
          }
        >
          <div className="p-4">
            {loading ? <Skeleton className="h-[260px] w-full" /> : <FlowChart />}
          </div>
        </BlockPanel>

        <BlockPanel label="BRANCH DISTRIBUTION" tone="ink">
          <div className="p-4">
            {loading ? (
              <Skeleton className="mx-auto h-[200px] w-[200px]" />
            ) : (
              <>
                <BranchDonut height={200} />
                <ul className="mt-3 grid grid-cols-2 gap-x-3">
                  {DEPARTMENTS.map((d) => (
                    <li key={d.code} className="flex items-center gap-2 py-1 text-[11.5px]">
                      <span className="h-2.5 w-2.5 shrink-0 rule" style={{ backgroundColor: d.color }} />
                      <span className="stencil text-[9px] text-ink-3">{d.code}</span>
                      <span className="figure ml-auto text-[12px] text-ink">{d.total}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </BlockPanel>

        <BlockPanel
          label="BOOTH STATUS"
          tone="warn"
          action={
            <Link href="/queue" className="stencil text-[9px] text-ink-black underline">
              MONITOR
            </Link>
          }
        >
          <div className="space-y-3 p-4">
            {booths.map((b) => (
              <div key={b.id} className="rule bg-paper-2">
                <div className="flex items-center justify-between rule-b px-3 py-1.5">
                  <p className="stencil text-[10px] text-ink">BOOTH {b.id}</p>
                  <LiveBadge label="ACTIVE" />
                </div>
                {b.current && (
                  <div className="flex items-center gap-2.5 px-3 py-2.5">
                    <Avatar name={b.current.name} hue={b.current.hue} size="xs" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-bold text-ink">{b.current.name}</p>
                      <p className="font-mono text-[10px] text-ink-3">{b.currentToken}</p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-3 rule-t">
                  {[
                    { v: b.queue.length, l: "QUEUE", c: "text-ink" },
                    { v: `${b.queue.length * b.avgMinutes}m`, l: "WAIT", c: "text-warn" },
                    { v: b.servedToday, l: "SERVED", c: "text-ok" },
                  ].map((m, i) => (
                    <div key={m.l} className={`px-2 py-2 text-center ${i > 0 ? "rule-l" : ""}`}>
                      <p className={`figure text-[16px] ${m.c}`}>{m.v}</p>
                      <p className="stencil text-[8px] text-ink-3">{m.l}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </BlockPanel>

        <BlockPanel label="QUEUE STATUS" tone="bad">
          <div className="space-y-3.5 p-4">
            {[
              { label: "STAGE HOLDING", count: 214, cap: 300, bar: "bg-warn" },
              { label: "PHOTO BOOTH 1", count: 12, cap: 25, bar: "bg-ok" },
              { label: "PHOTO BOOTH 2", count: 9, cap: 25, bar: "bg-ok" },
              { label: "CERTIFICATE DESK", count: 26, cap: 40, bar: "bg-accent" },
            ].map((q) => (
              <div key={q.label}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <p className="stencil text-[9.5px] text-ink">{q.label}</p>
                  <p className="text-[11px] text-ink-3">
                    <span className="figure text-[13px] text-ink">{q.count}</span>/{q.cap}
                  </p>
                </div>
                <div className="h-3 rule bg-paper-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round((q.count / q.cap) * 100)}%` }}
                    transition={{ duration: 0.7, ease: [0.2, 0, 0, 1] }}
                    className={`h-full ${q.bar}`}
                  />
                </div>
              </div>
            ))}

            <div className="flex items-start gap-2.5 rule bg-warn p-3">
              <Zap className="mt-0.5 h-4 w-4 shrink-0 text-ink-black" strokeWidth={2.6} />
              <p className="text-[12px] leading-snug font-bold text-ink-black">
                Booth 2 runs 4 min slower per session. Redirecting the next 6 graduates to Booth 1
                clears the backlog by 12:15.
              </p>
            </div>
          </div>
        </BlockPanel>

        <BlockPanel
          label="VOLUNTEER ACTIVITY"
          tone="ok"
          action={
            <Link href="/volunteers" className="stencil text-[9px] text-ink-black underline">
              ALL
            </Link>
          }
        >
          <div className="p-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-2.5">
                    <Skeleton className="h-7 w-7" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-2.5 w-full" />
                      <Skeleton className="h-2 w-14" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ActivityFeed items={VOLUNTEER_ACTIVITY.slice(0, 6)} />
            )}
          </div>
        </BlockPanel>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between rule-b bg-paper-2 px-4 py-2.5">
            <p className="stencil text-[10.5px] text-ink">RECENT GRADUATE ACTIVITY</p>
            <Link href="/students" className="stencil inline-flex items-center gap-1 text-[9px] text-pop">
              DATABASE
              <ArrowRight className="h-3 w-3" strokeWidth={3} />
            </Link>
          </div>
          <CardContent>
            {loading ? (
              <div className="space-y-2.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <ActivityFeed items={STUDENT_ACTIVITY} showAvatar={false} />
            )}
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
