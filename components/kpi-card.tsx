"use client";

import * as React from "react";
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  Award,
  Camera,
  GraduationCap,
  Hourglass,
  ScrollText,
  UserCheck,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

/**
 * Icons are looked up by name rather than passed as props — a Server
 * Component cannot hand a function to a Client Component.
 */
export const KPI_ICONS = {
  GraduationCap,
  UserCheck,
  Hourglass,
  Award,
  Camera,
  Users,
  UtensilsCrossed,
  ScrollText,
} satisfies Record<string, LucideIcon>;

export type KpiIconName = keyof typeof KPI_ICONS;

export function CountUp({
  value,
  duration = 1.2,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: duration * 1000, bounce: 0 });
  const text = useTransform(spring, (v) => formatNumber(Math.round(v)));

  React.useEffect(() => {
    if (inView) mv.set(value);
  }, [inView, value, mv]);

  return (
    <span ref={ref} className={className}>
      <motion.span>{text}</motion.span>
    </span>
  );
}

const TONE: Record<string, { block: string; bar: string; text: string }> = {
  accent: { block: "bg-accent text-accent-ink", bar: "bg-accent", text: "text-accent" },
  ok: { block: "bg-ok text-ink-black", bar: "bg-ok", text: "text-ok" },
  warn: { block: "bg-warn text-ink-black", bar: "bg-warn", text: "text-warn" },
  bad: { block: "bg-bad text-white", bar: "bg-bad", text: "text-bad" },
  pop: { block: "bg-pop text-white", bar: "bg-pop", text: "text-pop" },
  neutral: {
    block: "bg-[rgb(var(--ink))] text-[rgb(var(--paper))]",
    bar: "bg-[rgb(var(--ink))]",
    text: "text-ink",
  },
};

/**
 * Printed stat block. The icon sits in a colour-blocked corner tab, the
 * number is enormous, and the whole card presses on hover.
 */
export function KpiCard({
  label,
  value,
  total,
  delta,
  tone = "neutral",
  icon,
  hint,
  index = 0,
}: {
  label: string;
  value: number;
  total?: number | null;
  delta?: number;
  tone?: "accent" | "ok" | "warn" | "bad" | "pop" | "neutral";
  icon: KpiIconName;
  hint?: string;
  index?: number;
}) {
  const pct = total ? Math.round((value / total) * 100) : null;
  const t = TONE[tone];
  const Icon = KPI_ICONS[icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.2, 0, 0, 1] }}
      className="press relative bg-paper rule drop-2" >
      {/* Colour tab */}
      <div className={cn("flex items-center justify-between rule-b px-3 py-2", t.block)}>
        <Icon className="h-4 w-4" strokeWidth={2.6} />
        {delta !== undefined && delta !== 0 && (
          <span className="stencil inline-flex items-center gap-0.5 text-[10px]">
            {delta > 0 ? (
              <ArrowUp className="h-3 w-3" strokeWidth={3.5} />
            ) : (
              <ArrowDown className="h-3 w-3" strokeWidth={3.5} />
            )}
            {Math.abs(delta)}%
          </span>
        )}
      </div>

      <div className="p-3.5">
        <div className="flex items-baseline gap-1.5">
          <CountUp value={value} className="figure text-[34px] leading-none text-ink" />
          {pct !== null && <span className="stencil text-[11px] text-ink-3">{pct}%</span>}
        </div>

        <p className="stencil mt-2.5 text-[10px] text-ink-2">{label}</p>
        {hint && <p className="mt-1 text-[11.5px] leading-snug text-ink-3">{hint}</p>}

        {pct !== null && (
          <div className="mt-3 h-2.5 rule bg-paper-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ delay: 0.25 + index * 0.04, duration: 0.7, ease: [0.2, 0, 0, 1] }}
              className={cn("h-full", t.bar)} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

/** Compact stat tile — a ruled box with a stencilled label. */
export function StatTile({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "accent" | "ok" | "warn" | "bad" | "pop" | "neutral";
}) {
  return (
    <div className="bg-paper rule drop-1 px-3.5 py-3">
      <p className="stencil text-[9.5px] text-ink-3">{label}</p>
      <p className={cn("figure mt-1.5 text-[26px] leading-none", TONE[tone].text)}>
        {typeof value === "number" ? formatNumber(value) : value}
      </p>
      {sub && <p className="mt-1.5 text-[11.5px] leading-snug text-ink-3">{sub}</p>}
    </div>
  );
}
