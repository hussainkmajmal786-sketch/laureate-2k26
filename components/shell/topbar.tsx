"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Check, GraduationCap, LogOut, Menu, Moon, Search, Sun, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV, NAV_GROUPS } from "@/lib/nav";
import { useTheme } from "@/components/theme-provider";
import { Avatar } from "@/components/ui/avatar";
import { Badge, LiveBadge } from "@/components/ui/badge";
import { StudentRowItem } from "@/components/student-card";
import { Modal } from "@/components/ui/feedback";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/actions";
import type { StudentRow, VolunteerRow } from "@/lib/supabase/types";

const ROLE_LABEL: Record<string, string> = {
  admin: "Event Admin",
  registration: "Registration",
  stage: "Stage Coordinator",
  booth: "Booth Operator",
  counter: "Counter Staff",
  media: "Media Runner",
  viewer: "View Only",
};

function Clock() {
  const [now, setNow] = React.useState<Date | null>(null);
  React.useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Nothing until mounted — avoids an SSR/client time mismatch.
  if (!now) return <div className="hidden h-8 w-[74px] bg-paper-2 rule md:block" />;

  return (
    <div className="stencil hidden h-8 items-center rule bg-[rgb(var(--ink))] px-2 text-[11px] text-[rgb(var(--paper))] md:flex">
      <span>
        {now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </span>
    </div>
  );
}

export function Topbar({
  onOpenMobileNav,
  volunteer,
  eventStatus,
  eventMeta,
}: {
  onOpenMobileNav: () => void;
  volunteer: VolunteerRow | null;
  eventStatus: string;
  eventMeta: string;
}) {
  const { theme, toggle } = useTheme();
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const pathname = usePathname();
  const current = NAV.find((n) => n.href === pathname);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-2 rule-b bg-paper px-3 sm:px-5">
        <button
          onClick={onOpenMobileNav} aria-label="Open navigation" className="tap grid h-10 w-10 shrink-0 place-items-center rule bg-paper text-ink press-sm lg:hidden" >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate headline text-[19px] text-ink">
            {current?.label ?? "Laureate 2K26"}
          </h1>
          <p className="hidden truncate text-[11.5px] text-ink-3 sm:block">{eventMeta}</p>
        </div>

        <button
          onClick={() => setSearchOpen(true)} className="tap hidden h-9 items-center gap-2 stencil rule bg-paper pr-2 pl-2.5 text-[10px] text-ink-2 press-sm sm:flex" >
          <Search className="h-4 w-4" />
          <span className="hidden lg:inline">Search graduates…</span>
          <kbd className="ml-1 hidden bg-paper-3 px-1 text-[9px] lg:inline">
            ⌘K
          </kbd>
        </button>

        <Clock />

        <div className="hidden lg:block">
          <LiveBadge label={eventStatus} />
        </div>

        <button
          onClick={toggle} aria-label="Toggle theme" className="tap relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rule bg-paper text-ink press-sm" >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme}
              initial={{ y: 14, opacity: 0, rotate: -30 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: -14, opacity: 0, rotate: 30 }}
              transition={{ duration: 0.22 }} >
              {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </motion.span>
          </AnimatePresence>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)} aria-label="Notifications" className="tap relative grid h-10 w-10 shrink-0 place-items-center rule bg-paper text-ink press-sm" >
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute top-2 right-2.5 h-2 w-2  bg-bad ring-2 ring-[rgb(var(--paper))]" />
          </button>

          <AnimatePresence>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 420, damping: 32 }} className="absolute right-0 z-50 mt-2 w-[320px] origin-top-right bg-paper rule-thick drop-3" >
                  <div className="flex items-center justify-between rule-b px-4 py-3">
                    <p className="text-[13.5px] font-semibold text-ink">Notifications</p>
                    <button className="text-[12px] font-medium text-accent hover:underline">
                      Mark all read
                    </button>
                  </div>
                  <ul className="max-h-[360px] divide-y-2 divide-[rgb(var(--rule))] overflow-y-auto">
                    {[
                      { id: 1, t: "Booth 2 queue exceeded 20 min", b: "Consider redirecting to Booth 1", tone: "bg-warn", time: "2m" },
                      { id: 2, t: "Session II conferral started", b: "EEE and Mechanical now on stage", tone: "bg-accent", time: "18m" },
                      { id: 3, t: "412 photos synced", b: "Booth 1 batch uploaded", tone: "bg-ok", time: "34m" },
                    ].map((n) => (
                      <li key={n.id} className="flex gap-3 px-4 py-3 transition-colors hover:bg-paper-2">
                        <span className={cn("mt-1.5 h-2 w-2 shrink-0 ", n.tone)} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-ink">{n.t}</p>
                          <p className="mt-0.5 text-[12px] leading-snug text-ink-3">{n.b}</p>
                        </div>
                        <span className="shrink-0 text-[11px] text-ink-3">{n.time}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)} className="tap flex shrink-0 items-center gap-2.5 rule bg-paper p-0.5 pr-0 press-sm sm:pr-3" >
            <Avatar name={volunteer?.name ?? "Guest"} hue={volunteer?.hue ?? 220} size="sm" ring={false} />
            <span className="hidden text-left sm:block">
              <span className="block text-[13px] leading-tight font-semibold text-ink">
                {volunteer?.name ?? "Signed out"}
              </span>
              <span className="block text-[11px] text-ink-3">
                {ROLE_LABEL[volunteer?.role ?? "viewer"]}
              </span>
            </span>
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 420, damping: 32 }} className="absolute right-0 z-50 mt-2 w-64 origin-top-right bg-paper rule-thick drop-3" >
                  <div className="rule-b p-4">
                    <p className="text-[14px] font-semibold text-ink">{volunteer?.name}</p>
                    <p className="mt-0.5 truncate text-[12px] text-ink-3">{volunteer?.email}</p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <Badge tone="accent" size="sm">{ROLE_LABEL[volunteer?.role ?? "viewer"]}</Badge>
                      {volunteer?.station && <Badge tone="neutral" size="sm">{volunteer.station}</Badge>}
                    </div>
                  </div>
                  <form action={signOut}>
                    <button type="submit" className="tap flex w-full items-center gap-2.5 px-4 py-3 text-left text-[13.5px] font-medium text-bad transition-colors hover:bg-bad-soft" >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </form>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </header>

      <CommandSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

/** ⌘K palette — live graduate search plus page jumps. */
function CommandSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<StudentRow[]>([]);
  const supabase = React.useMemo(() => createClient(), []);

  React.useEffect(() => {
    if (!open) { setQ(""); setResults([]); }
  }, [open]);

  // Debounced so typing does not fire a query per keystroke.
  React.useEffect(() => {
    const term = q.trim();
    if (!term) { setResults([]); return; }

    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("students")
        .select("*")
        .or(`name.ilike.%${term}%,reg_no.ilike.%${term}%`)
        .limit(6);
      setResults(data ?? []);
    }, 220);

    return () => clearTimeout(timer);
  }, [q, supabase]);

  const pages = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return NAV.slice(0, 5);
    return NAV.filter((n) => n.label.toLowerCase().includes(term)).slice(0, 4);
  }, [q]);

  return (
    <Modal open={open} onClose={onClose} title="Search" size="md">
      <div className="-mx-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-3" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)} placeholder="Name, register number, or page…" className="h-12 w-full  bg-paper-2 pr-4 pl-10 text-sm text-ink rule outline-none placeholder:text-ink-3 focus:ring-2 focus:ring-[rgb(var(--accent))]" />
        </div>

        <div className="mt-4 max-h-[320px] overflow-y-auto">
          {pages.length > 0 && (
            <div className="mb-3">
              <p className="stencil mb-1 px-2 text-ink-3">Pages</p>
              {pages.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  onClick={onClose} className="tap flex items-center gap-3  px-2 py-2.5 transition-colors hover:bg-paper-2" >
                  <span className="grid h-8 w-8 place-items-center  bg-paper-2 text-ink-2 rule">
                    <p.icon className="h-4 w-4" />
                  </span>
                  <span className="text-[13.5px] font-medium text-ink">{p.label}</span>
                  <span className="ml-auto text-[11.5px] text-ink-3">{p.group}</span>
                </Link>
              ))}
            </div>
          )}

          {results.length > 0 && (
            <div>
              <p className="stencil mb-1 px-2 text-ink-3">Graduates</p>
              {results.map((s) => (
                <StudentRowItem key={s.id} student={s} meta={s.dept_code} onClick={onClose} />
              ))}
            </div>
          )}

          {q && results.length === 0 && pages.length === 0 && (
            <p className="px-2 py-8 text-center text-[13px] text-ink-3">No matches for “{q}”</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

/** Slide-over navigation for tablet and phone. */
export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  React.useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 halftone bg-[rgb(var(--ink))]/60" />
          <motion.nav
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 38 }} className="absolute inset-y-0 left-0 flex w-[270px] flex-col rule-r bg-paper" >
            <div className="flex h-16 items-center justify-between px-5">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center  bg-pop">
                  <GraduationCap className="h-[19px] w-[19px] text-white" strokeWidth={2.1} />
                </span>
                <div>
                  <p className="text-[15px] leading-tight font-bold tracking-[-0.025em] text-ink">
                    Laureate 2K26
                  </p>
                  <p className="text-[11.5px] text-ink-3">CEK Kidangoor</p>
                </div>
              </div>
              <button
                onClick={onClose} aria-label="Close navigation" className="tap grid h-9 w-9 place-items-center  text-ink-3 hover:bg-paper-2" >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="no-scrollbar flex-1 overflow-y-auto px-3 pb-6">
              {NAV_GROUPS.map((group) => (
                <div key={group} className="mb-5">
                  <p className="stencil mb-1.5 px-3 text-ink-3">{group}</p>
                  <ul className="space-y-0.5">
                    {NAV.filter((n) => n.group === group).map((item) => {
                      const active = pathname === item.href;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={cn(
                              "tap flex items-center gap-3  px-3 py-3 text-sm font-medium transition-colors",
                              active
                                ? "rule bg-[rgb(var(--ink))] text-[rgb(var(--paper))]"
                                : "text-ink-2 hover:bg-paper-2 hover:text-ink",
                            )} >
                            <item.icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.3 : 2} />
                            <span className="flex-1">{item.label}</span>
                            {active && <Check className="h-4 w-4" />}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </motion.nav>
        </div>
      )}
    </AnimatePresence>
  );
}
