"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Printed button. Every variant is a solid colour block with a hard ink rule
 * and an offset shadow; pressing physically moves the block onto its shadow.
 */
const button = cva(
  "tap relative inline-flex items-center justify-center gap-2 font-bold whitespace-nowrap select-none rule press-sm disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-ink drop-2",
        secondary: "bg-paper text-ink drop-2",
        pop: "bg-pop text-white drop-2",
        soft: "bg-pop text-white drop-2",
        success: "bg-ok text-ink-black drop-2",
        warning: "bg-warn text-ink-black drop-2",
        danger: "bg-bad text-white drop-2",
        glass: "bg-paper text-ink drop-2",
        ghost:
          "border-transparent shadow-none text-ink-2 hover:bg-paper-2 hover:text-ink hover:shadow-none hover:translate-0",
        outline: "bg-transparent text-ink drop-1",
      },
      size: {
        sm: "h-9 px-3 text-[12px] tracking-[0.02em]",
        md: "h-11 px-5 text-[13.5px]",
        lg: "h-13 px-6 text-[15px]",
        xl: "h-16 px-8 text-[17px] tracking-[-0.01em]",
        icon: "h-11 w-11",
        "icon-sm": "h-9 w-9",
      },
      block: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", block: false },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, ...props }, ref) => (
    <button ref={ref} className={cn(button({ variant, size, block }), className)} {...props} />
  ),
);
Button.displayName = "Button";

export { button as buttonVariants };
