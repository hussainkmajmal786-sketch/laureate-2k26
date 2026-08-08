"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, CloudUpload, ExternalLink, Loader2 } from "lucide-react";
import { BlockPanel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/feedback";
import { syncPhotosToDrive, type SyncResult } from "@/lib/drive-sync";

/**
 * Retries any photo that has not reached Drive.
 *
 * Captures mirror to Drive automatically, so this is normally empty. It
 * exists because that mirror is best-effort — a flaky connection at the
 * booth leaves the photo safe in Storage but absent from the archive, and
 * this picks those up afterwards.
 */
export function DriveSyncPanel({
  stored,
  synced,
  driveConfigured,
  rootFolderId,
}: {
  stored: number;
  synced: number;
  driveConfigured: boolean;
  rootFolderId?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [result, setResult] = React.useState<SyncResult | null>(null);
  const { push } = useToast();

  const outstanding = result ? result.remaining : Math.max(0, stored - synced);

  const run = async () => {
    if (pending) return;
    setPending(true);
    const res = await syncPhotosToDrive();
    setPending(false);
    setResult(res);

    if (!res.ok) {
      push({ title: "Sync failed", description: res.error, tone: "bad" });
      return;
    }

    push({
      title: res.copied ? `${res.copied} copied to Drive` : "Everything is already in Drive",
      description: res.remaining ? `${res.remaining} still to go — press Sync again` : undefined,
      tone: res.failed ? "warn" : "ok",
    });
    router.refresh();
  };

  return (
    <BlockPanel
      label="Google Drive archive"
      tone={outstanding === 0 && stored > 0 ? "ok" : "accent"}
      action={
        <Badge tone={driveConfigured ? "ok" : "warn"} size="sm" dot>
          {driveConfigured ? "Connected" : "Not connected"}
        </Badge>
      }
    >
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rule bg-paper-2 p-3">
            <p className="figure text-[24px] text-ink">{stored}</p>
            <p className="mt-1 text-[11.5px] text-ink-3">In storage</p>
          </div>
          <div className="rule bg-paper-2 p-3">
            <p className="figure text-[24px] text-ok">{synced}</p>
            <p className="mt-1 text-[11.5px] text-ink-3">In Drive</p>
          </div>
          <div className="rule bg-paper-2 p-3">
            <p className={`figure text-[24px] ${outstanding ? "text-warn" : "text-ink-3"}`}>
              {outstanding}
            </p>
            <p className="mt-1 text-[11.5px] text-ink-3">Waiting</p>
          </div>
        </div>

        <p className="text-[12.5px] leading-relaxed text-ink-3">
          Photos copy into Drive automatically as they are captured. This retries anything that
          did not make it — a dropped connection at the booth, or photos taken before Drive was
          connected. Each photo is filed under{" "}
          <span className="font-medium text-ink-2">Laureate 2K26 / Graduates / Name (Register no)</span>,
          with a second copy in its station folder.
        </p>

        {!driveConfigured && (
          <p className="text-[12.5px] leading-relaxed text-warn">
            No Google account is connected, so nothing can upload. Connect one in Settings →
            Google account.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={run} disabled={!driveConfigured || pending || outstanding === 0}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CloudUpload className="h-4 w-4" />
            )}
            {pending
              ? "Syncing…"
              : outstanding === 0
                ? "Nothing to sync"
                : `Sync ${outstanding} to Drive`}
          </Button>

          {rootFolderId && (
            <a
              href={`https://drive.google.com/drive/folders/${rootFolderId}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="secondary">
                <ExternalLink className="h-4 w-4" />
                Open Drive folder
              </Button>
            </a>
          )}
        </div>

        {result && result.details.length > 0 && (
          <ul className="max-h-[220px] overflow-y-auto rule bg-paper-2 p-3">
            {result.details.map((d, i) => (
              <li key={i} className="flex items-start gap-2 py-1.5 text-[12px]">
                {d.reason ? (
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="font-medium text-ink">{d.title}</span>
                  {d.reason && <span className="block text-ink-3">{d.reason}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </BlockPanel>
  );
}
