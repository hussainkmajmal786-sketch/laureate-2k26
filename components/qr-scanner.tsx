"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Keyboard, QrCode, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { pickStudent, type Student } from "@/lib/data";

const CORNERS = [
  "top-0 left-0 border-t-[5px] border-l-[5px]",
  "top-0 right-0 border-t-[5px] border-r-[5px]",
  "bottom-0 left-0 border-b-[5px] border-l-[5px]",
  "bottom-0 right-0 border-b-[5px] border-r-[5px]",
];

/**
 * Simulated QR scanner — no camera access. "Simulate scan" resolves a
 * deterministic student after a short delay so the flow can be demonstrated.
 */
export function QrScanner({
  onScan,
  label = "SCAN GRADUATE BADGE",
  hint = "Hold the badge 15–20 cm from the lens",
  filter,
  className,
  compact = false,
}: {
  onScan: (student: Student) => void;
  label?: string;
  hint?: string;
  filter?: (s: Student) => boolean;
  className?: string;
  compact?: boolean;
}) {
  const [scanning, setScanning] = React.useState(false);
  const [manual, setManual] = React.useState(false);
  const [code, setCode] = React.useState("");
  const nth = React.useRef(3);

  const simulate = () => {
    if (scanning) return;
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      onScan(pickStudent(nth.current++, filter));
    }, 1100);
  };

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    onScan(pickStudent(code.length + nth.current++, filter));
    setCode("");
  };

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "halftone grain relative overflow-hidden rule-thick bg-paper-2",
          compact ? "aspect-4/3" : "aspect-square sm:aspect-4/3",
        )}
      >
        {/* Status bar */}
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between rule-b bg-[rgb(var(--ink))] px-3 py-1.5">
          <span className="stencil inline-flex items-center gap-1.5 text-[10px] text-[rgb(var(--paper))]">
            <span className={cn("h-1.5 w-1.5", scanning ? "animate-blink bg-pop" : "bg-ok")} />
            {scanning ? "READING" : "CAMERA READY"}
          </span>
          <span className="stencil text-[10px] text-[rgb(var(--paper))]/60">CEK-SCAN-01</span>
        </div>

        <div className="absolute inset-0 grid place-items-center p-8 pt-12">
          <div className="relative aspect-square w-full max-w-[260px]">
            {CORNERS.map((pos, i) => (
              <motion.span
                key={pos}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06, duration: 0.3, ease: [0.2, 0, 0, 1] }}
                className={cn("absolute h-12 w-12 border-pop", pos)}
              />
            ))}

            {/* Scan laser */}
            <AnimatePresence>
              {scanning && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-x-2 top-0 bottom-0 overflow-hidden"
                >
                  <motion.div
                    initial={{ top: "2%" }}
                    animate={{ top: ["2%", "96%", "2%"] }}
                    transition={{ duration: 1.1, ease: "easeInOut" }}
                    className="absolute inset-x-0 h-1 bg-pop"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute inset-0 grid place-items-center">
              <motion.div
                animate={scanning ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                transition={{ repeat: scanning ? Infinity : 0, duration: 0.9 }}
                className="flex flex-col items-center"
              >
                <QrCode
                  className={cn(compact ? "h-11 w-11" : "h-14 w-14", scanning ? "text-pop" : "text-ink-3")}
                  strokeWidth={1.6}
                />
                <p className={cn("stencil mt-3 text-[10.5px]", scanning ? "text-pop" : "text-ink-3")}>
                  {scanning ? "READING BADGE…" : "AWAITING BADGE"}
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="headline text-[17px] text-ink">{label}</p>
          <p className="mt-1 text-[12.5px] text-ink-3">{hint}</p>
        </div>
        <Badge tone="outline" size="sm" className="mt-0.5 shrink-0 text-ink-3">
          SIMULATED
        </Badge>
      </div>

      <div className="mt-3.5 flex flex-col gap-2 sm:flex-row">
        <Button size="lg" block onClick={simulate} disabled={scanning}>
          <ScanLine className="h-[18px] w-[18px]" strokeWidth={2.6} />
          {scanning ? "SCANNING…" : "SIMULATE SCAN"}
        </Button>
        <Button size="lg" variant="secondary" onClick={() => setManual((m) => !m)} className="sm:w-auto">
          <Keyboard className="h-[18px] w-[18px]" strokeWidth={2.6} />
          MANUAL
        </Button>
      </div>

      <AnimatePresence>
        {manual && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={submitManual}
            className="overflow-hidden"
          >
            <div className="mt-2.5 flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="CEK22CSE118"
                autoFocus
                className="h-12 w-full rule bg-paper px-3 font-mono text-[14px] font-medium tracking-widest text-ink outline-none placeholder:text-ink-3 focus:drop-2"
              />
              <Button type="submit" size="lg" variant="pop">
                FIND
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
