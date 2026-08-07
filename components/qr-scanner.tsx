"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Camera,
  CameraOff,
  Keyboard,
  Loader2,
  QrCode,
  SkipForward,
  SwitchCamera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/client";
import type { StudentRow } from "@/lib/supabase/types";

const CORNERS = [
  "top-0 left-0 border-t-[5px] border-l-[5px]",
  "top-0 right-0 border-t-[5px] border-r-[5px]",
  "bottom-0 left-0 border-b-[5px] border-l-[5px]",
  "bottom-0 right-0 border-b-[5px] border-r-[5px]",
];

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

type QrDecoder = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  opts?: { inversionAttempts?: string },
) => { data: string } | null;

/**
 * Badge reader with a live camera.
 *
 * Printed passes encode a link ending in the graduate's hub token, so the
 * decoder pulls the token out of whatever the camera reads. A register
 * number typed by hand still works, as does a hardware scanner, which
 * behaves like a keyboard.
 *
 * Decoding prefers the browser's native BarcodeDetector (fast, hardware
 * accelerated). jsQR is loaded lazily, in the browser only, as a fallback
 * for Safari and Firefox — importing it at module scope crashes the
 * Next.js build worker.
 */
export function QrScanner({
  onScan,
  onError,
  label = "Scan graduate badge",
  hint = "Hold the QR code inside the frame",
  eligible,
  className,
  compact = false,
}: {
  onScan: (student: StudentRow) => void;
  onError?: (message: string) => void;
  label?: string;
  hint?: string;
  eligible?: "checked-in" | "stage-done" | "any";
  className?: string;
  compact?: boolean;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const busyRef = React.useRef(false);
  const decoderRef = React.useRef<QrDecoder | null>(null);
  const lastRef = React.useRef<{ value: string; at: number }>({ value: "", at: 0 });

  const [live, setLive] = React.useState(false);
  const [starting, setStarting] = React.useState(false);
  const [camError, setCamError] = React.useState<string | null>(null);
  const [facing, setFacing] = React.useState<"environment" | "user">("environment");
  const [scanning, setScanning] = React.useState(false);
  const [hit, setHit] = React.useState(false);
  const [manual, setManual] = React.useState(false);
  const [code, setCode] = React.useState("");

  const cursor = React.useRef(0);
  const supabase = React.useMemo(() => createClient(), []);

  /** Resolves whatever was read into a student record. */
  const resolve = React.useCallback(
    async (raw: string) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setScanning(true);

      try {
        const text = raw.trim();
        const token = text.match(UUID_RE)?.[0];

        const { data, error } = token
          ? await supabase.rpc("student_by_hub_token", { p_token: token })
          : await supabase.from("students").select("*").ilike("reg_no", text).maybeSingle();

        const student = (Array.isArray(data) ? data[0] : data) as StudentRow | null;

        if (error) onError?.(error.message);
        else if (!student) onError?.(`No graduate found for ${text.toUpperCase()}`);
        else {
          setHit(true);
          setTimeout(() => setHit(false), 600);
          onScan(student);
        }
      } finally {
        setScanning(false);
        // Cooldown so one badge is not read repeatedly.
        setTimeout(() => {
          busyRef.current = false;
        }, 1200);
      }
    },
    [onError, onScan, supabase],
  );

  const stop = React.useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLive(false);
  }, []);

  const start = React.useCallback(async () => {
    setCamError(null);
    setStarting(true);
    try {
      stop();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
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
      setCamError(
        name === "NotAllowedError"
          ? "Camera permission was refused. Allow it in the address bar, then try again."
          : name === "NotFoundError"
            ? "No camera on this device — use manual entry."
            : name === "NotReadableError"
              ? "The camera is in use by another app."
              : typeof window !== "undefined" && !window.isSecureContext
                ? "The camera needs HTTPS. Open the site over https:// or on localhost."
                : "Could not start the camera.",
      );
    } finally {
      setStarting(false);
    }
  }, [facing, stop]);

  // Decode loop — runs only while the camera is live.
  React.useEffect(() => {
    if (!live) return;
    let cancelled = false;

    type Detector = { detect: (s: CanvasImageSource) => Promise<{ rawValue: string }[]> };
    let detector: Detector | null = null;

    const Native = (globalThis as unknown as {
      BarcodeDetector?: new (o: { formats: string[] }) => Detector;
    }).BarcodeDetector;

    if (Native) {
      try {
        detector = new Native({ formats: ["qr_code"] });
      } catch {
        detector = null;
      }
    }

    /** Loads jsQR on first use, in the browser only. */
    const getDecoder = async () => {
      if (decoderRef.current) return decoderRef.current;
      const mod = await import("jsqr");
      decoderRef.current = (mod.default ?? mod) as unknown as QrDecoder;
      return decoderRef.current;
    };

    const tick = async () => {
      const video = videoRef.current;

      if (video && video.readyState === video.HAVE_ENOUGH_DATA && !busyRef.current) {
        let value: string | null = null;

        if (detector) {
          try {
            value = (await detector.detect(video))[0]?.rawValue ?? null;
          } catch {
            detector = null; // fall through to jsQR from the next frame
          }
        }

        if (!value && !detector) {
          const canvas = (canvasRef.current ??= document.createElement("canvas"));
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (ctx && canvas.width > 0) {
            ctx.drawImage(video, 0, 0);
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const decode = await getDecoder();
            value = decode(img.data, img.width, img.height, { inversionAttempts: "dontInvert" })?.data ?? null;
          }
        }

        const now = Date.now();
        if (value && !(value === lastRef.current.value && now - lastRef.current.at < 1500)) {
          lastRef.current = { value, at: now };
          void resolve(value);
        }
      }

      if (!cancelled) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [live, resolve]);

  // Release the camera when the station navigates away.
  React.useEffect(() => stop, [stop]);

  /** Pull the next real graduate matching this station's eligibility. */
  const nextInQueue = async () => {
    if (scanning) return;
    setScanning(true);

    let query = supabase.from("students").select("*");
    if (eligible === "checked-in") query = query.eq("attendance", true).eq("stage_done", false);
    else if (eligible === "stage-done") query = query.eq("stage_done", true).eq("booth_done", false);

    const { data, error } = await query
      .order("reg_no")
      .range(cursor.current, cursor.current)
      .maybeSingle();

    cursor.current += 1;
    setScanning(false);

    if (error) return onError?.(error.message);
    if (!data) {
      cursor.current = 0;
      return onError?.("No eligible graduates remaining at this station.");
    }
    onScan(data);
  };

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    void resolve(code);
    setCode("");
  };

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "relative overflow-hidden bg-[#0B0D14] rule",
          compact ? "aspect-4/3" : "aspect-square sm:aspect-4/3",
        )}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          className={cn("h-full w-full object-cover", live ? "" : "hidden")}
        />

        {live && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center p-8">
            <div className="relative aspect-square w-full max-w-[240px]">
              {CORNERS.map((pos) => (
                <span
                  key={pos}
                  className={cn(
                    "absolute h-11 w-11 transition-colors",
                    hit ? "border-[#4ADE80]" : "border-pop",
                    pos,
                  )}
                />
              ))}
              {!hit && (
                <motion.div
                  animate={{ top: ["4%", "94%", "4%"] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-x-2 h-0.5 bg-pop" />
              )}
            </div>
          </div>
        )}

        {!live && (
          <div className="absolute inset-0 grid place-items-center px-6 text-center">
            {camError ? (
              <div>
                <AlertTriangle className="mx-auto h-9 w-9 text-[#FFC24D]" strokeWidth={2} />
                <p className="mx-auto mt-3 max-w-xs text-[12.5px] leading-snug text-[#B9C4E0]">
                  {camError}
                </p>
              </div>
            ) : (
              <div>
                <QrCode className="mx-auto h-12 w-12 text-[#4A5578]" strokeWidth={1.4} />
                <p className="mt-3 text-[12.5px] text-[#8592B0]">Camera is off</p>
              </div>
            )}
          </div>
        )}

        <div className="absolute top-3 left-3 flex items-center gap-2 bg-[#151A2B] px-2.5 py-1.5 rule">
          <span
            className={cn(
              "h-2 w-2",
              hit ? "bg-[#4ADE80]" : live ? "animate-blink bg-pop" : "bg-[#4A5578]",
            )}
          />
          <span className="stencil text-[9.5px] text-[#B9C4E0]">
            {hit ? "Matched" : scanning ? "Reading…" : live ? "Looking for a code" : "Idle"}
          </span>
        </div>
      </div>

      <div className="mt-3.5">
        <p className="text-[15px] font-bold tracking-[-0.015em] text-ink">{label}</p>
        <p className="mt-0.5 text-[12.5px] text-ink-3">{hint}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {!live ? (
          <Button onClick={start} disabled={starting} className="flex-1">
            {starting ? (
              <Loader2 className="h-[18px] w-[18px] animate-spin" />
            ) : (
              <Camera className="h-[18px] w-[18px]" />
            )}
            {starting ? "Starting…" : "Start camera"}
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              aria-label="Switch camera"
              onClick={() => {
                setFacing((f) => (f === "environment" ? "user" : "environment"));
                setTimeout(start, 0);
              }}
            >
              <SwitchCamera className="h-[18px] w-[18px]" />
            </Button>
            <Button variant="ghost" onClick={stop} aria-label="Stop camera">
              <CameraOff className="h-[18px] w-[18px]" />
            </Button>
          </>
        )}

        <Button variant="secondary" onClick={nextInQueue} disabled={scanning}>
          <SkipForward className="h-[18px] w-[18px]" />
          Next in queue
        </Button>
        <Button variant="secondary" onClick={() => setManual((m) => !m)}>
          <Keyboard className="h-[18px] w-[18px]" />
          Manual
        </Button>
      </div>

      <AnimatePresence>
        {manual && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={submitManual}
            className="overflow-hidden"
          >
            <div className="mt-2.5 flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="KGR22CS042"
                autoFocus
                className="h-12 w-full bg-paper px-3 font-mono text-[14px] font-medium tracking-widest text-ink rule outline-none placeholder:text-ink-3 focus:drop-2" />
              <Button type="submit" size="lg" variant="pop" disabled={scanning}>
                Find
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
