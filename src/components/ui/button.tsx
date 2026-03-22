import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-[color:var(--primary-border)] bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
        secondary:
          "border-[color:var(--border)] bg-[rgba(255,255,255,0.05)] text-foreground hover:bg-[rgba(255,255,255,0.08)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
        ghost:
          "border-transparent bg-transparent text-muted-foreground hover:bg-[rgba(255,255,255,0.04)] hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
        destructive:
          "border-[color:var(--critical-border)] bg-[var(--critical)] text-[var(--critical-foreground)] hover:bg-[#f07c68] focus-visible:ring-2 focus-visible:ring-[rgba(235,108,90,0.28)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant }), className)} {...props} />;
}
