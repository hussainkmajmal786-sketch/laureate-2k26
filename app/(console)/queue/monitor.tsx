"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Timer, Users } from "lucide-react";
import { Card, BlockPanel } from "@/components/ui/card";
import { QrScanner } from "@/components/qr-scanner";
import { StudentCard, StudentRowItem } from "@/components/student-card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge, LiveBadge } from "@/components/ui/badge";
import { EmptyState, useToast } from "@/components/ui/feedback";
import { assignBooth } from "@/lib/actions";
import { useRealtimeRefresh } from "@/lib/use-realtime";
import type { BoothStatus, StudentRow } from "@/lib/supabase/types";
import type { QueueEntryRow } from "@/lib/queries";

const BOOTH_TINT = ["#4f46e5", "#f59e0b"];

export function QueueMonitor({
  initialBooths,
  initialQueues,
}: {
  initialBooths: BoothStatus[];
  initialQueues: QueueEntryRow[];
}) {
  const router = useRouter();
  const [scanned, setScanned] = React.useState<StudentRow | null>(null);
  const [assigned, setAssigned] = React.useState<{ booth: number; token: string; wait: number } | null>(null);
  const [pending, setPending] = React.useState(false);
  const { push } = useToast();

  // Any change to the queue anywhere refreshes this view.
  useRealtimeRefresh(["booth_queue", "booths"]);

  const assign = async () => {
    if (!scanned || pending) return;
    setPending(true);

    const result = await assignBooth(scanned.id);
    setPending(false);

    if (!result.ok) {
      push({ title: "Could not assign", description: result.error, tone: "bad" });
      return;
    }

    setAssigned({
      booth: result.data!.booth_id,
      token: result.data!.token,
      wait: result.data!.est_wait,
    });
    push({
      title: `Assigned to Booth ${result.data!.booth_id}`,
      description: `${scanned.name} · ${result.data!.token}`,
      tone: "ok",
    });
    router.refresh();
  };

  return (
    <>
      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        {initialBooths.map((b, i) => (
          <BoothCard
            key={b.id}
            booth={b}
            queue={initialQueues.filter((q) => q.booth_id === b.id)}
            tint={BOOTH_TINT[i % BOOTH_TINT.length]}
            highlight={assigned?.booth === b.id}
            index={i} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <BlockPanel label="Queue assignment" tone="accent" className="lg:col-span-3">
          <div className="p-5">
            <QrScanner
              onScan={(s) => { setScanned(s); setAssigned(null); }}
              onError={(m) => push({ title: "Scan failed", description: m, tone: "bad" })} label="Scan to join a booth queue" hint="Only graduates who have crossed the stage are eligible" eligible="stage-done"
              compact />
          </div>
        </BlockPanel>

        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {assigned && scanned ? (
              <motion.div key="assigned"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }} >
                <Card className="overflow-hidden">
                  <div className="grain relative bg-accent px-6 py-8 text-center">
                    <p className="stencil text-accent">Assigned to</p>
                    <p className="mt-2 text-[34px] leading-none font-bold tracking-[-0.035em] text-ink">
                      Booth {assigned.booth}
                    </p>
                    <p className="mt-3 font-mono text-2xl font-semibold tracking-wider text-accent">
                      {assigned.token}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2  bg-paper px-3 py-1.5 rule">
                      <Timer className="h-3.5 w-3.5 text-ink-3" />
                      <span className="text-[12.5px] font-medium text-ink-2">
                        Approx. {assigned.wait} min wait
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 p-5">
                    <StudentRowItem student={scanned} meta={scanned.dept_code} />
                    <Button
                      block size="lg" variant="secondary"
                      onClick={() => { setScanned(null); setAssigned(null); }} >
                      Scan next graduate
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ) : scanned ? (
              <StudentCard
                key={scanned.id}
                student={scanned}
                statusLabel="Awaiting booth assignment"
                statusTone="warn"
                showJourney={false}
                footer={
                  <div className="w-full space-y-2">
                    <Button size="xl" block onClick={assign} disabled={pending}>
                      <Sparkles className="h-[18px] w-[18px]" />
                      {pending ? "Assigning…" : "Assign automatically"}
                    </Button>
                    <p className="text-center text-[11.5px] text-ink-3">
                      Routes to the booth with the shortest projected wait
                    </p>
                  </div>
                } />
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="h-full">
                  <EmptyState
                    icon={Users} title="No graduate scanned" description="Scan a badge to see live wait times for both booths and assign a token automatically." />
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

function BoothCard({
  booth,
  queue,
  tint,
  highlight,
  index,
}: {
  booth: BoothStatus;
  queue: QueueEntryRow[];
  tint: string;
  highlight: boolean;
  index: number;
}) {
  const busy = (booth.est_wait ?? 0) > 20;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} >
      <Card className={highlight ? "drop-4 ring-2 ring-[rgb(var(--accent))]" : ""}>
        <div
          className="grain relative rounded-t-[24px] px-5 py-5"
          style={{ backgroundImage: `linear-gradient(135deg, ${tint}26, transparent 70%)` }} >
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[17px] font-bold tracking-[-0.025em] text-ink">
                  Booth {booth.id}
                </span>
                <LiveBadge label="Active" />
              </div>
              <p className="mt-0.5 text-[12.5px] text-ink-3">{booth.photographer}</p>
            </div>
            <Badge tone={busy ? "warn" : "ok"} size="md">{busy ? "Busy" : "Flowing"}</Badge>
          </div>

          {booth.current_name && (
            <div className="relative mt-4 flex items-center gap-3.5  bg-paper p-3.5 rule drop-1">
              <Avatar name={booth.current_name} hue={booth.current_hue ?? 220} size="md" ring={false} />
              <div className="min-w-0 flex-1">
                <p className="stencil text-ink-3">Now serving</p>
                <p className="truncate text-[16px] font-bold tracking-[-0.02em] text-ink">
                  {booth.current_name}
                </p>
                <p className="truncate font-mono text-[11.5px] text-ink-3">{booth.current_reg_no}</p>
              </div>
              <span className="shrink-0  bg-accent px-2.5 py-1.5 font-mono text-[13px] font-semibold text-accent">
                {booth.current_token}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 divide-x divide-[rgb(var(--rule-soft))] border-y border-[rgb(var(--rule))]">
          {[
            { label: "In queue", value: booth.waiting ?? 0, tone: "text-ink" },
            { label: "Est. wait", value: `${booth.est_wait ?? 0}m`, tone: busy ? "text-warn" : "text-ok" },
            { label: "Served", value: booth.served_today ?? 0, tone: "text-ink" },
          ].map((m) => (
            <div key={m.label} className="px-3 py-3.5 text-center">
              <p className={`figure text-[20px] ${m.tone}`}>{m.value}</p>
              <p className="mt-0.5 text-[11px] text-ink-3">{m.label}</p>
            </div>
          ))}
        </div>

        <div className="p-4">
          <p className="stencil mb-1.5 text-ink-3">Waiting</p>
          {queue.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-ink-3">Queue is empty</p>
          ) : (
            <ul className="max-h-[280px] divide-y divide-[rgb(var(--rule-soft))] overflow-y-auto">
              {queue.map((q) => (
                <li key={q.id} className="py-1">
                  <StudentRowItem
                    student={q.student}
                    meta={q.student.dept_code}
                    trailing={
                      <span className=" bg-paper-2 px-2 py-1 font-mono text-[11px] font-medium text-ink-2 rule">
                        {q.token}
                      </span>
                    } />
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
