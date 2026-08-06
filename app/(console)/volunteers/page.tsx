"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Clock, MapPin, MessageSquare, Phone, UserPlus, UsersRound, Zap } from "lucide-react";
import { Page, PageHeader } from "@/components/shell/app-shell";
import { Card, BlockPanel } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge, LiveBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Segmented, SearchBar } from "@/components/ui/input";
import { ActivityFeed } from "@/components/timeline";
import { EmptyState, useToast } from "@/components/ui/feedback";
import { StatTile } from "@/components/kpi-card";
import { VOLUNTEERS, VOLUNTEER_ACTIVITY, type Volunteer } from "@/lib/data";

export default function VolunteersPage() {
  const [filter, setFilter] = React.useState<"all" | "online" | "offline">("all");
  const [q, setQ] = React.useState("");
  const { push } = useToast();

  const list = VOLUNTEERS.filter((v) => {
    if (filter === "online" && !v.online) return false;
    if (filter === "offline" && v.online) return false;
    const term = q.trim().toLowerCase();
    if (term && !v.name.toLowerCase().includes(term) && !v.role.toLowerCase().includes(term)) return false;
    return true;
  });

  const online = VOLUNTEERS.filter((v) => v.online).length;
  const totalScans = VOLUNTEERS.reduce((s, v) => s + v.scansToday, 0);

  return (
    <Page wide>
      <PageHeader
        title="VOLUNTEERS"
        description="Live roster across every station. Throughput, assignments and shift windows for the whole team."
        actions={
          <Button
            size="md"
            onClick={() => push({ title: "INVITE SENT", description: "Volunteer will receive a link", tone: "ok" })}
          >
            <UserPlus className="h-4 w-4" strokeWidth={2.6} />
            ADD VOLUNTEER
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatTile label="ON DUTY" value={online} sub={`of ${VOLUNTEERS.length} volunteers`} tone="ok" />
        <StatTile label="SCANS TODAY" value={totalScans} sub="All stations" tone="accent" />
        <StatTile label="FASTEST STATION" value="7s" sub="Lunch counter" tone="pop" />
        <StatTile label="NEXT SHIFT CHANGE" value="14:00" sub="6 rotating out" tone="warn" />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <SearchBar value={q} onChange={setQ} placeholder="NAME OR ROLE…" className="flex-1" />
            <Segmented
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: "ALL" },
                { value: "online", label: "ONLINE" },
                { value: "offline", label: "OFFLINE" },
              ]}
            />
          </div>

          {list.length === 0 ? (
            <Card>
              <EmptyState
                icon={UsersRound}
                title="NO VOLUNTEERS FOUND"
                description="No one matches this search. Try clearing the filter or searching a different role."
              />
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {list.map((v, i) => (
                <VolunteerCard key={v.id} volunteer={v} index={i} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <BlockPanel label="LIVE ACTIVITY" tone="pop" action={<LiveBadge />}>
            <div className="p-4">
              <ActivityFeed items={VOLUNTEER_ACTIVITY} />
            </div>
          </BlockPanel>

          <BlockPanel label="STATION COVERAGE" tone="warn">
            <div className="space-y-3 p-4">
              {[
                { station: "REGISTRATION", count: 3, need: 3 },
                { station: "STAGE", count: 1, need: 2 },
                { station: "PHOTO BOOTHS", count: 2, need: 2 },
                { station: "LUNCH COUNTERS", count: 1, need: 4 },
                { station: "CERTIFICATE DESK", count: 0, need: 2 },
              ].map((s) => {
                const short = s.count < s.need;
                return (
                  <div key={s.station} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="stencil text-[9.5px] text-ink">{s.station}</p>
                      <div className="mt-1.5 h-3 rule bg-paper-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (s.count / s.need) * 100)}%` }}
                          transition={{ duration: 0.65, ease: [0.2, 0, 0, 1] }}
                          className={short ? "h-full bg-bad" : "h-full bg-ok"}
                        />
                      </div>
                    </div>
                    <Badge tone={short ? "bad" : "ok"} size="sm">
                      {s.count}/{s.need}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </BlockPanel>
        </div>
      </div>
    </Page>
  );
}

function VolunteerCard({ volunteer: v, index }: { volunteer: Volunteer; index: number }) {
  // Rough throughput score — faster scans and higher volume rank better.
  const perf = Math.min(100, Math.round((v.scansToday / 4.2) * (30 / Math.max(v.avgSeconds, 7))));

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.2, 0, 0, 1] }}
    >
      <Card interactive className="h-full">
        <div className="flex items-start gap-3 rule-b p-3.5">
          <div className="relative">
            <Avatar name={v.name} hue={v.hue} size="md" />
            <span
              className={`absolute -right-1 -bottom-1 h-3.5 w-3.5 rule ${v.online ? "bg-ok" : "bg-paper-3"}`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[14px] leading-tight font-black text-ink">{v.name}</p>
                <p className="stencil mt-1 truncate text-[8.5px] text-ink-3">{v.role}</p>
              </div>
              <Badge tone={v.online ? "ok" : "outline"} size="sm">
                {v.online ? "ONLINE" : "OFFLINE"}
              </Badge>
            </div>

            <div className="stencil mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[8.5px] text-ink-3">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" strokeWidth={2.6} />
                {v.station}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" strokeWidth={2.6} />
                TO {v.shiftEnds}
              </span>
            </div>
          </div>
        </div>

        <div className="p-3.5">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="stencil inline-flex items-center gap-1 text-[9px] text-ink-2">
              <Zap className="h-3 w-3 text-warn" strokeWidth={2.8} />
              THROUGHPUT
            </span>
            <span className="figure text-[13px] text-ink">{perf}</span>
          </div>
          <div className="h-3 rule bg-paper-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${perf}%` }}
              transition={{ delay: 0.15 + index * 0.04, duration: 0.65, ease: [0.2, 0, 0, 1] }}
              className={perf > 70 ? "h-full bg-ok" : perf > 40 ? "h-full bg-accent" : "h-full bg-warn"}
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rule bg-paper-2 px-2 py-2 text-center">
              <p className="figure text-[17px] leading-none text-ink">{v.scansToday}</p>
              <p className="stencil mt-1 text-[8px] text-ink-3">SCANS</p>
            </div>
            <div className="rule bg-paper-2 px-2 py-2 text-center">
              <p className="figure text-[17px] leading-none text-ink">{v.avgSeconds}s</p>
              <p className="stencil mt-1 text-[8px] text-ink-3">AVG</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 rule-t p-3">
          <Button size="sm" variant="secondary" block>
            <MessageSquare className="h-3.5 w-3.5" strokeWidth={2.6} />
            MESSAGE
          </Button>
          <Button size="sm" variant="ghost" className="shrink-0" aria-label="Call">
            <Phone className="h-3.5 w-3.5" strokeWidth={2.6} />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
