"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, Eye, SearchX, SlidersHorizontal } from "lucide-react";
import { Page, PageHeader } from "@/components/shell/app-shell";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge, StatusChip } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchBar, Segmented, Select } from "@/components/ui/input";
import { EmptyState, Modal, TableSkeleton, useToast } from "@/components/ui/feedback";
import { StudentCard, deptColor } from "@/components/student-card";
import { DEPARTMENTS, getStudents, TOTAL_GRADUATES, type Student } from "@/lib/data";
import { formatNumber } from "@/lib/utils";

const PER_PAGE = 12;
type Filter = "all" | "checked-in" | "waiting" | "complete";

export default function StudentsPage() {
  const all = React.useMemo(() => getStudents(), []);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  const [dept, setDept] = React.useState("all");
  const [filter, setFilter] = React.useState<Filter>("all");
  const [page, setPage] = React.useState(1);
  const [preview, setPreview] = React.useState<Student | null>(null);
  const { push } = useToast();

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 650);
    return () => clearTimeout(t);
  }, []);

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter((s) => {
      if (dept !== "all" && s.dept !== dept) return false;
      if (filter === "checked-in" && !s.attendance) return false;
      if (filter === "waiting" && (s.attendance || !s.qrIssued)) return false;
      if (filter === "complete" && !s.certificateDone) return false;
      if (term && !s.name.toLowerCase().includes(term) && !s.regNo.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [all, q, dept, filter]);

  // Any filter change returns to the first page.
  React.useEffect(() => setPage(1), [q, dept, filter]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const reset = () => { setQ(""); setDept("all"); setFilter("all"); };

  return (
    <Page wide>
      <PageHeader
        title="STUDENTS"
        description={`${formatNumber(TOTAL_GRADUATES)} graduates across ${DEPARTMENTS.length} departments. Search, filter and inspect any record.`}
        actions={
          <Button
            variant="secondary"
            size="md"
            onClick={() => push({ title: "EXPORT QUEUED", description: "students-2k26.csv", tone: "info" })}
          >
            <Download className="h-4 w-4" strokeWidth={2.6} />
            EXPORT CSV
          </Button>
        }
      />

      {/* Filters */}
      <Card className="mb-3">
        <div className="flex flex-col gap-2.5 p-3.5 lg:flex-row lg:items-center">
          <SearchBar value={q} onChange={setQ} placeholder="NAME OR REGISTER NUMBER…" className="flex-1" />
          <div className="flex flex-wrap items-center gap-2.5">
            <Select
              value={dept}
              onChange={setDept}
              aria-label="Filter by department"
              className="w-full sm:w-48"
              options={[
                { value: "all", label: "ALL DEPARTMENTS" },
                ...DEPARTMENTS.map((d) => ({ value: d.code, label: d.code })),
              ]}
            />
            <Segmented
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: "ALL" },
                { value: "checked-in", label: "PRESENT" },
                { value: "waiting", label: "AWAITED" },
                { value: "complete", label: "DONE" },
              ]}
            />
          </div>
        </div>
      </Card>

      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        <p className="stencil text-[10px] text-ink-3">
          <span className="text-ink">{formatNumber(filtered.length)}</span> GRADUATES
        </p>
        {dept !== "all" && <Badge tone="accent" size="sm">{dept}</Badge>}
        {(q || dept !== "all" || filter !== "all") && (
          <button onClick={reset} className="stencil text-[9.5px] text-pop underline">
            CLEAR FILTERS
          </button>
        )}
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <TableSkeleton rows={8} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="NO GRADUATES FOUND"
            description="No records match the current search and filters. Try widening the department or clearing the search."
            action={
              <Button variant="secondary" size="sm" onClick={reset}>
                <SlidersHorizontal className="h-4 w-4" strokeWidth={2.6} />
                RESET FILTERS
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] border-collapse text-left">
              <thead>
                <tr className="bg-[rgb(var(--ink))]">
                  {["GRADUATE", "REGISTER NO.", "DEPT", "QR", "ATTENDANCE", "STAGE", "BOOTH", "LUNCH", ""].map((h) => (
                    <th
                      key={h}
                      className="stencil px-3 py-2.5 text-[9px] text-[rgb(var(--paper))] first:pl-4 last:pr-4"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((s, i) => (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.015, duration: 0.25 }}
                    className="group rule-b transition-colors hover:bg-paper-2"
                  >
                    <td className="py-2.5 pr-3 pl-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={s.name} hue={s.hue} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-bold text-ink">{s.name}</p>
                          <p className="stencil text-[8.5px] text-ink-3">CGPA {s.cgpa.toFixed(2)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11.5px] text-ink-2">{s.regNo}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className="stencil inline-block px-1.5 py-1 text-[9px] text-white"
                        style={{ backgroundColor: deptColor(s.dept) }}
                      >
                        {s.dept}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusChip state={s.qrIssued} labels={["ISSUED", "MISSING"]} />
                    </td>
                    <td className="px-3 py-2.5">
                      {s.attendance ? (
                        <div className="flex items-center gap-1.5">
                          <Badge tone="ok" size="sm">PRESENT</Badge>
                          <span className="stencil text-[8.5px] text-ink-3">{s.checkedInAt}</span>
                        </div>
                      ) : (
                        <Badge tone="outline" size="sm" className="text-ink-3">AWAITED</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2.5"><StatusChip state={s.stageDone} labels={["DONE", "—"]} /></td>
                    <td className="px-3 py-2.5"><StatusChip state={s.boothDone} labels={["DONE", "—"]} /></td>
                    <td className="px-3 py-2.5"><StatusChip state={s.lunchDone} labels={["FED", "—"]} /></td>
                    <td className="py-2.5 pr-4 pl-3 text-right">
                      <button
                        onClick={() => setPreview(s)}
                        aria-label={`View ${s.name}`}
                        className="tap grid h-8 w-8 place-items-center rule bg-paper text-ink opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                      >
                        <Eye className="h-4 w-4" strokeWidth={2.6} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && rows.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 bg-paper-2 px-4 py-3 sm:flex-row">
            <p className="stencil text-[9.5px] text-ink-3">
              SHOWING {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} OF{" "}
              {formatNumber(filtered.length)}
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                size="icon-sm"
                variant="secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={3} />
              </Button>
              {Array.from({ length: Math.min(5, pages) }).map((_, i) => {
                // Window the page numbers around the current page.
                const start = Math.max(1, Math.min(page - 2, pages - 4));
                const n = start + i;
                if (n > pages) return null;
                return (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`stencil tap h-9 min-w-9 rule px-2 text-[10.5px] transition-colors ${
                      n === page
                        ? "bg-[rgb(var(--ink))] text-[rgb(var(--paper))]"
                        : "bg-paper text-ink-2 hover:bg-paper-3"
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
              {pages > 5 && <span className="stencil px-1 text-[9.5px] text-ink-3">/ {pages}</span>}
              <Button
                size="icon-sm"
                variant="secondary"
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={3} />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        title="GRADUATE RECORD"
        description="Full ceremony journey and contact details"
        size="md"
      >
        {preview && <StudentCard student={preview} compact />}
      </Modal>
    </Page>
  );
}
