"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Award, ChevronRight, SkipForward, Volume2 } from "lucide-react";
import { Page, PageHeader } from "@/components/shell/app-shell";
import { Card, BlockPanel } from "@/components/ui/card";
import { StudentCard, StudentRow, deptColor } from "@/components/student-card";
import { UploadCard, makeShot, type Shot } from "@/components/upload-card";
import { ProgressSteps } from "@/components/timeline";
import { Button } from "@/components/ui/button";
import { Badge, LiveBadge } from "@/components/ui/badge";
import { EmptyState, SuccessDialog, useToast } from "@/components/ui/feedback";
import { StatTile } from "@/components/kpi-card";
import { getStudents, type Student } from "@/lib/data";

const STEPS = ["CALLED", "ON STAGE", "PHOTO", "CLEARED"];

export default function StagePage() {
  const upNext = React.useMemo(
    () => getStudents().filter((s) => s.attendance && !s.stageDone).slice(0, 8),
    [],
  );

  const [current, setCurrent] = React.useState<Student | null>(upNext[0] ?? null);
  const [shots, setShots] = React.useState<Shot[]>([]);
  const [step, setStep] = React.useState(1);
  const [success, setSuccess] = React.useState(false);
  const [completed, setCompleted] = React.useState(1052);
  const [queue, setQueue] = React.useState(upNext.slice(1));
  const { push } = useToast();

  const addShot = (label: string) => {
    setShots((s) => [...s, makeShot(label)]);
    setStep((v) => Math.max(v, 2));
  };

  const completeStage = () => {
    if (!current) return;
    setCompleted((c) => c + 1);
    setStep(3);
    setSuccess(true);
  };

  const callNext = () => {
    const [next, ...rest] = queue;
    setCurrent(next ?? null);
    setQueue(rest);
    setShots([]);
    setStep(1);
    if (next) push({ title: "CALLED TO STAGE", description: next.name, tone: "info" });
  };

  return (
    <Page>
      <PageHeader
        title="STAGE"
        description="Session II conferral. Call the graduate, capture the handshake, and clear the stage for the next name."
        actions={
          <>
            <LiveBadge label="SESSION II" />
            <Button variant="pop" size="md" onClick={callNext} disabled={queue.length === 0}>
              <SkipForward className="h-4 w-4" strokeWidth={2.6} />
              CALL NEXT
            </Button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatTile label="CROSSED THE STAGE" value={completed} sub="51% of cohort" tone="ok" />
        <StatTile label="WAITING" value={214} sub="Holding area B" tone="warn" />
        <StatTile label="AVG. PER GRADUATE" value="24s" sub="Call to clear" tone="accent" />
        <StatTile label="SESSION PACE" value="148/hr" sub="On schedule" tone="pop" />
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-3">
          <AnimatePresence mode="wait">
            {current ? (
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
                className="space-y-3"
              >
                {/* Announcer card — the name is the whole design */}
                <Card className="overflow-hidden">
                  <div
                    className="grain relative px-5 py-7 sm:px-7"
                    style={{ backgroundColor: deptColor(current.dept) }}
                  >
                    <div className="relative flex flex-wrap items-center gap-2">
                      <Badge tone="ink" size="md">READY FOR STAGE</Badge>
                      <Badge tone="ink" size="md">POSITION {completed + 1}</Badge>
                      <button
                        onClick={() => push({ title: "ANNOUNCED", description: current.name, tone: "info" })}
                        className="stencil tap ml-auto inline-flex items-center gap-1.5 rule border-white bg-white/15 px-2.5 py-1.5 text-[9.5px] text-white hover:bg-white hover:text-ink-black"
                      >
                        <Volume2 className="h-3.5 w-3.5" strokeWidth={2.6} />
                        ANNOUNCE
                      </button>
                    </div>

                    <h2 className="headline mt-5 text-[clamp(2rem,7vw,4rem)] text-white text-balance">
                      {current.name}
                    </h2>
                    <p className="mt-3 font-mono text-[14px] font-medium tracking-widest text-white/80">
                      {current.regNo}
                    </p>
                    <div className="stencil mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[9.5px] text-white/75">
                      <span>{current.deptName}</span>
                      <span>/</span>
                      <span>CGPA {current.cgpa.toFixed(2)}</span>
                      <span>/</span>
                      <span>
                        {current.cgpa >= 8.5 ? "DISTINCTION" : current.cgpa >= 7 ? "FIRST CLASS" : "SECOND CLASS"}
                      </span>
                    </div>
                  </div>

                  <div className="rule-t bg-paper-2 px-5 py-4">
                    <ProgressSteps steps={STEPS} current={step} />
                  </div>
                </Card>

                <BlockPanel
                  label="STAGE PHOTOGRAPH"
                  tone="pop"
                  action={shots.length > 0 ? <Badge tone="ink" size="sm">{shots.length}</Badge> : undefined}
                >
                  <div className="p-4">
                    <UploadCard
                      shots={shots}
                      onAdd={addShot}
                      onRemove={(id) => setShots((s) => s.filter((x) => x.id !== id))}
                      title="NO FRAME CAPTURED"
                      description="Capture from the stage camera or upload from the photographer"
                    />
                    <Button
                      size="xl"
                      block
                      variant="success"
                      className="mt-3"
                      onClick={completeStage}
                      disabled={shots.length === 0}
                    >
                      <Award className="h-[18px] w-[18px]" strokeWidth={2.6} />
                      {shots.length === 0 ? "CAPTURE A PHOTO FIRST" : "COMPLETE STAGE"}
                    </Button>
                  </div>
                </BlockPanel>
              </motion.div>
            ) : (
              <Card key="empty">
                <EmptyState
                  icon={Award}
                  title="STAGE IS CLEAR"
                  description="No graduate is currently called. Use CALL NEXT to bring the next name up from the holding area."
                />
              </Card>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-3 lg:col-span-2">
          <BlockPanel
            label={`UP NEXT · ${queue.length}`}
            tone="warn"
            action={<Badge tone="ink" size="sm">SESSION II</Badge>}
          >
            <div className="p-3">
              {queue.length === 0 ? (
                <EmptyState
                  icon={ChevronRight}
                  title="QUEUE EMPTY"
                  description="All called graduates have crossed the stage for this session."
                />
              ) : (
                <ul>
                  {queue.map((s, i) => (
                    <motion.li
                      key={s.id}
                      layout
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="not-last:rule-b"
                    >
                      <StudentRow
                        student={s}
                        meta={s.deptName}
                        trailing={
                          <span className="figure w-7 text-right text-[15px] text-ink-3">{i + 1}</span>
                        }
                      />
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>
          </BlockPanel>

          {current && (
            <StudentCard student={current} compact statusLabel="ON STAGE NOW" statusTone="pop" />
          )}
        </div>
      </div>

      <SuccessDialog
        open={success}
        onClose={() => { setSuccess(false); callNext(); }}
        title="STAGE COMPLETE"
        description={
          current
            ? `${current.name} recorded. ${shots.length} photo${shots.length === 1 ? "" : "s"} synced to the gallery.`
            : ""
        }
        action={
          <Button block size="lg" onClick={() => { setSuccess(false); callNext(); }}>
            CALL NEXT GRADUATE
          </Button>
        }
      />
    </Page>
  );
}
