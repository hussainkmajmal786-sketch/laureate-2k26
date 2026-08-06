"use client";

import { cn, initials } from "@/lib/utils";

const SIZES = {
  xs: "h-7 w-7 text-[10px]",
  sm: "h-9 w-9 text-[11.5px]",
  md: "h-11 w-11 text-[14px]",
  lg: "h-16 w-16 text-[20px]",
  xl: "h-24 w-24 text-[32px]",
  "2xl": "h-32 w-32 text-[44px]",
};

/** Pigment ink set — avatars are flat spot colours, never gradients. */
const PIGMENTS = [
  "#2563eb", "#ec4899", "#f59e0b", "#10b981",
  "#6d28d9", "#f97316", "#06b6d4", "#84cc16",
];

/**
 * Photo placeholder as a printed initial block: flat spot colour, hard rule,
 * heavy display initials. Reads as a design choice, not a missing image.
 */
export function Avatar({
  name,
  hue,
  size = "md",
  className,
  ring = true,
}: {
  name: string;
  hue: number;
  size?: keyof typeof SIZES;
  className?: string;
  ring?: boolean;
}) {
  const pigment = PIGMENTS[hue % PIGMENTS.length];
  const dark = ["#f59e0b", "#84cc16", "#10b981", "#06b6d4"].includes(pigment);

  return (
    <div
      className={cn(
        "headline relative grid shrink-0 place-items-center overflow-hidden select-none",
        SIZES[size],
        ring && "rule",
        className,
      )}
      style={{ backgroundColor: pigment, color: dark ? "#14100e" : "#fff" }}
      aria-hidden
    >
      <span className="relative z-10 pt-0.5">{initials(name)}</span>
      {/* Halftone corner — the printed texture */}
      <span
        className="absolute -right-2 -bottom-2 h-8 w-8 opacity-25"
        style={{
          backgroundImage: `radial-gradient(${dark ? "#14100e" : "#fff"} 1.4px, transparent 1.5px)`,
          backgroundSize: "5px 5px",
        }}
      />
    </div>
  );
}
