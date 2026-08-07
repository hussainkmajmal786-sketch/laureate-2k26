import Link from "next/link";
import { Camera, CheckCircle2, Circle, GraduationCap, MonitorPlay } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { deptColor } from "@/lib/dept-colors";
import { StreamPlayer } from "./stream";
import { HubGallery } from "./gallery";

export const dynamic = "force-dynamic";

interface HubPayload {
  student: {
    id: string;
    name: string;
    reg_no: string;
    dept_code: string;
    cgpa: number;
    batch: string;
    hue: number;
    photo_url: string | null;
    attendance: boolean;
    stage_done: boolean;
    booth_done: boolean;
    lunch_done: boolean;
    certificate_done: boolean;
    photo_count: number;
  };
  photos: {
    id: string;
    title: string;
    category: string;
    hue: number;
    captured_at: string;
    drive_view_url: string | null;
    drive_thumb_url: string | null;
  }[];
  queue: { booth_id: number; token: string } | null;
  event: {
    college: string;
    event_date: string;
    venue: string;
    stream_url: string | null;
    stream_live: boolean;
  } | null;
}

/**
 * The graduate's own hub, opened by scanning their QR pass.
 *
 * The URL carries an unguessable token which is the credential: the
 * database function returns only that graduate's record and photos, and a
 * wrong token returns nothing. No sign-in, because the person holding the
 * pass is the person it belongs to — and no way to enumerate anyone else.
 */
export default async function GraduateHub({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data } = await supabase.rpc("get_student_hub", { p_token: token });
  const hub = data as HubPayload | null;

  if (!hub?.student) {
    return (
      <main className="grid min-h-dvh place-items-center bg-paper p-6">
        <div className="max-w-sm bg-paper rule-thick drop-3 p-8 text-center">
          <p className="stencil text-[9.5px] text-bad">PASS NOT RECOGNISED</p>
          <h1 className="headline mt-3 text-[28px] text-ink">INVALID QR</h1>
          <p className="mt-3 text-[13.5px] leading-relaxed text-ink-3">
            This pass does not match any graduate. Please visit the registration desk for a
            replacement.
          </p>
        </div>
      </main>
    );
  }

  const s = hub.student;
  const accent = deptColor(s.dept_code);

  const journey = [
    { done: s.attendance, label: "Registration", detail: "Checked in at the gate" },
    { done: s.stage_done, label: "Stage", detail: "Degree conferred" },
    { done: s.booth_done, label: "Photo booth", detail: "Session complete" },
    { done: s.lunch_done, label: "Lunch", detail: "Coupon redeemed" },
    { done: s.certificate_done, label: "Certificate", detail: "Collected in hand" },
  ];
  const doneCount = journey.filter((j) => j.done).length;

  return (
    <main className="grain min-h-dvh bg-paper px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between rule-b pb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rule bg-pop">
              <GraduationCap className="h-5 w-5 text-white" strokeWidth={2.6} />
            </span>
            <span className="headline text-[19px] text-ink">
              LAUREATE <span className="text-pop">2K26</span>
            </span>
          </div>
          <span className="stencil text-[8.5px] text-ink-3">YOUR HUB</span>
        </header>

        {/* Identity */}
        <section
          className="grain relative mt-6 overflow-hidden bg-[rgb(var(--ink))] rule-thick drop-3 p-6 sm:p-9"
        >
          <div
            className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 opacity-40 blur-3xl"
            style={{ background: accent }}
          />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar name={s.name} hue={s.hue} src={s.photo_url} size="xl" />
            <div className="min-w-0">
              <p className="stencil text-[9.5px]" style={{ color: accent }}>
                CONGRATULATIONS, GRADUATE
              </p>
              <h1 className="headline mt-2 text-[clamp(2rem,7vw,3.5rem)] text-[rgb(var(--paper))] text-balance">
                {s.name}
              </h1>
              <p className="mt-2.5 font-mono text-[13px] text-[rgb(var(--paper))]/70">
                {s.reg_no} · {s.dept_code}
              </p>
              <p className="mt-1 font-mono text-[12px] text-[rgb(var(--paper))]/65">
                B.TECH · {s.batch} · CGPA {Number(s.cgpa).toFixed(2)}
              </p>
            </div>
          </div>
        </section>

        {/* Live stream */}
        <StreamPlayer url={hub.event?.stream_url ?? null} live={hub.event?.stream_live ?? false} />

        {/* Progress */}
        <section className="mt-4 bg-paper rule drop-2 p-5">
          <div className="flex items-baseline justify-between">
            <p className="stencil text-[9.5px] text-ink-2">YOUR CEREMONY</p>
            <p className="font-mono text-[12px] text-ink-3">
              <span className="figure text-[16px] text-pop">{doneCount}</span> / {journey.length}
            </p>
          </div>

          <div className="mt-3 h-3 rule bg-paper-2">
            <div
              className="h-full bg-pop transition-all duration-700"
              style={{ width: `${(doneCount / journey.length) * 100}%` }}
            />
          </div>

          <ul className="mt-5 space-y-3">
            {journey.map((j) => (
              <li key={j.label} className="flex items-center gap-3">
                {j.done ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-ok" strokeWidth={2.4} />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-ink-3" strokeWidth={2} />
                )}
                <div className="min-w-0 flex-1">
                  <p className={`text-[13.5px] font-bold ${j.done ? "text-ink" : "text-ink-3"}`}>
                    {j.label}
                  </p>
                  <p className="text-[11.5px] text-ink-3">{j.detail}</p>
                </div>
                {j.done && <Badge tone="ok" size="sm">DONE</Badge>}
              </li>
            ))}
          </ul>
        </section>

        {/* Booth queue */}
        <section className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="bg-paper rule drop-2 p-5">
            <div className="flex items-center gap-2.5">
              <Camera className="h-5 w-5 text-pop" strokeWidth={2.4} />
              <p className="stencil text-[9.5px] text-ink-2">PHOTO BOOTH</p>
            </div>
            {hub.queue ? (
              <>
                <p className="figure mt-4 text-[34px] leading-none text-pop">{hub.queue.token}</p>
                <p className="mt-2 text-[13px] text-ink-2">
                  You are queued for Booth {hub.queue.booth_id}.
                </p>
              </>
            ) : s.booth_done ? (
              <>
                <p className="figure mt-4 text-[26px] leading-none text-ok">COMPLETE</p>
                <p className="mt-2 text-[13px] text-ink-3">
                  Your booth session is finished. Photos appear below once uploaded.
                </p>
              </>
            ) : (
              <>
                <p className="figure mt-4 text-[26px] leading-none text-warn">NOT QUEUED</p>
                <p className="mt-2 text-[13px] text-ink-3">
                  Show this pass at the booth desk after you cross the stage.
                </p>
              </>
            )}
          </div>

          <div className="bg-paper rule drop-2 p-5">
            <div className="flex items-center gap-2.5">
              <MonitorPlay className="h-5 w-5 text-accent" strokeWidth={2.4} />
              <p className="stencil text-[9.5px] text-ink-2">LIVE BOARD</p>
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-ink-2">
              The now-serving board shows which token each booth is calling right now.
            </p>
            <Link
              href="/display"
              className="stencil mt-4 inline-flex items-center gap-1.5 text-[10px] text-pop hover:underline"
            >
              OPEN THE BOARD →
            </Link>
          </div>
        </section>

        {/* Photos — only this graduate's own */}
        <HubGallery photos={hub.photos} name={s.name} />

        <p className="mt-6 text-center text-[11.5px] text-ink-3">
          This link is yours. Keep it — your photos stay here permanently.
        </p>
      </div>
    </main>
  );
}
