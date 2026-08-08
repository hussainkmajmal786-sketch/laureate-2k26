"use client";
/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import QRCode from "qrcode";
import Link from "next/link";
import { Download, ExternalLink, GraduationCap, QrCode, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deptColor } from "@/components/student-card";
import { quoteFor } from "@/lib/quotes";
import type { StudentRow } from "@/lib/supabase/types";

/**
 * Printable invitation pass.
 *
 * Layout is a ticket: a coloured masthead keyed to the department, the
 * graduate's name set large, a personal quote, then the QR on its own
 * white field with the register number beneath it as the human-readable
 * fallback for when a camera will not focus.
 *
 * The QR encodes a link to that graduate's ceremony hub, which doubles as
 * the badge every station scans.
 */
export function StudentQrCard({
  student,
  compact = false,
}: {
  student: StudentRow;
  compact?: boolean;
}) {
  const [src, setSrc] = React.useState("");
  const path = `/hub/${student.hub_token}`;
  const accent = deptColor(student.dept_code);
  const quote = quoteFor(student.reg_no);

  React.useEffect(() => {
    const url = `${window.location.origin}${path}`;
    QRCode.toDataURL(url, {
      margin: 1,
      width: compact ? 160 : 260,
      errorCorrectionLevel: "M",
      color: { dark: "#14100e", light: "#ffffff" },
    })
      .then(setSrc)
      .catch(() => setSrc(""));
  }, [path, compact]);

  const download = () => {
    if (!src) return;
    const link = document.createElement("a");
    link.href = src;
    link.download = `${student.reg_no}-qr.png`;
    link.click();
  };

  return (
    <div className="qr-print-card relative overflow-hidden bg-paper rule-thick drop-3">
      {/* ── Masthead ─────────────────────────────────────── */}
      <div className="relative rule-b px-4 py-3" style={{ backgroundColor: accent }}>
        <div className="flex items-center justify-between">
          <span className="stencil inline-flex items-center gap-2 text-[10px] text-white">
            <GraduationCap className="h-4 w-4" strokeWidth={2.6} />
            LAUREATE 2K26
          </span>
          <Badge tone="ink" size="sm">
            {student.dept_code}
          </Badge>
        </div>
        <p className="stencil mt-1.5 text-[8px] text-white/75">
          COLLEGE OF ENGINEERING KIDANGOOR
        </p>
      </div>

      {/* ── Name ─────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4 text-center">
        <p className="stencil text-[8.5px] text-ink-3">PRESENTED TO</p>
        <h2
          className={`headline mt-2 text-ink text-balance ${compact ? "text-[22px]" : "text-[30px]"}`}
        >
          {student.name}
        </h2>
        <p className="mt-2 font-mono text-[11.5px] tracking-wider text-ink-2">
          B.TECH · {student.batch}
        </p>
      </div>

      {/* ── Quote ────────────────────────────────────────── */}
      <div className="relative mx-5 mb-5 bg-paper-2 rule px-4 py-3.5">
        <Quote
          className="absolute -top-2 left-3 h-4 w-4 bg-paper-2 text-ink-3"
          strokeWidth={2.4}
        />
        <p className="text-center text-[12.5px] leading-relaxed font-medium text-ink text-pretty">
          &ldquo;{quote.text}&rdquo;
        </p>
        <p className="stencil mt-2 text-center text-[8px] text-ink-3">— {quote.author}</p>
      </div>

      {/* ── QR ───────────────────────────────────────────── */}
      <div className="flex flex-col items-center px-5 pb-5">
        <div className="grid place-items-center rule-thick bg-white p-2.5">
          {src ? (
            <img
              src={src}
              alt={`QR pass for ${student.name}`}
              className={compact ? "h-[140px] w-[140px]" : "h-[200px] w-[200px]"}
            />
          ) : (
            <div
              className={`grid animate-pulse place-items-center bg-paper-3 ${
                compact ? "h-[140px] w-[140px]" : "h-[200px] w-[200px]"
              }`}
            >
              <QrCode className="h-10 w-10 text-ink-3" />
            </div>
          )}
        </div>

        {/* Human-readable fallback when a camera won't focus */}
        <p className="mt-3 font-mono text-[15px] font-medium tracking-[0.18em] text-ink">
          {student.reg_no}
        </p>
        {/*
          Two captions, one shown at a time. The full sentence has room on
          screen; at 93mm it wraps to a third line and pushes the footer off
          the card, so print gets a version that says the same thing shorter
          rather than a clamped sentence cut mid-word.
        */}
        <p className="qr-caption-screen mt-1.5 max-w-[240px] text-center text-[11px] leading-snug text-ink-3">
          Scan to open your ceremony hub — stage status, booth queue and every photo of you today.
        </p>
        <p className="qr-caption-print mt-1.5 max-w-[240px] text-center text-[11px] leading-snug text-ink-3">
          Scan for your stage status, booth queue and photos.
        </p>

        {!compact && (
          <div className="mt-4 flex w-full flex-wrap justify-center gap-2">
            <Button size="sm" onClick={download} disabled={!src}>
              <Download className="h-3.5 w-3.5" strokeWidth={2.6} />
              DOWNLOAD QR
            </Button>
            <Link href={path} target="_blank">
              <Button size="sm" variant="secondary">
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.6} />
                OPEN HUB
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* ── Footer ───────────────────────────────────────── */}
      <div className="rule-t bg-[rgb(var(--ink))] px-4 py-2.5 text-center">
        <p className="stencil text-[8.5px] text-[rgb(var(--paper))]">
          6 AUGUST 2026 · MAIN AUDITORIUM &amp; QUADRANGLE
        </p>
      </div>
    </div>
  );
}
