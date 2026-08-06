"use client";

import * as React from "react";
import { FileUp, Printer, QrCode, Upload } from "lucide-react";
import { Page, PageHeader } from "@/components/shell/app-shell";
import { BlockPanel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StudentQrCard } from "@/components/qr-card";
import { getStudents, type Student } from "@/lib/data";

export default function QrCardsPage() {
  const all = React.useMemo(() => getStudents(), []);
  const [students, setStudents] = React.useState<Student[]>(all.slice(0, 6));
  const [imported, setImported] = React.useState(false);
  const [filter, setFilter] = React.useState("");

  const importStudents = (raw: string) => {
    const rows = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const numbers = rows.slice(1).map((row) => row.split(/[,\t]/)[0]?.trim()).filter(Boolean);
    const matched = numbers.map((number) => all.find((s) => s.regNo.toLowerCase() === number.toLowerCase())).filter(Boolean) as Student[];
    setStudents(matched.length ? matched : all.slice(0, 6));
    setImported(true);
  };

  const upload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => importStudents(String(reader.result ?? ""));
    reader.readAsText(file);
  };

  const visible = students.filter((s) => !filter || `${s.name} ${s.regNo}`.toLowerCase().includes(filter.toLowerCase()));

  return (
    <Page wide>
      <PageHeader title="QR PASSES" description="Import admission numbers before the program, generate one scan-ready pass per student, and hand them a direct link to their ceremony hub." actions={<Badge tone="pop" size="md">{students.length} SELECTED</Badge>} />

      <div className="grid gap-3 lg:grid-cols-5">
        <BlockPanel label="1 / IMPORT ADMISSION NUMBERS" tone="accent" className="lg:col-span-2">
          <div className="space-y-3 p-4">
            <label className="flex cursor-pointer flex-col items-center justify-center border-2 border-dashed border-[rgb(var(--ink))] bg-paper-2 px-5 py-8 text-center transition-colors hover:bg-paper-3">
              <FileUp className="h-8 w-8 text-accent" />
              <span className="headline mt-3 text-[18px] text-ink">UPLOAD CSV</span>
              <span className="mt-1 text-[12px] text-ink-3">First column: admission / register number</span>
              <input type="file" accept=".csv,.txt" onChange={upload} className="sr-only" />
            </label>
            <div className="flex items-center gap-2"><span className="h-px flex-1 bg-[rgb(var(--rule-soft))]" /><span className="stencil text-[9px] text-ink-3">OR PASTE</span><span className="h-px flex-1 bg-[rgb(var(--rule-soft))]" /></div>
            <textarea onChange={(e) => importStudents(`reg\n${e.target.value}`)} placeholder="CEK22CSE001\nCEK22CSE002" className="h-28 w-full resize-none rule bg-paper px-3 py-2 font-mono text-[12px] text-ink outline-none placeholder:text-ink-3 focus:drop-1" />
            <div className="flex items-center justify-between bg-ok px-3 py-2"><span className="stencil text-[9px] text-ink-black">{imported ? "IMPORT READY" : "DEMO COHORT LOADED"}</span><Upload className="h-4 w-4 text-ink-black" /></div>
          </div>
        </BlockPanel>

        <BlockPanel label="2 / GENERATE & DISTRIBUTE" tone="pop" className="lg:col-span-3">
          <div className="p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {[{ n: "01", t: "IMPORT", d: "Match admission numbers to student records." }, { n: "02", t: "GENERATE", d: "Every pass links to a private ceremony hub." }, { n: "03", t: "HAND OUT", d: "Print, WhatsApp or email the QR card." }].map((item) => <div key={item.n} className="rule bg-paper p-3"><span className="figure text-[24px] text-pop">{item.n}</span><p className="stencil mt-3 text-[10px] text-ink">{item.t}</p><p className="mt-1 text-[11.5px] leading-snug text-ink-3">{item.d}</p></div>)}
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row"><Button size="lg" onClick={() => window.print()}><Printer className="h-4 w-4" /> PRINT SELECTED PASSES</Button><div className="flex items-center gap-2 rule bg-paper px-3"><QrCode className="h-4 w-4 text-pop" /><span className="stencil text-[9px] text-ink-2">SCANNABLE ON ANY PHONE CAMERA</span></div></div>
          </div>
        </BlockPanel>
      </div>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="headline text-[28px] text-ink">PASS PREVIEW</h2><p className="mt-1 text-[12.5px] text-ink-3">Each QR opens the graduate&apos;s live ceremony hub.</p></div><input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="FILTER NAME OR NUMBER" className="h-10 w-full rule bg-paper px-3 font-mono text-[11px] text-ink outline-none sm:w-64" /></div>
      <div className="qr-print-grid mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map((student) => <StudentQrCard key={student.id} student={student} />)}</div>
    </Page>
  );
}
