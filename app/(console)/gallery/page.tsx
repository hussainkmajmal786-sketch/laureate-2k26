"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Heart, ImageOff, Maximize2, Share2, X } from "lucide-react";
import { Page, PageHeader } from "@/components/shell/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Segmented, Select } from "@/components/ui/input";
import { EmptyState, Skeleton, useToast } from "@/components/ui/feedback";
import { StatTile } from "@/components/kpi-card";
import { DEPARTMENTS, getMedia, type MediaItem } from "@/lib/data";

const PHOTOGRAPHERS = ["Arun Photography", "Frames by Nithin", "CEK Media Cell", "Studio Aperture", "Lensfolk Kerala"];
const PIGMENTS = ["#2563eb", "#ec4899", "#f59e0b", "#10b981", "#6d28d9", "#f97316", "#06b6d4", "#84cc16"];

const pigment = (hue: number) => PIGMENTS[hue % PIGMENTS.length];

export default function GalleryPage() {
  const all = React.useMemo(() => getMedia(), []);
  const [loading, setLoading] = React.useState(true);
  const [cat, setCat] = React.useState<"All" | MediaItem["category"]>("All");
  const [dept, setDept] = React.useState("all");
  const [shooter, setShooter] = React.useState("all");
  const [active, setActive] = React.useState<MediaItem | null>(null);
  const [liked, setLiked] = React.useState<Set<string>>(new Set());
  const { push } = useToast();

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  const items = all.filter((m) => {
    if (cat !== "All" && m.category !== cat) return false;
    if (dept !== "all" && m.dept !== dept) return false;
    if (shooter !== "all" && m.photographer !== shooter) return false;
    return true;
  });

  const toggleLike = (id: string) =>
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Page wide>
      <PageHeader
        title="GALLERY"
        description="Every frame from every photographer, indexed by graduate, branch and session."
        actions={
          <Button
            variant="secondary"
            size="md"
            onClick={() => push({ title: "PREPARING ARCHIVE", description: `${items.length} photos`, tone: "info" })}
          >
            <Download className="h-4 w-4" strokeWidth={2.6} />
            DOWNLOAD ALL
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatTile label="TOTAL PHOTOS" value={1052} sub="Stage and booth" tone="accent" />
        <StatTile label="BOOTH SESSIONS" value={791} sub="Complete sets" tone="ok" />
        <StatTile label="PHOTOGRAPHERS" value={5} sub="On assignment" tone="pop" />
        <StatTile label="SYNCED" value="100%" sub="No pending uploads" tone="ok" />
      </div>

      <Card className="mb-3">
        <div className="flex flex-col gap-2.5 p-3.5 lg:flex-row lg:items-center lg:justify-between">
          <Segmented
            value={cat}
            onChange={setCat}
            options={[
              { value: "All", label: "ALL" },
              { value: "Stage", label: "STAGE" },
              { value: "Booth", label: "BOOTH" },
              { value: "Candid", label: "CANDID" },
              { value: "Group", label: "GROUP" },
            ]}
          />
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Select
              value={dept}
              onChange={setDept}
              aria-label="Filter by department"
              className="w-full sm:w-40"
              options={[
                { value: "all", label: "ALL DEPARTMENTS" },
                ...DEPARTMENTS.map((d) => ({ value: d.code, label: d.code })),
              ]}
            />
            <Select
              value={shooter}
              onChange={setShooter}
              aria-label="Filter by photographer"
              className="w-full sm:w-52"
              options={[
                { value: "all", label: "ALL PHOTOGRAPHERS" },
                ...PHOTOGRAPHERS.map((p) => ({ value: p, label: p.toUpperCase() })),
              ]}
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="columns-2 gap-3 md:columns-3 xl:columns-4 [&>*]:mb-3">
          {[0.8, 1.2, 1, 1.4, 0.9, 1.1, 1.3, 0.85, 1.15, 1, 1.25, 0.95].map((r, i) => (
            <Skeleton key={i} className="w-full" style={{ aspectRatio: `1 / ${r}` }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={ImageOff}
            title="NO PHOTOS MATCH"
            description="Nothing in the archive matches these filters yet. Try a different category or photographer."
            action={
              <Button variant="secondary" size="sm" onClick={() => { setCat("All"); setDept("all"); setShooter("all"); }}>
                CLEAR FILTERS
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="columns-2 gap-3 md:columns-3 xl:columns-4 [&>*]:mb-3">
          {items.map((m, i) => (
            <motion.figure
              key={m.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.4), duration: 0.35, ease: [0.2, 0, 0, 1] }}
              onClick={() => setActive(m)}
              className="press tap group relative block w-full cursor-pointer break-inside-avoid overflow-hidden rule drop-2"
              style={{ aspectRatio: `1 / ${m.ratio}`, backgroundColor: pigment(m.hue) }}
            >
              {/* Halftone texture */}
              <span
                className="absolute inset-0 opacity-25"
                style={{
                  backgroundImage: "radial-gradient(#fff 1.6px, transparent 1.7px)",
                  backgroundSize: "9px 9px",
                }}
              />

              <span className="absolute top-2 left-2">
                <Badge tone="ink" size="sm">{m.category.toUpperCase()}</Badge>
              </span>

              <button
                onClick={(e) => { e.stopPropagation(); toggleLike(m.id); }}
                aria-label="Like"
                className="tap absolute top-2 right-2 grid h-8 w-8 place-items-center rule bg-paper opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                <Heart className={`h-4 w-4 ${liked.has(m.id) ? "fill-pop text-pop" : "text-ink"}`} strokeWidth={2.6} />
              </button>

              <figcaption className="absolute inset-x-0 bottom-0 translate-y-full bg-[rgb(var(--ink))] px-2.5 py-2 transition-transform duration-200 group-hover:translate-y-0">
                <p className="truncate text-[12.5px] font-bold text-[rgb(var(--paper))]">{m.title}</p>
                <p className="stencil mt-0.5 truncate text-[8.5px] text-[rgb(var(--paper))]/60">
                  {m.dept} / {m.photographer} / {m.time}
                </p>
              </figcaption>

              <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity group-hover:opacity-100">
                <span className="grid h-11 w-11 place-items-center rule bg-paper">
                  <Maximize2 className="h-4.5 w-4.5 text-ink" strokeWidth={2.6} />
                </span>
              </span>
            </motion.figure>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {active && (
          <div className="fixed inset-0 z-100 grid place-items-center p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActive(null)}
              className="halftone absolute inset-0 bg-[rgb(var(--ink))]/80"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, rotate: -1 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              className="relative flex max-h-[90dvh] w-full max-w-4xl flex-col bg-paper rule-thick drop-4 lg:flex-row"
            >
              <div
                className="relative min-h-[220px] flex-1 lg:min-h-[500px]"
                style={{ backgroundColor: pigment(active.hue) }}
              >
                <span
                  className="absolute inset-0 opacity-25"
                  style={{
                    backgroundImage: "radial-gradient(#fff 2px, transparent 2.1px)",
                    backgroundSize: "12px 12px",
                  }}
                />
              </div>

              <div className="flex w-full shrink-0 flex-col rule-l lg:w-72">
                <div className="flex items-start justify-between gap-3 rule-b bg-paper-2 p-4">
                  <div className="min-w-0">
                    <Badge tone="pop" size="sm">{active.category.toUpperCase()}</Badge>
                    <h2 className="headline mt-2 text-[19px] text-ink text-balance">{active.title}</h2>
                  </div>
                  <button
                    onClick={() => setActive(null)}
                    aria-label="Close"
                    className="tap grid h-8 w-8 shrink-0 place-items-center rule bg-paper text-ink"
                  >
                    <X className="h-4 w-4" strokeWidth={3} />
                  </button>
                </div>

                <dl className="flex-1 p-4">
                  {[
                    ["DEPARTMENT", DEPARTMENTS.find((d) => d.code === active.dept)?.short ?? active.dept],
                    ["PHOTOGRAPHER", active.photographer],
                    ["CAPTURED", active.time],
                    ["LIKES", String(active.likes + (liked.has(active.id) ? 1 : 0))],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-baseline justify-between gap-3 py-2 not-last:rule-b">
                      <dt className="stencil text-[9px] text-ink-3">{k}</dt>
                      <dd className="text-right text-[12.5px] font-bold text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>

                <div className="flex gap-2 rule-t p-3">
                  <Button
                    block
                    onClick={() => push({ title: "DOWNLOAD STARTED", description: `${active.id}.jpg`, tone: "ok" })}
                  >
                    <Download className="h-4 w-4" strokeWidth={2.6} />
                    SAVE
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    aria-label="Share"
                    onClick={() => push({ title: "LINK COPIED", tone: "info" })}
                  >
                    <Share2 className="h-4 w-4" strokeWidth={2.6} />
                  </Button>
                  <Button variant="secondary" size="icon" aria-label="Like" onClick={() => toggleLike(active.id)}>
                    <Heart className={`h-4 w-4 ${liked.has(active.id) ? "fill-pop text-pop" : ""}`} strokeWidth={2.6} />
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Page>
  );
}
