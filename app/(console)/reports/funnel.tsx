"use client";

import { motion } from "framer-motion";
import { formatNumber } from "@/lib/utils";

export function FunnelBars({
  rows,
  total,
}: {
  rows: { label: string; value: number; color: string }[];
  total: number;
}) {
  return (
    <div className="space-y-4">
      {rows.map((f, i) => {
        const pct = total ? (f.value / total) * 100 : 0;
        const drop = i > 0 ? rows[i - 1].value - f.value : 0;
        return (
          <div key={f.label}>
            <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[13.5px] font-medium text-ink">{f.label}</p>
              <div className="flex items-baseline gap-2.5">
                {drop > 0 && <span className="text-[11.5px] text-ink-3">−{formatNumber(drop)}</span>}
                <span className="figure text-[15px] text-ink">{formatNumber(f.value)}</span>
                <span className="w-12 text-right text-[12px] text-ink-3">{pct.toFixed(1)}%</span>
              </div>
            </div>
            <div className="h-2.5 overflow-hidden  bg-paper-3">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${pct}%` }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="h-full "
                style={{ backgroundColor: f.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
