"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText } from "@/components/icons";
import type { Report } from "@/lib/types";
import * as reportsApi from "@/lib/api/reports";
import { useSessionStore } from "@/lib/store/use-session-store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils/format";

export default function ReportsPage() {
  const user = useSessionStore((s) => s.user);
  const [reports, setReports] = useState<Report[] | null>(null);

  useEffect(() => {
    if (!user) return;
    reportsApi.listReports(user.id).then(setReports);
  }, [user]);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-xl font-semibold text-gray-50">Executive summaries</h1>

      {!reports ? (
        <Skeleton className="h-32 w-full" />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No executive summaries yet."
          description="An executive summary appears here once a challenge has been diagnosed."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((r) => (
            <Link key={r.id} href={`/reports/${r.id}`}>
              <Card className="flex items-center justify-between p-4 transition-colors hover:bg-gray-900">
                <div>
                  <p className="text-sm font-medium text-gray-50">{r.problemSummary.slice(0, 90)}...</p>
                  <p className="mt-1 text-xs text-gray-500">Generated {formatDate(r.createdAt)}</p>
                </div>
                <Badge variant="outline">{r.category}</Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
