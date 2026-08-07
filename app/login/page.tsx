"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, GraduationCap, Loader2, MonitorPlay } from "lucide-react";
import { signIn } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  /*
   * The post-login destination is read from window.location rather than
   * useSearchParams(): that hook opts the whole subtree out of SSR, which
   * left the server sending an empty page and no sign-in form at all.
   */
  const nextPath = React.useCallback(() => {
    if (typeof window === "undefined") return "/dashboard";
    const target = new URLSearchParams(window.location.search).get("next");
    // Only allow same-site paths, so ?next= cannot bounce users off-site.
    return target && target.startsWith("/") && !target.startsWith("//")
      ? target
      : "/dashboard";
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const result = await signIn(new FormData(e.currentTarget));

    if (!result.ok) {
      setError(result.error ?? "Could not sign in.");
      setPending(false);
      return;
    }

    router.replace(nextPath());
    router.refresh();
  }

  return (
    <div className="relative grid min-h-dvh lg:grid-cols-2">
      {/* Aurora bg-paper rule drop-3 */}
      <div className="bg-[rgb(var(--ink))] grain relative hidden overflow-hidden lg:block">
        <div className="animate-bob absolute -top-1/4 -left-1/4 h-[70vh] w-[70vh]  bg-indigo-500/30 blur-[120px]" />
        <div className="animate-bob absolute -right-1/4 bottom-0 h-[60vh] w-[60vh]  bg-cyan-400/25 blur-[110px]" />

        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center  bg-pop">
              <GraduationCap className="h-6 w-6 text-white" strokeWidth={2.1} />
            </span>
            <div>
              <p className="headline text-[18px] leading-none text-[rgb(var(--paper))]">
                Laureate 2K26
              </p>
              <p className="stencil text-[8.5px] text-[rgb(var(--paper))]/55">CEK Kidangoor</p>
            </div>
          </div>

          <div>
            <h1 className="headline text-[clamp(2.25rem,6vw,4rem)] text-[rgb(var(--paper))] text-balance">
              Every station,
              <br />
              one console.
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[rgb(var(--paper))]/60 text-pretty">
              Registration, stage flow, photo booths, lunch and certificates — tracking every
              graduate through a single day.
            </p>
          </div>

          <Link href="/display"
            className="inline-flex w-fit items-center gap-2  bg-[#232B44] px-4 py-2.5 text-[13px] font-medium text-[rgb(var(--paper))]/80 backdrop-blur-sm transition-colors hover:bg-[#2A3350] hover:text-white" >
            <MonitorPlay className="h-4 w-4" />
            Open the public queue board
          </Link>
        </div>
      </div>

      {/* Form */}
      <div className="relative flex items-center justify-center bg-paper px-5 py-12 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm" >
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid h-11 w-11 place-items-center  bg-accent">
              <GraduationCap className="h-6 w-6 text-white" strokeWidth={2.1} />
            </span>
            <div>
              <p className="headline text-[18px] leading-none text-ink">
                Laureate 2K26
              </p>
              <p className="stencil text-[8.5px] text-ink-3">CEK Kidangoor</p>
            </div>
          </div>

          <h2 className="headline text-[34px] text-ink">Sign in</h2>
          <p className="mt-2 text-[14px] text-ink-3">
            Volunteer access for the ceremony console.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="stencil mb-2 block text-[9.5px] text-ink">
                Email
              </label>
              <Input id="email" name="email" type="email"
                autoComplete="email"
                required placeholder="you@cek.ac.in" />
            </div>

            <div>
              <label htmlFor="password" className="stencil mb-2 block text-[9.5px] text-ink">
                Password
              </label>
              <Input id="password" name="password" type="password"
                autoComplete="current-password"
                required placeholder="••••••••" />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5  rule bg-bad p-3.5" >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-white" />
                <p className="text-[12.5px] font-bold leading-relaxed text-white">{error}</p>
              </motion.div>
            )}

            <Button type="submit" size="lg" block disabled={pending}>
              {pending ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : null}
              {pending ? "Signing in…" : "Sign in"}
              {!pending && <ArrowRight className="h-[18px] w-[18px]" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-[13px] text-ink-3">
            No account yet?{" "}
            <Link href="/signup" className="stencil text-[10px] text-pop hover:underline">
              Create one
            </Link>
          </p>

          <div className="mt-8  rule bg-warn p-4">
            <p className="text-[12px] leading-relaxed text-ink-black">
              <span className="font-black text-ink-black">First run?</span> The first account created
              becomes the event admin automatically. Everyone after that starts with view-only access
              until an admin assigns their station role.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
