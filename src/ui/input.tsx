import * as React from "react";
import { cn } from "../lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "app-control flex h-11 px-4 py-2 text-sm",
        className,
      )}
      {...props}
    />
  );
}
