"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  Camera,
  GraduationCap,
  Images,
  MonitorPlay,
  Moon,
  ScanLine,
  ScrollText,
  Sun,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { EVENT, DEPARTMENTS, TOTAL_GRADUATES } from "@/lib/data";
import { formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/kpi-card";
import { useTheme } from "@/components/theme-provider";

const EASE = [0.2, 0, 0, 1] as const;

const CAPABILITIES = [
  { icon: ScanLine, title: "REGISTRATION", body: "Six desks, sub-second check-in. A badge scan resolves the graduate instantly.", href: "/registration", color: "#2563eb" },
  { icon: Award, title: "STAGE FLOW", body: "Call, capture and clear each graduate without breaking the ceremony's rhythm.", href: "/stage", color: "#ec4899" },
  { icon: Camera, title: "PHOTO BOOTHS", body: "Two booths, automatic queue routing, individual and family sessions.", href: "/booth", color: "#f59e0b" },
  { icon: MonitorPlay, title: "TV QUEUE BOARD", body: "A now-serving board for the holding area, readable from thirty metres.", href: "/display", color: "#10b981" },
  { icon: UtensilsCrossed, title: "LUNCH", body: "One scan per graduate. Duplicate coupons are caught at the counter.", href: "/lunch", color: "#6d28d9" },
  { icon: ScrollText, title: "CERTIFICATES", body: "Track every degree from the desk into the graduate's hands.", href: "/certificates", color: "#f97316" },
  { icon: Images, title: "MEDIA GALLERY", body: "Every frame from every photographer, filtered by branch and session.", href: "/gallery", color: "#06b6d4" },
  { icon: Users, title: "VOLUNTEER OPS", body: "Live roster, station assignments and per-volunteer throughput.", href: "/volunteers", color: "#84cc16" },
];

const MARQUEE = [
  "CLASS OF 2026", "★", "COLLEGE OF ENGINEERING KIDANGOOR", "★",
  "2,047 GRADUATES", "★", "SEVEN DEPARTMENTS", "★", "ONE DAY", "★",
];

export default function Landing() {
  const { theme, toggle } = useTheme();

  return (
    <div className="grain relative min-h-dvh overflow-x-hidden bg-paper">
      {/* ── Nav ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 flex items-center justify-between rule-b bg-paper px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rule bg-pop">
            <GraduationCap className="h-5 w-5 text-white" strokeWidth={2.6} />
          </span>
          <div>
            <p className="headline text-[19px] leading-none text-ink">
              LAUREATE <span className="text-pop">2K26</span>
            </p>
            <p className="stencil mt-1 text-[8.5px] text-ink-3">CEK KIDANGOOR</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="tap grid h-10 w-10 place-items-center rule bg-paper text-ink press-sm"
          >
            {theme === "dark" ? <Sun className="h-[18px] w-[18px]" strokeWidth={2.6} /> : <Moon className="h-[18px] w-[18px]" strokeWidth={2.6} />}
          </button>
          <Link href="/dashboard">
            <Button size="md">
              OPEN CONSOLE
              <ArrowRight className="h-4 w-4" strokeWidth={3} />
            </Button>
          </Link>
        </div>
      </header>

      {/* ── Marquee ────────────────────────────────────────── */}
      <div className="overflow-hidden rule-b bg-[rgb(var(--ink))] py-2">
        <div className="animate-marquee flex w-max gap-8 whitespace-nowrap">
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i} className="stencil text-[11px] text-[rgb(var(--paper))]">{m}</span>
          ))}
        </div>
      </div>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative px-4 pt-10 pb-14 sm:px-6 sm:pt-16">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="inline-flex items-center gap-2 rule bg-ok px-2.5 py-1.5"
          >
            <span className="animate-blink h-2 w-2 bg-ink-black" />
            <span className="stencil text-[10.5px] text-ink-black">
              {EVENT.status.toUpperCase()} · {EVENT.date.toUpperCase()}
            </span>
          </motion.div>

          {/* Poster type — each line staggers in */}
          <h1 className="mt-6">
            {["LAUREATE"].map((line) => (
              <motion.span
                key={line}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.05, ease: EASE }}
                className="headline block text-[clamp(3.5rem,14vw,11rem)] text-ink"
              >
                {line}
              </motion.span>
            ))}
            <motion.span
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.13, ease: EASE }}
              className="headline relative block text-[clamp(3.5rem,14vw,11rem)] text-pop"
            >
              2K26
              <span className="absolute -top-2 -right-1 hidden rotate-6 rule bg-warn px-2 py-1 text-[13px] tracking-normal text-ink-black sm:inline-block">
                CLASS OF 2026
              </span>
            </motion.span>
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22, ease: EASE }}
            className="mt-7 grid gap-6 lg:grid-cols-[1.4fr_1fr]"
          >
            <p className="max-w-2xl text-[16px] leading-relaxed text-ink-2 text-pretty sm:text-[18px]">
              The graduation management system for the{" "}
              <span className="bg-warn px-1 font-bold text-ink-black">
                College of Engineering Kidangoor
              </span>
              . One console for registration, stage flow, photo booths, lunch and certificates —
              built to move {formatNumber(TOTAL_GRADUATES)} graduates through a single day without a
              queue anyone remembers.
            </p>

            <div className="flex flex-col gap-2.5 sm:flex-row lg:flex-col lg:justify-center">
              <Link href="/dashboard" className="sm:flex-1 lg:flex-none">
                <Button size="xl" block>
                  OPEN THE CONSOLE
                  <ArrowRight className="h-5 w-5" strokeWidth={3} />
                </Button>
              </Link>
              <Link href="/display" className="sm:flex-1 lg:flex-none">
                <Button size="xl" variant="secondary" block>
                  <MonitorPlay className="h-5 w-5" strokeWidth={2.6} />
                  TV DISPLAY
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Counters — colour-blocked cells */}
          <motion.dl
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
            className="mt-12 grid grid-cols-2 sm:grid-cols-4"
          >
            {[
              { label: "GRADUATES", value: TOTAL_GRADUATES, bg: "#2563eb", fg: "#fff" },
              { label: "DEPARTMENTS", value: DEPARTMENTS.length, bg: "#ec4899", fg: "#fff" },
              { label: "CHECKED IN", value: 1519, bg: "#f59e0b", fg: "#14100e" },
              { label: "PHOTOS", value: 1052, bg: "#10b981", fg: "#14100e" },
            ].map((s, i) => (
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
        </div>
      </section>

      {/* ── Capabilities ───────────────────────────────────── */}
      <section className="rule-t bg-paper-2 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="stencil text-[10.5px] text-pop">THIRTEEN SCREENS / ONE SYSTEM</p>
              <h2 className="headline mt-2 text-[clamp(2rem,6vw,3.75rem)] text-ink">
                EVERY STATION,
                <br />
                CONNECTED
              </h2>
            </div>
            <p className="max-w-sm text-[13.5px] leading-relaxed text-ink-2 text-pretty">
              A graduate scans once at the gate and the whole ceremony knows where they are — through
              stage, booth, lunch and certificate collection.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: (i % 4) * 0.06, duration: 0.45, ease: EASE }}
              >
                <Link href={c.href} className="press tap flex h-full flex-col bg-paper rule drop-2">
                  <div
                    className="flex items-center justify-between rule-b px-3 py-2.5"
                    style={{ backgroundColor: c.color }}
                  >
                    <c.icon className="h-5 w-5 text-white" strokeWidth={2.6} />
                    <ArrowRight className="h-4 w-4 text-white" strokeWidth={3} />
                  </div>
                  <div className="flex flex-1 flex-col p-3.5">
                    <h3 className="headline text-[16px] text-ink">{c.title}</h3>
                    <p className="mt-2 flex-1 text-[12.5px] leading-relaxed text-ink-3 text-pretty">
                      {c.body}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Departments ────────────────────────────────────── */}
      <section className="rule-t px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 rule-b pb-3">
            <h2 className="headline text-[clamp(2rem,6vw,3.75rem)] text-ink">THE CLASS OF 2026</h2>
            <p className="stencil mt-2 text-[10px] text-ink-3">
              {formatNumber(TOTAL_GRADUATES)} GRADUATES / {DEPARTMENTS.length} DEPARTMENTS
            </p>
          </div>

          <ul>
            {DEPARTMENTS.map((d, i) => (
              <motion.li
                key={d.code}
                initial={{ opacity: 0, x: -14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, duration: 0.4, ease: EASE }}
                className="group flex items-center gap-3 rule-b py-3.5 transition-colors hover:bg-paper-2 sm:gap-5"
              >
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rule text-[11px] font-black text-white sm:h-12 sm:w-12"
                  style={{ backgroundColor: d.color }}
                >
                  {d.code}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold text-ink sm:text-[16px]">{d.name}</p>
                  <p className="stencil mt-0.5 text-[9px] text-ink-3">B.TECH / 2022–2026</p>
                </div>
                <div className="hidden h-4 w-48 rule bg-paper sm:block">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(d.total / DEPARTMENTS[0].total) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 + i * 0.04, duration: 0.7, ease: EASE }}
                    className="h-full"
                    style={{ backgroundColor: d.color }}
                  />
                </div>
                <span className="figure w-14 shrink-0 text-right text-[20px] text-ink">{d.total}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Closing ────────────────────────────────────────── */}
      <section className="rule-t bg-[rgb(var(--ink))] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <p className="stencil text-[10.5px] text-warn">{EVENT.venue.toUpperCase()}</p>
          <h2 className="headline mt-4 text-[clamp(2.25rem,8vw,5.5rem)] text-[rgb(var(--paper))]">
            BUILT FOR THE ONE DAY
            <br />
            THAT <span className="bg-pop px-2 text-white">CANNOT</span> GO WRONG
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-[14.5px] leading-relaxed text-[rgb(var(--paper))]/60 text-pretty">
            Offline-tolerant scanning, live queue visibility on every screen, and a record of every
            graduate&rsquo;s journey through the ceremony.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-2.5 sm:flex-row">
            <Link href="/dashboard">
              <Button size="xl" variant="pop" block className="sm:w-auto">
                ENTER THE CONSOLE
                <ArrowRight className="h-5 w-5" strokeWidth={3} />
              </Button>
            </Link>
            <Link href="/students">
              <Button
                size="xl"
                block
                className="border-[rgb(var(--paper))] bg-transparent text-[rgb(var(--paper))] shadow-none hover:bg-[rgb(var(--paper))] hover:text-[rgb(var(--ink))] sm:w-auto"
              >
                BROWSE GRADUATES
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="rule-t px-4 py-6 text-center sm:px-6">
        <p className="stencil text-[9.5px] text-ink-3">
          {EVENT.college} / {EVENT.tagline} / INTERFACE PROTOTYPE WITH REPRESENTATIVE DATA
        </p>
      </footer>
    </div>
  );
}
