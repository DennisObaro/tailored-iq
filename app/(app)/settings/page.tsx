"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSessionStore } from "@/lib/store/use-session-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const signOut = useSessionStore((s) => s.signOut);

  async function onSignOut() {
    await signOut();
    router.push("/sign-in");
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-xl font-semibold text-gray-50">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>First name</Label>
              <Input value={user.firstName} disabled />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Last name</Label>
              <Input value={user.lastName} disabled />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Email</Label>
            <Input value={user.email} disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-gray-400">Manage whether you use TailoredIQ as a client, an expert, or both.</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/settings/roles">Manage</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expert review queue</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3">
          <p className="text-sm text-gray-400">
            Approve or decline experts awaiting verification. Behind an internal admin role in a real deployment.
          </p>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href="/settings/expert-review">Open</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Demo data</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-gray-400">Reset this prototype back to its seeded starting state.</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/settings/data">Manage</Link>
          </Button>
        </CardContent>
      </Card>

      <Button variant="outline" onClick={onSignOut}>
        Sign out
      </Button>
    </div>
  );
}
