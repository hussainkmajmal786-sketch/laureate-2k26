"use client";

import * as React from "react";
import { FileUp, Loader2, Printer, QrCode, Search } from "lucide-react";
import { BlockPanel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/feedback";
import { StudentQrCard } from "@/components/qr-card";
import { createClient } from "@/lib/supabase/client";
import type { DepartmentRow, StudentRow } from "@/lib/supabase/types";

export function QrCardsWorkbench({
  initialStudents,
  departments,
}: {
  initialStudents: StudentRow[];
  departments: DepartmentRow[];
}) {
  const [students, setStudents] = React.useState<StudentRow[]>(initialStudents);
  const [imported, setImported] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [filter, setFilter] = React.useState("");
  const [pasted, setPasted] = React.useState("");
  const { push } = useToast();
  const supabase = React.useMemo(() => createClient(), []);

  /** Matches a list of register numbers against the live student table. */
  const importNumbers = React.useCallback(
    async (raw: string) => {
      const numbers = raw
        .split(/\r?\n/)
        .map((line) => line.split(/[,\t;]/)[0]?.trim())
        .filter(Boolean)
        // Drop a header row like "reg_no" or "admission number".
        .filter((n) => /\d/.test(n!)) as string[];

      if (numbers.length === 0) {
        push({ title: "Nothing to import", description: "No register numbers found.", tone: "warn" });
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .in("reg_no", numbers.map((n) => n.toUpperCase()))
        .limit(500);
      setLoading(false);

      if (error) {
        push({ title: "Import failed", description: error.message, tone: "bad" });
        return;
      }

      setStudents(data ?? []);
      setImported(true);

      const missing = numbers.length - (data?.length ?? 0);
      push({
        title: `${data?.length ?? 0} pass${data?.length === 1 ? "" : "es"} ready`,
        description: missing > 0 ? `${missing} number(s) had no matching record.` : undefined,
        tone: missing > 0 ? "warn" : "ok",
      });
    },
    [supabase, push],
  );

  const upload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => importNumbers(String(reader.result ?? ""));
    reader.readAsText(file);
  };

  const loadDepartment = async (code: string) => {
    setLoading(true);
    let query = supabase.from("students").select("*");
    if (code !== "all") query = query.eq("dept_code", code);
    const { data } = await query.order("reg_no").limit(120);
    setLoading(false);
    setStudents(data ?? []);
    setImported(true);
  };

  const visible = students.filter(
    (s) => !filter || `${s.name} ${s.reg_no}`.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-5">
        <BlockPanel label="1 · Import admission numbers" tone="accent" className="lg:col-span-2">
          <div className="space-y-3 p-5">
            <label className="flex cursor-pointer flex-col items-center justify-center  border-2 border-dashed border-[rgb(var(--rule))] bg-paper-2 px-5 py-8 text-center transition-colors hover:bg-paper-3">
              <FileUp className="h-8 w-8 text-accent" />
              <span className="mt-3 text-[15px] font-semibold text-ink">Upload CSV</span>
              <span className="mt-1 text-[12px] text-ink-3">
                First column: admission / register number
              </span>
              <input type="file" accept=".csv,.txt" onChange={upload} className="sr-only" />
            </label>

            <div className="flex items-center gap-2">
              <span className="h-px flex-1 bg-[rgb(var(--rule))]" />
              <span className="stencil text-ink-3">or paste</span>
              <span className="h-px flex-1 bg-[rgb(var(--rule))]" />
            </div>

            <textarea
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder={"KGR22CS001\nLKGR22EC040"}
              className="h-24 w-full resize-none  bg-paper-2 px-3 py-2.5 font-mono text-[12px] text-ink rule outline-none placeholder:text-ink-3 focus:bg-paper focus:ring-2 focus:ring-[rgb(var(--accent))]" />
            <Button block onClick={() => importNumbers(pasted)} disabled={loading || !pasted.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Match against database
            </Button>

            <div className="flex items-center justify-between  bg-ok-soft px-3 py-2">
              <span className="text-[12px] font-medium text-ok">
                {imported ? `${students.length} matched` : "Sample set loaded"}
              </span>
              <QrCode className="h-4 w-4 text-ok" />
            </div>
          </div>
        </BlockPanel>

        <BlockPanel label="2 · Generate & distribute" tone="pop" className="lg:col-span-3">
          <div className="p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { n: "01", t: "Import", d: "Match admission numbers to live student records." },
                { n: "02", t: "Generate", d: "Every pass links to that graduate's ceremony hub." },
                { n: "03", t: "Hand out", d: "Print, WhatsApp or email the QR card." },
              ].map((item) => (
                <div key={item.n} className=" bg-paper-2 p-4 rule">
                  <span className="figure text-[22px] text-accent">{item.n}</span>
                  <p className="mt-2.5 text-[13px] font-semibold text-ink">{item.t}</p>
                  <p className="mt-1 text-[11.5px] leading-snug text-ink-3">{item.d}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button size="lg" onClick={() => window.print()} disabled={visible.length === 0}>
                <Printer className="h-4 w-4" />
                Print {visible.length} pass{visible.length === 1 ? "" : "es"}
              </Button>
              <Select value="all"
                onChange={loadDepartment} aria-label="Load a whole department"
                className="sm:w-56"
                options={[
                  { value: "all", label: "Load a department…" },
                  ...departments.map((d) => ({ value: d.code, label: `${d.code} — ${d.short}` })),
                ]} />
            </div>
          </div>
        </BlockPanel>
      </div>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[19px] font-bold tracking-[-0.025em] text-ink">Pass preview</h2>
          <p className="mt-1 text-[12.5px] text-ink-3">
            Each QR opens that graduate&rsquo;s live ceremony hub.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-3" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)} placeholder="Filter name or number"
            className="h-11 w-full  bg-paper-2 pr-4 pl-10 text-sm text-ink rule outline-none placeholder:text-ink-3 focus:bg-paper focus:ring-2 focus:ring-[rgb(var(--accent))]" />
        </div>
      </div>

      <div className="qr-print-grid mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((student) => (
          <StudentQrCard key={student.id} student={student} />
        ))}
      </div>
    </>
  );
}
