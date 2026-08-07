"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  QrCode,
  SearchX,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge, StatusChip } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchBar, Segmented, Select } from "@/components/ui/input";
import { EmptyState, Modal, useToast } from "@/components/ui/feedback";
import { StudentCard, deptColor } from "@/components/student-card";
import { formatNumber } from "@/lib/utils";
import { bulkCheckIn, studentIdsMatching } from "@/lib/actions";
import type { DepartmentRow, StudentRow } from "@/lib/supabase/types";

type Status = "all" | "checked-in" | "waiting" | "complete";

export function StudentsTable({
  students,
  total,
  departments,
  page,
  perPage,
  filters,
}: {
  students: StudentRow[];
  total: number;
  departments: DepartmentRow[];
  page: number;
  perPage: number;
  filters: { q: string; dept: string; status: Status };
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [preview, setPreview] = React.useState<StudentRow | null>(null);
  const [search, setSearch] = React.useState(filters.q);
  const [isPending, startTransition] = React.useTransition();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [working, setWorking] = React.useState(false);
  const { push } = useToast();

  const pageIds = students.map((s) => s.id);
  const pageAllSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const pageSomeSelected = pageIds.some((id) => selected.has(id));

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const togglePage = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (pageAllSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });

  /*
   * The table is paginated on the server, so "select all" has to ask for
   * every id matching the current filters — not just the rows on screen.
   */
  const selectAllMatching = async () => {
    setWorking(true);
    const ids = await studentIdsMatching(filters);
    setWorking(false);
    setSelected(new Set(ids));
    push({ title: `${ids.length} selected`, description: "Everyone matching the current filters", tone: "info" });
  };

  const checkInSelected = async () => {
    if (selected.size === 0 || working) return;
    setWorking(true);
    const result = await bulkCheckIn([...selected]);
    setWorking(false);

    if (!result.ok && !result.data) {
      push({ title: "Could not check in", description: result.error, tone: "bad" });
      return;
    }

    const d = result.data!;
    push({
      title: `${d.checkedIn} checked in`,
      description: [
        d.alreadyPresent ? `${d.alreadyPresent} already present` : null,
        d.failed.length ? `${d.failed.length} failed` : null,
      ].filter(Boolean).join(" · ") || "All done",
      tone: d.failed.length ? "warn" : "ok",
    });

    setSelected(new Set());
    router.refresh();
  };

  /** Filters live in the URL so the server can do the querying. */
  const setParam = React.useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (!v || v === "all" || v === "") next.delete(k);
        else next.set(k, v);
      }
      // Any filter change returns to the first page.
      if (!("page" in updates)) next.delete("page");
      startTransition(() => router.push(`/students?${next.toString()}`));
    },
    [params, router],
  );

  // Debounce search so typing doesn't fire a navigation per keystroke.
  React.useEffect(() => {
    if (search === filters.q) return;
    const timer = setTimeout(() => setParam({ q: search }), 350);
    return () => clearTimeout(timer);
  }, [search, filters.q, setParam]);

  const pages = Math.max(1, Math.ceil(total / perPage));
  const hasFilters = filters.q || filters.dept !== "all" || filters.status !== "all";

  const reset = () => {
    setSearch("");
    startTransition(() => router.push("/students"));
  };

  return (
    <>
      <Card className="mb-4">
        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <SearchBar
            value={search}
            onChange={setSearch} placeholder="Search by name or register number…"
            className="flex-1" />
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={filters.dept}
              onChange={(v) => setParam({ dept: v })} aria-label="Filter by department"
              className="w-full sm:w-52"
              options={[
                { value: "all", label: "All departments" },
                ...departments.map((d) => ({ value: d.code, label: `${d.code} — ${d.short}` })),
              ]} />
            <Segmented
              value={filters.status}
              onChange={(v) => setParam({ status: v })}
              options={[
                { value: "all", label: "All" },
                { value: "checked-in", label: "Present" },
                { value: "waiting", label: "Awaited" },
                { value: "complete", label: "Complete" },
              ]} />
          </div>
        </div>
      </Card>

      <div className="mb-3 flex flex-wrap items-center gap-2 px-1">
        <p className="text-[13px] text-ink-3">
          <span className="font-semibold text-ink">{formatNumber(total)}</span> graduates
          {isPending && <span className="ml-2 text-ink-3">updating…</span>}
        </p>
        {filters.dept !== "all" && (
          <Badge tone="accent" size="sm" dot>
            {departments.find((d) => d.code === filters.dept)?.short ?? filters.dept}
          </Badge>
        )}
        {hasFilters && (
          <button onClick={reset} className="text-[12.5px] font-medium text-accent hover:underline">
            Clear filters
          </button>
        )}
      </div>

      {/* Bulk actions — only present when something is selected. */}
      {selected.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex flex-wrap items-center gap-2.5 rule bg-accent px-4 py-3" >
          <p className="text-[13px] font-bold text-accent-ink">
            {formatNumber(selected.size)} selected
          </p>

          {selected.size < total && (
            <button
              onClick={selectAllMatching}
              disabled={working}
              className="text-[12.5px] font-medium text-accent-ink underline underline-offset-2" >
              Select all {formatNumber(total)} matching
            </button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setSelected(new Set())}>
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
            <Button size="sm" variant="success" onClick={checkInSelected} disabled={working}>
              {working ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5" />
              )}
              {working ? "Checking in…" : "Check in selected"}
            </Button>
          </div>
        </motion.div>
      )}

      <Card className="overflow-hidden">
        {students.length === 0 ? (
          <EmptyState
            icon={SearchX} title="No graduates found" description="No records match the current search and filters. Try widening the department or clearing the search."
            action={
              <Button variant="secondary" size="sm" onClick={reset}>
                <SlidersHorizontal className="h-4 w-4" />
                Reset filters
              </Button>
            } />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[rgb(var(--rule))]">
                  <th className="py-3 pr-2 pl-5">
                    <input
                      type="checkbox"
                      aria-label="Select every graduate on this page"
                      className="h-4 w-4 accent-[rgb(var(--accent))]"
                      checked={pageAllSelected}
                      ref={(el) => {
                        // Indeterminate shows "some but not all" — it cannot be set in JSX.
                        if (el) el.indeterminate = pageSomeSelected && !pageAllSelected;
                      }}
                      onChange={togglePage} />
                  </th>
                  {["Graduate", "Register No.", "Dept", "QR", "Attendance", "Stage", "Booth", "Lunch", ""].map((h) => (
                    <th key={h} className="stencil px-4 py-3 text-ink-3 last:pr-5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--rule-soft))]">
                {students.map((s, i) => (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02, duration: 0.3 }}
                    className={`group transition-colors hover:bg-paper-2 ${
                      selected.has(s.id) ? "bg-accent/8" : ""
                    }`} >
                    <td className="py-3 pr-2 pl-5">
                      <input
                        type="checkbox"
                        aria-label={`Select ${s.name}`}
                        className="h-4 w-4 accent-[rgb(var(--accent))]"
                        checked={selected.has(s.id)}
                        onChange={() => toggleOne(s.id)} />
                    </td>
                    <td className="py-3 pr-4 pl-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.name} hue={s.hue} src={s.photo_url} size="sm" ring={false} />
                        <div className="min-w-0">
                          <p className="truncate text-[13.5px] font-semibold text-ink">{s.name}</p>
                          {s.cgpa != null && (
                            <p className="text-[11.5px] text-ink-3">CGPA {Number(s.cgpa).toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[12.5px] text-ink-2">{s.reg_no}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 text-[13px] text-ink-2">
                        <span
                          className="h-2 w-2 shrink-0 "
                          style={{ backgroundColor: deptColor(s.dept_code) }} />
                        {s.dept_code}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {s.qr_issued ? (
                        <Badge tone="ok" size="sm">
                          <QrCode className="h-3 w-3" />
                          Issued
                        </Badge>
                      ) : (
                        <Badge tone="bad" size="sm">Missing</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {s.attendance ? (
                        <div className="flex items-center gap-2">
                          <Badge tone="ok" size="sm" dot>Present</Badge>
                          {s.checked_in_at && (
                            <span className="font-mono text-[11px] text-ink-3">
                              {new Date(s.checked_in_at).toLocaleTimeString("en-GB", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                      ) : (
                        <Badge tone="neutral" size="sm" dot>Awaited</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3"><StatusChip state={s.stage_done} labels={["Done", "Pending"]} /></td>
                    <td className="px-4 py-3"><StatusChip state={s.booth_done} labels={["Done", "Pending"]} /></td>
                    <td className="px-4 py-3"><StatusChip state={s.lunch_done} labels={["Redeemed", "—"]} /></td>
                    <td className="py-3 pr-5 pl-4 text-right">
                      <button
                        onClick={() => setPreview(s)}
                        aria-label={`View ${s.name}`}
                        className="tap grid h-8 w-8 place-items-center  text-ink-3 opacity-0 transition-all group-hover:opacity-100 hover:bg-paper-3 hover:text-ink focus-visible:opacity-100" >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {students.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-[rgb(var(--rule))] px-5 py-3.5 sm:flex-row">
            <p className="text-[12.5px] text-ink-3">
              Showing{" "}
              <span className="font-medium text-ink">
                {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)}
              </span>{" "}
              of {formatNumber(total)}
            </p>
            <div className="flex items-center gap-1.5">
              <Button size="icon-sm" variant="secondary"
                onClick={() => setParam({ page: String(page - 1) })}
                disabled={page === 1} aria-label="Previous page" >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(5, pages) }).map((_, i) => {
                // Window the page numbers around the current page.
                const start = Math.max(1, Math.min(page - 2, pages - 4));
                const n = start + i;
                if (n > pages) return null;
                return (
                  <button
                    key={n}
                    onClick={() => setParam({ page: String(n) })}
                    className={`tap h-8 min-w-8  px-2 text-[12.5px] font-medium tabular-nums transition-colors ${
                      n === page ? "bg-accent text-white" : "text-ink-2 hover:bg-paper-2"
                    }`} >
                    {n}
                  </button>
                );
              })}
              {pages > 5 && <span className="px-1 text-[12.5px] text-ink-3">of {pages}</span>}
              <Button size="icon-sm" variant="secondary"
                onClick={() => setParam({ page: String(page + 1) })}
                disabled={page >= pages} aria-label="Next page" >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal
        open={!!preview}
        onClose={() => setPreview(null)} title="Graduate record" description="Full ceremony journey and contact details" size="md" >
        {preview && <StudentCard student={preview} compact />}
      </Modal>
    </>
  );
}
