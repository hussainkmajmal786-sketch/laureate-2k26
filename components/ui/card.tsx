"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * A printed panel: square corners, thick ink rule, hard offset shadow.
 * No radii, no blur — this is ink on paper.
 */
export function Card({
  className,
  interactive = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "relative bg-paper rule drop-3",
        interactive && "tap cursor-pointer press",
        className,
      )}
      {...props}
    />
  );
}

export function MotionCard({ className, ...props }: HTMLMotionProps<"div">) {
  return <motion.div className={cn("relative bg-paper rule drop-3", className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-start justify-between gap-4 rule-b bg-paper-2 px-4 py-3", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("stencil text-[12px] leading-tight text-ink", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1 text-[12.5px] leading-snug text-ink-3", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center gap-2 rule-t px-4 py-3", className)} {...props} />;
}

/** Big stencilled section heading with a rule running to the edge. */
export function SectionTitle({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-4 rule-b pb-2.5", className)}>
      <div className="min-w-0">
        <h2 className="headline text-[22px] text-ink sm:text-[26px]">{title}</h2>
        {subtitle && <p className="mt-1 text-[12.5px] text-ink-3">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/**
 * Colour-blocked panel — used where a card needs to shout. The label sits in
 * a stencilled bar across the top.
 */
export function BlockPanel({
  label,
  tone = "accent",
  children,
  className,
  action,
}: {
  label: string;
  tone?: "accent" | "pop" | "ok" | "warn" | "bad" | "ink";
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  const bar = {
    accent: "bg-accent text-accent-ink",
    pop: "bg-pop text-white",
    ok: "bg-ok text-ink-black",
    warn: "bg-warn text-ink-black",
    bad: "bg-bad text-white",
    ink: "bg-[rgb(var(--ink))] text-[rgb(var(--paper))]",
  }[tone];

  return (
    <div className={cn("relative bg-paper rule drop-3", className)}>
      <div className={cn("flex items-center justify-between gap-3 rule-b px-4 py-2", bar)}>
        <span className="stencil text-[11px]">{label}</span>
        {action}
      </div>
      {children}
    </div>
  );
}
