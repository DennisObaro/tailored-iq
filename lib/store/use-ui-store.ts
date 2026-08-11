import { create } from "zustand";
import { id } from "@/lib/utils/id";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "danger";
}

interface UiState {
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  commandMenuOpen: boolean;
  toasts: Toast[];
  setSidebarCollapsed: (v: boolean) => void;
  setMobileNavOpen: (v: boolean) => void;
  setCommandMenuOpen: (v: boolean) => void;
  toast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  mobileNavOpen: false,
  commandMenuOpen: false,
  toasts: [],
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setMobileNavOpen: (v) => set({ mobileNavOpen: v }),
  setCommandMenuOpen: (v) => set({ commandMenuOpen: v }),
  toast: (toast) =>
    set((state) => ({ toasts: [...state.toasts, { ...toast, id: id("toast") }] })),
  dismissToast: (toastId) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== toastId) })),
}));
