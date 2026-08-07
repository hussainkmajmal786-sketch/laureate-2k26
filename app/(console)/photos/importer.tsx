"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, FolderTree, Loader2, Upload, XCircle } from "lucide-react";
import { BlockPanel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/feedback";
import { importCeremonyPhotos, type ImportResult } from "@/lib/photo-import";

const CATEGORIES = [
  { value: "Stage", label: "STAGE" },
  { value: "Booth", label: "PHOTO BOOTH" },
  { value: "Candid", label: "CANDID" },
  { value: "Group", label: "GROUP" },
];

export function PhotoImporter({
  driveConfigured,
  canImport,
  appearances,
}: {
  driveConfigured: boolean;
  canImport: boolean;
  appearances: number;
}) {
  const [files, setFiles] = React.useState<File[]>([]);
  const [category, setCategory] = React.useState("Stage");
  const [photographer, setPhotographer] = React.useState("CEK Media Cell");
  const [tolerance, setTolerance] = React.useState(45);
  const [offset, setOffset] = React.useState(0);
  const [pending, setPending] = React.useState(false);
  const [result, setResult] = React.useState<ImportResult | null>(null);
  const { push } = useToast();

  const blocked = !driveConfigured || !canImport || appearances === 0;

  const run = async () => {
    if (files.length === 0 || pending) return;
    setPending(true);
    setResult(null);

    const fd = new FormData();
    files.forEach((f) => fd.append("photos", f));
    fd.set("category", category);
    fd.set("photographer", photographer);
    fd.set("toleranceSeconds", String(tolerance));
    fd.set("clockOffsetMinutes", String(offset));

    const res = await importCeremonyPhotos(fd);
    setPending(false);
    setResult(res);

    if (!res.ok) {
      push({ title: "IMPORT FAILED", description: res.error, tone: "bad" });
      return;
    }
    push({
      title: `${res.matched} MATCHED`,
      description: res.unmatched > 0 ? `${res.unmatched} could not be matched` : "All photos filed",
      tone: res.unmatched > 0 ? "warn" : "ok",
    });
  };

  return (
    <div className="grid gap-3 lg:grid-cols-5">
      <BlockPanel label="1 / SELECT PHOTOS" tone="accent" className="lg:col-span-2">
        <div className="space-y-3 p-4">
          {!driveConfigured && (
            <div className="flex items-start gap-2.5 rule bg-warn p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-ink-black" strokeWidth={2.6} />
              <p className="text-[12px] leading-snug font-bold text-ink-black">
                Google Drive is not connected. Add the service account credentials before importing.
              </p>
            </div>
          )}

          {appearances === 0 && (
            <div className="flex items-start gap-2.5 rule bg-warn p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-ink-black" strokeWidth={2.6} />
              <p className="text-[12px] leading-snug font-bold text-ink-black">
                No stage appearances recorded yet. Photos are matched by the time each graduate was
                on stage, so run the ceremony through the Stage screen first.
              </p>
            </div>
          )}

          <label className="flex cursor-pointer flex-col items-center justify-center border-2 border-dashed border-[rgb(var(--rule))] bg-paper-2 px-5 py-8 text-center transition-colors hover:bg-paper-3">
            <Upload className="h-8 w-8 text-accent" strokeWidth={2.4} />
            <span className="headline mt-3 text-[18px] text-ink">CHOOSE FILES</span>
            <span className="mt-1 text-[12px] text-ink-3">
              JPEG from the camera card — EXIF time is read from each file
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
          </label>

          {files.length > 0 && (
            <div className="rule bg-paper-2 p-3">
              <p className="stencil text-[9.5px] text-ink-3">SELECTED</p>
              <p className="figure mt-1 text-[26px] text-ink">{files.length}</p>
              <p className="mt-1 truncate text-[11.5px] text-ink-3">
                {files[0]?.name}
                {files.length > 1 && ` + ${files.length - 1} more`}
              </p>
            </div>
          )}
        </div>
      </BlockPanel>

      <BlockPanel label="2 / MATCHING SETTINGS" tone="pop" className="lg:col-span-3">
        <div className="space-y-3.5 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="stencil mb-1.5 block text-[9px] text-ink-3">CATEGORY</label>
              <Select value={category} onChange={setCategory} options={CATEGORIES} aria-label="Photo category" />
            </div>
            <div>
              <label className="stencil mb-1.5 block text-[9px] text-ink-3">PHOTOGRAPHER</label>
              <input
                value={photographer}
                onChange={(e) => setPhotographer(e.target.value)}
                className="h-11 w-full rule bg-paper px-3 text-[13.5px] font-medium text-ink outline-none focus:drop-2"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="stencil mb-1.5 block text-[9px] text-ink-3">
                TOLERANCE (SECONDS)
              </label>
              <input
                type="number"
                value={tolerance}
                min={0}
                onChange={(e) => setTolerance(Number(e.target.value))}
                className="h-11 w-full rule bg-paper px-3 font-mono text-[13.5px] text-ink outline-none focus:drop-2"
              />
              <p className="mt-1 text-[11px] leading-snug text-ink-3">
                How far outside a graduate&rsquo;s stage window a photo may still match.
              </p>
            </div>
            <div>
              <label className="stencil mb-1.5 block text-[9px] text-ink-3">
                CAMERA CLOCK OFFSET (MIN)
              </label>
              <input
                type="number"
                value={offset}
                onChange={(e) => setOffset(Number(e.target.value))}
                className="h-11 w-full rule bg-paper px-3 font-mono text-[13.5px] text-ink outline-none focus:drop-2"
              />
              <p className="mt-1 text-[11px] leading-snug text-ink-3">
                If the camera clock was wrong, correct it here. Positive shifts photos later.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rule bg-paper-2 p-3">
            <FolderTree className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2.4} />
            <p className="text-[11.5px] leading-relaxed text-ink-2">
              Each photo is filed into <span className="font-bold">Laureate 2K26 / {category}</span>{" "}
              and also into <span className="font-bold">Laureate 2K26 / All Media</span>, then linked
              to the matched graduate so it appears in their hub.
            </p>
          </div>

          <Button
            size="xl"
            block
            onClick={run}
            disabled={blocked || files.length === 0 || pending}
          >
            {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" strokeWidth={2.6} />}
            {pending ? "IMPORTING…" : `IMPORT ${files.length || ""} PHOTOS`}
          </Button>

          {!canImport && (
            <p className="stencil text-center text-[9px] text-ink-3">
              YOUR ROLE CANNOT IMPORT PHOTOS
            </p>
          )}
        </div>
      </BlockPanel>

      {result && (
        <BlockPanel label="IMPORT RESULT" tone={result.unmatched > 0 ? "warn" : "ok"} className="lg:col-span-5">
          <div className="p-4">
            <div className="mb-3 grid grid-cols-3 gap-2.5">
              <div className="rule bg-paper-2 p-3 text-center">
                <p className="figure text-[26px] text-ok">{result.matched}</p>
                <p className="stencil mt-1 text-[9px] text-ink-3">MATCHED</p>
              </div>
              <div className="rule bg-paper-2 p-3 text-center">
                <p className="figure text-[26px] text-accent">{result.uploaded}</p>
                <p className="stencil mt-1 text-[9px] text-ink-3">UPLOADED</p>
              </div>
              <div className="rule bg-paper-2 p-3 text-center">
                <p className="figure text-[26px] text-bad">{result.unmatched}</p>
                <p className="stencil mt-1 text-[9px] text-ink-3">UNMATCHED</p>
              </div>
            </div>

            {result.error && (
              <div className="mb-3 rule bg-bad p-3">
                <p className="text-[12px] font-bold text-white">{result.error}</p>
              </div>
            )}

            <ul className="max-h-[320px] overflow-y-auto">
              {result.details.map((d, i) => (
                <li key={i} className="flex items-start gap-2.5 py-2 not-last:rule-b">
                  {d.matchedTo ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" strokeWidth={2.4} />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-bad" strokeWidth={2.4} />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-[12px] text-ink">{d.filename}</p>
                    <p className="text-[11px] text-ink-3">
                      {d.matchedTo ? `→ ${d.matchedTo}` : d.reason}
                      {d.takenAt && ` · ${new Date(d.takenAt).toLocaleTimeString("en-GB")}`}
                    </p>
                  </div>
                  {d.matchedTo && <Badge tone="ok" size="sm">FILED</Badge>}
                </li>
              ))}
            </ul>
          </div>
        </BlockPanel>
      )}
    </div>
  );
}
