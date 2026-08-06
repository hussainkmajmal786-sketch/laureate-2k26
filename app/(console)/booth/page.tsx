"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, CircleCheck, Play, ScanLine, Upload, UserRound, Users, UsersRound } from "lucide-react";
import { Page, PageHeader } from "@/components/shell/app-shell";
import { Card, BlockPanel } from "@/components/ui/card";
import { StudentCard, StudentRow } from "@/components/student-card";
import { UploadCard, makeShot, type Shot } from "@/components/upload-card";
import { Button } from "@/components/ui/button";
import { Badge, LiveBadge } from "@/components/ui/badge";
import { EmptyState, SuccessDialog, useToast } from "@/components/ui/feedback";
import { StatTile } from "@/components/kpi-card";
import { Segmented } from "@/components/ui/input";
import { getBooths, type Student } from "@/lib/data";
import { QrScanner } from "@/components/qr-scanner";

type ShotKind = "INDIVIDUAL" | "FAMILY" | "FRIENDS";

const KIND_ICON: Record<ShotKind, typeof UserRound> = {
  INDIVIDUAL: UserRound,
  FAMILY: Users,
  FRIENDS: UsersRound,
};

/** A complete session wants at least one of each category. */
const REQUIRED: ShotKind[] = ["INDIVIDUAL", "FAMILY", "FRIENDS"];

export default function BoothPage() {
  const booths = React.useMemo(() => getBooths(), []);
  const [boothId, setBoothId] = React.useState<"1" | "2">("1");
  const booth = booths.find((b) => String(b.id) === boothId)!;

  const [started, setStarted] = React.useState(false);
  const [shots, setShots] = React.useState<Shot[]>([]);
  const [current, setCurrent] = React.useState<Student | null>(booth.current);
  const [success, setSuccess] = React.useState(false);
  const [served, setServed] = React.useState(booth.servedToday);
  const [scanned, setScanned] = React.useState<Student[]>([]);
  const { push } = useToast();

  // Switching booths resets the panel to that booth's current graduate.
  React.useEffect(() => {
    setCurrent(booth.current);
    setStarted(false);
    setShots([]);
    setServed(booth.servedToday);
  }, [booth]);

  const covered = new Set(shots.map((s) => s.label as ShotKind));
  const progress = Math.round((covered.size / REQUIRED.length) * 100);

  const nextGraduate = () => {
    setCurrent(booth.queue[0]?.student ?? null);
    setShots([]);
    setStarted(false);
  };

  return (
    <Page>
      <PageHeader
        title="PHOTO BOOTH"
        description="Run a graduate's booth session — individual, family and friends frames, then hand off to the next token."
        actions={
          <>
            <Segmented
              value={boothId}
              onChange={setBoothId}
              options={[
                { value: "1", label: "BOOTH 1" },
                { value: "2", label: "BOOTH 2" },
              ]}
            />
            <LiveBadge label={booth.photographer.toUpperCase()} />
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatTile label="SERVED TODAY" value={served} sub={booth.name} tone="ok" />
        <StatTile label="IN QUEUE" value={booth.queue.length} sub="Waiting for this booth" tone="warn" />
        <StatTile label="AVG. SESSION" value={`${booth.avgMinutes}m`} sub="Start to complete" tone="accent" />
        <StatTile label="FRAMES" value={shots.length} sub="This session" tone="pop" />
      </div>

      <BlockPanel label="SCAN TO JOIN BOOTH QUEUE" tone="accent" className="mb-3" action={<span className="stencil text-[9px] text-accent-ink">TECH STATION / LIVE</span>}>
        <div className="grid gap-4 p-4 lg:grid-cols-[280px_1fr] lg:items-center">
          <QrScanner compact onScan={(student) => { setScanned((items) => [student, ...items.filter((item) => item.id !== student.id)].slice(0, 5)); push({ title: "ADDED TO BOOTH QUEUE", description: `${student.name} · ${student.regNo}`, tone: "ok" }); }} label="SCAN STUDENT QR" hint="Scan their pass to issue the next booth token" />
          <div>
            <div className="flex items-center gap-2"><ScanLine className="h-5 w-5 text-accent" /><p className="headline text-2xl text-ink">FAST INTAKE</p></div>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-ink-3">When more graduates arrive, scan each QR from their phone. Their admission number is matched instantly and the next token is added to this booth&apos;s live queue.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3"><div className="rule bg-paper-2 p-3"><p className="figure text-2xl text-ink">{booth.queue.length + scanned.length}</p><p className="stencil mt-1 text-[9px] text-ink-3">QUEUE TOTAL</p></div><div className="rule bg-paper-2 p-3"><p className="figure text-2xl text-ok">{scanned.length}</p><p className="stencil mt-1 text-[9px] text-ink-3">JUST SCANNED</p></div><div className="rule bg-paper-2 p-3"><p className="figure text-2xl text-warn">~{(booth.queue.length + scanned.length) * booth.avgMinutes}m</p><p className="stencil mt-1 text-[9px] text-ink-3">EST. WAIT</p></div></div>
            {scanned.length > 0 && <ul className="mt-3 divide-y-2 divide-[rgb(var(--rule-soft))] border-2 border-[rgb(var(--rule))] bg-paper">{scanned.map((student, index) => <li key={student.id} className="flex items-center justify-between gap-3 px-3 py-2"><div><p className="text-[12px] font-bold text-ink">{student.name}</p><p className="font-mono text-[10px] text-ink-3">{student.regNo}</p></div><span className="stencil text-[9px] text-pop">TOKEN {booth.id}-{String(booth.queue.length + index + 1).padStart(3, "0")}</span></li>)}</ul>}
          </div>
        </div>
      </BlockPanel>

      <div className="grid gap-3 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-3">
          {current ? (
            <>
              <StudentCard
                student={current}
                statusLabel={started ? "SESSION IN PROGRESS" : "READY FOR BOOTH"}
                statusTone={started ? "pop" : "ok"}
                showJourney={false}
                footer={
                  !started ? (
                    <Button size="xl" block onClick={() => setStarted(true)}>
                      <Play className="h-[18px] w-[18px]" strokeWidth={2.6} />
                      START SESSION
                    </Button>
                  ) : (
                    <div className="w-full">
                      <div className="mb-2 flex items-baseline justify-between">
                        <p className="stencil text-[9.5px] text-ink-2">SESSION PROGRESS</p>
                        <p className="text-[11.5px] text-ink-3">
                          <span className="figure text-[14px] text-ink">{covered.size}</span>/3 CATEGORIES
                        </p>
                      </div>
                      <div className="h-3.5 rule bg-paper-2">
                        <motion.div
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.45, ease: [0.2, 0, 0, 1] }}
                          className="h-full bg-pop"
                        />
                      </div>
                    </div>
                  )
                }
              />

              <AnimatePresence>
                {started && (
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <BlockPanel
                      label="CAPTURE"
                      tone="pop"
                      action={
                        <Badge tone="ink" size="sm">
                          {covered.size === 3 ? "COMPLETE SET" : `${3 - covered.size} LEFT`}
                        </Badge>
                      }
                    >
                      <div className="p-4">
                        <UploadCard
                          shots={shots}
                          onAdd={(l) => setShots((s) => [...s, makeShot(l)])}
                          onRemove={(id) => setShots((s) => s.filter((x) => x.id !== id))}
                          title="NO FRAMES YET"
                          description="Choose a category below to add the first shot"
                          actions={
                            <div className="grid gap-2 sm:grid-cols-3">
                              {REQUIRED.map((kind) => {
                                const Icon = KIND_ICON[kind];
                                const done = covered.has(kind);
                                return (
                                  <Button
                                    key={kind}
                                    size="lg"
                                    variant={done ? "success" : "secondary"}
                                    block
                                    onClick={() => {
                                      setShots((s) => [...s, makeShot(kind)]);
                                      push({ title: `${kind} ADDED`, tone: "ok" });
                                    }}
                                  >
                                    {done ? (
                                      <CircleCheck className="h-[18px] w-[18px]" strokeWidth={2.6} />
                                    ) : (
                                      <Icon className="h-[18px] w-[18px]" strokeWidth={2.6} />
                                    )}
                                    {kind}
                                  </Button>
                                );
                              })}
                            </div>
                          }
                        />

                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                          <Button
                            size="lg"
                            variant="secondary"
                            block
                            onClick={() => setShots((s) => [...s, makeShot("EXTRA")])}
                          >
                            <Upload className="h-[18px] w-[18px]" strokeWidth={2.6} />
                            EXTRA FRAME
                          </Button>
                          <Button
                            size="lg"
                            variant="success"
                            block
                            onClick={() => { setServed((s) => s + 1); setSuccess(true); }}
                            disabled={shots.length === 0}
                          >
                            <CircleCheck className="h-[18px] w-[18px]" strokeWidth={2.6} />
                            COMPLETE SESSION
                          </Button>
                        </div>
                      </div>
                    </BlockPanel>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <Card>
              <EmptyState
                icon={Camera}
                title="NO GRADUATE AT THIS BOOTH"
                description="The queue for this booth is empty. New tokens appear here as graduates clear the stage."
              />
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <BlockPanel
            label={booth.name.toUpperCase()}
            tone="warn"
            action={<LiveBadge label="ACTIVE" />}
          >
            <div className="rule-b bg-paper-2 px-3 py-2">
              <p className="stencil text-[9.5px] text-ink-3">
                {booth.queue.length} WAITING · ~{booth.queue.length * booth.avgMinutes} MIN
              </p>
            </div>
            <div className="p-3">
              <ul>
                {booth.queue.map((q) => (
                  <li key={q.token} className="not-last:rule-b">
                    <StudentRow
                      student={q.student}
                      meta={q.student.deptName}
                      trailing={
                        <div className="text-right">
                          <p className="stencil text-[9.5px] text-ink">{q.token}</p>
                          <p className="stencil text-[8.5px] text-ink-3">~{q.waitMin}M</p>
                        </div>
                      }
                    />
                  </li>
                ))}
              </ul>
            </div>
          </BlockPanel>
        </div>
      </div>

      <SuccessDialog
        open={success}
        onClose={() => { setSuccess(false); nextGraduate(); }}
        title="SESSION COMPLETE"
        description={
          current
            ? `${shots.length} frame${shots.length === 1 ? "" : "s"} uploaded for ${current.name}. Gallery updated.`
            : ""
        }
        action={
          <Button block size="lg" onClick={() => { setSuccess(false); nextGraduate(); }}>
            CALL NEXT TOKEN
          </Button>
        }
      />
    </Page>
  );
}
