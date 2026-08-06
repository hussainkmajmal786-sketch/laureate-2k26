"use client";
/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import QRCode from "qrcode";
import Link from "next/link";
import { Download, ExternalLink, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deptColor } from "@/components/student-card";
import type { StudentRow } from "@/lib/supabase/types";

/**
 * Printable invitation pass. The QR encodes a link to the graduate's own
 * ceremony hub, which doubles as the badge every station scans.
 */
export function StudentQrCard({
  student,
  compact = false,
}: {
  student: StudentRow;
  compact?: boolean;
}) {
  const [src, setSrc] = React.useState("");
  const path = `/student/${student.id}`;
  const accent = deptColor(student.dept_code);

  React.useEffect(() => {
    const url = `${window.location.origin}${path}`;
    QRCode.toDataURL(url, { margin: 1, width: compact ? 150 : 210, errorCorrectionLevel: "M" })
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
    <div className="qr-print-card relative overflow-hidden bg-paper rule-thick drop-2">
      <div className="pointer-events-none absolute inset-2 border border-pop/40" />

      <div className="flex items-center justify-between rule-b bg-[rgb(var(--ink))] px-3 py-2 text-[rgb(var(--paper))]">
        <span className="stencil inline-flex items-center gap-2 text-[10px]">
          <QrCode className="h-4 w-4" /> LAUREATE 2K26
        </span>
        <Badge tone="pop" size="sm">INVITATION PASS</Badge>
      </div>

      <div className={`relative flex ${compact ? "gap-3 p-3" : "flex-col items-center gap-4 p-6 text-center"}`}>
        <div className="grid shrink-0 place-items-center border-2 border-[rgb(var(--ink))] bg-white p-2">
          {src ? (
            <img
              src={src}
              alt={`QR pass for ${student.name}`}
              className={compact ? "h-[118px] w-[118px]" : "h-[190px] w-[190px]"} />
          ) : (
            <div
              className={`grid animate-pulse place-items-center bg-paper-3 ${
                compact ? "h-[118px] w-[118px]" : "h-[190px] w-[190px]"
              }`} >
              <QrCode className="h-10 w-10 text-ink-3" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="stencil text-[9px]" style={{ color: accent }}>
            COLLEGE OF ENGINEERING KIDANGOOR
          </p>
          <h2 className="headline mt-2 text-[24px] text-ink text-balance">{student.name}</h2>
          <p className="mt-1 font-mono text-[12px] tracking-wider text-ink-2">
            {student.reg_no} · {student.dept_code}
          </p>
          <p className="mt-3 text-[12px] leading-relaxed text-ink-3 text-pretty">
            Scan this invitation to open your live ceremony hub, photo booth queue and event
            photographs.
          </p>

          {!compact && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button size="sm" onClick={download} disabled={!src}>
                <Download className="h-3.5 w-3.5" /> DOWNLOAD QR
              </Button>
              <Link href={path} target="_blank">
                <Button size="sm" variant="secondary">
                  <ExternalLink className="h-3.5 w-3.5" /> OPEN HUB
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="rule-t bg-pop px-4 py-2 text-center">
        <p className="stencil text-[9px] text-white">
          6 AUGUST 2026 · MAIN AUDITORIUM &amp; QUADRANGLE
        </p>
      </div>
    </div>
  );
}
