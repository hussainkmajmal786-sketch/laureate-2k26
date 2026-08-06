"use client";

import * as React from "react";
import {
  Bell,
  Building2,
  Camera,
  Check,
  CloudUpload,
  ExternalLink,
  GraduationCap,
  Palette,
  Plus,
  Save,
  Timer,
  Trash2,
  UsersRound,
} from "lucide-react";
import { Page, PageHeader } from "@/components/shell/app-shell";
import { BlockPanel } from "@/components/ui/card";
import { Input, Segmented, Switch } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal, useToast } from "@/components/ui/feedback";
import { useTheme } from "@/components/theme-provider";
import { DEPARTMENTS, EVENT } from "@/lib/data";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "branding", label: "BRANDING", icon: GraduationCap },
  { id: "theme", label: "APPEARANCE", icon: Palette },
  { id: "departments", label: "DEPARTMENTS", icon: Building2 },
  { id: "queue", label: "QUEUE", icon: Timer },
  { id: "booths", label: "BOOTHS", icon: Camera },
  { id: "roles", label: "ROLES", icon: UsersRound },
  { id: "drive", label: "DRIVE", icon: CloudUpload },
  { id: "notifications", label: "ALERTS", icon: Bell },
];

const ACCENTS = [
  { name: "Sapphire", value: "#2563eb" },
  { name: "Pink", value: "#ec4899" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Green", value: "#10b981" },
  { name: "Violet", value: "#6d28d9" },
  { name: "Orange", value: "#f97316" },
];

export default function SettingsPage() {
  const { theme, set } = useTheme();
  const [active, setActive] = React.useState("branding");
  const [accent, setAccent] = React.useState("#2563eb");
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);
  const { push } = useToast();

  const [toggles, setToggles] = React.useState({
    autoAssign: true,
    duplicateBlock: true,
    tvTicker: true,
    driveSync: false,
    pushAlerts: true,
    queueAlerts: true,
    dailyDigest: false,
    soundOnScan: true,
  });

  const flip = (k: keyof typeof toggles) => setToggles((t) => ({ ...t, [k]: !t[k] }));
  const save = () => push({ title: "SETTINGS SAVED", description: "Changes apply immediately", tone: "ok" });

  return (
    <Page>
      <PageHeader
        title="SETTINGS"
        description="Event configuration, appearance, station rules and integrations."
        actions={
          <Button size="md" onClick={save}>
            <Save className="h-4 w-4" strokeWidth={2.6} />
            SAVE CHANGES
          </Button>
        }
      />

      <div className="grid gap-3 lg:grid-cols-[200px_1fr]">
        {/* Section nav */}
        <nav className="lg:sticky lg:top-20 lg:self-start">
          <ul className="no-scrollbar flex gap-1.5 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
            {SECTIONS.map((s) => (
              <li key={s.id} className="shrink-0">
                <button
                  onClick={() => {
                    setActive(s.id);
                    document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={cn(
                    "stencil tap flex w-full items-center gap-2 rule px-3 py-2.5 text-[9.5px] whitespace-nowrap transition-colors",
                    active === s.id
                      ? "bg-[rgb(var(--ink))] text-[rgb(var(--paper))]"
                      : "bg-paper text-ink-2 hover:bg-paper-2 hover:text-ink",
                  )}
                >
                  <s.icon className="h-4 w-4 shrink-0" strokeWidth={2.4} />
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-3">
          <BlockPanel label="EVENT BRANDING" tone="accent" className="scroll-mt-20">
            <div id="branding" className="space-y-3.5 p-4">
              <Field label="EVENT NAME" hint="Shown in the sidebar and on the TV board">
                <Input defaultValue={EVENT.name} />
              </Field>
              <Field label="INSTITUTION">
                <Input defaultValue={EVENT.college} />
              </Field>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field label="EVENT DATE"><Input defaultValue={EVENT.date} /></Field>
                <Field label="VENUE"><Input defaultValue="Main Auditorium, CEK" /></Field>
              </div>
              <Field label="EVENT LOGO" hint="SVG or PNG, at least 512×512">
                <div className="flex items-center gap-3">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rule bg-pop">
                    <GraduationCap className="h-6 w-6 text-white" strokeWidth={2.6} />
                  </span>
                  <Button variant="secondary" size="md">REPLACE LOGO</Button>
                </div>
              </Field>
            </div>
          </BlockPanel>

          <BlockPanel label="APPEARANCE" tone="pop" className="scroll-mt-20">
            <div id="theme" className="space-y-4 p-4">
              <Field label="THEME">
                <Segmented
                  value={theme}
                  onChange={(v) => set(v as "light" | "dark")}
                  options={[
                    { value: "light", label: "LIGHT" },
                    { value: "dark", label: "DARK" },
                  ]}
                />
              </Field>

              <Field label="ACCENT COLOUR" hint="Applies to buttons, links and active states">
                <div className="flex flex-wrap gap-2">
                  {ACCENTS.map((a) => (
                    <button
                      key={a.value}
                      onClick={() => { setAccent(a.value); push({ title: `ACCENT: ${a.name.toUpperCase()}`, tone: "info" }); }}
                      aria-label={a.name}
                      className="press-sm tap grid h-11 w-11 place-items-center rule drop-1"
                      style={{ backgroundColor: a.value }}
                    >
                      {accent === a.value && <Check className="h-5 w-5 text-white" strokeWidth={4} />}
                    </button>
                  ))}
                </div>
              </Field>

              <Row
                label="SOUND ON SCAN"
                hint="A short confirmation tone at every station"
                checked={toggles.soundOnScan}
                onChange={() => flip("soundOnScan")}
              />
            </div>
          </BlockPanel>

          <BlockPanel
            label={`DEPARTMENTS · ${DEPARTMENTS.length}`}
            tone="ink"
            className="scroll-mt-20"
            action={
              <Button size="sm" variant="pop" className="h-6 px-2 text-[9px]">
                <Plus className="h-3 w-3" strokeWidth={3} />
                ADD
              </Button>
            }
          >
            <div id="departments" className="p-4">
              <ul>
                {DEPARTMENTS.map((d) => (
                  <li key={d.code} className="flex items-center gap-3 py-2.5 not-last:rule-b">
                    <span
                      className="stencil grid h-9 w-11 shrink-0 place-items-center rule text-[9px] text-white"
                      style={{ backgroundColor: d.color }}
                    >
                      {d.code}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold text-ink">{d.name}</p>
                      <p className="stencil mt-0.5 text-[8.5px] text-ink-3">{d.total} GRADUATES</p>
                    </div>
                    <button
                      onClick={() => setConfirmDelete(d.name)}
                      aria-label={`Remove ${d.code}`}
                      className="tap grid h-8 w-8 place-items-center rule bg-paper text-ink-3 transition-colors hover:bg-bad hover:text-white"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2.4} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </BlockPanel>

          <BlockPanel label="QUEUE SETTINGS" tone="warn" className="scroll-mt-20">
            <div id="queue" className="space-y-4 p-4">
              <Row
                label="AUTOMATIC BOOTH ASSIGNMENT"
                hint="Route each graduate to the booth with the shortest projected wait"
                checked={toggles.autoAssign}
                onChange={() => flip("autoAssign")}
              />
              <Row
                label="BLOCK DUPLICATE REDEMPTIONS"
                hint="Reject a second lunch or certificate scan for the same graduate"
                checked={toggles.duplicateBlock}
                onChange={() => flip("duplicateBlock")}
              />
              <Row
                label="TV ANNOUNCEMENT TICKER"
                hint="Scroll announcements along the bottom of the display board"
                checked={toggles.tvTicker}
                onChange={() => flip("tvTicker")}
              />
              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field label="QUEUE WARNING AT" hint="Flag the station above this many waiting">
                  <Input type="number" defaultValue={25} />
                </Field>
                <Field label="HOLDING AREA CAPACITY">
                  <Input type="number" defaultValue={300} />
                </Field>
              </div>
            </div>
          </BlockPanel>

          <BlockPanel
            label="BOOTH CONFIGURATION"
            tone="ok"
            className="scroll-mt-20"
            action={
              <Button size="sm" variant="secondary" className="h-6 px-2 text-[9px]">
                <Plus className="h-3 w-3" strokeWidth={3} />
                ADD BOOTH
              </Button>
            }
          >
            <div id="booths" className="space-y-3 p-4">
              {[
                { id: 1, name: "North Wing", shooter: "Arun Photography", minutes: 3 },
                { id: 2, name: "Auditorium Foyer", shooter: "Frames by Nithin", minutes: 4 },
              ].map((b) => (
                <div key={b.id} className="rule bg-paper-2">
                  <div className="flex items-center justify-between rule-b px-3 py-2">
                    <p className="stencil text-[10px] text-ink">BOOTH {b.id}</p>
                    <Badge tone="ok" size="sm">ACTIVE</Badge>
                  </div>
                  <div className="grid gap-3 p-3 sm:grid-cols-3">
                    <Field label="LOCATION" compact><Input defaultValue={b.name} className="h-10" /></Field>
                    <Field label="PHOTOGRAPHER" compact><Input defaultValue={b.shooter} className="h-10" /></Field>
                    <Field label="AVG. SESSION (MIN)" compact>
                      <Input type="number" defaultValue={b.minutes} className="h-10" />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </BlockPanel>

          <BlockPanel label="VOLUNTEER ROLES" tone="accent" className="scroll-mt-20">
            <div id="roles" className="p-4">
              <ul>
                {[
                  { role: "Event Admin", access: "Full console access", count: 2, tone: "pop" as const },
                  { role: "Registration Lead", access: "Registration, students", count: 3, tone: "ok" as const },
                  { role: "Stage Coordinator", access: "Stage, queue monitor", count: 2, tone: "ok" as const },
                  { role: "Booth Operator", access: "Photo booth, gallery", count: 2, tone: "ok" as const },
                  { role: "Counter Staff", access: "Lunch, certificates", count: 4, tone: "neutral" as const },
                  { role: "Media Runner", access: "Gallery upload only", count: 1, tone: "neutral" as const },
                ].map((r) => (
                  <li key={r.role} className="flex items-center gap-3 py-2.5 not-last:rule-b">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-ink">{r.role}</p>
                      <p className="stencil mt-0.5 text-[8.5px] text-ink-3">{r.access}</p>
                    </div>
                    <Badge tone={r.tone} size="sm">{r.count} ASSIGNED</Badge>
                  </li>
                ))}
              </ul>
            </div>
          </BlockPanel>

          <BlockPanel
            label="GOOGLE DRIVE"
            tone="bad"
            className="scroll-mt-20"
            action={<Badge tone="ink" size="sm">NOT CONNECTED</Badge>}
          >
            <div id="drive" className="space-y-3.5 p-4">
              <div className="rule bg-warn p-3">
                <p className="text-[12px] leading-snug font-bold text-ink-black">
                  This is an interface prototype — Drive integration is not wired up. Connecting an
                  account here would sync every captured frame into a dated folder structure.
                </p>
              </div>
              <Field label="DESTINATION FOLDER">
                <Input defaultValue="/Laureate 2K26/Photos" disabled />
              </Field>
              <Row
                label="AUTO-SYNC ON CAPTURE"
                hint="Upload each frame as soon as the session completes"
                checked={toggles.driveSync}
                onChange={() => flip("driveSync")}
                disabled
              />
              <Button variant="secondary" size="md">
                <ExternalLink className="h-4 w-4" strokeWidth={2.6} />
                CONNECT GOOGLE ACCOUNT
              </Button>
            </div>
          </BlockPanel>

          <BlockPanel label="NOTIFICATIONS" tone="pop" className="scroll-mt-20">
            <div id="notifications" className="space-y-4 p-4">
              <Row
                label="PUSH ALERTS"
                hint="Browser notifications for critical events"
                checked={toggles.pushAlerts}
                onChange={() => flip("pushAlerts")}
              />
              <Row
                label="QUEUE BACKLOG ALERTS"
                hint="Warn when any station exceeds its capacity threshold"
                checked={toggles.queueAlerts}
                onChange={() => flip("queueAlerts")}
              />
              <Row
                label="DAILY DIGEST EMAIL"
                hint="A summary report at the close of the ceremony"
                checked={toggles.dailyDigest}
                onChange={() => flip("dailyDigest")}
              />
              <Field label="ALERT RECIPIENTS" hint="Comma-separated email addresses">
                <Input defaultValue="events@cek.ac.in, principal@cek.ac.in" />
              </Field>
            </div>
          </BlockPanel>

          <div className="flex justify-end gap-2 pb-4">
            <Button variant="ghost" size="lg">DISCARD</Button>
            <Button size="lg" onClick={save}>
              <Save className="h-4 w-4" strokeWidth={2.6} />
              SAVE CHANGES
            </Button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => push({ title: "DEPARTMENT REMOVED", description: confirmDelete ?? "", tone: "bad" })}
        title="REMOVE DEPARTMENT?"
        description={`${confirmDelete} and its graduate records would be unlinked from this event. This cannot be undone.`}
        confirmLabel="REMOVE"
        destructive
      />
    </Page>
  );
}

function Field({
  label,
  hint,
  children,
  compact = false,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div>
      <label className={cn("stencil block text-ink", compact ? "text-[8.5px]" : "text-[9.5px]")}>
        {label}
      </label>
      {hint && <p className="mt-1 text-[11.5px] text-ink-3">{hint}</p>}
      <div className="mt-1.5">{children}</div>
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
    <div className={cn("flex items-start justify-between gap-4", disabled && "opacity-50")}>
      <div className="min-w-0">
        <p className="stencil text-[9.5px] text-ink">{label}</p>
        <p className="mt-1 text-[11.5px] leading-snug text-ink-3">{hint}</p>
      </div>
      <Switch checked={checked} onChange={disabled ? () => {} : onChange} label={label} />
    </div>
  );
}
