"use client";

import { useEffect, useState } from "react";
import { FileText } from "@/components/icons";
import * as engagementsApi from "@/lib/api/engagements";
import type { EngagementAttachment } from "@/lib/api/engagements";
import { formatRelative } from "@/lib/utils/format";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function EngagementFiles({
  engagementId,
  viewerId,
  refreshKey,
}: {
  engagementId: string;
  viewerId: string;
  /** Bump this to force a refetch — e.g. after a new message/attachment is sent elsewhere on the page. */
  refreshKey?: number;
}) {
  const [files, setFiles] = useState<EngagementAttachment[] | undefined>(undefined);

  useEffect(() => {
    engagementsApi.listAttachmentsForEngagement(engagementId, viewerId).then(setFiles);
  }, [engagementId, viewerId, refreshKey]);

  if (!files || files.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xs font-medium uppercase tracking-wide text-gray-500">Files</h2>
      <div className="flex flex-col gap-1.5">
        {files.map(({ attachment, createdAt }) => (
          <div
            key={attachment.id}
            className="flex items-center gap-2 rounded-lg border border-gray-800 px-2.5 py-2 text-xs"
          >
            <FileText className="size-3.5 shrink-0 text-gray-500" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate text-gray-200">{attachment.name}</p>
              <p className="text-gray-500">
                {formatSize(attachment.sizeBytes)} · {formatRelative(createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
