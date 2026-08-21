"use client";

import { useState } from "react";
import Link from "next/link";
import { RotateCcw, AlertTriangle, ChevronRight } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DataSettingsPage() {
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function resetDemoData() {
    setResetting(true);
    const { db, setSessionUserId } = await import("@/lib/api/_db");
    db.reset();
    setSessionUserId(null);
    // Hard navigation (not router.push) is intentional: it clears in-memory
    // Zustand state too, not just localStorage, so nothing stale survives the reset.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/sign-in";
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <div>
        <div className="mb-4 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/settings" className="hover:text-gray-300">
            Settings
          </Link>
          <ChevronRight className="size-3" aria-hidden />
          <span className="text-gray-300">Demo data</span>
        </div>
        <h1 className="text-xl font-semibold text-gray-50">Demo data</h1>
        <p className="mt-1 text-sm text-gray-400">
          This is a prototype — all data lives in your browser. You can reset it back to the seeded
          starting state at any time.
        </p>
      </div>

      <Card className="flex flex-col gap-4 p-5">
        <div className="flex items-start gap-2 text-sm text-gray-300">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
          Resetting will sign you out and permanently discard every project, brief, executive summary, consultation,
          and playbook created in this browser — including the seeded demo accounts&apos; current state.
        </div>
        {!confirming ? (
          <Button variant="outline" className="gap-1.5 self-start" onClick={() => setConfirming(true)}>
            <RotateCcw className="size-4" aria-hidden />
            Reset demo data
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="danger" loading={resetting} onClick={resetDemoData}>
              Confirm reset
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)} disabled={resetting}>
              Cancel
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
