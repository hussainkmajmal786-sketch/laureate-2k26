"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Award, ChevronRight, SkipForward, Volume2 } from "lucide-react";
import { Card, BlockPanel } from "@/components/ui/card";
import { StudentCard, StudentRowItem, deptColor } from "@/components/student-card";
import { UploadCard, makeShot, type Shot } from "@/components/upload-card";
import { ProgressSteps } from "@/components/timeline";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, SuccessDialog, useToast } from "@/components/ui/feedback";
import { completeStage, startStageAppearance } from "@/lib/actions";
import type { StudentRow } from "@/lib/supabase/types";

const STEPS = ["Called", "On stage", "Photo captured", "Cleared"];

export function StageStation({
  initialQueue,
  position,
}: {
  initialQueue: StudentRow[];
  position: number;
}) {
  const router = useRouter();
  const [current, setCurrent] = React.useState<StudentRow | null>(initialQueue[0] ?? null);
  const [queue, setQueue] = React.useState(initialQueue.slice(1));
  const [shots, setShots] = React.useState<Shot[]>([]);
  const [step, setStep] = React.useState(1);
  const [success, setSuccess] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const { push } = useToast();

  const addShot = (label: string) => {
    setShots((s) => [...s, makeShot(label)]);
    setStep((v) => Math.max(v, 2));
  };

  const complete = async () => {
    if (!current || pending) return;
    setPending(true);

    const result = await completeStage(current.id, shots.length);
    setPending(false);

    if (!result.ok) {
      push({ title: "Could not complete", description: result.error, tone: "bad" });
      return;
    }

    setStep(3);
    setSuccess(true);
  };

  const callNext = () => {
    const [next, ...rest] = queue;
    setCurrent(next ?? null);
    setQueue(rest);
    setShots([]);
    setStep(1);

    if (next) {
      push({ title: "Called to stage", description: next.name, tone: "info" });
      /*
       * Open a stage appearance window. Bulk photo import later matches
       * each photo's EXIF timestamp against these windows, so a graduate
       * who is never "called" here cannot have photos matched to them.
       */
      void startStageAppearance(next.id);
    }

    // Pull a fresh queue once the local buffer runs low.
    if (rest.length <= 1) router.refresh();
  };

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <AnimatePresence mode="wait">
            {current ? (
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-4" >
                {/* Announcer card — this is what gets read aloud */}
                <Card className="overflow-hidden">
                  <div
                    className="grain relative px-6 py-8 sm:px-8"
                    style={{
                      backgroundImage: `linear-gradient(140deg, ${deptColor(current.dept_code)}26, transparent 70%)`,
                    }} >
                    <div className="relative flex flex-wrap items-center gap-2">
                      <Badge tone="accent" size="md" dot>Ready for stage</Badge>
                      <Badge tone="neutral" size="md">Position {position}</Badge>
                      <button
                        onClick={() =>
                          push({ title: "Name announced", description: current.name, tone: "info" })
                        }
                        className="tap ml-auto inline-flex items-center gap-1.5  bg-paper px-3 py-1.5 text-[12px] font-medium text-ink-2 rule transition-colors hover:bg-paper-2" >
                        <Volume2 className="h-3.5 w-3.5" />
                        Announce
                      </button>
                    </div>

                    <h2 className="headline text-[clamp(2rem,6vw,4rem)] mt-5 text-ink text-balance">{current.name}</h2>
                    <p className="mt-3 font-mono text-[14px] tracking-wide text-ink-2">
                      {current.reg_no}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13.5px] text-ink-3">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 "
                          style={{ backgroundColor: deptColor(current.dept_code) }} />
                        {current.dept_code}
                      </span>
                      <span>CGPA {Number(current.cgpa).toFixed(2)}</span>
                      <span>{current.batch}</span>
                    </div>
                  </div>

                  <div className="border-t border-[rgb(var(--rule))] px-6 py-5">
                    <ProgressSteps steps={STEPS} current={step} />
                  </div>
                </Card>

                <BlockPanel label="Stage photograph" tone="accent"
                  action={shots.length > 0 ? <Badge tone="ok" size="sm">{shots.length} captured</Badge> : undefined} >
                  <div className="p-5">
                    <UploadCard
                      shots={shots}
                      onAdd={addShot}
                      onRemove={(id) => setShots((s) => s.filter((x) => x.id !== id))} description="Capture from the stage camera or upload from the photographer" />
                    <Button size="xl"
                      block variant="success"
                      className="mt-3"
                      onClick={complete}
                      disabled={shots.length === 0 || pending} >
                      <Award className="h-[18px] w-[18px]" />
                      {shots.length === 0
                        ? "Capture a photo to continue"
                        : pending
                          ? "Saving…"
                          : "Complete stage"}
                    </Button>
                  </div>
                </BlockPanel>
              </motion.div>
            ) : (
              <Card key="empty">
                <EmptyState
                  icon={Award} title="Stage is clear" description="No graduate is currently called. Use “Call next” to bring the next name up from the holding area."
                  action={
                    <Button variant="secondary" size="sm" onClick={() => router.refresh()}>
                      Refresh queue
                    </Button>
                  } />
              </Card>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <BlockPanel label="Up next" tone="warn"
            action={
              <Button size="sm" variant="secondary" onClick={callNext} disabled={queue.length === 0}>
                <SkipForward className="h-3.5 w-3.5" />
                Call next
              </Button>
            } >
            <div className="p-4">
              {queue.length === 0 ? (
                <EmptyState
                  icon={ChevronRight} title="Queue empty" description="All called graduates have crossed the stage for this session." />
              ) : (
                <ul className="divide-y divide-[rgb(var(--rule-soft))]">
                  {queue.map((s, i) => (
                    <motion.li
                      key={s.id}
                      layout
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="py-1" >
                      <StudentRowItem
                        student={s}
                        meta={s.dept_code}
                        trailing={
                          <span className="figure w-6 text-right text-[13px] text-ink-3">{i + 1}</span>
                        } />
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>
          </BlockPanel>

          {current && (
            <StudentCard student={current} compact statusLabel="On stage now" statusTone="accent" />
          )}
        </div>
      </div>

      <SuccessDialog
        open={success}
        onClose={() => { setSuccess(false); callNext(); }} title="Stage complete"
        description={
          current
            ? `${current.name} has been recorded. ${shots.length} photo${shots.length === 1 ? "" : "s"} logged.`
            : ""
        }
        action={
          <Button block size="lg" onClick={() => { setSuccess(false); callNext(); }}>
            Call next graduate
          </Button>
        } />
    </>
  );
}
