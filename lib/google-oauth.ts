import "server-only";
import { google } from "googleapis";
import { createClient } from "./supabase/server";

/**
 * Google OAuth for Drive uploads.
 *
 * A service account has zero storage quota, so it can create folders in
 * My Drive but never store a file — Google refuses with "Service Accounts
 * do not have storage quota". Uploading as a real user works, because the
 * files are owned by that account and consume its quota.
 *
 * Only the refresh token matters long term; access tokens are minted from
 * it on demand and expire in an hour.
 */

export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

export function isOAuthConfigured() {
  return Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET);
}

/** Where Google sends the user back. Must match the Cloud Console entry exactly. */
export function redirectUri() {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return `${base.replace(/\/$/, "")}/api/google/callback`;
}

export function oauthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    redirectUri(),
  );
}

/** Consent URL. `prompt: consent` forces a refresh token to be returned. */
export function consentUrl(state: string) {
  return oauthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [DRIVE_SCOPE, "https://www.googleapis.com/auth/userinfo.email"],
    state,
    include_granted_scopes: true,
  });
}

export interface OAuthStatus {
  configured: boolean;
  connected: boolean;
  accountEmail?: string;
  quotaUsed?: string;
  quotaLimit?: string;
  error?: string;
  hint?: string;
}

/** Reads the stored connection and confirms Google still accepts it. */
export async function getOAuthStatus(): Promise<OAuthStatus> {
  if (!isOAuthConfigured()) {
    return {
      configured: false,
      connected: false,
      hint: "Add GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET to .env.local, then restart.",
    };
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("google_oauth")
    .select("account_email, refresh_token")
    .eq("id", 1)
    .maybeSingle();

  if (!data?.refresh_token) {
    return { configured: true, connected: false, hint: "Press Connect and sign in with the account that should own the photos." };
  }

  try {
    const drive = await driveAsUser();
    const about = await drive.about.get({ fields: "storageQuota, user(emailAddress)" });
    const q = about.data.storageQuota;

    const gb = (v?: string | null) => (v ? `${(Number(v) / 1073741824).toFixed(1)} GB` : undefined);

    return {
      configured: true,
      connected: true,
      accountEmail: about.data.user?.emailAddress ?? data.account_email ?? undefined,
      quotaUsed: gb(q?.usage),
      quotaLimit: q?.limit ? gb(q.limit) : "unlimited",
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      configured: true,
      connected: false,
      accountEmail: data.account_email ?? undefined,
      error: message.includes("invalid_grant") ? "The saved authorisation was revoked or expired." : message,
      hint: "Press Connect to sign in again.",
    };
  }
}

/**
 * A Drive client acting as the connected user.
 *
 * googleapis refreshes the access token from the refresh token by itself,
 * so only the refresh token needs storing.
 */
export async function driveAsUser() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("google_oauth")
    .select("refresh_token")
    .eq("id", 1)
    .maybeSingle();

  if (!data?.refresh_token) throw new Error("Google account is not connected.");

  const client = oauthClient();
  client.setCredentials({ refresh_token: data.refresh_token });
  return google.drive({ version: "v3", auth: client });
}

/** True when uploads can actually be written to Drive right now. */
export async function canUploadToDrive() {
  if (!isOAuthConfigured()) return false;
  const supabase = await createClient();
  const { data } = await supabase
    .from("google_oauth")
    .select("refresh_token")
    .eq("id", 1)
    .maybeSingle();
  return Boolean(data?.refresh_token);
}
