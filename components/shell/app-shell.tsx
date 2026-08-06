"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { MobileNav, Topbar } from "./topbar";
import { BottomNav } from "./bottom-nav";
import type { VolunteerRow } from "@/lib/supabase/types";

export function AppShell({
  children,
  volunteer,
  eventStatus,
  eventMeta,
}: {
  children: React.ReactNode;
  volunteer: VolunteerRow | null;
  eventStatus: string;
  eventMeta: string;
}) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    <div className="grain relative min-h-dvh surface-paper">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div
        className={cn(
          "flex min-h-dvh flex-col transition-[padding] duration-200 ease-out",
          collapsed ? "lg:pl-[74px]" : "lg:pl-[248px]",
        )} >
        <Topbar
          onOpenMobileNav={() => setMobileOpen(true)}
          volunteer={volunteer}
          eventStatus={eventStatus}
          eventMeta={eventMeta} />

        <main className="flex-1 pb-20 lg:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }} >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

/** Standard page frame — consistent gutters and max width across screens. */
export function Page({
  children,
  className,
  wide = false,
}: {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-3 py-6 sm:px-5 sm:py-8",
        wide ? "max-w-[1600px]" : "max-w-[1400px]",
        className,
      )} >
      {children}
    </div>
  );
}

/** Page masthead — oversized poster type over a heavy rule. */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 rule-b pb-3.5", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="headline text-[34px] text-ink sm:text-[46px]">{title}</h1>
          {description && (
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-ink-2 text-pretty">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
