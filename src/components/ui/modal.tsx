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

export const MODAL_TRANSITION_MS = 260;
const MODAL_OPEN_DELAY_MS = 28;

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  className,
}: ModalProps) {
  const [isMounted, setIsMounted] = React.useState(open);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    let enterTimer: number | undefined;
    let exitTimer: number | undefined;

    if (open) {
      setIsMounted(true);
      enterTimer = window.setTimeout(() => {
        setIsVisible(true);
      }, MODAL_OPEN_DELAY_MS);
    } else if (isMounted) {
      setIsVisible(false);
      exitTimer = window.setTimeout(() => {
        setIsMounted(false);
      }, MODAL_TRANSITION_MS);
    }

    return () => {
      if (enterTimer) {
        window.clearTimeout(enterTimer);
      }

      if (exitTimer) {
        window.clearTimeout(exitTimer);
      }
    };
  }, [open, isMounted]);

  React.useEffect(() => {
    if (!isMounted) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMounted, onClose]);

  if (!isMounted) {
    return null;
  }

  return (
    <div
      className="app-modal-root fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
      data-state={isVisible ? "open" : "closed"}
    >
      <div
        className="app-modal-backdrop absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "app-modal app-modal-surface relative z-10 flex max-h-[calc(100dvh-4rem)] w-full max-w-2xl flex-col overflow-hidden",
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
