"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Award, Download, ScrollText, Stamp } from "lucide-react";
import { Page, PageHeader } from "@/components/shell/app-shell";
import { Card, BlockPanel } from "@/components/ui/card";
import { QrScanner } from "@/components/qr-scanner";
import { StudentCard, StudentRow, deptColor } from "@/components/student-card";
import { Button } from "@/components/ui/button";
import { Badge, LiveBadge } from "@/components/ui/badge";
import { EmptyState, useToast, SuccessDialog } from "@/components/ui/feedback";
import { StatTile } from "@/components/kpi-card";
import { EVENT, TOTAL_GRADUATES, type Student } from "@/lib/data";

export default function CertificatesPage() {
  const [current, setCurrent] = React.useState<Student | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [recent, setRecent] = React.useState<Student[]>([]);
  const [total, setTotal] = React.useState(586);
  const { push } = useToast();

  const markCollected = () => {
    if (!current) return;
    setTotal((t) => t + 1);
    setRecent((r) => [current, ...r].slice(0, 6));
    setSuccess(true);
    setCurrent({ ...current, certificateDone: true });
  };

  return (
    <Page>
      <PageHeader
        title="CERTIFICATES"
        description="Hall B distribution desk. Scan the badge, confirm the degree details, and log the handover."
        actions={<LiveBadge label="OPEN · CLOSES 18:00" />}
      />

      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatTile label="DISTRIBUTED" value={total} sub="29% of cohort" tone="ok" />
        <StatTile label="PENDING" value={TOTAL_GRADUATES - total} sub="Awaiting collection" tone="warn" />
        <StatTile label="AT THIS DESK" value={recent.length + 156} sub="Since 09:00" tone="accent" />
        <StatTile label="AVG. HANDOVER" value="19s" sub="Scan to signature" />
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        <BlockPanel label="SCANNER" tone="pop" className="lg:col-span-2">
          <div className="p-4">
            <QrScanner
              onScan={setCurrent}
              label="SCAN TO COLLECT"
              hint="Verify the photo on screen matches the graduate"
              compact
            />
          </div>
        </BlockPanel>

        <div className="space-y-3 lg:col-span-3">
          <AnimatePresence mode="wait">
            {current ? (
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-3"
              >
                <StudentCard
                  student={current}
                  statusLabel={current.certificateDone ? "ALREADY COLLECTED" : "READY TO COLLECT"}
                  statusTone={current.certificateDone ? "warn" : "ok"}
                  compact
                  showJourney={false}
                />

                {/* The certificate — a printed diploma block */}
                <Card className="overflow-hidden">
                  <div
                    className="grain relative px-5 py-8 text-center"
                    style={{ backgroundColor: deptColor(current.dept) }}
                  >
                    <div className="pointer-events-none absolute inset-3 border-2 border-dashed border-white/45" />
                    <div className="relative">
                      <div className="mx-auto grid h-12 w-12 place-items-center rule border-white bg-white/15">
                        <Award className="h-6 w-6 text-white" strokeWidth={2.4} />
                      </div>
                      <p className="stencil mt-4 text-[9px] text-white/75">{EVENT.college}</p>
                      <h3 className="headline mt-3 text-[clamp(1.5rem,4vw,2.25rem)] text-white">
                        BACHELOR OF
                        <br />
                        TECHNOLOGY
                      </h3>
                      <p className="stencil mt-2 text-[10px] text-white/80">{current.deptName}</p>

                      <div className="mx-auto my-5 h-0.5 w-20 bg-white/50" />

                      <p className="stencil text-[9px] text-white/70">CONFERRED UPON</p>
                      <p className="headline mt-2 text-[clamp(1.25rem,3.5vw,1.85rem)] text-white text-balance">
                        {current.name}
                      </p>
                      <p className="mt-1.5 font-mono text-[11.5px] text-white/70">{current.regNo}</p>

                      <dl className="mt-6 grid grid-cols-3 gap-2 border-t-2 border-white/35 pt-4">
                        {[
                          ["CGPA", current.cgpa.toFixed(2)],
                          ["BATCH", current.batch],
                          ["CLASS", current.cgpa >= 8.5 ? "DISTINCTION" : current.cgpa >= 7 ? "FIRST" : "SECOND"],
                        ].map(([k, v]) => (
                          <div key={k}>
                            <dt className="stencil text-[8px] text-white/60">{k}</dt>
                            <dd className="mt-1 text-[13px] font-black text-white">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 rule-t p-4 sm:flex-row">
                    <Button
                      size="lg"
                      block
                      onClick={markCollected}
                      disabled={current.certificateDone}
                      variant={current.certificateDone ? "secondary" : "primary"}
                    >
                      <Stamp className="h-[18px] w-[18px]" strokeWidth={2.6} />
                      {current.certificateDone ? "ALREADY COLLECTED" : "MARK COLLECTED"}
                    </Button>
                    <Button
                      size="lg"
                      variant="secondary"
                      block
                      onClick={() =>
                        push({ title: "DOWNLOAD QUEUED", description: `${current.regNo}.pdf`, tone: "info" })
                      }
                    >
                      <Download className="h-[18px] w-[18px]" strokeWidth={2.6} />
                      DOWNLOAD PDF
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card>
                  <EmptyState
                    icon={ScrollText}
                    title="NO CERTIFICATE LOADED"
                    description="Scan a graduate's badge to pull their degree record and log the handover."
                  />
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {recent.length > 0 && (
            <BlockPanel
              label="HANDED OVER"
              tone="ok"
              action={<Badge tone="ink" size="sm">{recent.length}</Badge>}
            >
              <div className="p-3">
                <ul>
                  {recent.map((s, i) => (
                    <li key={`${s.id}-${i}`} className="not-last:rule-b">
                      <StudentRow
                        student={s}
                        meta={s.deptName}
                        trailing={<Badge tone="ok" size="sm">COLLECTED</Badge>}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </BlockPanel>
          )}
        </div>
      </div>

      <SuccessDialog
        open={success}
        onClose={() => setSuccess(false)}
        title="HANDED OVER"
        description={current ? `${current.name}'s degree certificate is logged as collected.` : ""}
      />
    </Page>
  );
}
