"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, UtensilsCrossed } from "lucide-react";
import { Card, BlockPanel } from "@/components/ui/card";
import { QrScanner } from "@/components/qr-scanner";
import { StudentCard, StudentRowItem } from "@/components/student-card";
import { Button } from "@/components/ui/button";
import { EmptyState, SuccessCheck, useToast } from "@/components/ui/feedback";
import { redeemLunch } from "@/lib/actions";
import type { StudentRow } from "@/lib/supabase/types";

export function LunchStation() {
  const [current, setCurrent] = React.useState<StudentRow | null>(null);
  const [redeemed, setRedeemed] = React.useState(false);
  const [recent, setRecent] = React.useState<StudentRow[]>([]);
  const [pending, setPending] = React.useState(false);
  const { push } = useToast();

  const onScan = (s: StudentRow) => {
    setCurrent(s);
    setRedeemed(false);
    if (s.lunch_done) {
      push({
        title: "Coupon already redeemed",
        description: `${s.name} collected lunch earlier today.`,
        tone: "warn",
      });
    }
  };

  const redeem = async () => {
    if (!current || pending) return;
    setPending(true);

    const result = await redeemLunch(current.id);
    setPending(false);

    if (!result.ok) {
      push({ title: "Cannot redeem", description: result.error, tone: "bad" });
      // The database is the source of truth on duplicates — reflect it.
      if (result.error?.includes("already redeemed")) {
        setCurrent({ ...current, lunch_done: true });
      }
      return;
    }

    const updated = result.data!;
    setCurrent(updated);
    setRedeemed(true);
    setRecent((r) => [updated, ...r].slice(0, 6));
    push({ title: "Lunch redeemed", description: updated.name, tone: "ok" });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <BlockPanel label="Coupon scanner" tone="ok" className="lg:col-span-3">
        <div className="p-5">
          <QrScanner
            onScan={onScan}
            onError={(m) => push({ title: "Scan failed", description: m, tone: "bad" })} label="Scan for lunch redemption" hint="The badge is the coupon — no paper tokens are issued" eligible="any" />
        </div>
      </BlockPanel>

      <div className="space-y-4 lg:col-span-2">
        <AnimatePresence mode="wait">
          {redeemed && current ? (
            <motion.div key="redeemed"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }} >
              <Card className="overflow-hidden">
                <div className="flex flex-col items-center bg-ok-soft px-6 py-10">
                  <SuccessCheck size={84} />
                  <h2 className="mt-5 text-[22px] font-bold tracking-[-0.03em] text-ink">
                    Lunch redeemed
                  </h2>
                  <p className="mt-2 text-center text-[14px] text-ink-2">{current.name}</p>
                  <p className="font-mono text-[12px] text-ink-3">{current.reg_no}</p>
                </div>
                <div className="p-5">
                  <Button
                    block size="lg" variant="secondary"
                    onClick={() => { setRedeemed(false); setCurrent(null); }} >
                    Scan next graduate
                  </Button>
                </div>
              </Card>
            </motion.div>
          ) : current ? (
            <StudentCard
              key={current.id}
              student={current}
              statusLabel={current.lunch_done ? "Already redeemed" : "Eligible for lunch"}
              statusTone={current.lunch_done ? "bad" : "ok"}
              footer={
                current.lunch_done ? (
                  <div className="flex items-start gap-2.5  bg-bad-soft p-3.5">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-bad" />
                    <p className="text-[12.5px] leading-relaxed text-bad">
                      This coupon was already redeemed today. Send the graduate to the help desk if
                      they believe this is an error.
                    </p>
                  </div>
                ) : (
                  <Button size="lg" block variant="success" onClick={redeem} disabled={pending}>
                    <UtensilsCrossed className="h-[18px] w-[18px]" />
                    {pending ? "Redeeming…" : "Redeem lunch"}
                  </Button>
                )
              } />
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card>
                <EmptyState
                  icon={UtensilsCrossed} title="Awaiting badge" description="Scan a graduate's badge to check their coupon status and redeem their meal." />
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {recent.length > 0 && (
          <BlockPanel label="Just served" tone="neutral">
            <div className="p-4">
              <ul className="divide-y divide-[rgb(var(--rule-soft))]">
                {recent.map((s, i) => (
                  <li key={`${s.id}-${i}`} className="py-1">
                    <StudentRowItem
                      student={s}
                      meta={s.dept_code}
                      trailing={<Check className="h-4 w-4 text-ok" />} />
                  </li>
                ))}
              </ul>
            </div>
          </BlockPanel>
        )}
      </div>
    </div>
  );
}
