"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { ANNOUNCEMENTS, EVENT, getBooths, TOTAL_GRADUATES } from "@/lib/data";
import { formatNumber } from "@/lib/utils";

const BOOTH_COLOR = ["#2563eb", "#f59e0b"];

/**
 * TV Mode — for a 1080p/4K screen in the holding area, read at distance.
 * Everything is oversized, flat and high-contrast: no gradients, no blur.
 * Permanently dark, because a bright board in a dim hall washes out.
 */
export default function DisplayPage() {
  const booths = React.useMemo(() => getBooths(), []);
  const [now, setNow] = React.useState<Date | null>(null);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    setNow(new Date());
    const clock = setInterval(() => setNow(new Date()), 1000);
    // Rotate the "now serving" name so the board visibly advances.
    const rotate = setInterval(() => setTick((t) => t + 1), 7000);
    return () => {
      clearInterval(clock);
      clearInterval(rotate);
    };
  }, []);

  const progress = 51;

  return (
    <div className="grain relative flex min-h-dvh flex-col bg-[#0f0e14] text-white">
      <Link
        href="/queue"
        className="stencil absolute top-4 right-4 z-30 flex items-center gap-2 border-2 border-white/25 px-3 py-2 text-[10px] text-white/40 opacity-0 transition-opacity hover:border-white hover:text-white focus-visible:opacity-100 lg:hover:opacity-100"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={3} />
        EXIT
      </Link>

      {/* ── Header ────────────────────────────────────────── */}
      <header className="flex items-center justify-between border-b-4 border-white px-6 py-5 lg:px-12 lg:py-6">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center bg-pop lg:h-16 lg:w-16">
            <GraduationCap className="h-7 w-7 text-white lg:h-8 lg:w-8" strokeWidth={2.6} />
          </span>
          <div>
            <p className="headline text-[28px] leading-none lg:text-[38px]">
              LAUREATE <span className="text-pop">2K26</span>
            </p>
            <p className="stencil mt-1.5 text-[10px] text-white/45 lg:text-[12px]">{EVENT.college}</p>
          </div>
        </div>

        <div className="text-right">
          <p className="figure text-[40px] leading-none tabular-nums lg:text-[72px]">
            {now ? now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
          </p>
          <p className="stencil mt-1.5 text-[10px] text-white/45 lg:text-[12px]">
            {now
              ? now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()
              : EVENT.date.toUpperCase()}
          </p>
        </div>
      </header>

      {/* ── Now serving ───────────────────────────────────── */}
      <main className="flex flex-1 flex-col justify-center px-6 py-6 lg:px-12">
        <div className="mb-5 flex items-center gap-4 lg:mb-8">
          <span className="animate-blink h-5 w-5 bg-ok lg:h-6 lg:w-6" />
          <h1 className="headline text-[clamp(2rem,5vw,4rem)] text-white">NOW SERVING</h1>
          <span className="h-1 flex-1 bg-white/25" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
          {booths.map((b, i) => {
            const pool = [b.current, ...b.queue.map((q) => q.student)].filter(Boolean);
            const person = pool[(tick + i) % pool.length]!;
            const tokenNum = (Number(b.currentToken.split("-")[1]) + tick) % 999;
            const token = `B${b.id}-${String(tokenNum).padStart(3, "0")}`;

            return (
              <motion.section
                key={b.id}
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: [0.2, 0, 0, 1] }}
                className="border-4 border-white bg-white/[0.03]"
              >
                <div
                  className="flex items-center justify-between border-b-4 border-white px-5 py-3"
                  style={{ backgroundColor: BOOTH_COLOR[i] }}
                >
                  <p className="headline text-[clamp(1.5rem,3vw,2.5rem)] text-white">BOOTH {b.id}</p>
                  <span className="stencil flex items-center gap-2 border-2 border-white px-2.5 py-1.5 text-[11px] text-white lg:text-[13px]">
                    <span className="animate-blink h-2.5 w-2.5 bg-white" />
                    LIVE
                  </span>
                </div>

                <div className="px-5 py-6 lg:px-7 lg:py-8">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${b.id}-${tick}`}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
                    >
                      <p className="headline text-[clamp(2rem,5vw,4.5rem)] text-white text-balance">
                        {person.name}
                      </p>
                      <p className="mt-3 font-mono text-[clamp(1rem,1.6vw,1.5rem)] tracking-widest text-white/50">
                        {person.regNo}
                      </p>
                      <p className="stencil mt-2 text-[clamp(0.75rem,1.2vw,1rem)] text-white/60">
                        {person.deptName}
                      </p>

                      <div className="mt-7 flex items-end justify-between border-t-4 border-white/20 pt-5">
                        <div>
                          <p className="stencil text-[10px] text-white/40 lg:text-[12px]">TOKEN</p>
                          <p
                            className="figure mt-1.5 font-mono text-[clamp(2.25rem,5vw,4.5rem)] leading-none"
                            style={{ color: BOOTH_COLOR[i] }}
                          >
                            {token}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="stencil text-[10px] text-white/40 lg:text-[12px]">WAITING</p>
                          <p className="figure mt-1.5 text-[clamp(2.25rem,5vw,4.5rem)] leading-none text-white">
                            {b.queue.length}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Up next strip */}
                <div className="border-t-4 border-white px-5 py-3">
                  <p className="stencil text-[10px] text-white/40 lg:text-[12px]">UP NEXT</p>
                  <ol className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
                    {b.queue.slice(0, 4).map((q, n) => (
                      <li
                        key={q.token}
                        className="flex items-baseline gap-2 text-[clamp(0.85rem,1.3vw,1.15rem)] font-bold text-white/70"
                      >
                        <span className="font-mono text-white/30">{n + 1}.</span>
                        {q.student.name}
                      </li>
                    ))}
                  </ol>
                </div>
              </motion.section>
            );
          })}
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="border-t-4 border-white">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 px-6 py-4 lg:px-12">
          <div className="flex items-center gap-3">
            <span className="stencil text-[10px] text-white/45 lg:text-[12px]">CEREMONY PROGRESS</span>
            <div className="h-5 w-40 border-2 border-white lg:w-64">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.3, ease: [0.2, 0, 0, 1] }}
                className="h-full bg-ok"
              />
            </div>
            <span className="figure text-[18px] text-white lg:text-[22px]">{progress}%</span>
          </div>

          <div className="stencil flex items-center gap-6 text-[10px] text-white/45 lg:text-[12px]">
            <span>
              <span className="figure text-[16px] text-white lg:text-[20px]">1,052</span> CROSSED THE STAGE
            </span>
            <span className="hidden sm:inline">
              <span className="figure text-[16px] text-white lg:text-[20px]">
                {formatNumber(TOTAL_GRADUATES)}
              </span>{" "}
              GRADUATES
            </span>
          </div>
        </div>

        {/* Ticker */}
        <div className="overflow-hidden border-t-4 border-white bg-pop py-2.5">
          <div className="animate-ticker flex w-max gap-14 whitespace-nowrap will-change-transform">
            {[...ANNOUNCEMENTS, ...ANNOUNCEMENTS].map((a, i) => (
              <span
                key={i}
                className="flex items-center gap-3.5 text-[clamp(0.9rem,1.25vw,1.15rem)] font-bold text-white"
              >
                <span className="h-2.5 w-2.5 shrink-0 bg-white" />
                {a}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
