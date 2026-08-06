"use client";

import * as React from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const FIELD =
  "h-11 w-full rule bg-paper px-3 text-[13.5px] font-medium text-ink outline-none transition-shadow placeholder:font-normal placeholder:text-ink-3 focus:drop-2 disabled:opacity-50";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(FIELD, className)} {...props} />,
);
Input.displayName = "Input";

export function SearchBar({
  value,
  onChange,
  placeholder = "SEARCH…",
  className,
  shortcut,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  shortcut?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink"
        strokeWidth={2.6}
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(FIELD, "stencil pr-14 pl-9 text-[11.5px] placeholder:text-ink-3")}
      />
      {shortcut && (
        <kbd className="stencil pointer-events-none absolute top-1/2 right-2 hidden h-6 -translate-y-1/2 items-center rule bg-paper-2 px-1.5 text-[10px] text-ink-2 sm:flex">
          {shortcut}
        </kbd>
      )}
    </div>
  );
}

export function Select({
  value,
  onChange,
  options,
  className,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(FIELD, "stencil cursor-pointer appearance-none pr-9 text-[11.5px]")}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-ink"
        strokeWidth={3}
      />
    </div>
  );
}

/** Hard-edged toggle — the knob is a square block that snaps across. */
export function Switch({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  id?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "tap relative h-7 w-13 shrink-0 rule transition-colors duration-150",
        checked ? "bg-ok" : "bg-paper-3",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 grid h-5 w-5 place-items-center bg-[rgb(var(--ink))] transition-transform duration-150 ease-out",
          checked && "translate-x-6",
        )}
      >
        {checked && <Check className="h-3 w-3 text-[rgb(var(--paper))]" strokeWidth={4} />}
      </span>
    </button>
  );
}

/** Tabbed segmented control — the active tab is a solid ink block. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  return (
    <div className={cn("inline-flex rule bg-paper", className)}>
      {options.map((o, i) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "stencil tap px-3 py-2 text-[10.5px] leading-none transition-colors duration-150",
            i > 0 && "rule-l",
            value === o.value
              ? "bg-[rgb(var(--ink))] text-[rgb(var(--paper))]"
              : "text-ink-2 hover:bg-paper-2 hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
