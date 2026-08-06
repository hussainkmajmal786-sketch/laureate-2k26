"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCheck, Clock, ScanLine, UserCheck } from "lucide-react";
import { Card, BlockPanel } from "@/components/ui/card";
import { QrScanner } from "@/components/qr-scanner";
import { StudentCard, StudentRowItem } from "@/components/student-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, useToast, SuccessDialog } from "@/components/ui/feedback";
import { checkInStudent } from "@/lib/actions";
import type { StudentRow } from "@/lib/supabase/types";

interface ScanEntry {
  student: StudentRow;
  at: string;
}

export function RegistrationStation({ station }: { station: string | null }) {
  const [current, setCurrent] = React.useState<StudentRow | null>(null);
  const [recent, setRecent] = React.useState<ScanEntry[]>([]);
  const [success, setSuccess] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const { push } = useToast();

  const onScan = (s: StudentRow) => {
    setCurrent(s);
    push({
      title: "Badge read",
      description: `${s.name} · ${s.reg_no}`,
      tone: s.attendance ? "warn" : "info",
    });
  };

  const markPresent = async () => {
    if (!current || pending) return;
    setPending(true);

    const result = await checkInStudent(current.id, station ?? undefined);
    setPending(false);

    if (!result.ok) {
      push({ title: "Check-in failed", description: result.error, tone: "bad" });
      return;
    }

    const updated = result.data!;
    setCurrent(updated);
    setRecent((r) =>
      [
        { student: updated, at: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) },
        ...r,
      ].slice(0, 8),
    );
    setSuccess(true);
  };

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-5">
        <BlockPanel label="QR Scanner" tone="accent" className="lg:col-span-3">
          <div className="p-5">
            <QrScanner
              onScan={onScan}
              onError={(m) => push({ title: "Scan failed", description: m, tone: "bad" })} eligible="any" />
          </div>
        </BlockPanel>

        <div className="space-y-4 lg:col-span-2">
          <AnimatePresence mode="wait">
            {current ? (
              <StudentCard
                key={current.id}
                student={current}
                statusLabel={current.attendance ? "Already checked in" : "Ready to check in"}
                statusTone={current.attendance ? "warn" : "accent"}
                footer={
                  <Button size="lg"
                    block
                    variant={current.attendance ? "secondary" : "primary"}
                    onClick={markPresent}
                    disabled={current.attendance || pending} >
                    <UserCheck className="h-[18px] w-[18px]" />
                    {current.attendance ? "Already marked present" : pending ? "Saving…" : "Mark present"}
                  </Button>
                } />
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card>
                  <EmptyState
                    icon={ScanLine} title="No badge scanned" description="Scan a graduate's QR badge and their record appears here with a one-tap check-in." />
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <BlockPanel label="Recent scans" tone="neutral"
        className="mt-4"
        action={recent.length > 0 ? <Badge tone="accent" size="sm">{recent.length}</Badge> : undefined} >
        <div className="p-5">
          {recent.length === 0 ? (
            <EmptyState
              icon={Clock} title="Nothing scanned yet" description="Check-ins from this desk are listed here in order, most recent first." />
          ) : (
            <ul className="divide-y divide-[rgb(var(--rule-soft))]">
              {recent.map((r, i) => (
                <motion.li
                  key={`${r.student.id}-${i}`}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35 }}
                  className="py-1" >
                  <StudentRowItem
                    student={r.student}
                    meta={r.student.dept_code}
                    trailing={
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[11.5px] text-ink-3">{r.at}</span>
                        <Badge tone="ok" size="sm">
                          <CheckCheck className="h-3 w-3" />
                          Present
                        </Badge>
                      </div>
                    } />
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </BlockPanel>

      <SuccessDialog
        open={success}
        onClose={() => setSuccess(false)} title="Checked in"
        description={
          current ? `${current.name} is now marked present and cleared for the stage queue.` : ""
        } />
    </>
  );
}
