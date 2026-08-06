"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, Info, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

/* ── Skeletons ─────────────────────────────────────────────── */

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("shimmer rule", className)} {...props} />;
}

export function KpiSkeleton() {
  return (
    <div className="bg-paper rule drop-2 p-4">
      <div className="flex items-start justify-between">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-5 w-10" />
      </div>
      <Skeleton className="mt-4 h-10 w-24" />
      <Skeleton className="mt-2 h-3 w-28" />
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rule-b px-4 py-3">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-3.5 flex-1" style={{ maxWidth: `${190 - i * 9}px` }} />
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="ml-auto h-5 w-16" />
        </div>
      ))}
    </div>
  );
}

/* ── Empty / Error ─────────────────────────────────────────── */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <motion.div
        initial={{ scale: 0.8, rotate: -8, opacity: 0 }}
        animate={{ scale: 1, rotate: -3, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
        className="grid h-16 w-16 place-items-center rule bg-warn drop-2" >
        <Icon className="h-7 w-7 text-ink-black" strokeWidth={2.4} />
      </motion.div>
      <h3 className="headline mt-5 text-[19px] text-ink">{title}</h3>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-ink-3 text-pretty">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "SOMETHING BROKE",
  description,
  onRetry,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="grid h-16 w-16 -rotate-3 place-items-center rule bg-bad drop-2">
        <AlertTriangle className="h-7 w-7 text-white" strokeWidth={2.4} />
      </div>
      <h3 className="headline mt-5 text-[19px] text-ink">{title}</h3>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-ink-3">{description}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          TRY AGAIN
        </Button>
      )}
    </div>
  );
}

/* ── Modal ─────────────────────────────────────────────────── */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const width = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" }[size];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-100 grid place-items-end p-0 sm:place-items-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="halftone absolute inset-0 bg-[rgb(var(--ink))]/55" />
          <motion.div role="dialog" aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 30, rotate: -1 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className={cn("relative w-full bg-paper rule-thick drop-4", width)} >
            {title && (
              <div className="flex items-start justify-between gap-4 rule-b bg-accent px-5 py-3">
                <div className="min-w-0">
                  <h2 className="headline text-[20px] text-accent-ink">{title}</h2>
                  {description && (
                    <p className="mt-1 text-[12.5px] leading-snug text-accent-ink/80 text-pretty">
                      {description}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose} aria-label="Close dialog"
                  className="tap grid h-7 w-7 shrink-0 place-items-center rule border-accent-ink text-accent-ink transition-colors hover:bg-accent-ink hover:text-accent" >
                  <X className="h-4 w-4" strokeWidth={3} />
                </button>
              </div>
            )}
            {!title && (
              <button
                onClick={onClose} aria-label="Close dialog"
                className="tap absolute top-3 right-3 z-10 grid h-7 w-7 place-items-center rule bg-paper text-ink hover:bg-ink hover:text-paper" >
                <X className="h-4 w-4" strokeWidth={3} />
              </button>
            )}
            {children && <div className="p-5">{children}</div>}
            {footer && <div className="flex justify-end gap-2 rule-t bg-paper-2 px-5 py-3">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "CONFIRM",
  destructive = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description} size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>CANCEL</Button>
          <Button
            variant={destructive ? "danger" : "primary"}
            onClick={() => { onConfirm(); onClose(); }} >
            {confirmLabel}
          </Button>
        </>
      } />
  );
}

/* ── Success ───────────────────────────────────────────────── */

export function SuccessCheck({ size = 76 }: { size?: number }) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 76 76" initial="hidden" animate="visible" aria-hidden>
      <motion.rect x="4" y="4" width="68" height="68" fill="none" stroke="rgb(var(--ink))"
        strokeWidth="4"
        variants={{
          hidden: { pathLength: 0 },
          visible: { pathLength: 1, transition: { duration: 0.45, ease: "easeOut" } },
        }} />
      <motion.path d="M20 39 L32 51 L56 25" fill="none" stroke="rgb(var(--ok))"
        strokeWidth="8"
        strokeLinecap="square"
        variants={{
          hidden: { pathLength: 0 },
          visible: { pathLength: 1, transition: { duration: 0.3, delay: 0.3, ease: "easeOut" } },
        }} />
    </motion.svg>
  );
}

export function SuccessDialog({
  open,
  onClose,
  title,
  description,
  action,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Modal open={open} onClose={onClose} title="" size="sm">
      <div className="flex flex-col items-center py-3 text-center">
        <SuccessCheck />
        <h2 className="headline mt-5 text-[26px] text-ink text-balance">{title}</h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2 text-pretty">{description}</p>
        <div className="mt-6 w-full">{action ?? <Button block size="lg" onClick={onClose}>DONE</Button>}</div>
      </div>
    </Modal>
  );
}

/* ── Toasts ────────────────────────────────────────────────── */

export type ToastTone = "ok" | "info" | "warn" | "bad";
export interface Toast {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
}

const ToastCtx = React.createContext<{ push: (t: Omit<Toast, "id">) => void }>({ push: () => {} });

export function useToast() {
  return React.useContext(ToastCtx);
}

const TONE_ICON: Record<ToastTone, LucideIcon> = { ok: Check, info: Info, warn: AlertTriangle, bad: X };
const TONE_BAR: Record<ToastTone, string> = {
  ok: "bg-ok text-ink-black",
  info: "bg-accent text-accent-ink",
  warn: "bg-warn text-ink-black",
  bad: "bg-bad text-white",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const idRef = React.useRef(0);

  const push = React.useCallback((t: Omit<Toast, "id">) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4200);
  }, []);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-200 flex flex-col items-center gap-2 px-4 sm:right-5 sm:bottom-5 sm:left-auto sm:items-end sm:px-0">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const Icon = TONE_ICON[t.tone];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 40, rotate: 2 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                exit={{ opacity: 0, x: 30, transition: { duration: 0.15 } }}
                transition={{ type: "spring", stiffness: 460, damping: 30 }}
                className="pointer-events-auto flex w-full max-w-sm items-stretch bg-paper rule-thick drop-3" >
                <span className={cn("grid w-10 shrink-0 place-items-center rule-r", TONE_BAR[t.tone])}>
                  <Icon className="h-4.5 w-4.5" strokeWidth={3} />
                </span>
                <div className="min-w-0 flex-1 px-3 py-2.5">
                  <p className="stencil text-[11px] text-ink">{t.title}</p>
                  {t.description && (
                    <p className="mt-0.5 truncate text-[12px] text-ink-3">{t.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))} aria-label="Dismiss"
                  className="tap grid w-8 shrink-0 place-items-center rule-l text-ink-3 hover:bg-paper-2 hover:text-ink" >
                  <X className="h-3.5 w-3.5" strokeWidth={3} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
