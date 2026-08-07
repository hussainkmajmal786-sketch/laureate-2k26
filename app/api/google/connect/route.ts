import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { consentUrl, isOAuthConfigured } from "@/lib/google-oauth";
import { getCurrentVolunteer } from "@/lib/supabase/server";

/**
 * Starts the Google consent flow.
 *
 * Admins only — this authorises an account whose storage the whole event
 * will use. The state parameter is a random value echoed back by Google
 * and compared in the callback, so another site cannot complete the flow
 * on this user's behalf.
 */
export async function GET() {
  const volunteer = await getCurrentVolunteer();
  if (volunteer?.role !== "admin") {
    return NextResponse.redirect(new URL("/settings?drive=forbidden", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"));
  }

  if (!isOAuthConfigured()) {
    return NextResponse.redirect(new URL("/settings?drive=unconfigured", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"));
  }

  const state = randomBytes(24).toString("hex");
  const jar = await cookies();
  jar.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return NextResponse.redirect(consentUrl(state));
}
