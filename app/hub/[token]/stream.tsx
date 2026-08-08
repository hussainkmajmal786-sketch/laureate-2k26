"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, MonitorPlay } from "lucide-react";

/**
 * Embeds the ceremony live stream.
 *
 * Accepts a normal YouTube or Facebook URL as pasted in Settings and
 * converts it to the embeddable form, so an admin never has to hunt for
 * an "embed link".
 */
function toEmbedUrl(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return `https://www.youtube.com/embed/${url.pathname.slice(1)}`;
    }
    if (host.endsWith("youtube.com")) {
      if (url.pathname === "/watch") {
        const v = url.searchParams.get("v");
        return v ? `https://www.youtube.com/embed/${v}` : null;
      }
      if (url.pathname.startsWith("/live/")) {
        const id = url.pathname.split("/")[2];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (url.pathname.startsWith("/embed/")) return url.toString();
      return null;
    }
    if (host.endsWith("facebook.com") || host === "fb.watch") {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
        raw,
      )}&show_text=false`;
    }
    return null;
  } catch {
    return null;
  }
}

export function StreamPlayer({ url, live }: { url: string | null; live: boolean }) {
  const embed = url ? toEmbedUrl(url) : null;
  const router = useRouter();

  /*
   * Graduates open their hub from a printed card, often well before the
   * ceremony starts. Without this the page would sit on "STREAM NOT
   * STARTED" until they thought to reload, so poll until a stream
   * appears - then stop, because reloading around a playing iframe would
   * interrupt it.
   */
  React.useEffect(() => {
    if (embed) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 60_000);
    return () => clearInterval(id);
  }, [embed, router]);

  return (
    <section className="mt-4 overflow-hidden bg-paper rule drop-2">
      <div className="flex items-center justify-between rule-b bg-pop px-4 py-2.5">
        <span className="stencil text-[10px] text-white">LIVE CEREMONY STREAM</span>
        {live ? (
          <span className="stencil inline-flex items-center gap-1.5 text-[9px] text-white">
            <span className="animate-blink h-2 w-2 bg-white" />
            LIVE NOW
          </span>
        ) : (
          <span className="stencil text-[9px] text-white/70">OFFLINE</span>
        )}
      </div>

      {embed ? (
        <>
          <div className="relative aspect-video bg-ink-black">
            <iframe
              src={embed}
              title="Laureate 2K26 live ceremony stream"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
          {/*
            Embeds are blocked inside some in-app browsers and on networks
            that filter iframes, which would leave a black box with no way
            out on the one day it matters.
          */}
          <a
            href={url ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 rule-t px-4 py-2 text-[11px] text-ink-2 underline-offset-2 hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.4} />
            Video not playing? Open it on YouTube
          </a>
        </>
      ) : (
        <div className="grid min-h-48 place-items-center bg-ink-black p-8 text-center">
          <div>
            <MonitorPlay className="mx-auto h-10 w-10 text-pop" strokeWidth={1.8} />
            <p className="headline mt-3 text-[22px] text-white">
              {url ? "STREAM LINK NOT RECOGNISED" : "STREAM NOT STARTED"}
            </p>
            <p className="mt-2 text-[12px] text-white/50">
              {url
                ? "Paste a YouTube or Facebook video link in Settings."
                : "The official ceremony stream will appear here once it begins."}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
