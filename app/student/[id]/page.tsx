import Link from "next/link";
import { Camera, CheckCircle2, Circle, GraduationCap, Images, MonitorPlay } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { deptColor } from "@/components/student-card";

export const dynamic = "force-dynamic";

/**
 * The graduate's own hub, opened by scanning their QR pass. Public by
 * design — no sign-in, because the person holding the pass is the person
 * it belongs to.
 */
export default async function StudentHub({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase.from("students").select("*").eq("id", id).maybeSingle();

  if (!student) {
    return (
      <main className="grid min-h-dvh place-items-center bg-paper p-6">
        <div className="bg-paper rule drop-3 max-w-sm p-8 text-center">
          <p className="stencil text-bad">Error 404</p>
          <h1 className="headline text-[clamp(1.75rem,4vw,2.75rem)] mt-3 text-ink">Pass not found</h1>
          <p className="mt-3 text-[13.5px] leading-relaxed text-ink-3">
            This QR does not match any graduate record. Ask the registration desk for a new pass.
          </p>
        </div>
      </main>
    );
  }

  const [{ data: photos }, { data: queueEntry }] = await Promise.all([
    supabase
      .from("media")
      .select("*")
      .eq("student_id", student.id)
      .order("captured_at", { ascending: false })
      .limit(8),
    supabase
      .from("booth_queue")
      .select("booth_id, token, position")
      .eq("student_id", student.id)
      .eq("served", false)
      .maybeSingle(),
  ]);

  const accent = deptColor(student.dept_code);

  const journey = [
    { done: student.attendance, label: "Registration", detail: "Checked in at the gate" },
    { done: student.stage_done, label: "Stage", detail: "Degree conferred" },
    { done: student.booth_done, label: "Photo booth", detail: "Session complete" },
    { done: student.lunch_done, label: "Lunch", detail: "Coupon redeemed" },
    { done: student.certificate_done, label: "Certificate", detail: "Collected in hand" },
  ];
  const doneCount = journey.filter((j) => j.done).length;

  return (
    <main className="min-h-dvh bg-paper px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between border-b border-[rgb(var(--rule))] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center  bg-accent">
              <GraduationCap className="h-5 w-5 text-[rgb(var(--accent-ink))]" strokeWidth={2.3} />
            </span>
            <span className="text-[15px] font-extrabold tracking-[-0.03em] text-ink">
              Laureate <span className="text-accent">2K26</span>
            </span>
          </div>
          <span className="stencil text-ink-3">Graduate hub</span>
        </header>

        {/* Identity */}
        <section className="bg-paper rule drop-3 bg-[rgb(var(--ink))] grain relative mt-6 overflow-hidden p-6 sm:p-9">
          <div
            className="pointer-events-none absolute -top-24 -right-24 h-64 w-64  opacity-25 blur-3xl"
            style={{ background: accent }} />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar name={student.name} hue={student.hue} src={student.photo_url} size="xl" />
            <div className="min-w-0">
              <p className="stencil" style={{ color: accent }}>
                Congratulations, graduate
              </p>
              <h1 className="headline text-[clamp(2rem,6vw,4rem)] mt-2 text-ink text-balance">{student.name}</h1>
              <p className="mt-2.5 font-mono text-[13px] text-ink-2">
                {student.reg_no} · {student.dept_code}
              </p>
              <p className="mt-1 font-mono text-[12px] text-ink-3">
                B.Tech · {student.batch} · CGPA {Number(student.cgpa).toFixed(2)}
              </p>
            </div>
          </div>
        </section>

        {/* Progress */}
        <section className="bg-paper rule drop-3 mt-4 p-5">
          <div className="flex items-baseline justify-between">
            <p className="stencil text-ink-2">Your ceremony</p>
            <p className="font-mono text-[12px] text-ink-3">
              <span className="figure text-[16px] text-accent">{doneCount}</span> / {journey.length}
            </p>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden  bg-paper-3">
            <div
              className="h-full  bg-accent transition-all duration-700"
              style={{ width: `${(doneCount / journey.length) * 100}%` }} />
          </div>

          <ul className="mt-5 space-y-3">
            {journey.map((j) => (
              <li key={j.label} className="flex items-center gap-3">
                {j.done ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-ok" strokeWidth={2.2} />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-ink-3" strokeWidth={1.8} />
                )}
                <div className="min-w-0 flex-1">
                  <p className={`text-[13.5px] font-semibold ${j.done ? "text-ink" : "text-ink-3"}`}>
                    {j.label}
                  </p>
                  <p className="text-[11.5px] text-ink-3">{j.detail}</p>
                </div>
                {j.done && <Badge tone="ok" size="sm">Done</Badge>}
              </li>
            ))}
          </ul>
        </section>

        {/* Booth queue */}
        <section className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="bg-paper rule drop-3 p-5">
            <div className="flex items-center gap-2.5">
              <Camera className="h-5 w-5 text-accent" strokeWidth={2.2} />
              <p className="stencil text-ink-2">Photo booth</p>
            </div>
            {queueEntry ? (
              <>
                <p className="figure mt-4 text-[34px] leading-none text-accent">{queueEntry.token}</p>
                <p className="mt-2 text-[13px] text-ink-2">
                  You are in the queue for Booth {queueEntry.booth_id}.
                </p>
                <p className="mt-1 text-[12px] text-ink-3">
                  Watch the display board — your token will be called.
                </p>
              </>
            ) : student.booth_done ? (
              <>
                <p className="figure mt-4 text-[26px] leading-none text-ok">Complete</p>
                <p className="mt-2 text-[13px] text-ink-3">
                  Your booth session is finished. Photos appear below once synced.
                </p>
              </>
            ) : (
              <>
                <p className="figure mt-4 text-[26px] leading-none text-warn">Not queued</p>
                <p className="mt-2 text-[13px] text-ink-3">
                  Show this pass at the booth desk after you cross the stage.
                </p>
              </>
            )}
          </div>

          <div className="bg-paper rule drop-3 p-5">
            <div className="flex items-center gap-2.5">
              <MonitorPlay className="h-5 w-5 text-pop" strokeWidth={2.2} />
              <p className="stencil text-ink-2">Live board</p>
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-ink-2">
              The now-serving board shows which token each booth is calling right now.
            </p>
            <Link href="/display"
              className="mt-4 inline-flex items-center gap-1.5 font-mono text-[12px] text-accent hover:underline" >
              Open the board →
            </Link>
          </div>
        </section>

        {/* Photos */}
        <section className="bg-paper rule drop-3 mt-4 p-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="stencil text-accent">Your archive</p>
              <h2 className="mt-1.5 text-[19px] font-bold tracking-[-0.025em] text-ink">
                Photos of you
              </h2>
            </div>
            <span className="figure text-[26px] text-ink">{photos?.length ?? 0}</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {photos && photos.length > 0 ? (
              photos.map((photo) => (
                <div
                  key={photo.id}
                  className="grid aspect-square place-items-center  p-2 text-center rule"
                  style={{
                    backgroundImage: `linear-gradient(145deg, hsl(${photo.hue} 70% 58%), hsl(${(photo.hue + 45) % 360} 66% 38%))`,
                  }} >
                  <Images className="h-6 w-6 text-white/90" />
                  <span className="mt-2 font-mono text-[10px] font-medium text-white/90">
                    {photo.category}
                  </span>
                </div>
              ))
            ) : (
              <p className="col-span-full  bg-paper-2 p-8 text-center text-[13px] text-ink-3">
                Photos appear here once your booth session is synced.
              </p>
            )}
          </div>
        </section>

        <p className="mt-6 text-center text-[11.5px] text-ink-3">
          Need help? Visit the registration desk and show this pass.
        </p>
      </div>
    </main>
  );
}
