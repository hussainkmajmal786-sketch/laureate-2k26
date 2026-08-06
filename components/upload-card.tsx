"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, ImagePlus, Trash2, Upload } from "lucide-react";
import { cn, hueFrom } from "@/lib/utils";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export interface Shot {
  id: string;
  label: string;
  hue: number;
}

const PIGMENTS = ["#2563eb", "#ec4899", "#f59e0b", "#10b981", "#6d28d9", "#f97316", "#06b6d4", "#84cc16"];

function pigment(hue: number) {
  return PIGMENTS[hue % PIGMENTS.length];
}

/**
 * Photo capture surface. No real file handling — "uploading" adds a synthetic
 * frame so the gallery and progress states can be demonstrated.
 */
export function UploadCard({
  shots,
  onAdd,
  onRemove,
  title = "NO FRAME YET",
  description = "Capture on device or upload from the photographer's card",
  actions,
  aspect = "aspect-4/3",
}: {
  shots: Shot[];
  onAdd: (label: string) => void;
  onRemove?: (id: string) => void;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  aspect?: string;
}) {
  const [dragging, setDragging] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const latest = shots[shots.length - 1];

  const simulateUpload = (label: string) => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      onAdd(label);
    }, 800);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); simulateUpload("DROPPED"); }}
        className={cn(
          "halftone grain relative overflow-hidden rule-thick",
          aspect,
          dragging ? "bg-pop" : latest ? "" : "bg-paper-2",
        )}
        style={latest && !dragging ? { backgroundColor: pigment(latest.hue) } : undefined}
      >
        <AnimatePresence mode="wait">
          {uploading ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 grid place-items-center bg-paper"
            >
              <div className="flex flex-col items-center">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                  className="h-9 w-9 rule border-t-pop"
                />
                <p className="stencil mt-3 text-[10.5px] text-ink-2">UPLOADING…</p>
              </div>
            </motion.div>
          ) : latest ? (
            <motion.div
              key={latest.id}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
                <Badge tone="ink" size="sm">{latest.label}</Badge>
                <Badge tone="ink" size="sm">
                  {shots.length} FRAME{shots.length === 1 ? "" : "S"}
                </Badge>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 grid place-items-center px-6 text-center"
            >
              <div>
                <ImagePlus className="mx-auto h-11 w-11 text-ink-3" strokeWidth={1.6} />
                <p className="headline mt-3 text-[16px] text-ink">{title}</p>
                <p className="mt-1.5 text-[12px] text-ink-3">{description}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {shots.length > 0 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {shots.map((s) => (
            <motion.div
              key={s.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="group relative h-16 w-16 shrink-0 overflow-hidden rule"
              style={{ backgroundColor: pigment(s.hue) }}
            >
              <span className="stencil absolute inset-x-0 bottom-0 bg-[rgb(var(--ink))] px-1 py-0.5 text-center text-[7.5px] text-[rgb(var(--paper))]">
                {s.label}
              </span>
              {onRemove && (
                <button
                  onClick={() => onRemove(s.id)}
                  aria-label={`Remove ${s.label}`}
                  className="absolute inset-0 grid place-items-center bg-bad opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4 text-white" strokeWidth={2.6} />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {actions ?? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button size="lg" block onClick={() => simulateUpload("CAPTURED")} disabled={uploading}>
            <Camera className="h-[18px] w-[18px]" strokeWidth={2.6} />
            CAPTURE
          </Button>
          <Button size="lg" variant="secondary" block onClick={() => simulateUpload("UPLOADED")} disabled={uploading}>
            <Upload className="h-[18px] w-[18px]" strokeWidth={2.6} />
            UPLOAD
          </Button>
        </div>
      )}
    </div>
  );
}

export function makeShot(label: string): Shot {
  const id = `${label}-${Math.random().toString(36).slice(2, 8)}`;
  return { id, label, hue: hueFrom(id) };
}
