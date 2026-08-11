"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useUiStore } from "@/lib/store/use-ui-store";
import { Sidebar } from "./sidebar";

export function MobileDrawer() {
  const open = useUiStore((s) => s.mobileNavOpen);
  const setOpen = useUiStore((s) => s.setMobileNavOpen);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 data-[state=open]:animate-in data-[state=open]:fade-in md:hidden" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 md:hidden">
          <Dialog.Title className="sr-only">Navigation</Dialog.Title>
          <Sidebar className="w-72" />
          <Dialog.Close
            className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-md bg-gray-900 text-gray-400 hover:text-gray-100"
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
