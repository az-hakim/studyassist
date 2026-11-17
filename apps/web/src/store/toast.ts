import { create } from "zustand";

import { newId } from "@/lib/utils";

export type ToastTone = "info" | "success" | "error";

export interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
}

interface ToastState {
  toasts: Toast[];
  push: (message: string, tone?: ToastTone) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (message, tone = "info") => {
    const id = newId("toast");
    set({ toasts: [...get().toasts.slice(-2), { id, message, tone }] });
    if (typeof window !== "undefined") {
      window.setTimeout(() => get().dismiss(id), 4200);
    }
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((toast) => toast.id !== id) }),
}));

export function toast(message: string, tone: ToastTone = "info"): void {
  useToastStore.getState().push(message, tone);
}
