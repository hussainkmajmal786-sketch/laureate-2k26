"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { GraduationCap, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV, NAV_GROUPS } from "@/lib/nav";

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden shrink-0 flex-col rule-r bg-paper transition-[width] duration-200 ease-out lg:flex",
        collapsed ? "w-[74px]" : "w-[248px]",
      )} >
      {/* Brand block */}
      <Link href="/dashboard"
        className={cn(
          "tap flex h-16 items-center gap-2.5 rule-b bg-[rgb(var(--ink))] px-4 text-[rgb(var(--paper))]",
          collapsed && "justify-center px-0",
        )} >
        <span className="grid h-9 w-9 shrink-0 place-items-center bg-pop">
          <GraduationCap className="h-5 w-5 text-white" strokeWidth={2.6} />
        </span>
        {!collapsed && (
          <div className="min-w-0">
            <p className="headline text-[17px] leading-none">
              LAUREATE <span className="text-pop">2K26</span>
            </p>
            <p className="stencil mt-1 text-[8.5px] opacity-60">CEK KIDANGOOR</p>
          </div>
        )}
      </Link>

      <nav className="no-scrollbar flex-1 overflow-y-auto py-3">
        {NAV_GROUPS.map((group) => {
          const items = NAV.filter((n) => n.group === group);
          if (!items.length) return null;
          return (
            <div key={group} className="mb-4">
              {!collapsed ? (
                <p className="stencil mb-1.5 px-4 text-[8.5px] text-ink-3">{group}</p>
              ) : (
                <div className="mx-4 mb-2 h-0.5 bg-[rgb(var(--rule-soft))]" />
              )}
              <ul>
                {items.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "tap relative mx-2 flex items-center gap-2.5 px-2.5 py-2.5 text-[12.5px] font-bold transition-colors",
                          collapsed && "justify-center px-0",
                          active ? "text-[rgb(var(--paper))]" : "text-ink-2 hover:bg-paper-2 hover:text-ink",
                        )} >
                        {active && (
                          <motion.span
                            layoutId="nav-active"
                            transition={{ type: "spring", stiffness: 500, damping: 38 }}
                            className="absolute inset-0 rule bg-[rgb(var(--ink))]" />
                        )}
                        <Icon
                          className="relative z-10 h-[17px] w-[17px] shrink-0"
                          strokeWidth={active ? 2.8 : 2.2} />
                        {!collapsed && (
                          <>
                            <span className="relative z-10 flex-1 truncate">{item.label}</span>
                            {item.badge && (
                              <span
                                className={cn(
                                  "stencil relative z-10 px-1 py-0.5 text-[9px]",
                                  active ? "bg-pop text-white" : "bg-paper-3 text-ink-2",
                                )} >
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                        {collapsed && item.badge && (
                          <span className="absolute top-1 right-2 h-2 w-2 bg-pop" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <button
        onClick={onToggle}
        className={cn(
          "stencil tap flex w-full items-center gap-2.5 rule-t px-4 py-3 text-[10px] text-ink-3 transition-colors hover:bg-paper-2 hover:text-ink",
          collapsed && "justify-center px-0",
        )} >
        {collapsed ? (
          <PanelLeftOpen className="h-4 w-4" />
        ) : (
          <>
            <PanelLeftClose className="h-4 w-4" />
            COLLAPSE
          </>
        )}
      </button>
    </aside>
  );
}
