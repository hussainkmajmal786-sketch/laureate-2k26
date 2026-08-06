"use client";

import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { CountUp } from "@/components/kpi-card";
import { useTheme } from "@/components/theme-provider";

/** Colour-blocked counter row on the landing hero. */
export function LandingCounters({
  items,
}: {
  items: { label: string; value: number; bg: string; fg: string }[];
}) {
  return (
    <motion.dl
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: [0.2, 0, 0, 1] }}
      className="mt-12 grid grid-cols-2 sm:grid-cols-4"
    >
      {items.map((s, i) => (
        <div
          key={s.label}
          className={`rule px-4 py-6 ${i > 0 ? "-ml-0.5" : ""}`}
          style={{ backgroundColor: s.bg, color: s.fg }}
        >
          <dd className="figure text-[clamp(2rem,5vw,3rem)] leading-none">
            <CountUp value={s.value} />
          </dd>
          <dt className="stencil mt-2 text-[9.5px] opacity-80">{s.label}</dt>
        </div>
      ))}
    </motion.dl>
  );
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="tap grid h-10 w-10 place-items-center rule bg-paper text-ink press-sm"
    >
      {theme === "dark" ? (
        <Sun className="h-[18px] w-[18px]" strokeWidth={2.6} />
      ) : (
        <Moon className="h-[18px] w-[18px]" strokeWidth={2.6} />
      )}
    </button>
  );
}
