import * as React from "react";
import { cn } from "../../lib/utils";

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "app-control min-h-32 rounded-[1.25rem] px-4 py-3 text-sm",
        className,
      )}
      {...props}
    />
  );
}
