"use client";
/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import { Download, ExternalLink, Images, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HubPhoto {
  id: string;
  title: string;
  category: string;
  hue: number;
  captured_at: string;
  drive_view_url: string | null;
  drive_thumb_url: string | null;
}

/**
 * The graduate's own photos. Files live in Google Drive; the database is
 * what decides which files are theirs, so this list can never show anyone
 * else's pictures.
 */
export function HubGallery({ photos, name }: { photos: HubPhoto[]; name: string }) {
  const [active, setActive] = React.useState<HubPhoto | null>(null);

  return (
    <section className="mt-4 bg-paper rule drop-2 p-5">
      <div className="flex items-end justify-between">
        <div>
          <p className="stencil text-[9.5px] text-pop">YOUR ARCHIVE</p>
          <h2 className="headline mt-1.5 text-[24px] text-ink">PHOTOS OF YOU</h2>
        </div>
        <span className="figure text-[26px] text-ink">{photos.length}</span>
      </div>

      {photos.length === 0 ? (
        <p className="mt-4 bg-paper-2 rule p-8 text-center text-[13px] text-ink-3">
          Photos appear here once the photographer&rsquo;s card has been imported. This usually
          happens shortly after the ceremony — your link keeps working, so check back any time.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {photos.map((p) => (
            <button
              key={p.id}
              onClick={() => setActive(p)}
              className="press-sm group relative aspect-square overflow-hidden rule bg-paper-2"
            >
              {p.drive_thumb_url ? (
                <img
                  src={p.drive_thumb_url}
                  alt={`${name} — ${p.category}`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  className="grid h-full w-full place-items-center"
                  style={{ backgroundColor: `hsl(${p.hue} 65% 55%)` }}
                >
                  <Images className="h-6 w-6 text-white" />
                </span>
              )}
              <span className="stencil absolute inset-x-0 bottom-0 bg-[rgb(var(--ink))] px-1.5 py-1 text-[8px] text-[rgb(var(--paper))]">
                {p.category.toUpperCase()}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {active && (
        <div className="fixed inset-0 z-100 grid place-items-center p-4">
          <div
            className="halftone absolute inset-0 bg-[rgb(var(--ink))]/80"
            onClick={() => setActive(null)}
          />
          <div className="relative w-full max-w-2xl bg-paper rule-thick drop-4">
            <div className="flex items-center justify-between rule-b bg-pop px-4 py-2.5">
              <span className="stencil text-[10px] text-white">{active.category.toUpperCase()}</span>
              <button
                onClick={() => setActive(null)}
                aria-label="Close"
                className="grid h-7 w-7 place-items-center rule border-white text-white"
              >
                <X className="h-4 w-4" strokeWidth={3} />
              </button>
            </div>

            {active.drive_thumb_url ? (
              <img
                src={active.drive_thumb_url}
                alt={`${name} — ${active.category}`}
                className="max-h-[65dvh] w-full bg-ink-black object-contain"
              />
            ) : (
              <div className="grid h-64 place-items-center bg-paper-2">
                <Images className="h-10 w-10 text-ink-3" />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 rule-t p-3.5">
              <Badge tone="neutral" size="sm">
                {new Date(active.captured_at).toLocaleString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "numeric",
                  month: "short",
                })}
              </Badge>
              {active.drive_view_url && (
                <>
                  <a href={active.drive_view_url} target="_blank" rel="noreferrer" className="ml-auto">
                    <span className="stencil inline-flex items-center gap-1.5 rule bg-paper px-3 py-2 text-[9.5px] text-ink drop-1">
                      <ExternalLink className="h-3.5 w-3.5" />
                      OPEN IN DRIVE
                    </span>
                  </a>
                  <a
                    href={active.drive_view_url.replace("/view", "").replace("/file/d/", "/uc?export=download&id=")}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="stencil inline-flex items-center gap-1.5 rule bg-pop px-3 py-2 text-[9.5px] text-white drop-1">
                      <Download className="h-3.5 w-3.5" />
                      DOWNLOAD
                    </span>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
