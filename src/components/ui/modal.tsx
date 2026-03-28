import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  className,
}: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-8 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "app-modal relative z-10 flex max-h-[calc(100dvh-4rem)] w-full max-w-2xl flex-col overflow-hidden",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[color:var(--border)] px-6 py-5">
          <div className="space-y-1.5">
            <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
            {description ? (
              <p className="text-sm leading-6 text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="app-panel-muted rounded-full p-2 text-muted-foreground transition hover:text-foreground"
            aria-label="Cerrar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="app-scroll-y min-h-0 flex-1 px-6 py-5">{children}</div>
        {footer ? <div className="border-t border-[color:var(--border)] px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}
