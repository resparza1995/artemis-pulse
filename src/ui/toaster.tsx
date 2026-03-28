import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, X } from "lucide-react";
import { toastManager, type Toast } from "../lib/toast";

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    return toastManager.subscribe(setToasts);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={[
            "pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-[var(--shadow-overlay)] animate-toast-in",
            t.type === "success"
              ? "border-[var(--success-border)] bg-[#1e252b] text-[var(--success-foreground)]"
              : t.type === "warning"
              ? "border-[var(--warning-border)] bg-[#1e252b] text-[var(--warning-foreground)]"
              : "border-[var(--critical-border)] bg-[#1e252b] text-[var(--critical-foreground)]"
          ].join(" ")}
          style={{
            // Enhance the visual by using the base panel color but slightly tinted
            background: `linear-gradient(to right, ${
              t.type === "success" ? "rgba(53, 194, 111, 0.08)" 
              : t.type === "warning" ? "rgba(244, 181, 75, 0.08)"
              : "rgba(235, 108, 90, 0.08)"
            }, transparent), var(--surface-overlay)`
          }}
        >
          <div className="mt-0.5 shrink-0">
            {t.type === "success" && <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />}
            {t.type === "warning" && <AlertTriangle className="h-4 w-4 text-[var(--warning)]" />}
            {t.type === "error" && <XCircle className="h-4 w-4 text-[var(--critical)]" />}
          </div>
          <p className="flex-1 text-sm font-medium leading-relaxed">
            {t.message}
          </p>
          <button
            type="button"
            className="shrink-0 opacity-70 hover:opacity-100 transition"
            onClick={() => toastManager.dismiss(t.id)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
