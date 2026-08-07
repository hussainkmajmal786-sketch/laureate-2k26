"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Keyboard, QrCode, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { createClient } from "@/lib/supabase/client";
import type { StudentRow } from "@/lib/supabase/types";

const CORNERS = [
  "top-0 left-0 border-t-[5px] border-l-[5px]",
  "top-0 right-0 border-t-[5px] border-r-[5px]",
  "bottom-0 left-0 border-b-[5px] border-l-[5px]",
  "bottom-0 right-0 border-b-[5px] border-r-[5px]",
];

/**
 * Badge reader. Resolves a register number against the live database.
 * Camera capture is not wired up yet — "Next in queue" pulls a real
 * eligible graduate, and manual entry accepts any register number.
 */
export function QrScanner({
  onScan,
  onError,
  label = "SCAN GRADUATE BADGE",
  hint = "Hold the badge 15–20 cm from the lens",
  eligible,
  className,
  compact = false,
}: {
  onScan: (student: StudentRow) => void;
  onError?: (message: string) => void;
  label?: string;
  hint?: string;
  eligible?: "checked-in" | "stage-done" | "any";
  className?: string;
  compact?: boolean;
}) {
  const [scanning, setScanning] = React.useState(false);
  const [manual, setManual] = React.useState(false);
  const [code, setCode] = React.useState("");
  const cursor = React.useRef(0);
  const supabase = React.useMemo(() => createClient(), []);

  const lookup = async (regNo: string) => {
    setScanning(true);
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .ilike("reg_no", regNo.trim())
      .maybeSingle();
    setScanning(false);

    if (error) return onError?.(error.message);
    if (!data) return onError?.(`No graduate found for ${regNo.trim().toUpperCase()}`);
    onScan(data);
  };

  /** Pull the next real graduate matching this station's eligibility. */
  const nextInQueue = async () => {
    if (scanning) return;
    setScanning(true);

    let query = supabase.from("students").select("*");
    if (eligible === "checked-in") query = query.eq("attendance", true).eq("stage_done", false);
    else if (eligible === "stage-done") query = query.eq("stage_done", true).eq("booth_done", false);

    const { data, error } = await query
      .order("reg_no")
      .range(cursor.current, cursor.current)
      .maybeSingle();

    cursor.current += 1;
    setScanning(false);

    if (error) return onError?.(error.message);
    if (!data) {
      cursor.current = 0;
      return onError?.("No eligible graduates remaining at this station.");
    }
    onScan(data);
  };

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    lookup(code);
    setCode("");
  };

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "halftone grain relative overflow-hidden rule-thick bg-paper-2",
          compact ? "aspect-4/3" : "aspect-square sm:aspect-4/3",
        )} >
        {/* Status bar */}
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between rule-b bg-[rgb(var(--ink))] px-3 py-1.5">
          <span className="stencil inline-flex items-center gap-1.5 text-[10px] text-[rgb(var(--paper))]">
            <span className={cn("h-1.5 w-1.5", scanning ? "animate-blink bg-pop" : "bg-ok")} />
            {scanning ? "READING" : "READER READY"}
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
                className={cn("absolute h-12 w-12 border-pop", pos)} />
            ))}

            <AnimatePresence>
              {scanning && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-x-2 top-0 bottom-0 overflow-hidden" >
                  <motion.div
                    initial={{ top: "2%" }}
                    animate={{ top: ["2%", "96%", "2%"] }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-x-0 h-1 bg-pop" />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute inset-0 grid place-items-center">
              <motion.div
                animate={scanning ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                transition={{ repeat: scanning ? Infinity : 0, duration: 0.9 }}
                className="flex flex-col items-center" >
                <QrCode
                  className={cn(compact ? "h-11 w-11" : "h-14 w-14", scanning ? "text-pop" : "text-ink-3")}
                  strokeWidth={1.6} />
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
          LIVE DB
        </Badge>
      </div>

      <div className="mt-3.5 flex flex-col gap-2 sm:flex-row">
        <Button size="lg" block onClick={nextInQueue} disabled={scanning}>
          <ScanLine className="h-[18px] w-[18px]" strokeWidth={2.6} />
          {scanning ? "READING…" : "NEXT IN QUEUE"}
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
            className="overflow-hidden" >
            <div className="mt-2.5 flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="KGR22CS042"
                autoFocus
                className="h-12 w-full rule bg-paper px-3 font-mono text-[14px] font-medium tracking-widest text-ink outline-none placeholder:text-ink-3 focus:drop-2" />
              <Button type="submit" size="lg" variant="pop" disabled={scanning}>
                FIND
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
