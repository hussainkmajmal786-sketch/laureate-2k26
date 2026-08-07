"use client";
/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Camera,
  CameraOff,
  Check,
  Loader2,
  RefreshCw,
  SwitchCamera,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/feedback";
import { uploadStudentPhoto } from "@/lib/photo-capture";

export interface CapturedShot {
  id: string;
  label: string;
  dataUrl: string;
  path?: string;
  uploading: boolean;
  failed?: boolean;
}

/**
 * Live camera capture for a station.
 *
 * The shutter uploads straight away, filed against the graduate who is
 * currently scanned in — so a photo can never end up under the wrong
 * person, and nothing depends on matching timestamps later.
 *
 * A file picker is kept alongside it: laptop webcams are poor, and the
 * photographer's SLR shots still need a way in.
 */
export function CameraCapture({
  studentId,
  studentName,
  category = "Booth",
  label,
  shots,
  onShot,
  disabled,
}: {
  studentId: string;
  studentName: string;
  category?: "Stage" | "Booth" | "Candid" | "Group";
  label?: string;
  shots: CapturedShot[];
  onShot: (shot: CapturedShot) => void;
  disabled?: boolean;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const [live, setLive] = React.useState(false);
  const [starting, setStarting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [facing, setFacing] = React.useState<"user" | "environment">("environment");
  const [flash, setFlash] = React.useState(false);
  const { push } = useToast();

  const stop = React.useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLive(false);
  }, []);

  const start = React.useCallback(async () => {
    setError(null);
    setStarting(true);
    try {
      stop();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setLive(true);
    } catch (e) {
      const name = e instanceof Error ? e.name : "";
      setError(
        name === "NotAllowedError"
          ? "Camera permission was refused. Allow it in the browser address bar, then try again."
          : name === "NotFoundError"
            ? "No camera found on this device."
            : name === "NotReadableError"
              ? "The camera is in use by another app. Close it and try again."
              : "Could not start the camera.",
      );
    } finally {
      setStarting(false);
    }
  }, [facing, stop]);

  // Release the camera when the station moves on.
  React.useEffect(() => stop, [stop]);

  /** Uploads a blob and reports the outcome back to the parent. */
  const send = async (blob: Blob, dataUrl: string, shotLabel: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const pending: CapturedShot = { id, label: shotLabel, dataUrl, uploading: true };
    onShot(pending);

    const fd = new FormData();
    fd.set("photo", new File([blob], `${shotLabel}.jpg`, { type: "image/jpeg" }));
    fd.set("studentId", studentId);
    fd.set("category", category);
    if (label) fd.set("label", label);

    const result = await uploadStudentPhoto(fd);

    onShot({ ...pending, uploading: false, failed: !result.ok, path: result.path });

    push(
      result.ok
        ? { title: "Photo saved", description: `${studentName} · ${shotLabel}`, tone: "ok" }
        : { title: "Upload failed", description: result.error, tone: "bad" },
    );
  };

  const shutter = async () => {
    const video = videoRef.current;
    if (!video || !live) return;

    setFlash(true);
    setTimeout(() => setFlash(false), 140);

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    canvas.toBlob(
      (blob) => blob && send(blob, dataUrl, "Captured"),
      "image/jpeg",
      0.9,
    );
  };

  const pickFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      const dataUrl = URL.createObjectURL(file);
      await send(file, dataUrl, "Uploaded");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      {/* Viewfinder */}
      <div className="relative aspect-4/3 overflow-hidden rule bg-[#0B0D14]">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`h-full w-full object-cover ${live ? "" : "hidden"}`}
        />

        {flash && <div className="absolute inset-0 z-20 bg-white" />}

        {!live && (
          <div className="absolute inset-0 grid place-items-center px-6 text-center">
            {error ? (
              <div>
                <AlertTriangle className="mx-auto h-10 w-10 text-[#FFC24D]" strokeWidth={2} />
                <p className="mt-3 max-w-xs text-[13px] leading-snug text-[#B9C4E0]">{error}</p>
                <Button size="sm" variant="secondary" className="mt-4" onClick={start}>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Try again
                </Button>
              </div>
            ) : (
              <div>
                <CameraOff className="mx-auto h-10 w-10 text-[#4A5578]" strokeWidth={1.6} />
                <p className="mt-3 text-[13px] text-[#8592B0]">Camera is off</p>
              </div>
            )}
          </div>
        )}

        {live && (
          <div className="absolute top-3 left-3">
            <Badge tone="ok" size="sm" dot>
              Live · {studentName}
            </Badge>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        {!live ? (
          <Button onClick={start} disabled={disabled || starting} className="flex-1">
            {starting ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <Camera className="h-[18px] w-[18px]" />}
            {starting ? "Starting…" : "Start camera"}
          </Button>
        ) : (
          <>
            <Button onClick={shutter} disabled={disabled} className="flex-1" size="lg">
              <Camera className="h-5 w-5" />
              Take photo
            </Button>
            <Button
              variant="secondary"
              size="lg"
              aria-label="Switch camera"
              onClick={() => {
                setFacing((f) => (f === "user" ? "environment" : "user"));
                // start() re-runs from the effect dependency on `facing`.
                setTimeout(start, 0);
              }}
            >
              <SwitchCamera className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="lg" onClick={stop} aria-label="Stop camera">
              <CameraOff className="h-5 w-5" />
            </Button>
          </>
        )}

        <Button
          variant="secondary"
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
        >
          <Upload className="h-[18px] w-[18px]" />
          Upload files
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => pickFiles(e.target.files)}
        />
      </div>

      {/* Captured strip */}
      {shots.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <AnimatePresence initial={false}>
            {shots.map((s) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative h-16 w-16 shrink-0 overflow-hidden rule"
              >
                <img src={s.dataUrl} alt={s.label} className="h-full w-full object-cover" />
                <span className="absolute inset-0 grid place-items-center bg-[rgb(var(--ink))]/55">
                  {s.uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : s.failed ? (
                    <AlertTriangle className="h-4 w-4 text-[#FFC24D]" />
                  ) : (
                    <Check className="h-4 w-4 text-[#4ADE80]" strokeWidth={3} />
                  )}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
