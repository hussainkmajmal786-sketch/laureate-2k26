"use client";

import { MonitorPlay } from "lucide-react";

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
        return `https://www.youtube.com/embed/${url.pathname.split("/")[2]}`;
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
        <div className="relative aspect-video bg-ink-black">
          <iframe
            src={embed}
            title="Laureate 2K26 live ceremony stream"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
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
