"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, UtensilsCrossed } from "lucide-react";
import { Page, PageHeader } from "@/components/shell/app-shell";
import { Card, BlockPanel } from "@/components/ui/card";
import { QrScanner } from "@/components/qr-scanner";
import { StudentCard, StudentRow } from "@/components/student-card";
import { Button } from "@/components/ui/button";
import { Badge, LiveBadge } from "@/components/ui/badge";
import { EmptyState, SuccessCheck, useToast } from "@/components/ui/feedback";
import { StatTile } from "@/components/kpi-card";
import { TOTAL_GRADUATES, type Student } from "@/lib/data";

const COUNTERS = [
  { name: "COUNTER A", kind: "Vegetarian", served: 241, capacity: 400, color: "#10b981" },
  { name: "COUNTER B", kind: "Vegetarian", served: 198, capacity: 400, color: "#2563eb" },
  { name: "COUNTER C", kind: "Non-vegetarian", served: 156, capacity: 300, color: "#f59e0b" },
  { name: "COUNTER D", kind: "Jain / Special", served: 83, capacity: 150, color: "#ec4899" },
];

export default function LunchPage() {
  const [current, setCurrent] = React.useState<Student | null>(null);
  const [redeemed, setRedeemed] = React.useState(false);
  const [recent, setRecent] = React.useState<Student[]>([]);
  const [total, setTotal] = React.useState(678);
  const { push } = useToast();

  const onScan = (s: Student) => {
    setCurrent(s);
    setRedeemed(false);
    if (s.lunchDone) {
      push({ title: "ALREADY REDEEMED", description: `${s.name} collected lunch earlier`, tone: "warn" });
    }
  };

  const redeem = () => {
    if (!current || current.lunchDone) return;
    setRedeemed(true);
    setTotal((t) => t + 1);
    setRecent((r) => [current, ...r].slice(0, 6));
    push({ title: "LUNCH REDEEMED", description: current.name, tone: "ok" });
    setCurrent({ ...current, lunchDone: true });
  };

  return (
    <Page>
      <PageHeader
        title="LUNCH"
        description="One coupon per graduate. A second scan is rejected at the counter, so duplicates never reach the kitchen."
        actions={<LiveBadge label="SERVICE OPEN" />}
      />

      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatTile label="REDEEMED" value={total} sub="33% of cohort" tone="ok" />
        <StatTile label="REMAINING" value={TOTAL_GRADUATES - total} sub="Coupons unclaimed" />
        <StatTile label="PEAK RATE" value="386/hr" sub="13:00 – 14:00" tone="accent" />
        <StatTile label="DUPLICATES BLOCKED" value={14} sub="Today" tone="bad" />
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        <BlockPanel label="COUPON SCANNER" tone="ok" className="lg:col-span-3">
          <div className="p-4">
            <QrScanner
              onScan={onScan}
              label="SCAN FOR LUNCH"
              hint="The badge is the coupon — no paper tokens are issued"
            />
          </div>
        </BlockPanel>

        <div className="space-y-3 lg:col-span-2">
          <AnimatePresence mode="wait">
            {redeemed && current ? (
              <motion.div
                key="redeemed"
                initial={{ opacity: 0, scale: 0.95, rotate: -1 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 340, damping: 26 }}
              >
                <Card className="overflow-hidden">
                  <div className="flex flex-col items-center rule-b bg-ok px-5 py-8">
                    <SuccessCheck size={80} />
                    <h2 className="headline mt-4 text-[30px] text-ink-black">LUNCH REDEEMED</h2>
                    <p className="mt-2 text-center text-[13px] font-bold text-ink-black/75">
                      {current.name}
                    </p>
                    <p className="font-mono text-[11.5px] text-ink-black/60">{current.regNo}</p>
                    <Badge tone="ink" size="lg" className="mt-4">COUNTER A · VEGETARIAN</Badge>
                  </div>
                  <div className="p-4">
                    <Button
                      block
                      size="lg"
                      variant="secondary"
                      onClick={() => { setRedeemed(false); setCurrent(null); }}
                    >
                      SCAN NEXT GRADUATE
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ) : current ? (
              <StudentCard
                key={current.id}
                student={current}
                statusLabel={current.lunchDone ? "ALREADY REDEEMED" : "ELIGIBLE"}
                statusTone={current.lunchDone ? "bad" : "ok"}
                footer={
                  current.lunchDone ? (
                    <div className="flex items-start gap-2.5 rule bg-bad p-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-white" strokeWidth={2.6} />
                      <p className="text-[12px] leading-snug font-bold text-white">
                        This coupon was already redeemed today. Direct the graduate to the help desk
                        if they believe this is an error.
                      </p>
                    </div>
                  ) : (
                    <Button size="xl" block variant="success" onClick={redeem}>
                      <UtensilsCrossed className="h-[18px] w-[18px]" strokeWidth={2.6} />
                      REDEEM LUNCH
                    </Button>
                  )
                }
              />
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card>
                  <EmptyState
                    icon={UtensilsCrossed}
                    title="AWAITING BADGE"
                    description="Scan a graduate's badge to check coupon status and redeem their meal."
                  />
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {recent.length > 0 && (
            <BlockPanel label="JUST SERVED" tone="ink">
              <div className="p-3">
                <ul>
                  {recent.map((s, i) => (
                    <li key={`${s.id}-${i}`} className="not-last:rule-b">
                      <StudentRow
                        student={s}
                        meta={s.deptName}
                        trailing={<Check className="h-4 w-4 text-ok" strokeWidth={3} />}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </BlockPanel>
          )}
        </div>
      </div>

      <BlockPanel label="COUNTER LOAD" tone="warn" className="mt-3">
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {COUNTERS.map((c) => {
            const pct = Math.round((c.served / c.capacity) * 100);
            return (
              <div key={c.name} className="rule bg-paper-2">
                <div className="rule-b px-3 py-1.5" style={{ backgroundColor: c.color }}>
                  <p className="stencil text-[10px] text-white">{c.name}</p>
                </div>
                <div className="p-3">
                  <p className="text-[11.5px] text-ink-3">{c.kind}</p>
                  <p className="figure mt-1.5 text-[28px] leading-none text-ink">{c.served}</p>
                  <p className="stencil mt-1 text-[9px] text-ink-3">OF {c.capacity} PORTIONS</p>
                  <div className="mt-2.5 h-3 rule bg-paper">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, ease: [0.2, 0, 0, 1] }}
                      className="h-full"
                      style={{ backgroundColor: pct > 80 ? "#f59e0b" : c.color }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </BlockPanel>
    </Page>
  );
}
