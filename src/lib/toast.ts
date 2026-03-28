export type ToastType = "success" | "warning" | "error";

export type Toast = {
  id: string;
  type: ToastType;
  message: string;
};

type ToastListener = (toasts: Toast[]) => void;

class ToastManager {
  private toasts: Toast[] = [];
  private listeners: Set<ToastListener> = new Set();
  private timers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  subscribe(listener: ToastListener) {
    this.listeners.add(listener);
    listener(this.toasts);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private toast(type: ToastType, message: string) {
    // Basic ID generation
    const id = Math.random().toString(36).slice(2, 9);
    this.toasts = [...this.toasts, { id, type, message }];
    this.notify();

    const timer = setTimeout(() => {
      this.dismiss(id);
    }, 4000);
    this.timers.set(id, timer);
  }

  success(message: string) {
    this.toast("success", message);
  }

  warning(message: string) {
    this.toast("warning", message);
  }

  error(message: string) {
    this.toast("error", message);
  }

  dismiss(id: string) {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.toasts));
  }
}

export const toastManager = new ToastManager();
