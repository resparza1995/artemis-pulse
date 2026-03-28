import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
  {
    variants: {
      variant: {
        neutral: "border-[color:var(--border)] bg-[rgba(255,255,255,0.05)] text-muted-foreground",
        success:
          "border-[color:var(--success-border)] bg-[var(--success-soft)] text-[var(--success-foreground)]",
        warning:
          "border-[color:var(--warning-border)] bg-[var(--warning-soft)] text-[var(--warning-foreground)]",
        critical:
          "border-[color:var(--critical-border)] bg-[var(--critical-soft)] text-[var(--critical-foreground)]",
        outline:
          "border-[color:var(--primary-border)] bg-[var(--primary-soft)] text-[var(--foreground)]",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
