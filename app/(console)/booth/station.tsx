"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  CircleCheck,
  Play,
  ScanLine,
  UserRound,
  Users,
  UsersRound,
} from "lucide-react";
import { Card, BlockPanel } from "@/components/ui/card";
import { StudentCard, StudentRowItem } from "@/components/student-card";
import { CameraCapture, type CapturedShot } from "@/components/camera-capture";
import { QrScanner } from "@/components/qr-scanner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, SuccessDialog, useToast } from "@/components/ui/feedback";
import { Segmented } from "@/components/ui/input";
import { assignBooth, completeBooth } from "@/lib/actions";
import type { BoothStatus, StudentRow } from "@/lib/supabase/types";
import type { QueueEntryRow } from "@/lib/queries";

type ShotKind = "Individual" | "Family" | "Friends";

const KIND_ICON: Record<ShotKind, typeof UserRound> = {
  Individual: UserRound,
  Family: Users,
  Friends: UsersRound,
};

/** A complete session wants at least one of each category. */
const REQUIRED: ShotKind[] = ["Individual", "Family", "Friends"];

export function BoothStation({
  booths,
  queues,
}: {
  booths: BoothStatus[];
  queues: QueueEntryRow[];
}) {
  const router = useRouter();
  const [boothId, setBoothId] = React.useState(String(booths[0]?.id ?? 1));
  const booth = booths.find((b) => String(b.id) === boothId) ?? booths[0];
  const boothQueue = queues.filter((q) => String(q.booth_id) === boothId);

  const [current, setCurrent] = React.useState<StudentRow | null>(null);
  const [started, setStarted] = React.useState(false);
  const [shots, setShots] = React.useState<CapturedShot[]>([]);
  const [success, setSuccess] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [justScanned, setJustScanned] = React.useState<StudentRow[]>([]);
  const { push } = useToast();

  const saved = shots.filter((x) => !x.uploading && !x.failed);
  const covered = new Set(shots.map((s) => s.label as ShotKind));
  const progress = Math.round((covered.size / REQUIRED.length) * 100);

  /** Fast intake — scanning a badge issues a real booth token. */
  const intake = async (student: StudentRow) => {
    const result = await assignBooth(student.id);
    if (!result.ok) {
      push({ title: "Could not assign", description: result.error, tone: "bad" });
      return;
    }
    setJustScanned((prev) => [student, ...prev.filter((p) => p.id !== student.id)].slice(0, 5));
    push({
      title: `Added to Booth ${result.data!.booth_id}`,
      description: `${student.name} · token ${result.data!.token}`,
      tone: "ok",
    });
    router.refresh();
  };

  const complete = async () => {
    if (!current || pending) return;
    setPending(true);

    const result = await completeBooth(current.id, shots.length);
    setPending(false);

    if (!result.ok) {
      push({ title: "Could not complete", description: result.error, tone: "bad" });
      return;
    }
    setSuccess(true);
  };

  const nextGraduate = () => {
    setCurrent(null);
    setShots([]);
    setStarted(false);
    router.refresh();
  };

  return (
    <>
      {/* Fast intake */}
      <BlockPanel label="Scan to join booth queue" tone="pop"
        className="mb-4"
        action={<span className="text-[11.5px] text-ink-3">Tech station · live</span>} >
        <div className="grid gap-5 p-5 lg:grid-cols-[290px_1fr] lg:items-center">
          <QrScanner
            compact
            onScan={intake}
            onError={(m) => push({ title: "Scan failed", description: m, tone: "bad" })} label="Scan student QR" hint="Scan their pass to issue the next booth token" eligible="stage-done" />
          <div>
            <div className="flex items-center gap-2">
              <ScanLine className="h-5 w-5 text-accent" />
              <p className="text-[19px] font-bold tracking-[-0.025em] text-ink">Fast intake</p>
            </div>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-ink-3 text-pretty">
              As graduates arrive, scan each QR from their phone. Their register number is matched
              instantly and the next token is added to whichever booth clears them soonest.
            </p>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
              <div className=" bg-paper-2 p-3.5 rule">
                <p className="figure text-[24px] text-ink">
                  {booths.reduce((s, b) => s + (b.waiting ?? 0), 0)}
                </p>
                <p className="mt-1 text-[11.5px] text-ink-3">Queue total</p>
              </div>
              <div className=" bg-paper-2 p-3.5 rule">
                <p className="figure text-[24px] text-ok">{justScanned.length}</p>
                <p className="mt-1 text-[11.5px] text-ink-3">Just scanned</p>
              </div>
              <div className=" bg-paper-2 p-3.5 rule">
                <p className="figure text-[24px] text-warn">
                  ~{Math.max(...booths.map((b) => b.est_wait ?? 0), 0)}m
                </p>
                <p className="mt-1 text-[11.5px] text-ink-3">Longest wait</p>
              </div>
            </div>

            {justScanned.length > 0 && (
              <ul className="mt-3 divide-y divide-[rgb(var(--rule-soft))]  bg-paper-2 px-2 rule">
                {justScanned.map((s) => (
                  <li key={s.id} className="py-1">
                    <StudentRowItem student={s} meta={s.dept_code} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </BlockPanel>

      <div className="mb-4 flex items-center justify-between gap-3">
        <Segmented
          value={boothId}
          onChange={setBoothId}
          options={booths.map((b) => ({ value: String(b.id), label: `Booth ${b.id}` }))} />
        <p className="truncate text-[12.5px] text-ink-3">{booth?.photographer}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          {current ? (
            <>
              <StudentCard
                student={current}
                statusLabel={started ? "Session in progress" : "Ready for booth"}
                statusTone={started ? "accent" : "ok"}
                showJourney={false}
                footer={
                  !started ? (
                    <Button size="xl" block onClick={() => setStarted(true)}>
                      <Play className="h-[18px] w-[18px]" />
                      Start session
                    </Button>
                  ) : (
                    <div className="w-full">
                      <div className="mb-2 flex items-baseline justify-between">
                        <p className="text-[12.5px] font-medium text-ink-2">Session progress</p>
                        <p className="text-[12.5px] text-ink-3">
                          <span className="figure text-[14px] text-ink">{covered.size}</span> / 3 categories
                        </p>
                      </div>
                      <div className="h-2 overflow-hidden  bg-paper-3">
                        <motion.div
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                          className="h-full  bg-accent" />
                      </div>
                    </div>
                  )
                } />

              <AnimatePresence>
                {started && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }} >
                    <BlockPanel label="Capture" tone="accent"
                      action={
                        <Badge tone={covered.size === 3 ? "ok" : "warn"} size="sm">
                          {covered.size === 3 ? "Complete set" : `${3 - covered.size} remaining`}
                        </Badge>
                      } >
                      <div className="p-5">
                        {/*
                         * The shutter uploads immediately against the graduate
                         * who is currently scanned in, so a frame can never be
                         * filed under the wrong person.
                         */}
                        <CameraCapture
                          studentId={current.id}
                          studentName={current.name}
                          category="Booth"
                          label={`Booth ${boothId}`}
                          shots={shots}
                          onShot={(shot) =>
                            setShots((prev) => {
                              const i = prev.findIndex((x) => x.id === shot.id);
                              if (i === -1) return [...prev, shot];
                              const next = [...prev];
                              next[i] = shot;
                              return next;
                            })
                          }
                          disabled={pending} />

                        <div className="mt-4 grid gap-2 sm:grid-cols-3">
                          {REQUIRED.map((kind) => {
                            const Icon = KIND_ICON[kind];
                            const done = covered.has(kind);
                            return (
                              <div
                                key={kind}
                                className={`flex items-center justify-center gap-2 rule px-3 py-2.5 text-[12.5px] font-bold ${
                                  done ? "bg-ok text-ink-black" : "bg-paper-2 text-ink-3"
                                }`} >
                                {done ? (
                                  <CircleCheck className="h-4 w-4" />
                                ) : (
                                  <Icon className="h-4 w-4" />
                                )}
                                {kind}
                              </div>
                            );
                          })}
                        </div>

                        <Button size="lg" variant="success"
                          block
                          className="mt-3"
                          onClick={complete}
                          disabled={saved.length === 0 || pending} >
                          <CircleCheck className="h-[18px] w-[18px]" />
                          {pending ? "Saving…" : "Complete session"}
                        </Button>
                      </div>
                    </BlockPanel>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <Card>
              <EmptyState
                icon={Camera} title="No graduate selected" description="Pick someone from this booth's queue to begin their session, or scan a badge above to add to the queue." />
            </Card>
          )}
        </div>

        {/* Booth queue */}
        <div className="lg:col-span-2">
          <BlockPanel
            label={`Booth ${booth?.id} queue`} tone="warn"
            action={
              <span className="text-[11.5px] text-ink-3">
                {boothQueue.length} · ~{booth?.est_wait ?? 0} min
              </span>
            } >
            <div className="p-4">
              {boothQueue.length === 0 ? (
                <EmptyState
                  icon={Camera} title="Queue empty" description="Scan a graduate above to add the first token to this booth." />
              ) : (
                <ul className="divide-y divide-[rgb(var(--rule-soft))]">
                  {boothQueue.map((q) => (
                    <li key={q.id} className="py-1">
                      <StudentRowItem
                        student={q.student}
                        meta={q.student.dept_code}
                        onClick={() => {
                          // Queue rows carry a slim projection; widen it for the card.
                          setCurrent({
                            ...(q.student as unknown as StudentRow),
                            stage_done: true,
                            booth_done: false,
                          } as StudentRow);
                          setStarted(false);
                          setShots([]);
                        }}
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
          </BlockPanel>
        </div>
      </div>

      <SuccessDialog
        open={success}
        onClose={() => { setSuccess(false); nextGraduate(); }} title="Session complete"
        description={
          current
            ? `${shots.length} frame${shots.length === 1 ? "" : "s"} logged for ${current.name}.`
            : ""
        }
        action={
          <Button block size="lg" onClick={() => { setSuccess(false); nextGraduate(); }}>
            Call next token
          </Button>
        } />
    </>
  );
}
