"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface QueueRow {
  label: string;
  count: number;
  cap: number;
  tone: "ok" | "warn" | "bad" | "accent";
}

const BAR: Record<QueueRow["tone"], string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  bad: "bg-bad",
  accent: "bg-accent",
};

/** Capacity bars for each station queue. */
export function QueueBars({ rows }: { rows: QueueRow[] }) {
  return (
    <div className="space-y-3.5">
      {rows.map((q) => {
        const pct = Math.min(100, Math.round((q.count / Math.max(q.cap, 1)) * 100));
        return (
          <div key={q.label}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <p className="text-[13px] font-medium text-ink">{q.label}</p>
              <p className="text-[12px] text-ink-3">
                <span className="figure text-[14px] text-ink">{q.count}</span> / {q.cap}
              </p>
            </div>
            <div className="h-2 overflow-hidden  bg-paper-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className={cn("h-full ", BAR[q.tone])} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
