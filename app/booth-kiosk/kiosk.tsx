"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Camera, CheckCircle2, Clock, QrCode, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface KioskResult {
  ok: boolean;
  already?: boolean;
  error?: string;
  name?: string;
  reg_no?: string;
  hue?: number;
  booth_id?: number;
  token?: string;
  ahead?: number;
  est_wait?: number;
}

/** Failure text written for a graduate standing at a tablet, not an operator. */
const MESSAGES: Record<string, { title: string; body: string }> = {
  PASS_NOT_RECOGNISED: {
    title: "Pass not recognised",
    body: "Please see a volunteer at the booth desk — they can add you manually.",
  },
  STAGE_NOT_DONE: {
    title: "Stage first",
    body: "The photo booth opens after you have crossed the stage. Come back once your degree is conferred.",
  },
  ALREADY_DONE: {
    title: "Your session is complete",
    body: "Your booth photos are already taken. They will appear on your pass link shortly.",
  },
  NO_ACTIVE_BOOTH: {
    title: "No booth open",
    body: "Both booths are paused right now. A volunteer can help you at the desk.",
  },
};

export function KioskScanner() {
  const [code, setCode] = React.useState("");
  const [result, setResult] = React.useState<KioskResult | null>(null);
  const [pending, setPending] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  /*
   * A hardware QR scanner behaves as a keyboard: it types the decoded text
   * and presses Enter. Keeping this hidden input focused means a graduate
   * just scans — nothing to tap first.
   */
  React.useEffect(() => {
    const focus = () => inputRef.current?.focus();
    focus();
    const t = setInterval(focus, 1200);
    return () => clearInterval(t);
  }, []);

  // Clear the result so the next graduate starts from a blank screen.
  React.useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => setResult(null), result.ok ? 12000 : 8000);
    return () => clearTimeout(t);
  }, [result]);

  const submit = async (raw: string) => {
    const value = raw.trim();
    if (!value || pending) return;

    setPending(true);
    setCode("");

    // The scanner reads the full hub URL; the token is its last path segment.
    const token = value.split("/").filter(Boolean).pop() ?? value;

    const supabase = createClient();
    const { data, error } = await supabase.rpc("self_join_booth_queue", { p_token: token });

    setPending(false);
    // The RPC returns jsonb, so narrow it rather than asserting through Json.
    if (error || !data || typeof data !== "object" || Array.isArray(data)) {
      setResult({ ok: false, error: "PASS_NOT_RECOGNISED" });
      return;
    }
    setResult(data as unknown as KioskResult);
  };

  return (
    <main
      className="grain relative grid min-h-dvh place-items-center overflow-hidden bg-[#0B0D14] px-6 py-10 text-white"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="animate-bob absolute -top-1/4 -left-20 h-[500px] w-[500px] bg-[#3B4FD8]/20 blur-[120px]" />
      <div className="animate-bob absolute -right-20 -bottom-1/4 h-[440px] w-[440px] bg-[#7C3AED]/16 blur-[110px]" />

      {/* Scanner input — offscreen, always focused */}
      <input
        ref={inputRef}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit(code)}
        className="sr-only"
        aria-label="Scan your pass"
        autoFocus
      />

      <div className="relative w-full max-w-2xl text-center">
        <AnimatePresence mode="wait">
          {result?.ok ? (
            <motion.div
              key="ok"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
            >
              <CheckCircle2 className="mx-auto h-16 w-16 text-[#4ADE80]" strokeWidth={2.2} />
              <p className="mt-5 text-[clamp(1.1rem,2.4vw,1.5rem)] text-[#B9C4E0]">
                {result.already ? "You are already in the queue" : "You are in the queue"}
              </p>
              <h1 className="headline mt-2 text-[clamp(2.2rem,7vw,4rem)] text-white text-balance">
                {result.name}
              </h1>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <Tile label="Your token" value={result.token ?? "—"} accent />
                <Tile label="Booth" value={`No. ${result.booth_id}`} />
                <Tile
                  label="Ahead of you"
                  value={String(result.ahead ?? 0)}
                  icon={<Users className="h-4 w-4" />}
                />
              </div>

              <p className="mt-7 inline-flex items-center gap-2.5 rounded-full bg-[#232B44] px-5 py-3 text-[clamp(1rem,2vw,1.25rem)] text-[#E8EDF9]">
                <Clock className="h-5 w-5 text-[#FFC24D]" />
                About {result.est_wait ?? 0} minutes
              </p>

              <p className="mt-6 text-[14px] text-[#8592B0]">
                Watch the board — your token is called when it is your turn.
              </p>
            </motion.div>
          ) : result ? (
            <motion.div
              key="err"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <AlertTriangle className="mx-auto h-16 w-16 text-[#FFC24D]" strokeWidth={2.2} />
              <h1 className="headline mt-5 text-[clamp(1.8rem,5vw,3rem)] text-white">
                {MESSAGES[result.error ?? ""]?.title ?? "Something went wrong"}
              </h1>
              {result.name && (
                <p className="mt-2 text-[clamp(1rem,2vw,1.25rem)] text-[#B9C4E0]">{result.name}</p>
              )}
              <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-[#9AA8C7]">
                {MESSAGES[result.error ?? ""]?.body ??
                  "Please see a volunteer at the booth desk."}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-[#232B44]">
                <Camera className="h-11 w-11 text-[#7DA2FF]" strokeWidth={1.8} />
              </div>

              <h1 className="headline mt-7 text-[clamp(2.2rem,7vw,4.5rem)] text-white">
                Photo Booth
              </h1>
              <p className="mt-4 text-[clamp(1.1rem,2.6vw,1.6rem)] text-[#B9C4E0]">
                Scan your graduation pass to join the queue
              </p>

              <motion.div
                animate={pending ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                transition={{ repeat: pending ? Infinity : 0, duration: 1 }}
                className="mx-auto mt-10 grid h-40 w-40 place-items-center rounded-3xl border-4 border-dashed border-[#2A3350]"
              >
                <QrCode
                  className={pending ? "h-16 w-16 text-[#7DA2FF]" : "h-16 w-16 text-[#4A5578]"}
                  strokeWidth={1.4}
                />
              </motion.div>

              <p className="mt-8 text-[14px] text-[#8592B0]">
                {pending ? "Reading your pass…" : "Hold the QR code under the scanner"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="absolute bottom-5 text-[12px] text-[#5A6788]">
        Laureate 2K26 · College of Engineering Kidangoor
      </p>
    </main>
  );
}

function Tile({
  label,
  value,
  accent = false,
  icon,
}: {
  label: string;
  value: string;
  accent?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#2A3350] bg-[#151A2B] px-4 py-5">
      <p className="stencil flex items-center justify-center gap-1.5 text-[9.5px] text-[#9AA8C7]">
        {icon}
        {label}
      </p>
      <p
        className={`figure mt-2 text-[clamp(1.6rem,4vw,2.6rem)] leading-none ${
          accent ? "text-[#7DA2FF]" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
