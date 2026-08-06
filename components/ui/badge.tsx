"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Stamped label — square, ruled, stencil type. */
const badge = cva(
  "stencil inline-flex items-center gap-1.5 rule whitespace-nowrap leading-none",
  {
    variants: {
      tone: {
        neutral: "bg-paper-2 text-ink",
        accent: "bg-accent text-accent-ink",
        pop: "bg-pop text-white",
        ok: "bg-ok text-ink-black",
        warn: "bg-warn text-ink-black",
        bad: "bg-bad text-white",
        ink: "bg-[rgb(var(--ink))] text-[rgb(var(--paper))]",
        outline: "bg-transparent text-ink",
      },
      size: {
        sm: "h-5 px-1.5 text-[9.5px]",
        md: "h-6 px-2 text-[10.5px]",
        lg: "h-8 px-3 text-[12px]",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badge> {
  dot?: boolean;
}

export function Badge({ className, tone, size, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badge({ tone, size }), className)} {...props}>
      {dot && <span className="h-1.5 w-1.5 shrink-0 bg-current" />}
      {children}
    </span>
  );
}

/** Live indicator — a hard blinking square, not a soft pulse. */
export function LiveBadge({ label = "LIVE", className }: { label?: string; className?: string }) {
  return (
    <span
      className={cn(
        "stencil inline-flex h-6 items-center gap-1.5 rule bg-ok px-2 text-[10.5px] leading-none text-ink-black",
        className,
      )}
    >
      <span className="animate-blink h-1.5 w-1.5 bg-ink-black" />
      {label}
    </span>
  );
}

/** Consistent done / not-done chip used across every table and list. */
export function StatusChip({
  state,
  labels,
  size = "sm",
}: {
  state: boolean | "pending";
  labels: [done: string, notDone: string, pending?: string];
  size?: "sm" | "md";
}) {
  if (state === "pending") {
    return (
      <Badge tone="warn" size={size}>
        {labels[2] ?? "PENDING"}
      </Badge>
    );
  }
  return state ? (
    <Badge tone="ok" size={size}>
      {labels[0]}
    </Badge>
  ) : (
    <Badge tone="outline" size={size} className="text-ink-3">
      {labels[1]}
    </Badge>
  );
}
