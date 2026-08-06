import { UsersRound } from "lucide-react";
import { Page, PageHeader } from "@/components/shell/app-shell";
import { Card, BlockPanel } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge, LiveBadge } from "@/components/ui/badge";
import { StatTile } from "@/components/kpi-card";
import { ActivityFeed } from "@/components/timeline";
import { EmptyState } from "@/components/ui/feedback";
import { getRecentActivity, getScanCounts, getVolunteers } from "@/lib/queries";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  admin: "Event Admin",
  registration: "Registration",
  stage: "Stage Coordinator",
  booth: "Booth Operator",
  counter: "Counter Staff",
  media: "Media Runner",
  viewer: "View Only",
};

const ROLE_TONE: Record<string, "accent" | "ok" | "warn" | "neutral"> = {
  admin: "accent",
  registration: "ok",
  stage: "ok",
  booth: "ok",
  counter: "warn",
  media: "warn",
  viewer: "neutral",
};

export default async function VolunteersPage() {
  const [volunteers, activity, scans] = await Promise.all([
    getVolunteers(),
    getRecentActivity(10),
    getScanCounts(),
  ]);

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
        <div className="lg:col-span-2">
          {volunteers.length === 0 ? (
            <Card>
              <EmptyState
                icon={UsersRound} title="No volunteers yet" description="Volunteers appear here once they create an account. The first account to sign up becomes the event admin." />
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {volunteers.map((v) => (
                <Card key={v.id} interactive className="h-full overflow-hidden">
                  <div className="flex items-start gap-3.5 p-4">
                    <div className="relative">
                      <Avatar name={v.name} hue={v.hue} size="md" ring={false} />
                      <span
                        className={`absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5  ring-2 ring-[rgb(var(--paper))] ${
                          v.online ? "bg-ok" : "bg-ink-3"
                        }`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-bold tracking-[-0.02em] text-ink">
                            {v.name}
                          </p>
                          <p className="truncate text-[12px] text-ink-3">{v.email}</p>
                        </div>
                        <Badge tone={v.online ? "ok" : "neutral"} size="sm" dot>
                          {v.online ? "Online" : "Offline"}
                        </Badge>
                      </div>

                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <Badge tone={ROLE_TONE[v.role] ?? "neutral"} size="sm">
                          {ROLE_LABEL[v.role] ?? v.role}
                        </Badge>
                        {v.station && <Badge tone="neutral" size="sm">{v.station}</Badge>}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-[rgb(var(--rule))] p-4">
                    <div className=" bg-paper-2 px-2.5 py-2 text-center">
                      <p className="figure text-[16px] text-ink">{v.scans_today}</p>
                      <p className="text-[10.5px] text-ink-3">Scans today</p>
                    </div>
                    <div className=" bg-paper-2 px-2.5 py-2 text-center">
                      <p className="figure text-[16px] text-ink">{v.shift_ends ?? "—"}</p>
                      <p className="text-[10.5px] text-ink-3">Shift ends</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
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
