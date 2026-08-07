"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Award, Download, ScrollText, Stamp } from "lucide-react";
import { Card, BlockPanel } from "@/components/ui/card";
import { QrScanner } from "@/components/qr-scanner";
import { StudentCard, StudentRowItem, deptColor } from "@/components/student-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, useToast, SuccessDialog } from "@/components/ui/feedback";
import { collectCertificate } from "@/lib/actions";
import type { StudentRow } from "@/lib/supabase/types";

export function CertificateStation({ college }: { college: string }) {
  const [current, setCurrent] = React.useState<StudentRow | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [recent, setRecent] = React.useState<StudentRow[]>([]);
  const [pending, setPending] = React.useState(false);
  const { push } = useToast();

  const markCollected = async () => {
    if (!current || pending) return;
    setPending(true);

    const result = await collectCertificate(current.id);
    setPending(false);

    if (!result.ok) {
      push({ title: "Cannot collect", description: result.error, tone: "bad" });
      if (result.error?.includes("already collected")) {
        setCurrent({ ...current, certificate_done: true });
      }
      return;
    }

    const updated = result.data!;
    setCurrent(updated);
    setRecent((r) => [updated, ...r].slice(0, 6));
    setSuccess(true);
  };

  const classOf = (cgpa: number) =>
    cgpa >= 8.5 ? "Distinction" : cgpa >= 7 ? "First Class" : "Second Class";

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-5">
        <BlockPanel label="Scanner" tone="accent" className="lg:col-span-2">
          <div className="p-5">
            <QrScanner
              onScan={setCurrent}
              onError={(m) => push({ title: "Scan failed", description: m, tone: "bad" })} label="Scan to collect certificate" hint="Verify the photo on screen matches the graduate" eligible="any"
              compact />
          </div>
        </BlockPanel>

        <div className="space-y-4 lg:col-span-3">
          <AnimatePresence mode="wait">
            {current ? (
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="space-y-4" >
                <StudentCard
                  student={current}
                  statusLabel={current.certificate_done ? "Already collected" : "Ready to collect"}
                  statusTone={current.certificate_done ? "warn" : "ok"}
                  compact
                  showJourney={false} />

                {/* The certificate */}
                <Card className="overflow-hidden">
                  <div
                    className="grain relative px-6 py-9 text-center"
                    style={{
                      backgroundImage: `linear-gradient(155deg, ${deptColor(current.dept_code)}1f, transparent 65%)`,
                    }} >
                    <div className="pointer-events-none absolute inset-5  border border-dashed border-[rgb(var(--rule))]" />
                    <div className="relative">
                      <div
                        className="mx-auto grid h-12 w-12 place-items-center  text-white"
                        style={{ backgroundColor: deptColor(current.dept_code) }} >
                        <Award className="h-6 w-6" strokeWidth={1.9} />
                      </div>
                      <p className="stencil mt-4 text-ink-3">{college}</p>
                      <h3 className="mt-3 text-[28px] leading-tight font-bold tracking-[-0.03em] text-ink">
                        Bachelor of Technology
                      </h3>
                      <p className="mt-1.5 text-[13px] text-ink-2">{current.dept_code}</p>

                      <div className="mx-auto my-6 h-px w-24 bg-[rgb(var(--rule))]" />

                      <p className="stencil text-ink-3">Conferred upon</p>
                      <p className="mt-2 text-[22px] font-bold tracking-[-0.03em] text-ink text-balance">
                        {current.name}
                      </p>
                      <p className="mt-1.5 font-mono text-[12.5px] text-ink-3">{current.reg_no}</p>

                      <dl className="mt-7 grid grid-cols-3 gap-2 border-t border-[rgb(var(--rule))] pt-5 text-left">
                        {[
                          ...(current.cgpa != null
                            ? ([
                                ["CGPA", Number(current.cgpa).toFixed(2)],
                                ["Class", classOf(Number(current.cgpa))],
                              ] as [string, string][])
                            : []),
                          ["Batch", current.batch] as [string, string],
                          ...(current.award
                            ? ([["Award", current.award]] as [string, string][])
                            : []),
                        ].map(([k, v]) => (
                          <div key={k}>
                            <dt className="stencil text-ink-3">{k}</dt>
                            <dd className="mt-1 text-[13.5px] font-semibold text-ink">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 border-t border-[rgb(var(--rule))] p-5 sm:flex-row">
                    <Button size="lg"
                      block
                      onClick={markCollected}
                      disabled={current.certificate_done || pending}
                      variant={current.certificate_done ? "secondary" : "primary"} >
                      <Stamp className="h-[18px] w-[18px]" />
                      {current.certificate_done
                        ? "Already collected"
                        : pending
                          ? "Saving…"
                          : "Mark collected"}
                    </Button>
                    <Button size="lg" variant="secondary"
                      block
                      onClick={() =>
                        push({
                          title: "Download queued",
                          description: `${current.reg_no}-certificate.pdf`,
                          tone: "info",
                        })
                      } >
                      <Download className="h-[18px] w-[18px]" />
                      Download PDF
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card>
                  <EmptyState
                    icon={ScrollText} title="No certificate loaded" description="Scan a graduate's badge to pull their degree record and log the handover." />
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {recent.length > 0 && (
            <BlockPanel label="Handed over" tone="ok"
              action={<Badge tone="ok" size="sm">{recent.length}</Badge>} >
              <div className="p-4">
                <ul className="divide-y divide-[rgb(var(--rule-soft))]">
                  {recent.map((s, i) => (
                    <li key={`${s.id}-${i}`} className="py-1">
                      <StudentRowItem
                        student={s}
                        meta={s.dept_code}
                        trailing={<Badge tone="ok" size="sm">Collected</Badge>} />
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
        onClose={() => setSuccess(false)} title="Certificate handed over"
        description={current ? `${current.name}'s degree certificate is logged as collected.` : ""} />
    </>
  );
}
