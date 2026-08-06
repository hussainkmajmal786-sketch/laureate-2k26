"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Check, GraduationCap, Menu, Moon, Search, Sun, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV, NAV_GROUPS } from "@/lib/nav";
import { EVENT, getStudents } from "@/lib/data";
import { useTheme } from "@/components/theme-provider";
import { Avatar } from "@/components/ui/avatar";
import { LiveBadge } from "@/components/ui/badge";
import { StudentRow } from "@/components/student-card";
import { Modal } from "@/components/ui/feedback";

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
      {now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </div>
  );
}

const NOTIFICATIONS = [
  { id: 1, title: "BOOTH 2 QUEUE OVER 20 MIN", body: "Consider redirecting to Booth 1", tone: "warn", time: "2m" },
  { id: 2, title: "SESSION II STARTED", body: "EEE and Mechanical now on stage", tone: "accent", time: "18m" },
  { id: 3, title: "412 PHOTOS SYNCED", body: "Booth 1 batch uploaded", tone: "ok", time: "34m" },
  { id: 4, title: "SHIFT CHANGE AT 14:00", body: "6 volunteers rotating out", tone: "neutral", time: "1h" },
];

export function Topbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const { theme, toggle } = useTheme();
  const [notifOpen, setNotifOpen] = React.useState(false);
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
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
          className="tap grid h-10 w-10 shrink-0 place-items-center rule bg-paper text-ink lg:hidden"
        >
          <Menu className="h-5 w-5" strokeWidth={2.6} />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="headline truncate text-[19px] text-ink">{current?.label ?? "LAUREATE 2K26"}</h1>
          <p className="stencil hidden truncate text-[8.5px] text-ink-3 sm:block">
            {EVENT.college} · {EVENT.date}
          </p>
        </div>

        <button
          onClick={() => setSearchOpen(true)}
          className="stencil tap hidden h-9 items-center gap-2 rule bg-paper px-2.5 text-[10px] text-ink-2 press-sm sm:flex"
        >
          <Search className="h-4 w-4" strokeWidth={2.6} />
          <span className="hidden lg:inline">SEARCH</span>
          <kbd className="ml-1 hidden bg-paper-3 px-1 text-[9px] lg:inline">⌘K</kbd>
        </button>

        <Clock />

        <div className="hidden lg:block">
          <LiveBadge label={EVENT.status.toUpperCase()} />
        </div>

        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="tap relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rule bg-paper text-ink press-sm"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme}
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {theme === "dark" ? <Sun className="h-[18px] w-[18px]" strokeWidth={2.6} /> : <Moon className="h-[18px] w-[18px]" strokeWidth={2.6} />}
            </motion.span>
          </AnimatePresence>
        </button>

        <div className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            aria-label="Notifications"
            className="tap relative grid h-10 w-10 shrink-0 place-items-center rule bg-paper text-ink press-sm"
          >
            <Bell className="h-[18px] w-[18px]" strokeWidth={2.6} />
            <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rule bg-pop" />
          </button>

          <AnimatePresence>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ type: "spring", stiffness: 460, damping: 32 }}
                  className="absolute right-0 z-50 mt-2 w-[320px] origin-top-right bg-paper rule-thick drop-3"
                >
                  <div className="flex items-center justify-between rule-b bg-pop px-3 py-2">
                    <p className="stencil text-[10.5px] text-white">NOTIFICATIONS</p>
                    <button className="stencil text-[9.5px] text-white/80 hover:text-white">CLEAR ALL</button>
                  </div>
                  <ul className="max-h-[360px] overflow-y-auto">
                    {NOTIFICATIONS.map((n) => (
                      <li key={n.id} className="flex gap-2.5 not-last:rule-b px-3 py-2.5 hover:bg-paper-2">
                        <span
                          className={cn(
                            "mt-1 h-2.5 w-2.5 shrink-0",
                            n.tone === "warn" && "bg-warn",
                            n.tone === "ok" && "bg-ok",
                            n.tone === "accent" && "bg-accent",
                            n.tone === "neutral" && "bg-[rgb(var(--ink-3))]",
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="stencil text-[9.5px] text-ink">{n.title}</p>
                          <p className="mt-0.5 text-[11.5px] leading-snug text-ink-3">{n.body}</p>
                        </div>
                        <span className="stencil shrink-0 text-[9px] text-ink-3">{n.time}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <button className="tap flex shrink-0 items-center gap-2 rule bg-paper p-0.5 pr-0 press-sm sm:pr-2.5">
          <Avatar name="Ajmal Hussain" hue={0} size="sm" ring={false} />
          <span className="hidden text-left sm:block">
            <span className="block text-[12px] leading-tight font-bold text-ink">Ajmal Hussain</span>
            <span className="stencil block text-[8.5px] text-ink-3">EVENT ADMIN</span>
          </span>
        </button>
      </header>

      <CommandSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function CommandSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = React.useState("");
  const students = React.useMemo(() => getStudents(), []);

  const results = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return students
      .filter((s) => s.name.toLowerCase().includes(term) || s.regNo.toLowerCase().includes(term))
      .slice(0, 6);
  }, [q, students]);

  const pages = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return NAV.slice(0, 5);
    return NAV.filter((n) => n.label.toLowerCase().includes(term)).slice(0, 4);
  }, [q]);

  React.useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="SEARCH" size="md">
      <div>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink" strokeWidth={2.6} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="NAME, REGISTER NUMBER, OR PAGE…"
            className="stencil h-12 w-full rule bg-paper pr-3 pl-9 text-[11px] text-ink outline-none placeholder:text-ink-3 focus:drop-2"
          />
        </div>

        <div className="mt-4 max-h-[320px] overflow-y-auto">
          {pages.length > 0 && (
            <div className="mb-3">
              <p className="stencil mb-1 text-[9px] text-ink-3">PAGES</p>
              {pages.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  onClick={onClose}
                  className="tap flex items-center gap-2.5 px-1.5 py-2 hover:bg-paper-2"
                >
                  <span className="grid h-7 w-7 place-items-center rule bg-paper-2 text-ink">
                    <p.icon className="h-3.5 w-3.5" strokeWidth={2.4} />
                  </span>
                  <span className="text-[13px] font-bold text-ink">{p.label}</span>
                  <span className="stencil ml-auto text-[9px] text-ink-3">{p.group}</span>
                </Link>
              ))}
            </div>
          )}

          {results.length > 0 && (
            <div>
              <p className="stencil mb-1 text-[9px] text-ink-3">GRADUATES</p>
              {results.map((s) => (
                <StudentRow key={s.id} student={s} meta={s.deptName} onClick={onClose} />
              ))}
            </div>
          )}

          {q && results.length === 0 && pages.length === 0 && (
            <p className="stencil px-2 py-8 text-center text-[11px] text-ink-3">NO MATCHES</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

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
            onClick={onClose}
            className="halftone absolute inset-0 bg-[rgb(var(--ink))]/60"
          />
          <motion.nav
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 460, damping: 40 }}
            className="absolute inset-y-0 left-0 flex w-[270px] flex-col rule-r bg-paper"
          >
            <div className="flex h-16 items-center justify-between rule-b bg-[rgb(var(--ink))] px-4 text-[rgb(var(--paper))]">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center bg-pop">
                  <GraduationCap className="h-5 w-5 text-white" strokeWidth={2.6} />
                </span>
                <div>
                  <p className="headline text-[17px] leading-none">
                    LAUREATE <span className="text-pop">2K26</span>
                  </p>
                  <p className="stencil mt-1 text-[8.5px] opacity-60">CEK KIDANGOOR</p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close navigation"
                className="tap grid h-8 w-8 place-items-center border-2 border-[rgb(var(--paper))]"
              >
                <X className="h-4 w-4" strokeWidth={3} />
              </button>
            </div>

            <div className="no-scrollbar flex-1 overflow-y-auto py-3">
              {NAV_GROUPS.map((group) => (
                <div key={group} className="mb-4">
                  <p className="stencil mb-1.5 px-4 text-[8.5px] text-ink-3">{group}</p>
                  <ul>
                    {NAV.filter((n) => n.group === group).map((item) => {
                      const active = pathname === item.href;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={cn(
                              "tap mx-2 flex items-center gap-2.5 px-2.5 py-3 text-[13px] font-bold transition-colors",
                              active
                                ? "rule bg-[rgb(var(--ink))] text-[rgb(var(--paper))]"
                                : "text-ink-2 hover:bg-paper-2 hover:text-ink",
                            )}
                          >
                            <item.icon className="h-[17px] w-[17px]" strokeWidth={active ? 2.8 : 2.2} />
                            <span className="flex-1">{item.label}</span>
                            {active && <Check className="h-4 w-4" strokeWidth={3} />}
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
