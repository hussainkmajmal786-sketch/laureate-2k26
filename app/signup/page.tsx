"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, GraduationCap, Loader2 } from "lucide-react";
import { signUp } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SuccessCheck } from "@/components/ui/feedback";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [done, setDone] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const result = await signUp(new FormData(e.currentTarget));

    if (!result.ok) {
      setError(result.error ?? "Could not create the account.");
      setPending(false);
      return;
    }

    setDone(true);
    setPending(false);
    // Email confirmation may be required depending on project settings;
    // sending them to sign-in covers both cases.
    setTimeout(() => router.push("/login"), 2600);
  }

  return (
    <div className="relative grid min-h-dvh lg:grid-cols-2">
      <div className="bg-[rgb(var(--ink))] grain relative hidden overflow-hidden lg:block">
        <div className="animate-bob absolute -top-1/4 -right-1/4 h-[70vh] w-[70vh]  bg-violet-500/30 blur-[120px]" />
        <div className="animate-bob absolute -left-1/4 bottom-0 h-[60vh] w-[60vh]  bg-indigo-400/25 blur-[110px]" />

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
              Join the
              <br />
              volunteer team.
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[rgb(var(--paper))]/60 text-pretty">
              Create your account, then an admin assigns your station — registration, stage, booth or
              counter — and the console adapts to what you can do.
            </p>
          </div>

          <p className="text-[12.5px] text-[rgb(var(--paper))]/45">
            College of Engineering Kidangoor · Graduation Management System
          </p>
        </div>
      </div>

      <div className="relative flex items-center justify-center bg-paper px-5 py-12 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm" >
          {done ? (
            <div className="flex flex-col items-center text-center">
              <SuccessCheck />
              <h2 className="mt-5 headline text-[28px] text-ink">
                Account created
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-3 text-pretty">
                If email confirmation is enabled for this project, check your inbox before signing
                in. Redirecting you to sign in…
              </p>
              <Link href="/login" className="mt-6 w-full">
                <Button block size="lg">Go to sign in</Button>
              </Link>
            </div>
          ) : (
            <>
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

              <h2 className="headline text-[34px] text-ink">Create account</h2>
              <p className="mt-2 text-[14px] text-ink-3">
                Volunteer access for the ceremony console.
              </p>

              <form onSubmit={onSubmit} className="mt-8 space-y-4">
                <div>
                  <label htmlFor="name" className="stencil mb-2 block text-[9.5px] text-ink">
                    Full name
                  </label>
                  <Input id="name" name="name" required placeholder="Anagha Krishnan" autoComplete="name" />
                </div>

                <div>
                  <label htmlFor="email" className="stencil mb-2 block text-[9.5px] text-ink">
                    Email
                  </label>
                  <Input id="email" name="email" type="email" required placeholder="you@cek.ac.in" autoComplete="email" />
                </div>

                <div>
                  <label htmlFor="password" className="stencil mb-2 block text-[9.5px] text-ink">
                    Password
                  </label>
                  <Input id="password" name="password" type="password"
                    required
                    minLength={8} placeholder="At least 8 characters"
                    autoComplete="new-password" />
                </div>

                <div>
                  <label htmlFor="station" className="stencil mb-2 block text-[9.5px] text-ink">
                    Station <span className="font-normal text-ink-3">(optional)</span>
                  </label>
                  <Input id="station" name="station" placeholder="Desk 1 — Main Gate" />
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
                  {pending ? "Creating…" : "Create account"}
                  {!pending && <ArrowRight className="h-[18px] w-[18px]" />}
                </Button>
              </form>

              <p className="mt-6 text-center text-[13px] text-ink-3">
                Already have an account?{" "}
                <Link href="/login" className="stencil text-[10px] text-pop hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
