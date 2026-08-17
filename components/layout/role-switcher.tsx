"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftRight } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useSessionStore } from "@/lib/store/use-session-store";

export function RoleSwitcher({ collapsed }: { collapsed?: boolean }) {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const switchRole = useSessionStore((s) => s.switchRole);

  if (!user || user.roles.length < 2) return null;

  async function toggle() {
    if (!user) return;
    const next = user.activeRole === "client" ? "expert" : "client";
    await switchRole(next);
    router.push(next === "expert" ? "/expert/dashboard" : "/dashboard");
  }

  const label = `Switch to ${user.activeRole === "client" ? "expert" : "client"} view`;

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="secondary" size="icon" onClick={toggle} aria-label={label} className="size-8">
            <ArrowLeftRight className="size-3.5" aria-hidden />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button variant="secondary" size="sm" onClick={toggle} className="w-full justify-center gap-2">
      <ArrowLeftRight className="size-3.5" aria-hidden />
      {label}
    </Button>
  );
}
