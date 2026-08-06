"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn, relativeTime, hueFrom } from "@/lib/utils";
import type { Activity, TimelineItem } from "@/lib/data";
import { Avatar } from "./ui/avatar";

/** Event schedule as a printed itinerary — square nodes on a thick rule. */
export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <motion.li
            key={item.time}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.35 }}
            className="relative flex gap-3.5 pb-4 last:pb-0"
          >
            {!last && (
              <span
                className={cn(
                  "absolute top-7 left-[13px] h-[calc(100%-1.25rem)] w-[3px]",
                  item.status === "done" ? "bg-ok" : "bg-[rgb(var(--rule-soft))]",
                )}
              />
            )}

            <span className="relative z-10 shrink-0">
              {item.status === "done" ? (
                <span className="grid h-7 w-7 place-items-center rule bg-ok">
                  <Check className="h-4 w-4 text-ink-black" strokeWidth={4} />
                </span>
              ) : item.status === "active" ? (
                <span className="grid h-7 w-7 place-items-center rule bg-pop">
                  <span className="animate-blink h-2.5 w-2.5 bg-white" />
                </span>
              ) : (
                <span className="grid h-7 w-7 place-items-center rule bg-paper">
                  <span className="h-2 w-2 bg-[rgb(var(--rule-soft))]" />
                </span>
              )}
            </span>

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p
                  className={cn(
                    "text-[13px] leading-tight font-bold",
                    item.status === "upcoming" ? "text-ink-3" : "text-ink",
                  )}
                >
                  {item.title}
                </p>
                <span className="stencil text-[10px] text-ink-3">{item.time}</span>
                {item.status === "active" && (
                  <span className="stencil bg-pop px-1 text-[9px] text-white">NOW</span>
                )}
              </div>
              <p className="mt-1 text-[12px] leading-snug text-ink-3">{item.detail}</p>
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}

const TONE_BLOCK: Record<string, string> = {
  accent: "bg-accent",
  ok: "bg-ok",
  warn: "bg-warn",
  neutral: "bg-[rgb(var(--ink-3))]",
};

export function ActivityFeed({ items, showAvatar = true }: { items: Activity[]; showAvatar?: boolean }) {
  return (
    <ul>
      {items.map((a, i) => (
        <motion.li
          key={a.id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03, duration: 0.3 }}
          className="flex items-start gap-2.5 py-2.5 not-last:rule-b"
        >
          {showAvatar ? (
            <Avatar name={a.actor} hue={hueFrom(a.actor)} size="xs" />
          ) : (
            <span className={cn("mt-1.5 h-2 w-2 shrink-0", TONE_BLOCK[a.tone])} />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] leading-snug text-ink-2">
              <span className="font-bold text-ink">{a.actor}</span> {a.action}{" "}
              <span className="font-bold text-ink">{a.subject}</span>
            </p>
            <p className="stencil mt-0.5 text-[9.5px] text-ink-3">{relativeTime(a.minutesAgo)}</p>
          </div>
        </motion.li>
      ))}
    </ul>
  );
}

/** Chunky segmented progress bar for Stage and Booth flows. */
export function ProgressSteps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex gap-1.5">
      {steps.map((s, i) => (
        <div key={s} className="min-w-0 flex-1">
          <div className="h-3 rule bg-paper-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: i < current ? "100%" : i === current ? "55%" : "0%" }}
              transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
              className={cn("h-full", i <= current ? "bg-pop" : "")}
            />
          </div>
          <p className={cn("stencil mt-1.5 truncate text-[9px]", i <= current ? "text-ink" : "text-ink-3")}>
            {s}
          </p>
        </div>
      ))}
    </div>
  );
}
