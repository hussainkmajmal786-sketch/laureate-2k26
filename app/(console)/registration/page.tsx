"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, ExternalLink, ScanLine, UserCheck } from "lucide-react";
import { Page, PageHeader } from "@/components/shell/app-shell";
import { Card, BlockPanel } from "@/components/ui/card";
import { QrScanner } from "@/components/qr-scanner";
import { StudentCard, StudentRow } from "@/components/student-card";
import { Button } from "@/components/ui/button";
import { Badge, LiveBadge } from "@/components/ui/badge";
import { EmptyState, useToast, SuccessDialog } from "@/components/ui/feedback";
import { StatTile } from "@/components/kpi-card";
import type { Student } from "@/lib/data";

export default function RegistrationPage() {
  const [current, setCurrent] = React.useState<Student | null>(null);
  const [recent, setRecent] = React.useState<{ student: Student; at: string }[]>([]);
  const [success, setSuccess] = React.useState(false);
  const [checkedIn, setCheckedIn] = React.useState(1519);
  const { push } = useToast();

  const onScan = (s: Student) => {
    setCurrent(s);
    push({
      title: "BADGE READ",
      description: `${s.name} · ${s.regNo}`,
      tone: s.attendance ? "warn" : "info",
    });
  };

  const markPresent = () => {
    if (!current) return;
    const at = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    setRecent((r) => [{ student: current, at }, ...r].slice(0, 8));
    setCheckedIn((c) => c + 1);
    setSuccess(true);
    setCurrent({ ...current, attendance: true, stage: "checked-in" });
  };

  return (
    <Page>
      <PageHeader
        title="REGISTRATION"
        description="Scan a graduate's QR badge to check them in. Six desks run the same queue — check-ins are deduplicated automatically."
        actions={<LiveBadge label="DESK 1 · ONLINE" />}
      />

      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatTile label="CHECKED IN TODAY" value={checkedIn} sub="74% of cohort" tone="ok" />
        <StatTile label="THIS DESK" value={recent.length + 312} sub="Since 08:00" tone="accent" />
        <StatTile label="AVG. SCAN TIME" value="11s" sub="Badge to confirmation" />
        <StatTile label="NOT ARRIVED" value={528} sub="Awaiting check-in" tone="warn" />
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        <BlockPanel label="QR SCANNER" tone="accent" className="lg:col-span-3">
          <div className="p-4">
            <QrScanner onScan={onScan} />
          </div>
        </BlockPanel>

        <div className="space-y-3 lg:col-span-2">
          <AnimatePresence mode="wait">
            {current ? (
              <StudentCard
                key={current.id}
                student={current}
                statusLabel={current.attendance ? "ALREADY CHECKED IN" : "READY TO CHECK IN"}
                statusTone={current.attendance ? "warn" : "pop"}
                footer={
                  <div className="flex flex-col gap-2">
                    <Button
                      size="lg"
                      block
                      variant={current.attendance ? "secondary" : "primary"}
                      onClick={markPresent}
                      disabled={current.attendance}
                    >
                      <UserCheck className="h-[18px] w-[18px]" strokeWidth={2.6} />
                      {current.attendance ? "ALREADY PRESENT" : "MARK PRESENT"}
                    </Button>
                    <Button size="lg" variant="ghost" block>
                      <ExternalLink className="h-[18px] w-[18px]" strokeWidth={2.6} />
                      VIEW PROFILE
                    </Button>
                  </div>
                }
              />
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card>
                  <EmptyState
                    icon={ScanLine}
                    title="NO BADGE SCANNED"
                    description="Scan a graduate's QR badge and their record appears here with a one-tap check-in."
                  />
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <BlockPanel
        label="RECENT SCANS"
        tone="ink"
        className="mt-3"
        action={recent.length > 0 ? <Badge tone="pop" size="sm">{recent.length}</Badge> : undefined}
      >
        <div className="p-4">
          {recent.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="NOTHING SCANNED YET"
              description="Check-ins from this desk are listed here in order, most recent first."
            />
          ) : (
            <ul>
              {recent.map((r, i) => (
                <motion.li
                  key={`${r.student.id}-${i}`}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="not-last:rule-b"
                >
                  <StudentRow
                    student={r.student}
                    meta={r.student.deptName}
                    trailing={
                      <div className="flex items-center gap-2">
                        <span className="stencil text-[9.5px] text-ink-3">{r.at}</span>
                        <Badge tone="ok" size="sm">PRESENT</Badge>
                      </div>
                    }
                  />
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </BlockPanel>

      <SuccessDialog
        open={success}
        onClose={() => setSuccess(false)}
        title="CHECKED IN"
        description={current ? `${current.name} is marked present and cleared for the stage queue.` : ""}
      />
    </Page>
  );
}
