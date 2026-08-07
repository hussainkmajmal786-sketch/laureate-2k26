"use client";

import * as React from "react";
import {
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  FolderTree,
  Loader2,
  Plug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/feedback";
import { connectDrive, type DriveStatus } from "@/lib/drive-actions";

const SETUP_STEPS = [
  "Google Cloud Console → create a project",
  "APIs & Services → Library → enable Google Drive API",
  "Credentials → Create credentials → Service account",
  "Open it → Keys → Add key → JSON (a file downloads)",
  "In Drive, share your event folder with the service account email as Editor",
  "Put the email, private key and folder id in .env.local, then restart",
];

/**
 * Drive connection panel.
 *
 * Deliberately shows the failure reason and the next action, because every
 * realistic failure here (key truncated, folder not shared, API not enabled)
 * looks identical from the app's side without one.
 */
export function DrivePanel({
  initial,
  savedFolder,
  isAdmin,
}: {
  initial: DriveStatus;
  savedFolder: string | null;
  isAdmin: boolean;
}) {
  const [status, setStatus] = React.useState(initial);
  const [folder, setFolder] = React.useState(savedFolder ?? "");
  const [pending, setPending] = React.useState(false);
  const { push } = useToast();

  const run = async () => {
    if (pending) return;
    setPending(true);
    const next = await connectDrive(folder);
    setPending(false);
    setStatus(next);

    push({
      title: next.connected ? "Drive connected" : "Could not connect",
      description: next.connected
        ? "Folder tree is ready for photo import"
        : next.error,
      tone: next.connected ? "ok" : "bad",
    });
  };

  return (
    <div className="space-y-4 p-5">
      {/* Status line */}
      <div
        className={`flex items-start gap-3 rule p-3.5 ${
          status.connected ? "bg-ok" : status.configured ? "bg-warn" : "bg-paper-2"
        }`}
      >
        {status.connected ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-ink-black" strokeWidth={2.4} />
        ) : (
          <CircleAlert
            className={`mt-0.5 h-5 w-5 shrink-0 ${status.configured ? "text-ink-black" : "text-ink-3"}`}
            strokeWidth={2.4}
          />
        )}
        <div className="min-w-0 flex-1">
          <p
            className={`text-[13.5px] font-bold ${
              status.configured ? "text-ink-black" : "text-ink"
            }`}
          >
            {status.connected
              ? "Connected to Google Drive"
              : status.configured
                ? "Credentials found, but not connected"
                : "Not configured"}
          </p>

          {status.serviceAccount && (
            <p
              className={`mt-1 truncate font-mono text-[11px] ${
                status.configured ? "text-ink-black/70" : "text-ink-3"
              }`}
            >
              {status.serviceAccount}
            </p>
          )}

          {status.error && (
            <p className="mt-1.5 text-[12px] leading-snug font-medium text-ink-black">
              {status.error}
            </p>
          )}
          {status.hint && (
            <p
              className={`mt-1.5 text-[12px] leading-snug ${
                status.configured ? "text-ink-black/80" : "text-ink-3"
              }`}
            >
              {status.hint}
            </p>
          )}
        </div>
      </div>

      {/* Folder link */}
      <div>
        <label className="stencil mb-1.5 block text-[9.5px] text-ink-3">
          Drive folder link
        </label>
        <Input
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
          placeholder="https://drive.google.com/drive/folders/..."
          disabled={!isAdmin}
        />
        <p className="mt-1.5 text-[11.5px] leading-snug text-ink-3">
          Paste the folder from your Drive address bar. Leave blank to use the root of the
          service account&rsquo;s own Drive. The event tree is created inside whatever you choose.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={run} disabled={!isAdmin || pending || !status.configured}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
          {pending ? "Connecting…" : status.connected ? "Reconnect" : "Connect Drive"}
        </Button>

        {status.rootFolderId && (
          <a
            href={`https://drive.google.com/drive/folders/${status.rootFolderId}`}
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="secondary">
              <ExternalLink className="h-4 w-4" />
              Open in Drive
            </Button>
          </a>
        )}
      </div>

      {/* Folder tree — what import will actually write into */}
      {status.folders && status.folders.length > 0 && (
        <div className="rule bg-paper-2 p-3.5">
          <p className="stencil mb-2 flex items-center gap-1.5 text-[9.5px] text-ink-2">
            <FolderTree className="h-3.5 w-3.5" />
            Folder tree ready
          </p>
          <ul className="space-y-1">
            <li className="text-[12.5px] font-bold text-ink">Laureate 2K26/</li>
            {status.folders.map((f) => (
              <li key={f.id} className="flex items-center gap-2 pl-4 text-[12.5px] text-ink-2">
                <span className="text-ink-3">├</span>
                {f.name}
                <Badge tone="ok" size="sm" className="ml-auto">
                  ready
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Setup guide, shown until credentials exist */}
      {!status.configured && (
        <div className="rule bg-paper-2 p-3.5">
          <p className="stencil mb-2 text-[9.5px] text-ink-2">One-time setup</p>
          <ol className="space-y-1.5">
            {SETUP_STEPS.map((step, i) => (
              <li key={step} className="flex gap-2.5 text-[12px] leading-snug text-ink-2">
                <span className="stencil shrink-0 text-[9.5px] text-pop">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[11.5px] leading-snug text-ink-3">
            Full instructions with the exact env var names are in WORKFLOW.md.
          </p>
        </div>
      )}
    </div>
  );
}
