"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Compass, Briefcase, ChevronRight } from "lucide-react";
import { useSessionStore } from "@/lib/store/use-session-store";
import * as usersApi from "@/lib/api/users";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RolesSettingsPage() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const refresh = useSessionStore((s) => s.refresh);
  const [addingExpert, setAddingExpert] = useState(false);
  const [addingClient, setAddingClient] = useState(false);

  if (!user) return null;

  async function addExpertRole() {
    setAddingExpert(true);
    await usersApi.addRole(user!.id, "expert");
    await usersApi.switchActiveRole(user!.id, "expert");
    await refresh();
    setAddingExpert(false);
    router.push("/expert/onboarding");
  }

  async function addClientRole() {
    setAddingClient(true);
    await usersApi.addRole(user!.id, "client");
    await usersApi.switchActiveRole(user!.id, "client");
    await refresh();
    setAddingClient(false);
    router.push("/dashboard");
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <div>
        <div className="mb-4 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/settings" className="hover:text-gray-300">
            Settings
          </Link>
          <ChevronRight className="size-3" aria-hidden />
          <span className="text-gray-300">Roles</span>
        </div>
        <h1 className="text-xl font-semibold text-gray-50">Roles</h1>
        <p className="mt-1 text-sm text-gray-400">
          You can be a client, an expert, or both at the same time — this never restricts the other.
        </p>
      </div>

      <Card className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <Compass className="size-4 text-primary-400" aria-hidden />
          <div>
            <p className="text-sm font-medium text-gray-100">Get help with challenges</p>
            <p className="text-xs text-gray-500">{user.roles.includes("client") ? "Active" : "Not active"}</p>
          </div>
        </div>
        {!user.roles.includes("client") && (
          <Button size="sm" variant="outline" loading={addingClient} onClick={addClientRole}>
            Enable
          </Button>
        )}
      </Card>

      <Card className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <Briefcase className="size-4 text-primary-400" aria-hidden />
          <div>
            <p className="text-sm font-medium text-gray-100">Contribute expertise</p>
            <p className="text-xs text-gray-500">{user.roles.includes("expert") ? "Active" : "Not active"}</p>
          </div>
        </div>
        {!user.roles.includes("expert") && (
          <Button size="sm" variant="outline" loading={addingExpert} onClick={addExpertRole}>
            Enable
          </Button>
        )}
      </Card>
    </div>
  );
}
