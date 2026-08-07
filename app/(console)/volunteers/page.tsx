import { UsersRound } from "lucide-react";
import { Page, PageHeader } from "@/components/shell/app-shell";
import { Card, BlockPanel } from "@/components/ui/card";
import { LiveBadge } from "@/components/ui/badge";
import { StatTile } from "@/components/kpi-card";
import { ActivityFeed } from "@/components/timeline";
import { EmptyState } from "@/components/ui/feedback";
import { getRecentActivity, getScanCounts, getVolunteers } from "@/lib/queries";
import { getCurrentVolunteer } from "@/lib/supabase/server";
import { VolunteerRoster } from "./roster";
import { InviteVolunteer, type PendingInvite } from "./invite";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function VolunteersPage() {
  const [volunteers, activity, scans, me] = await Promise.all([
    getVolunteers(),
    getRecentActivity(10),
    getScanCounts(),
    getCurrentVolunteer(),
  ]);

  const supabase = await createClient();
  const { data: invites } = await supabase
    .from("volunteer_invites")
    .select("id, email, name, role, station")
    .is("claimed_at", null)
    .order("created_at", { ascending: false });

  const online = volunteers.filter((v) => v.online).length;
  const totalScans = Object.values(scans).reduce((a, b) => a + b, 0);

  return (
    <Page wide>
      <PageHeader title="Volunteers" description="Live roster across every station. Roles decide what each volunteer can do — the database enforces it, not just the UI." />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Registered volunteers" value={volunteers.length} sub="With console access" tone="accent" />
        <StatTile label="Marked online" value={online} sub="On duty now" tone="ok" />
        <StatTile label="Scans logged" value={totalScans} sub="All stations" tone="ok" />
        <StatTile label="Admins" value={volunteers.filter((v) => v.role === "admin").length} sub="Full access" tone="warn" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Admins can pre-assign roles before anyone has signed up. */}
          <InviteVolunteer
            invites={(invites ?? []) as PendingInvite[]}
            isAdmin={me?.role === "admin"}
          />

          {volunteers.length === 0 ? (
            <Card>
              <EmptyState
                icon={UsersRound} title="No volunteers yet" description="Volunteers appear here once they create an account. The first account to sign up becomes the event admin." />
            </Card>
          ) : (
            <VolunteerRoster
              volunteers={volunteers}
              isAdmin={me?.role === "admin"}
              currentUserId={me?.id ?? null}
            />
          )}
        </div>

        <div className="space-y-4">
          <BlockPanel label="Live activity" tone="accent" action={<LiveBadge />}>
            <div className="p-5">
              {activity.length > 0 ? (
                <ActivityFeed items={activity} />
              ) : (
                <p className="py-8 text-center text-[13px] text-ink-3">
                  No station activity logged yet.
                </p>
              )}
            </div>
          </BlockPanel>

          <BlockPanel label="Roles & permissions" tone="neutral">
            <div className="p-5">
              <ul className="divide-y divide-[rgb(var(--rule-soft))]">
                {[
                  { role: "Event Admin", access: "Full console, settings, departments" },
                  { role: "Registration", access: "Check-in and student records" },
                  { role: "Stage Coordinator", access: "Stage flow and queue" },
                  { role: "Booth Operator", access: "Photo booth, queue, gallery" },
                  { role: "Counter Staff", access: "Lunch and certificates" },
                  { role: "Media Runner", access: "Gallery upload only" },
                  { role: "View Only", access: "Read access, no mutations" },
                ].map((r) => (
                  <li key={r.role} className="py-2.5">
                    <p className="text-[13px] font-semibold text-ink">{r.role}</p>
                    <p className="mt-0.5 text-[11.5px] text-ink-3">{r.access}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-3  bg-accent p-3 text-[11.5px] leading-relaxed text-accent">
                Roles are enforced by row-level security in Postgres. A volunteer without the right
                role cannot write, even by calling the API directly.
              </p>
            </div>
          </BlockPanel>
        </div>
      </div>
    </Page>
  );
}
