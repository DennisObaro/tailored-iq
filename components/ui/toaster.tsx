"use client";

import * as Toast from "@radix-ui/react-toast";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useUiStore } from "@/lib/store/use-ui-store";
import { cn } from "@/lib/utils/cn";

const icons = {
  default: Info,
  success: CheckCircle2,
  danger: AlertCircle,
};

export function Toaster() {
  const toasts = useUiStore((s) => s.toasts);
  const dismissToast = useUiStore((s) => s.dismissToast);

  return (
    <Toast.Provider swipeDirection="right" duration={5000}>
      {toasts.map((t) => {
        const Icon = icons[t.variant ?? "default"];
        return (
          <Toast.Root
            key={t.id}
            onOpenChange={(open) => !open && dismissToast(t.id)}
            className={cn(
              "flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-900 p-4 shadow-lg",
              "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-2 data-[state=open]:fade-in",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out",
            )}
          >
            <Icon
              className={cn(
                "mt-0.5 size-4 shrink-0",
                t.variant === "success" && "text-success-400",
                t.variant === "danger" && "text-danger-400",
                (!t.variant || t.variant === "default") && "text-primary-400",
              )}
              aria-hidden
            />
            <div className="flex flex-col gap-0.5">
              <Toast.Title className="text-sm font-medium text-gray-50">{t.title}</Toast.Title>
              {t.description && (
                <Toast.Description className="text-xs text-gray-400">
                  {t.description}
                </Toast.Description>
              )}
            </div>
            <Toast.Close
              className="ml-auto text-gray-500 hover:text-gray-300"
              aria-label="Dismiss notification"
            >
              <X className="size-3.5" />
            </Toast.Close>
          </Toast.Root>
        );
      })}
      <Toast.Viewport className="fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2 outline-none" />
    </Toast.Provider>
  );
}
