"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, MonitorPlay, Timer, Users, Zap } from "lucide-react";
import { Page, PageHeader } from "@/components/shell/app-shell";
import { Card, BlockPanel } from "@/components/ui/card";
import { QrScanner } from "@/components/qr-scanner";
import { StudentCard, StudentRow } from "@/components/student-card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge, LiveBadge } from "@/components/ui/badge";
import { EmptyState, useToast } from "@/components/ui/feedback";
import { StatTile } from "@/components/kpi-card";
import { getBooths, type Booth, type Student } from "@/lib/data";

const BOOTH_COLOR = ["#2563eb", "#f59e0b"];

export default function QueueMonitor() {
  const booths = React.useMemo(() => getBooths(), []);
  const [scanned, setScanned] = React.useState<Student | null>(null);
  const [assigned, setAssigned] = React.useState<{ booth: Booth; token: string } | null>(null);
  const [extra, setExtra] = React.useState<Record<number, number>>({ 1: 0, 2: 0 });
  const { push } = useToast();

  const load = (b: Booth) => b.queue.length + (extra[b.id] ?? 0);
  const wait = (b: Booth) => load(b) * b.avgMinutes;

  /** Assign to whichever booth clears the graduate soonest, not the shorter line. */
  const assign = () => {
    if (!scanned) return;
    const target = [...booths].sort((a, b) => wait(a) - wait(b))[0];
    const token = `B${target.id}-${String(load(target) + 2).padStart(3, "0")}`;
    setExtra((e) => ({ ...e, [target.id]: (e[target.id] ?? 0) + 1 }));
    setAssigned({ booth: target, token });
    push({ title: `ASSIGNED TO BOOTH ${target.id}`, description: `${scanned.name} · ${token}`, tone: "ok" });
  };

  const totalWaiting = booths.reduce((s, b) => s + load(b), 0);

  return (
    <Page wide>
      <PageHeader
        title="QUEUE MONITOR"
        description="Both photo booths at a glance. Scan a graduate and the system routes them to whichever booth clears them first."
        actions={
          <>
            <LiveBadge label={`${totalWaiting} WAITING`} />
            <Link href="/display">
              <Button variant="secondary" size="md">
                <MonitorPlay className="h-4 w-4" strokeWidth={2.6} />
                TV BOARD
              </Button>
            </Link>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatTile label="TOTAL IN QUEUE" value={totalWaiting} sub="Across both booths" tone="warn" />
        <StatTile label="LONGEST WAIT" value={`${Math.max(...booths.map(wait))}m`} sub="Booth 2" tone="bad" />
        <StatTile label="SERVED TODAY" value={booths.reduce((s, b) => s + b.servedToday, 0)} sub="Both booths" tone="ok" />
        <StatTile label="THROUGHPUT" value="17/hr" sub="Per booth average" tone="accent" />
      </div>

      <div className="mb-3 grid gap-3 lg:grid-cols-2">
        {booths.map((b, i) => (
          <BoothQueueCard
            key={b.id}
            booth={b}
            extraCount={extra[b.id] ?? 0}
            highlight={assigned?.booth.id === b.id}
            index={i}
          />
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        <BlockPanel label="QUEUE ASSIGNMENT" tone="pop" className="lg:col-span-3">
          <div className="p-4">
            <QrScanner
              onScan={(s) => { setScanned(s); setAssigned(null); }}
              label="SCAN TO JOIN A QUEUE"
              hint="Only graduates who have crossed the stage are eligible"
              filter={(s) => s.stageDone && !s.boothDone}
              compact
            />
          </div>
        </BlockPanel>

        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {assigned && scanned ? (
              <motion.div
                key="assigned"
                initial={{ opacity: 0, scale: 0.95, rotate: -1.5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 340, damping: 26 }}
              >
                <Card className="overflow-hidden">
                  <div
                    className="grain relative px-5 py-7 text-center"
                    style={{ backgroundColor: BOOTH_COLOR[assigned.booth.id - 1] }}
                  >
                    <p className="stencil text-[9.5px] text-white/75">ASSIGNED TO</p>
                    <p className="headline mt-2 text-[42px] leading-none text-white">
                      BOOTH {assigned.booth.id}
                    </p>
                    <p className="figure mt-3 font-mono text-[30px] leading-none text-white">
                      {assigned.token}
                    </p>
                    <Badge tone="ink" size="lg" className="mt-4">
                      <Timer className="h-3.5 w-3.5" strokeWidth={2.6} />
                      ~{wait(assigned.booth)} MIN WAIT
                    </Badge>
                  </div>
                  <div className="space-y-2 p-4">
                    <div className="rule">
                      <StudentRow student={scanned} meta={scanned.deptName} />
                    </div>
                    <Button
                      block
                      size="lg"
                      variant="secondary"
                      onClick={() => { setScanned(null); setAssigned(null); }}
                    >
                      SCAN NEXT GRADUATE
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ) : scanned ? (
              <StudentCard
                key={scanned.id}
                student={scanned}
                statusLabel="AWAITING ASSIGNMENT"
                statusTone="warn"
                showJourney={false}
                footer={
                  <div className="w-full space-y-2">
                    <Button size="xl" block variant="pop" onClick={assign}>
                      <Zap className="h-[18px] w-[18px]" strokeWidth={2.6} />
                      ASSIGN AUTOMATICALLY
                    </Button>
                    <p className="stencil text-center text-[8.5px] text-ink-3">
                      ROUTES TO THE SHORTEST PROJECTED WAIT
                    </p>
                  </div>
                }
              />
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="h-full">
                  <EmptyState
                    icon={Users}
                    title="NO GRADUATE SCANNED"
                    description="Scan a badge to see live wait times for both booths and assign a token automatically."
                  />
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Page>
  );
}

function BoothQueueCard({
  booth,
  extraCount,
  highlight,
  index,
}: {
  booth: Booth;
  extraCount: number;
  highlight: boolean;
  index: number;
}) {
  const count = booth.queue.length + extraCount;
  const wait = count * booth.avgMinutes;
  const busy = wait > 20;
  const color = BOOTH_COLOR[index];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: [0.2, 0, 0, 1] }}
      className={highlight ? "drop-4" : ""}
    >
      <Card className={highlight ? "border-pop" : ""}>
        <div className="grain relative rule-b px-4 py-4" style={{ backgroundColor: color }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="headline text-[24px] text-white">BOOTH {booth.id}</p>
              <p className="stencil mt-1 text-[9px] text-white/75">{booth.photographer}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <LiveBadge label="ACTIVE" />
              <Badge tone="ink" size="sm">{busy ? "BUSY" : "FLOWING"}</Badge>
            </div>
          </div>

          {booth.current && (
            <div className="mt-4 flex items-center gap-3 rule bg-paper p-2.5">
              <Avatar name={booth.current.name} hue={booth.current.hue} size="md" />
              <div className="min-w-0 flex-1">
                <p className="stencil text-[8.5px] text-ink-3">NOW SERVING</p>
                <p className="truncate text-[16px] leading-tight font-black text-ink">
                  {booth.current.name}
                </p>
                <p className="truncate font-mono text-[10.5px] text-ink-3">{booth.current.regNo}</p>
              </div>
              <span className="stencil shrink-0 rule bg-[rgb(var(--ink))] px-2 py-1.5 text-[11px] text-[rgb(var(--paper))]">
                {booth.currentToken}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 rule-b">
          {[
            { label: "IN QUEUE", value: count, c: "text-ink" },
            { label: "EST. WAIT", value: `${wait}m`, c: busy ? "text-bad" : "text-ok" },
            { label: "SERVED", value: booth.servedToday, c: "text-ink" },
          ].map((m, i) => (
            <div key={m.label} className={`px-3 py-3 text-center ${i > 0 ? "rule-l" : ""}`}>
              <p className={`figure text-[22px] leading-none ${m.c}`}>{m.value}</p>
              <p className="stencil mt-1.5 text-[8.5px] text-ink-3">{m.label}</p>
            </div>
          ))}
        </div>

        <div className="p-3">
          <p className="stencil mb-1.5 text-[9px] text-ink-3">WAITING</p>
          <ul className="max-h-[260px] overflow-y-auto">
            {booth.queue.map((q) => (
              <li key={q.token} className="not-last:rule-b">
                <StudentRow
                  student={q.student}
                  meta={q.student.deptName}
                  trailing={
                    <div className="flex items-center gap-2">
                      <span className="stencil text-[8.5px] text-ink-3">~{q.waitMin}M</span>
                      <span className="stencil rule bg-paper-2 px-1.5 py-1 text-[9px] text-ink">
                        {q.token}
                      </span>
                    </div>
                  }
                />
              </li>
            ))}
            {extraCount > 0 && (
              <li className="stencil flex items-center gap-2 py-3 text-[9.5px] text-pop">
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={3} />
                {extraCount} NEWLY ASSIGNED
              </li>
            )}
          </ul>
        </div>
      </Card>
    </motion.div>
  );
}
