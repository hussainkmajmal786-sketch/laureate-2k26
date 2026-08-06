"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MOBILE_NAV } from "@/lib/nav";

/**
 * Phone bar. 56px targets, thumb-reachable, safe-area aware — volunteers
 * run this one-handed all day. The active tab is a solid ink block.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 rule-t bg-paper lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }} >
      <ul className="flex items-stretch">
        {MOBILE_NAV.map((item, i) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <li key={item.href} className={cn("flex-1", i > 0 && "rule-l")}>
              <Link href={item.href} className="tap relative flex h-14 flex-col items-center justify-center gap-1">
                {active && (
                  <motion.span
                    layoutId="bottom-active"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                    className="absolute inset-0 bg-[rgb(var(--ink))]" />
                )}
                <Icon
                  className={cn(
                    "relative z-10 h-[19px] w-[19px]",
                    active ? "text-[rgb(var(--paper))]" : "text-ink-2",
                  )}
                  strokeWidth={active ? 2.8 : 2.2} />
                <span
                  className={cn(
                    "stencil relative z-10 text-[8.5px]",
                    active ? "text-[rgb(var(--paper))]" : "text-ink-3",
                  )} >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
