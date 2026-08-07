"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, MailPlus, Trash2, UserPlus } from "lucide-react";
import { BlockPanel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/feedback";
import { inviteVolunteer, revokeInvite, type VolunteerRoleValue } from "@/lib/actions";

const ROLES: { value: VolunteerRoleValue; label: string }[] = [
  { value: "registration", label: "Registration" },
  { value: "stage", label: "Stage coordinator" },
  { value: "booth", label: "Booth operator" },
  { value: "counter", label: "Counter staff" },
  { value: "media", label: "Media runner" },
  { value: "admin", label: "Event admin" },
  { value: "viewer", label: "View only" },
];

export interface PendingInvite {
  id: string;
  email: string;
  name: string | null;
  role: string;
  station: string | null;
}

/**
 * Admin invite panel.
 *
 * Creating auth users outright would need the service_role key, which must
 * never reach the browser. Instead the role is pre-assigned against an
 * email; the signup trigger grants it when that person registers.
 */
export function InviteVolunteer({
  invites,
  isAdmin,
}: {
  invites: PendingInvite[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [role, setRole] = React.useState<VolunteerRoleValue>("registration");
  const [station, setStation] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const { push } = useToast();

  if (!isAdmin) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setPending(true);

    const result = await inviteVolunteer({ email, name, role, station });
    setPending(false);

    if (!result.ok) {
      push({ title: "Could not add", description: result.error, tone: "bad" });
      return;
    }

    const updated = (result.data as { updated?: boolean })?.updated;
    push({
      title: updated ? "Role updated" : "Volunteer added",
      description: updated
        ? `${email} already had an account — their role was changed.`
        : `${email} gets ${role} access when they sign up.`,
      tone: "ok",
    });

    setEmail("");
    setName("");
    setStation("");
    router.refresh();
  };

  const drop = async (id: string, who: string) => {
    const result = await revokeInvite(id);
    if (!result.ok) {
      push({ title: "Could not remove", description: result.error, tone: "bad" });
      return;
    }
    push({ title: "Invite removed", description: who, tone: "ok" });
    router.refresh();
  };

  return (
    <BlockPanel
      label="Add a volunteer"
      tone="accent"
      action={
        invites.length > 0 ? (
          <Badge tone="ink" size="sm">{invites.length} pending</Badge>
        ) : undefined
      }
    >
      <form onSubmit={submit} className="space-y-3 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="stencil mb-1.5 block text-[9.5px] text-ink-3">Email</label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="volunteer@cek.ac.in"
            />
          </div>
          <div>
            <label className="stencil mb-1.5 block text-[9.5px] text-ink-3">Name (optional)</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Anagha Krishnan" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="stencil mb-1.5 block text-[9.5px] text-ink-3">Role</label>
            <Select
              value={role}
              onChange={(v) => setRole(v as VolunteerRoleValue)}
              options={ROLES}
              aria-label="Role"
            />
          </div>
          <div>
            <label className="stencil mb-1.5 block text-[9.5px] text-ink-3">Station (optional)</label>
            <Input
              value={station}
              onChange={(e) => setStation(e.target.value)}
              placeholder="Desk 1 — Main Gate"
            />
          </div>
        </div>

        <Button type="submit" block size="lg" disabled={pending}>
          {pending ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <UserPlus className="h-[18px] w-[18px]" />}
          {pending ? "Saving…" : "Add volunteer"}
        </Button>

        <p className="text-[11.5px] leading-snug text-ink-3">
          They sign up at <span className="font-mono">/signup</span> with this email and get the
          role automatically. If they already have an account, their role is updated instead.
        </p>
      </form>

      {invites.length > 0 && (
        <div className="rule-t p-5">
          <p className="stencil mb-2.5 flex items-center gap-1.5 text-[9.5px] text-ink-2">
            <MailPlus className="h-3.5 w-3.5" />
            Waiting to sign up
          </p>
          <ul>
            {invites.map((i) => (
              <li key={i.id} className="flex items-center gap-3 py-2.5 not-last:rule-b">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-ink">{i.name || i.email}</p>
                  <p className="truncate text-[11.5px] text-ink-3">
                    {i.name ? `${i.email} · ` : ""}
                    {i.station ?? "No station"}
                  </p>
                </div>
                <Badge tone="neutral" size="sm">{i.role}</Badge>
                <button
                  onClick={() => drop(i.id, i.email)}
                  aria-label={`Remove invite for ${i.email}`}
                  className="tap grid h-8 w-8 place-items-center rule bg-paper text-ink-3 transition-colors hover:bg-bad hover:text-white"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </BlockPanel>
  );
}
