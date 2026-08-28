"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Consultation } from "@/lib/types";
import { ChevronRight } from "@/components/icons";
import * as consultationsApi from "@/lib/api/consultations";
import * as conversationsApi from "@/lib/api/expert-conversations";
import { useSessionStore } from "@/lib/store/use-session-store";
import { ConsultationSummary } from "@/components/consultation/consultation-summary";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * A consultation on its own page.
 *
 * Everything below the breadcrumb is the same component the conversation
 * thread shows in its side panel — the summary belongs beside the thread it
 * came out of, and this route stays for the links that point straight at it
 * (notifications, bookmarks, a project's history).
 */
export default function ConsultationLobbyPage() {
  const { consultationId } = useParams<{ consultationId: string }>();
  const router = useRouter();
  const currentUser = useSessionStore((s) => s.user);
  const [consultation, setConsultation] = useState<Consultation | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const c = await consultationsApi.getConsultation(consultationId, currentUser?.id);
      if (!c || cancelled) return;

      /**
       * Before the call there is nothing here the conversation doesn't
       * already say — the date and a way in. So a scheduled consultation
       * hands straight over to the thread, where the two of them can also
       * prepare. The redirect lives on the page rather than at every link
       * so older notifications and bookmarks land in the right place too.
       */
      if (c.status === "scheduled" && currentUser) {
        const conversationId = await conversationsApi.getConversationForConsultation(
          consultationId,
          currentUser.id,
        );
        if (cancelled) return;
        if (conversationId) {
          router.replace(`/conversations/${conversationId}`);
          return;
        }
      }

      setConsultation(c);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [consultationId, currentUser, router]);

  if (consultation === undefined) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!consultation) return null;

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <Link href="/conversations" className="hover:text-gray-300">
          Conversations
        </Link>
        <ChevronRight className="size-3" aria-hidden />
        <span className="text-gray-300">Consultation</span>
      </div>

      <ConsultationSummary consultationId={consultation.id} />
    </div>
  );
}
