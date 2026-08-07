"use client";

import * as React from "react";
import { CheckCircle2, CircleAlert, ExternalLink, HardDrive, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { OAuthStatus } from "@/lib/google-oauth";

const SETUP_STEPS = [
  "Google Cloud Console → APIs & Services → Credentials",
  "Create credentials → OAuth client ID → Web application",
  "Add the redirect URI shown below, exactly as written",
  "Copy the client ID and secret into .env.local, then restart",
];

/**
 * Google account connection for Drive uploads.
 *
 * This exists because a service account has no storage quota: it can make
 * folders in My Drive but never store a file there. Uploading as a real
 * user works, so photos are owned by whichever account is connected here.
 */
export function GooglePanel({
  status,
  redirectUri,
  isAdmin,
  result,
}: {
  status: OAuthStatus;
  redirectUri: string;
  isAdmin: boolean;
  result?: string;
}) {
  const MESSAGES: Record<string, { text: string; ok: boolean }> = {
    connected: { text: "Google account connected. Photos will upload to its Drive.", ok: true },
    denied: { text: "Consent was cancelled, so nothing changed.", ok: false },
    forbidden: { text: "Only an event admin can connect a Google account.", ok: false },
    unconfigured: { text: "Add the OAuth client ID and secret first.", ok: false },
    badstate: { text: "That sign-in could not be verified. Please try again.", ok: false },
    norefresh: {
      text: "Google did not return a refresh token. Remove this app at myaccount.google.com/permissions, then connect again.",
      ok: false,
    },
    failed: { text: "Could not complete the sign-in.", ok: false },
  };
  const message = result ? MESSAGES[result] : undefined;

  return (
    <div className="space-y-4 p-5">
      {message && (
        <div className={`flex items-start gap-2.5 rule p-3.5 ${message.ok ? "bg-ok" : "bg-warn"}`}>
          {message.ok ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ink-black" strokeWidth={2.4} />
          ) : (
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-ink-black" strokeWidth={2.4} />
          )}
          <p className="text-[12.5px] leading-snug font-bold text-ink-black">{message.text}</p>
        </div>
      )}

      {/* Status */}
      <div
        className={`flex items-start gap-3 rule p-3.5 ${
          status.connected ? "bg-ok" : status.configured ? "bg-warn" : "bg-paper-2"
        }`}
      >
        {status.connected ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-ink-black" strokeWidth={2.4} />
        ) : (
          <CircleAlert
            className={`mt-0.5 h-5 w-5 shrink-0 ${status.configured ? "text-ink-black" : "text-ink-3"}`}
            strokeWidth={2.4}
          />
        )}
        <div className="min-w-0 flex-1">
          <p className={`text-[13.5px] font-bold ${status.configured ? "text-ink-black" : "text-ink"}`}>
            {status.connected
              ? "Connected — photos upload to Google Drive"
              : status.configured
                ? "Not connected yet"
                : "OAuth client not configured"}
          </p>

          {status.accountEmail && (
            <p
              className={`mt-1 truncate font-mono text-[11px] ${
                status.configured ? "text-ink-black/75" : "text-ink-3"
              }`}
            >
              {status.accountEmail}
            </p>
          )}

          {status.connected && status.quotaLimit && (
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-[12px] text-ink-black/80">
              <HardDrive className="h-3.5 w-3.5" />
              {status.quotaUsed} of {status.quotaLimit} used
            </p>
          )}

          {status.error && (
            <p className="mt-1.5 text-[12px] leading-snug font-medium text-ink-black">{status.error}</p>
          )}
          {status.hint && (
            <p
              className={`mt-1.5 text-[12px] leading-snug ${
                status.configured ? "text-ink-black/80" : "text-ink-3"
              }`}
            >
              {status.hint}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <a href="/api/google/connect">
          <Button disabled={!isAdmin || !status.configured}>
            <LogIn className="h-4 w-4" />
            {status.connected ? "Reconnect a different account" : "Connect Google account"}
          </Button>
        </a>
        {status.connected && (
          <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">
            <Button variant="secondary">
              <ExternalLink className="h-4 w-4" />
              Manage access
            </Button>
          </a>
        )}
      </div>

      {!isAdmin && (
        <p className="text-[11.5px] text-ink-3">Only an event admin can change this.</p>
      )}

      {/* Setup, shown until the client exists */}
      {!status.configured && (
        <div className="rule bg-paper-2 p-3.5">
          <p className="stencil mb-2 text-[9.5px] text-ink-2">One-time setup</p>
          <ol className="space-y-1.5">
            {SETUP_STEPS.map((step, i) => (
              <li key={step} className="flex gap-2.5 text-[12px] leading-snug text-ink-2">
                <span className="stencil shrink-0 text-[9.5px] text-pop">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>

          <p className="stencil mt-3 mb-1 text-[9px] text-ink-3">Authorised redirect URI</p>
          <code className="block overflow-x-auto rule bg-paper px-2.5 py-2 font-mono text-[11px] text-ink">
            {redirectUri}
          </code>
          <p className="mt-2 text-[11.5px] leading-snug text-ink-3">
            It must match character for character, including http vs https and the port.
          </p>
        </div>
      )}

      <p className="text-[11.5px] leading-relaxed text-ink-3">
        Photos are owned by the connected account and use its Drive storage. A service account
        cannot be used for this: Google gives it no storage quota, so every upload is refused.
      </p>

      <div className="rule bg-paper-2 p-3.5">
        <Badge tone="neutral" size="sm">Scope</Badge>
        <p className="mt-2 text-[11.5px] leading-relaxed text-ink-3">
          Access is limited to <span className="font-mono">drive.file</span> — this app can only
          see and manage files it creates itself, never the rest of that account&rsquo;s Drive.
        </p>
      </div>
    </div>
  );
}
