import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useToastStore } from "@/store/toast";

const icons = {
  info: Info,
  success: CheckCircle2,
  error: AlertCircle,
};

const tones = {
  info: "border-border bg-card text-foreground",
  success: "border-success/30 bg-success/10 text-foreground",
  error: "border-danger/30 bg-danger/10 text-foreground",
};

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const Icon = icons[toast.tone];
        return (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-3 shadow-lift animate-fade-up",
              tones[toast.tone],
            )}
          >
            <Icon
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0",
                toast.tone === "success"
                  ? "text-success"
                  : toast.tone === "error"
                    ? "text-danger"
                    : "text-primary",
              )}
            />
            <p className="flex-1 text-sm leading-5">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="rounded-md p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
