"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Heart, ImageOff, Maximize2, Share2, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Segmented, Select } from "@/components/ui/input";
import { EmptyState, useToast } from "@/components/ui/feedback";
import type { DepartmentRow, MediaRow } from "@/lib/supabase/types";

export function GalleryGrid({
  media,
  departments,
  photographers,
  filters,
}: {
  media: MediaRow[];
  departments: DepartmentRow[];
  photographers: string[];
  filters: { cat: string; dept: string; by: string };
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [active, setActive] = React.useState<MediaRow | null>(null);
  const [liked, setLiked] = React.useState<Set<string>>(new Set());
  const { push } = useToast();

  const setParam = (updates: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (!v || v === "all") next.delete(k);
      else next.set(k, v);
    }
    router.push(`/gallery?${next.toString()}`);
  };

  const toggleLike = (id: string) =>
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <>
      <Card className="mb-4">
        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <Segmented
            value={filters.cat}
            onChange={(v) => setParam({ cat: v })}
            options={[
              { value: "all", label: "All" },
              { value: "Stage", label: "Stage" },
              { value: "Booth", label: "Booth" },
              { value: "Candid", label: "Candid" },
              { value: "Group", label: "Group" },
            ]} />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Select
              value={filters.dept}
              onChange={(v) => setParam({ dept: v })} aria-label="Filter by department"
              className="w-full sm:w-48"
              options={[
                { value: "all", label: "All departments" },
                ...departments.map((d) => ({ value: d.code, label: d.short })),
              ]} />
            <Select
              value={filters.by}
              onChange={(v) => setParam({ by: v })} aria-label="Filter by photographer"
              className="w-full sm:w-52"
              options={[
                { value: "all", label: "All photographers" },
                ...photographers.map((p) => ({ value: p, label: p })),
              ]} />
          </div>
        </div>
      </Card>

      {media.length === 0 ? (
        <Card>
          <EmptyState
            icon={ImageOff} title="No photos match" description="Nothing in the archive matches these filters yet. Try a different category or photographer."
            action={
              <Button variant="secondary" size="sm" onClick={() => router.push("/gallery")}>
                Clear filters
              </Button>
            } />
        </Card>
      ) : (
        <div className="columns-2 gap-4 md:columns-3 xl:columns-4 [&>*]:mb-4">
          {media.map((m, i) => (
            <motion.figure
              key={m.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.025, 0.5), duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => setActive(m)}
              className="press tap group relative block w-full cursor-pointer break-inside-avoid overflow-hidden  rule drop-1 hover:drop-3"
              style={{
                aspectRatio: `1 / ${Number(m.ratio) || 1}`,
                backgroundImage: `linear-gradient(145deg, hsl(${m.hue} 70% 58%), hsl(${(m.hue + 45) % 360} 66% 38%))`,
              }} >
              <span
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "radial-gradient(130% 90% at 22% 8%, rgba(255,255,255,0.6), transparent 62%)",
                }} />
              <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <span className="absolute top-3 left-3">
                <Badge tone="glass" size="sm">{m.category}</Badge>
              </span>

              <button
                onClick={(e) => { e.stopPropagation(); toggleLike(m.id); }} aria-label="Like"
                className="tap glass absolute top-3 right-3 grid h-8 w-8 place-items-center  opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-visible:opacity-100" >
                <Heart className={`h-4 w-4 ${liked.has(m.id) ? "fill-rose-400 text-rose-400" : "text-white"}`} />
              </button>

              <figcaption className="absolute inset-x-0 bottom-0 translate-y-2 p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <p className="truncate text-[13.5px] font-semibold text-white">{m.title}</p>
                <p className="mt-0.5 truncate text-[11.5px] text-white/70">
                  {m.dept_code} · {m.photographer}
                </p>
              </figcaption>

              <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <span className="glass grid h-11 w-11 place-items-center ">
                  <Maximize2 className="h-4.5 w-4.5 text-white" />
                </span>
              </span>
            </motion.figure>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {active && (
          <div className="fixed inset-0 z-100 grid place-items-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActive(null)}
              className="absolute inset-0 bg-black/75 backdrop-blur-xl" />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
              className="bg-paper rule drop-3 relative flex max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden drop-4 lg:flex-row" >
              <div
                className="grain relative min-h-[240px] flex-1 lg:min-h-[520px]"
                style={{
                  backgroundImage: `linear-gradient(145deg, hsl(${active.hue} 70% 58%), hsl(${(active.hue + 45) % 360} 66% 38%))`,
                }} >
                <span
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage:
                      "radial-gradient(130% 90% at 22% 8%, rgba(255,255,255,0.6), transparent 62%)",
                  }} />
              </div>

              <div className="flex w-full shrink-0 flex-col lg:w-80">
                <div className="flex items-start justify-between gap-3 border-b border-[rgb(var(--rule))] p-5">
                  <div className="min-w-0">
                    <Badge tone="accent" size="sm">{active.category}</Badge>
                    <h2 className="mt-2.5 text-lg font-bold tracking-[-0.025em] text-ink text-balance">
                      {active.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => setActive(null)} aria-label="Close"
                    className="tap grid h-8 w-8 shrink-0 place-items-center  text-ink-3 hover:bg-paper-2 hover:text-ink" >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <dl className="flex-1 space-y-3.5 p-5">
                  {[
                    ["Department", departments.find((d) => d.code === active.dept_code)?.short ?? active.dept_code ?? "—"],
                    ["Photographer", active.photographer],
                    ["Captured", new Date(active.captured_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })],
                    ["Likes", String(active.likes + (liked.has(active.id) ? 1 : 0))],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-baseline justify-between gap-3">
                      <dt className="text-[12.5px] text-ink-3">{k}</dt>
                      <dd className="text-right text-[13px] font-medium text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>

                <div className="flex gap-2 border-t border-[rgb(var(--rule))] p-4">
                  <Button
                    block
                    onClick={() => push({ title: "Download started", description: active.title, tone: "ok" })} >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="secondary" size="icon" aria-label="Share"
                    onClick={() => push({ title: "Link copied", tone: "info" })} >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button variant="secondary" size="icon" aria-label="Like" onClick={() => toggleLike(active.id)}>
                    <Heart className={`h-4 w-4 ${liked.has(active.id) ? "fill-rose-500 text-rose-500" : ""}`} />
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
