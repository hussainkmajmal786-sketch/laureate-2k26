"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, Switch } from "@/components/ui/input";
import { useToast } from "@/components/ui/feedback";
import { updateVolunteer, type VolunteerRoleValue } from "@/lib/actions";
import type { VolunteerRow } from "@/lib/supabase/types";

const ROLES: { value: VolunteerRoleValue; label: string }[] = [
  { value: "admin", label: "EVENT ADMIN" },
  { value: "registration", label: "REGISTRATION" },
  { value: "stage", label: "STAGE COORDINATOR" },
  { value: "booth", label: "BOOTH OPERATOR" },
  { value: "counter", label: "COUNTER STAFF" },
  { value: "media", label: "MEDIA RUNNER" },
  { value: "viewer", label: "VIEW ONLY" },
];

const ROLE_TONE: Record<string, "accent" | "ok" | "warn" | "neutral"> = {
  admin: "accent",
  registration: "ok",
  stage: "ok",
  booth: "ok",
  counter: "warn",
  media: "warn",
  neutral: "neutral",
  viewer: "neutral",
};

/**
 * The roster. Admins can assign a role and station here — without this,
 * every volunteer who signs up is stuck as a read-only viewer and cannot
 * work a station.
 */
export function VolunteerRoster({
  volunteers,
  isAdmin,
  currentUserId,
}: {
  volunteers: VolunteerRow[];
  isAdmin: boolean;
  currentUserId: string | null;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {volunteers.map((v) => (
        <VolunteerCard
          key={v.id}
          volunteer={v}
          isAdmin={isAdmin}
          isSelf={v.id === currentUserId}
        />
      ))}
    </div>
  );
}

function VolunteerCard({
  volunteer: v,
  isAdmin,
  isSelf,
}: {
  volunteer: VolunteerRow;
  isAdmin: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [role, setRole] = React.useState<VolunteerRoleValue>(v.role);
  const [station, setStation] = React.useState(v.station ?? "");
  const { push } = useToast();

  const save = async (patch: { role?: VolunteerRoleValue; station?: string; online?: boolean }) => {
    setPending(true);
    const result = await updateVolunteer({ id: v.id, ...patch });
    setPending(false);

    if (!result.ok) {
      push({ title: "COULD NOT SAVE", description: result.error, tone: "bad" });
      // Roll the control back so it never shows a value the database refused.
      if (patch.role) setRole(v.role);
      if (patch.station !== undefined) setStation(v.station ?? "");
      return;
    }

    push({ title: "VOLUNTEER UPDATED", description: v.name, tone: "ok" });
    router.refresh();
  };

  return (
    <Card className="h-full overflow-hidden">
      <div className="flex items-start gap-3.5 p-4">
        <div className="relative">
          <Avatar name={v.name} hue={v.hue} size="md" />
          <span
            className={`absolute -right-1 -bottom-1 h-3.5 w-3.5 rule ${
              v.online ? "bg-ok" : "bg-paper-3"
            }`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[14px] font-black tracking-[-0.02em] text-ink">
                {v.name}
                {isSelf && <span className="ml-1.5 text-[11px] font-bold text-ink-3">(you)</span>}
              </p>
              <p className="truncate text-[12px] text-ink-3">{v.email}</p>
            </div>
            <Badge tone={ROLE_TONE[v.role] ?? "neutral"} size="sm">
              {ROLES.find((r) => r.value === v.role)?.label ?? v.role}
            </Badge>
          </div>
        </div>
      </div>

      {isAdmin ? (
        <div className="space-y-3 rule-t bg-paper-2 p-3.5">
          <div>
            <label className="stencil mb-1.5 block text-[9px] text-ink-3">ASSIGN ROLE</label>
            <Select
              value={role}
              aria-label={`Role for ${v.name}`}
              options={ROLES}
              onChange={(next) => {
                const value = next as VolunteerRoleValue;
                setRole(value);
                save({ role: value });
              }}
            />
          </div>

          <div>
            <label className="stencil mb-1.5 block text-[9px] text-ink-3">STATION</label>
            <input
              value={station}
              onChange={(e) => setStation(e.target.value)}
              onBlur={() => station !== (v.station ?? "") && save({ station })}
              placeholder="Desk 1 — Main Gate"
              className="h-11 w-full rule bg-paper px-3 text-[13.5px] font-medium text-ink outline-none placeholder:font-normal placeholder:text-ink-3 focus:drop-2"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="stencil text-[9px] text-ink-3">ON DUTY</span>
            <Switch
              checked={v.online}
              label={`On duty: ${v.name}`}
              onChange={(next) => save({ online: next })}
            />
          </div>

          {pending && (
            <p className="stencil flex items-center gap-1.5 text-[9px] text-ink-3">
              <Loader2 className="h-3 w-3 animate-spin" />
              SAVING…
            </p>
          )}
        </div>
      ) : (
        <div className="rule-t bg-paper-2 p-3.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {v.station && <Badge tone="neutral" size="sm">{v.station}</Badge>}
            <Badge tone={v.online ? "ok" : "outline"} size="sm">
              {v.online ? "ON DUTY" : "OFF DUTY"}
            </Badge>
          </div>
          <p className="stencil mt-2.5 flex items-center gap-1.5 text-[9px] text-ink-3">
            <ShieldCheck className="h-3 w-3" />
            ONLY ADMINS CAN CHANGE ROLES
          </p>
        </div>
      )}
    </Card>
  );
}
