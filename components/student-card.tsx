"use client";

import { motion } from "framer-motion";
import {
  Award,
  Camera,
  Phone,
  ScrollText,
  UserCheck,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CeremonyStage, StudentRow } from "@/lib/supabase/types";
import { Avatar } from "./ui/avatar";
import { Badge, StatusChip } from "./ui/badge";

import { deptColor } from "@/lib/dept-colors";

export { DEPT_COLORS, deptColor } from "@/lib/dept-colors";

const STAGE_LABEL: Record<CeremonyStage, { label: string; tone: "accent" | "ok" | "warn" | "neutral" | "pop" }> = {
  registered: { label: "NOT CHECKED IN", tone: "neutral" },
  "checked-in": { label: "CHECKED IN", tone: "ok" },
  waiting: { label: "WAITING", tone: "warn" },
  "on-stage": { label: "ON STAGE NOW", tone: "pop" },
  "stage-done": { label: "READY FOR BOOTH", tone: "accent" },
  booth: { label: "BOOTH DONE", tone: "ok" },
  complete: { label: "ALL COMPLETE", tone: "ok" },
};

/**
 * The graduate's identity card — a printed pass. Department colour runs as
 * a solid block down the left edge; the name is set in poster display type.
 */
export function StudentCard({
  student,
  statusLabel,
  statusTone = "accent",
  footer,
  compact = false,
  showJourney = true,
  className,
}: {
  student: StudentRow;
  statusLabel?: string;
  statusTone?: "accent" | "ok" | "warn" | "bad" | "neutral" | "pop";
  footer?: React.ReactNode;
  compact?: boolean;
  showJourney?: boolean;
  className?: string;
}) {
  const auto = STAGE_LABEL[student.stage];
  const label = statusLabel ?? auto.label;
  const tone = statusLabel ? statusTone : auto.tone;
  const accent = deptColor(student.dept_code);

  return (
    <motion.div
      key={student.id}
      initial={{ opacity: 0, y: 14, rotate: -0.6 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ type: "spring", stiffness: 340, damping: 28 }}
      className={cn("relative bg-paper rule-thick drop-3", className)} >
      {/* Department spine */}
      <div className="absolute inset-y-0 left-0 w-3 rule-r" style={{ backgroundColor: accent }} />

      <div className={cn("relative", compact ? "pl-6" : "pl-7")}>
        <div className={cn("flex items-start gap-3.5", compact ? "p-3.5" : "p-5")}>
          <Avatar
            name={student.name}
            hue={student.hue}
            src={student.photo_url}
            size={compact ? "lg" : "xl"} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone={tone} size="sm">{label}</Badge>
              {!student.qr_issued && <Badge tone="bad" size="sm">NO QR</Badge>}
            </div>

            <h3
              className={cn(
                "headline mt-2.5 text-ink text-balance",
                compact ? "text-[20px]" : "text-[30px]",
              )} >
              {student.name}
            </h3>

            <p className="mt-1.5 font-mono text-[12.5px] font-medium tracking-wider text-ink-2">
              {student.reg_no}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-ink-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rule" style={{ backgroundColor: accent }} />
                {student.dept_code}
              </span>
              <span className="text-ink-3">/</span>
              {student.cgpa != null && <span>CGPA {Number(student.cgpa).toFixed(2)}</span>}
              {!compact && student.phone && (
                <>
                  <span className="text-ink-3">/</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3 w-3" strokeWidth={2.6} /> {student.phone}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {showJourney && (
          <div className={cn("rule-t bg-paper-2", compact ? "px-3.5 py-3" : "px-5 py-4")}>
            <p className="stencil mb-2 text-[9.5px] text-ink-3">CEREMONY PROGRESS</p>
            <div className="grid grid-cols-5 gap-1.5">
              <JourneyStep icon={UserCheck} label="CHECK" done={student.attendance} />
              <JourneyStep icon={Award} label="STAGE" done={student.stage_done} />
              <JourneyStep icon={Camera} label="BOOTH" done={student.booth_done} />
              <JourneyStep icon={UtensilsCrossed} label="LUNCH" done={student.lunch_done} />
              <JourneyStep icon={ScrollText} label="CERT" done={student.certificate_done} />
            </div>
          </div>
        )}

        {footer && <div className="rule-t p-3.5">{footer}</div>}
      </div>
    </motion.div>
  );
}

function JourneyStep({ icon: Icon, label, done }: { icon: LucideIcon; label: string; done: boolean }) {
  return (
    <div>
      <div
        className={cn(
          "grid h-9 w-full place-items-center rule",
          done ? "bg-ok text-ink-black" : "bg-paper text-ink-3",
        )} >
        <Icon className="h-4 w-4" strokeWidth={2.6} />
      </div>
      <span className={cn("stencil mt-1 block text-center text-[8.5px]", done ? "text-ink" : "text-ink-3")}>
        {label}
      </span>
    </div>
  );
}

/** Dense list row used in queues, recent scans and search results. */
export function StudentRowItem({
  student,
  trailing,
  onClick,
  meta,
}: {
  student: Pick<StudentRow, "id" | "name" | "reg_no" | "hue"> & { photo_url?: string | null };
  trailing?: React.ReactNode;
  onClick?: () => void;
  meta?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-2 py-2.5 transition-colors",
        onClick && "tap cursor-pointer hover:bg-paper-2",
      )} >
      <Avatar name={student.name} hue={student.hue} src={student.photo_url} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold text-ink">{student.name}</p>
        <p className="truncate font-mono text-[11px] text-ink-3">
          {student.reg_no}
          {meta && <span className="font-sans"> · {meta}</span>}
        </p>
      </div>
      {trailing}
    </div>
  );
}

export { StatusChip };
