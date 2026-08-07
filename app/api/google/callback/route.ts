import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { google } from "googleapis";
import { oauthClient } from "@/lib/google-oauth";
import { createClient, getCurrentVolunteer } from "@/lib/supabase/server";

const site = () =>
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const back = (status: string) => NextResponse.redirect(new URL(`/settings?drive=${status}`, site()));

/**
 * Receives the Google consent redirect and stores the refresh token.
 *
 * The state cookie is compared before anything is exchanged, so a link
 * from another site cannot connect an account here.
 */
export async function GET(request: NextRequest) {
  const volunteer = await getCurrentVolunteer();
  if (volunteer?.role !== "admin") return back("forbidden");

  const params = request.nextUrl.searchParams;
  if (params.get("error")) return back("denied");

  const code = params.get("code");
  const state = params.get("state");
  const jar = await cookies();
  const expected = jar.get("google_oauth_state")?.value;

  jar.delete("google_oauth_state");

  if (!code || !state || !expected || state !== expected) return back("badstate");

  try {
    const client = oauthClient();
    const { tokens } = await client.getToken(code);

    if (!tokens.refresh_token) {
      // Google only returns one on first consent; prompt=consent should
      // force it, so this means something re-used an existing grant.
      return back("norefresh");
    }

    client.setCredentials(tokens);

    const me = await google.oauth2({ version: "v2", auth: client }).userinfo.get();

    const supabase = await createClient();
    await supabase.from("google_oauth").upsert({
      id: 1,
      account_email: me.data.email ?? null,
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token ?? null,
      expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      scope: tokens.scope ?? null,
      connected_by: volunteer.id,
      connected_at: new Date().toISOString(),
    });

    return back("connected");
  } catch {
    return back("failed");
  }
}
