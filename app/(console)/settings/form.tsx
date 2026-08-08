"use client";

import * as React from "react";
import {
  Bell,
  Building2,
  Camera,
  CloudUpload,
  MonitorPlay,
  GraduationCap,
  Lock,
  LogIn,
  Palette,
  Save,
  Timer,
} from "lucide-react";
import { BlockPanel } from "@/components/ui/card";
import { Input, Segmented, Switch } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/feedback";
import { useTheme } from "@/components/theme-provider";
import { DrivePanel } from "./drive-panel";
import { GooglePanel } from "./google-panel";
import type { OAuthStatus } from "@/lib/google-oauth";
import type { DriveStatus } from "@/lib/drive-actions";
import { updateEventSettings } from "@/lib/actions";
import { cn } from "@/lib/utils";
import type { DepartmentRow, EventSettingsRow } from "@/lib/supabase/types";

const SECTIONS = [
  { id: "branding", label: "Event branding", icon: GraduationCap },
  { id: "theme", label: "Appearance", icon: Palette },
  { id: "departments", label: "Departments", icon: Building2 },
  { id: "queue", label: "Queue settings", icon: Timer },
  { id: "booths", label: "Booths", icon: Camera },
  { id: "stream", label: "Live stream", icon: MonitorPlay },
  { id: "google", label: "Google account", icon: LogIn },
  { id: "drive", label: "Google Drive", icon: CloudUpload },
  { id: "notifications", label: "Notifications", icon: Bell },
];

export function SettingsForm({
  settings,
  departments,
  isAdmin,
  drive,
  googleAuth,
  googleRedirectUri,
  driveResult,
}: {
  settings: EventSettingsRow | null;
  departments: DepartmentRow[];
  isAdmin: boolean;
  drive: DriveStatus;
  googleAuth: OAuthStatus;
  googleRedirectUri: string;
  driveResult?: string;
}) {
  const { theme, set } = useTheme();
  const [active, setActive] = React.useState("branding");
  const [pending, setPending] = React.useState(false);
  const { push } = useToast();

  const [form, setForm] = React.useState({
    name: settings?.name ?? "",
    college: settings?.college ?? "",
    event_date: settings?.event_date ?? "",
    venue: settings?.venue ?? "",
    auto_assign: settings?.auto_assign ?? true,
    duplicate_block: settings?.duplicate_block ?? true,
    tv_ticker: settings?.tv_ticker ?? true,
    queue_warn_at: settings?.queue_warn_at ?? 25,
    holding_capacity: settings?.holding_capacity ?? 300,
    stream_url: settings?.stream_url ?? "",
    stream_live: settings?.stream_live ?? false,
  });

  const patch = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (pending) return;
    setPending(true);
    const result = await updateEventSettings(form);
    setPending(false);

    if (!result.ok) {
      push({ title: "Could not save", description: result.error, tone: "bad" });
      return;
    }
    push({ title: "Settings saved", description: "Changes apply immediately", tone: "ok" });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <nav className="lg:sticky lg:top-20 lg:self-start">
        <ul className="no-scrollbar flex gap-1.5 overflow-x-auto pb-2 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
          {SECTIONS.map((s) => (
            <li key={s.id} className="shrink-0">
              <button
                onClick={() => {
                  setActive(s.id);
                  document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={cn(
                  "tap flex w-full items-center gap-2.5  px-3.5 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors",
                  active === s.id
                    ? "bg-accent text-accent"
                    : "text-ink-2 hover:bg-paper-2 hover:text-ink",
                )} >
                <s.icon className="h-4 w-4 shrink-0" />
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-4">
        {!isAdmin && (
          <div className="flex items-start gap-3  bg-warn-soft p-4">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
            <p className="text-[12.5px] leading-relaxed text-warn">
              Only event admins can change these settings. You can review them here, but saving will
              be rejected by the database.
            </p>
          </div>
        )}

        <BlockPanel label="Event branding" tone="accent" className="scroll-mt-20">
          <div id="branding" className="space-y-4 p-5">
            <Field label="Event name" hint="Appears in the sidebar and on the TV board">
              <Input value={form.name} onChange={(e) => patch("name", e.target.value)} disabled={!isAdmin} />
            </Field>
            <Field label="Institution">
              <Input value={form.college} onChange={(e) => patch("college", e.target.value)} disabled={!isAdmin} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Event date">
                <Input value={form.event_date} onChange={(e) => patch("event_date", e.target.value)} disabled={!isAdmin} />
              </Field>
              <Field label="Venue">
                <Input value={form.venue} onChange={(e) => patch("venue", e.target.value)} disabled={!isAdmin} />
              </Field>
            </div>
          </div>
        </BlockPanel>

        <BlockPanel label="Appearance" tone="pop" className="scroll-mt-20">
          <div id="theme" className="space-y-5 p-5">
            <Field label="Theme" hint="Applies to your session only">
              <Segmented
                value={theme}
                onChange={(v) => set(v as "light" | "dark")}
                options={[
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                ]} />
            </Field>
          </div>
        </BlockPanel>

        <BlockPanel
          label={`Departments · ${departments.length}`} tone="neutral"
          className="scroll-mt-20" >
          <div id="departments" className="p-5">
            <ul className="divide-y divide-[rgb(var(--rule-soft))]">
              {departments.map((d) => (
                <li key={d.code} className="flex items-center gap-3 py-3">
                  <span className="h-8 w-1 shrink-0 " style={{ backgroundColor: d.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-ink">{d.name}</p>
                    <p className="text-[11.5px] text-ink-3">{d.code}</p>
                  </div>
                  <Badge tone="neutral" size="sm">{d.short}</Badge>
                </li>
              ))}
            </ul>
          </div>
        </BlockPanel>

        <BlockPanel label="Queue settings" tone="warn" className="scroll-mt-20">
          <div id="queue" className="space-y-4 p-5">
            <Row label="Automatic booth assignment" hint="Route each graduate to the booth with the shortest projected wait"
              checked={form.auto_assign}
              onChange={() => patch("auto_assign", !form.auto_assign)}
              disabled={!isAdmin} />
            <Row label="Block duplicate redemptions" hint="Reject a second lunch or certificate scan for the same graduate"
              checked={form.duplicate_block}
              onChange={() => patch("duplicate_block", !form.duplicate_block)}
              disabled={!isAdmin} />
            <Row label="TV announcement ticker" hint="Scroll announcements along the bottom of the display board"
              checked={form.tv_ticker}
              onChange={() => patch("tv_ticker", !form.tv_ticker)}
              disabled={!isAdmin} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Queue capacity warning" hint="Flag a station above this many waiting">
                <Input type="number"
                  value={form.queue_warn_at}
                  onChange={(e) => patch("queue_warn_at", Number(e.target.value))}
                  disabled={!isAdmin} />
              </Field>
              <Field label="Holding area capacity">
                <Input type="number"
                  value={form.holding_capacity}
                  onChange={(e) => patch("holding_capacity", Number(e.target.value))}
                  disabled={!isAdmin} />
              </Field>
            </div>
          </div>
        </BlockPanel>

        <BlockPanel label="Booth configuration" tone="ok" className="scroll-mt-20">
          <div id="booths" className="p-5">
            <p className="text-[13px] leading-relaxed text-ink-3">
              Booth records live in the database and are edited from the Queue Monitor. Adding or
              renaming a booth requires an admin.
            </p>
          </div>
        </BlockPanel>

        {/*
          The player on every graduate's hub reads these two fields. Paste
          any normal YouTube or Facebook link - the hub converts it to an
          embed itself, so nobody has to hunt for an "embed URL".
        */}
        <BlockPanel
          label="Live stream"
          tone={form.stream_live ? "ok" : "ink"}
          className="scroll-mt-20"
          action={
            <Badge tone={form.stream_live ? "ok" : "warn"} size="sm" dot>
              {form.stream_live ? "Live" : "Off"}
            </Badge>
          }
        >
          <div id="stream" className="space-y-4 p-5">
            <Field
              label="Stream link"
              hint="YouTube or Facebook. Paste the normal share link — /live/, /watch?v= and youtu.be all work."
            >
              <Input
                type="url"
                inputMode="url"
                placeholder="https://www.youtube.com/live/…"
                value={form.stream_url}
                onChange={(e) => patch("stream_url", e.target.value)}
                disabled={!isAdmin}
              />
            </Field>

            <Row
              label="Show the stream on graduate hubs"
              hint="Turn on when the broadcast starts. Every hub picks it up within a minute."
              checked={form.stream_live}
              onChange={() => patch("stream_live", !form.stream_live)}
              disabled={!isAdmin}
            />

            <p className="text-[12px] leading-relaxed text-ink-3">
              The stream must be public or unlisted, with embedding allowed in YouTube Studio — a
              private stream shows a black player to everyone but you.
            </p>
          </div>
        </BlockPanel>

        {/* Signing in as a real user is what makes uploads possible. */}
        <BlockPanel
          label="Google account"
          tone={googleAuth.connected ? "ok" : "accent"}
          className="scroll-mt-20"
          action={
            <Badge tone={googleAuth.connected ? "ok" : "warn"} size="sm" dot>
              {googleAuth.connected ? "Connected" : "Not connected"}
            </Badge>
          } >
          <div id="google">
            <GooglePanel
              status={googleAuth}
              redirectUri={googleRedirectUri}
              isAdmin={isAdmin}
              result={driveResult} />
          </div>
        </BlockPanel>

        <BlockPanel
          label="Google Drive"
          tone={drive.connected ? "ok" : "bad"}
          className="scroll-mt-20"
          action={
            <Badge tone={drive.connected ? "ok" : "warn"} size="sm" dot>
              {drive.connected ? "Connected" : "Not connected"}
            </Badge>
          } >
          <div id="drive">
            <DrivePanel
              initial={drive}
              savedFolder={settings?.drive_root_folder ?? null}
              isAdmin={isAdmin} />
          </div>
        </BlockPanel>

        <BlockPanel label="Notifications" tone="accent" className="scroll-mt-20">
          <div id="notifications" className="p-5">
            <p className="text-[13px] leading-relaxed text-ink-3">
              In-app toasts are active across every station. Email and push delivery are not
              configured in this build.
            </p>
          </div>
        </BlockPanel>

        <div className="flex justify-end gap-2 pb-4">
          <Button size="lg" onClick={save} disabled={!isAdmin || pending}>
            <Save className="h-4 w-4" />
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-ink">{label}</label>
      {hint && <p className="mt-0.5 text-[12px] text-ink-3">{hint}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Row({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", disabled && "opacity-55")}>
      <div className="min-w-0">
        <p className="text-[13.5px] font-medium text-ink">{label}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-ink-3">{hint}</p>
      </div>
      <Switch checked={checked} onChange={disabled ? () => {} : onChange} label={label} />
    </div>
  );
}
