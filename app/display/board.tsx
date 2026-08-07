"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, GraduationCap, Radio } from "lucide-react";
import { useRealtimeRefresh } from "@/lib/use-realtime";
import type { BoothStatus } from "@/lib/supabase/types";

interface QueueRow {
  id: string;
  booth_id: number;
  token: string;
  position: number;
  student: { id: string; name: string; reg_no: string; hue: number; dept_code: string };
}

/* Booth accents, checked against the #151A2B panel: 6.99:1 and 10.77:1. */
const TINT = ["#7DA2FF", "#FFC24D"];

/**
 * TV Mode — for a 1080p/4K screen in the holding area, read at distance.
 * Permanently dark: a bright board in a dim hall washes out. Updates live
 * via Postgres change events, so no operator has to refresh it.
 */
export function DisplayBoard({
  booths,
  queue,
  announcements,
  college,
  eventDate,
}: {
  booths: BoothStatus[];
  queue: QueueRow[];
  announcements: string[];
  college: string;
  eventDate: string;
}) {
  const [now, setNow] = React.useState<Date | null>(null);

  useRealtimeRefresh(["booth_queue", "booths"], 600);

  React.useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const totalWaiting = booths.reduce((s, b) => s + (b.waiting ?? 0), 0);

  return (
    <div className="grain relative min-h-dvh overflow-hidden bg-[#0B0D14] text-white">
      <div className="animate-bob absolute -top-1/4 left-0 h-[70vh] w-[70vh]  bg-[#3B4FD8]/20 blur-[130px]" />
      <div className="animate-bob absolute -right-1/4 bottom-0 h-[60vh] w-[60vh]  bg-[#7C3AED]/16 blur-[120px]" />

      <Link href="/queue"
        className="absolute top-6 right-6 z-30 flex items-center gap-2  bg-[#1A2036] px-4 py-2 text-sm text-[#9AA8C7] opacity-0 backdrop-blur-sm transition-opacity hover:bg-[#2A3350] hover:text-white focus-visible:opacity-100 lg:hover:opacity-100" >
        <ArrowLeft className="h-4 w-4" />
        Exit display
      </Link>

      <div className="relative z-10 flex min-h-dvh flex-col">
        <header className="flex items-center justify-between px-8 py-7 lg:px-14 lg:py-9">
          <div className="flex items-center gap-4 lg:gap-5">
            <span className="grid h-14 w-14 place-items-center  bg-[#232B44] lg:h-16 lg:w-16">
              <GraduationCap className="h-7 w-7 lg:h-8 lg:w-8" strokeWidth={2} />
            </span>
            <div>
              <p className="text-2xl leading-tight font-bold tracking-[-0.03em] lg:text-[32px]">
                Laureate{" "}
                <span className="bg-gradient-to-r from-[#7DA2FF] via-[#A78BFA] to-[#22D3EE] bg-clip-text text-transparent">
                  2K26
                </span>
              </p>
              <p className="text-sm text-[#9AA8C7] lg:text-base">{college}</p>
            </div>
          </div>

          <div className="text-right">
            <p className="figure text-4xl leading-none tabular-nums lg:text-[64px]">
              {now ? now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
            </p>
            <p className="mt-1.5 text-sm text-[#9AA8C7] lg:text-base">
              {now
                ? now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
                : eventDate}
            </p>
          </div>
        </header>

        <main className="flex flex-1 flex-col justify-center px-8 pb-6 lg:px-14">
          <h1 className="mb-6 flex items-center gap-4 text-[clamp(1.75rem,4vw,3.25rem)] leading-none font-bold tracking-[-0.04em] lg:mb-9">
            <span className="relative flex h-3.5 w-3.5 lg:h-4 lg:w-4">
              <span className="absolute inline-flex h-full w-full animate-ping  bg-[#4ADE80] opacity-70" />
              <span className="relative inline-flex h-full w-full  bg-[#4ADE80]" />
            </span>
            NOW SERVING
          </h1>

          <div className="grid gap-5 lg:grid-cols-2 lg:gap-8">
            {booths.map((b, i) => {
              const boothQueue = queue.filter((q) => q.booth_id === b.id);
              return (
                <motion.section
                  key={b.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="relative overflow-hidden rounded-[32px] border border-[#2A3350] bg-[#151A2B] p-7 lg:rounded-[40px] lg:p-10" >
                  <div
                    className="pointer-events-none absolute -top-24 -right-24 h-64 w-64  opacity-30 blur-3xl"
                    style={{ background: TINT[i % TINT.length] }} />

                  <div className="relative flex items-center justify-between">
                    <p className="text-[clamp(1.25rem,2.2vw,2rem)] font-bold tracking-[-0.03em] text-[#E8EDF9]">
                      Booth {b.id}
                    </p>
                    <span className="inline-flex items-center gap-2  bg-[#4ADE80]/15 px-3.5 py-1.5 text-sm font-medium text-[#4ADE80] lg:text-base">
                      <Radio className="h-4 w-4" />
                      Live
                    </span>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={b.current_token ?? "empty"}
                      initial={{ opacity: 0, y: 22 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -18 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} >
                      {b.current_name ? (
                        <>
                          <p className="mt-6 text-[clamp(2rem,4.6vw,4.25rem)] leading-[1.02] font-bold tracking-[-0.045em] text-balance lg:mt-9">
                            {b.current_name}
                          </p>
                          <p className="mt-3 font-mono text-[clamp(0.95rem,1.5vw,1.4rem)] tracking-wider text-[#9AA8C7]">
                            {b.current_reg_no}
                          </p>
                        </>
                      ) : (
                        <p className="mt-9 text-[clamp(1.5rem,3vw,2.5rem)] font-semibold text-[#8592B0]">
                          Awaiting next graduate
                        </p>
                      )}

                      <div className="mt-7 flex items-end justify-between lg:mt-10">
                        <div>
                          <p className="text-xs font-semibold tracking-[0.16em] text-[#9AA8C7] uppercase lg:text-sm">
                            Token
                          </p>
                          <p
                            className="figure mt-1 font-mono text-[clamp(2.25rem,5vw,4.5rem)] leading-none"
                            style={{ color: TINT[i % TINT.length] }} >
                            {b.current_token ?? "—"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold tracking-[0.16em] text-[#9AA8C7] uppercase lg:text-sm">
                            Waiting
                          </p>
                          <p className="figure mt-1 text-[clamp(2.25rem,5vw,4.5rem)] leading-none text-white">
                            {b.waiting ?? 0}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {boothQueue.length > 0 && (
                    <div className="relative mt-7 border-t border-[#2A3350] pt-5">
                      <p className="text-xs font-semibold tracking-[0.16em] text-[#9AA8C7] uppercase lg:text-sm">
                        Up next
                      </p>
                      <ol className="mt-2.5 flex flex-wrap gap-x-6 gap-y-1.5">
                        {boothQueue.slice(0, 4).map((q, n) => (
                          <li
                            key={q.id}
                            className="flex items-baseline gap-2 text-[clamp(0.9rem,1.3vw,1.2rem)] font-medium text-[#B9C4E0]" >
                            <span className="font-mono text-[#8592B0]">{n + 1}.</span>
                            {/* Falls back to the token when RLS hides the name. */}
                            {q.student?.name ?? q.token}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </motion.section>
              );
            })}
          </div>
        </main>

        <footer className="border-t border-[#2A3350] bg-[#080A10]">
          <div className="flex flex-wrap items-center gap-x-10 gap-y-3 px-8 py-4 lg:px-14 lg:py-5">
            <div className="flex items-center gap-6 text-sm text-[#9AA8C7] lg:text-base">
              <span>
                <span className="figure text-white">{totalWaiting}</span> waiting across{" "}
                {booths.length} booths
              </span>
              {booths.map((b) => (
                <span key={b.id} className="hidden sm:inline">
                  Booth {b.id}: <span className="figure text-white">{b.est_wait ?? 0}m</span>
                </span>
              ))}
            </div>
          </div>

          {announcements.length > 0 && (
            <div className="relative overflow-hidden border-t border-[#2A3350] py-3.5">
              <div className="animate-ticker flex w-max gap-16 whitespace-nowrap will-change-transform">
                {[...announcements, ...announcements].map((a, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-4 text-[clamp(0.9rem,1.25vw,1.15rem)] text-[#B9C4E0]" >
                    <span className="h-1.5 w-1.5 shrink-0  bg-[#FFC24D]" />
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}
