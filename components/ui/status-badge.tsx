import { cn } from "@/lib/utils/cn";

export type Tone = "neutral" | "progress" | "success" | "warning" | "danger" | "action";

// Fills stay on the fixed 500 steps at low alpha, so a pill keeps the same
// familiar tint in both themes. The ink and dot resolve through the semantic
// aliases instead, which deepen in light mode — the 400 steps that read well
// on near-black are far too pale on a light pill.
const toneClasses: Record<Tone, string> = {
  neutral: "bg-gray-850 text-gray-300 before:bg-gray-400",
  progress: "bg-primary-500/15 text-gold before:bg-gold",
  success: "bg-success-500/15 text-success before:bg-success",
  warning: "bg-primary-500/15 text-gold before:bg-gold",
  danger: "bg-danger-500/15 text-destructive before:bg-destructive",
  /** The one status colour gold doesn't already own — reserved for "this is
      waiting on you", so it never gets confused with plain progress or a
      literal warning. */
  action: "bg-info-500/15 text-info before:bg-info",
};

/**
 * Project statuses (lib/types/project.ts), mapped to four buckets rather than
 * one shade of gold for everything that isn't done:
 *
 * - neutral (grey): automated backend work with nothing for the client to
 *   look at yet — analysing, matching. Fast, and ours to finish.
 * - action (blue): the client is the one who has to move it forward —
 *   answer more questions, confirm a brief, attend a call, work through a
 *   playbook's action items. Report/consultation/playbook "ready" states
 *   live here rather than under success, since a document landing doesn't
 *   mean the engagement is done — only `completed` does.
 * - progress (amber): a person — an expert — is actively working on it over
 *   real time, the way analysing/matching aren't.
 * - success (green): reserved for the actual terminal state.
 */
const STATUS_LABELS: Record<string, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "action" },
  brief_in_progress: { label: "Brief in progress", tone: "action" },
  brief_submitted: { label: "Brief submitted", tone: "action" },
  analysing: { label: "Analysing", tone: "neutral" },
  report_ready: { label: "Executive summary ready", tone: "action" },
  expert_matching: { label: "Matching experts", tone: "neutral" },
  consultation_scheduled: { label: "Consultation scheduled", tone: "action" },
  consultation_completed: { label: "Consultation completed", tone: "action" },
  playbook_in_progress: { label: "Playbook in progress", tone: "progress" },
  expert_review: { label: "Expert review", tone: "progress" },
  playbook_ready: { label: "Playbook ready", tone: "action" },
  completed: { label: "Completed", tone: "success" },
  archived: { label: "Archived", tone: "neutral" },
  generating: { label: "Generating", tone: "progress" },
  ready: { label: "Ready", tone: "success" },
  updated: { label: "Updated", tone: "progress" },
  pending: { label: "Pending", tone: "warning" },
  incomplete: { label: "Incomplete", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  restricted: { label: "Restricted", tone: "warning" },
  suspended: { label: "Suspended", tone: "danger" },
  rejected: { label: "Rejected", tone: "danger" },
  not_started: { label: "Not started", tone: "neutral" },
  in_progress: { label: "In progress", tone: "progress" },
  done: { label: "Done", tone: "success" },
  scheduled: { label: "Scheduled", tone: "progress" },
  in_call: { label: "In call", tone: "progress" },
  cancelled: { label: "Cancelled", tone: "danger" },
  // Engagement status (lib/types/engagement.ts) — in_progress/completed reuse the entries above.
  // The label says "proposed" rather than "pending" so the status chip alone
  // carries what used to need a second "Completion proposed" badge next to
  // it (see engagement-card.tsx) — the two always co-occur, so showing both
  // was saying the same thing twice.
  pending_completion: { label: "Completion proposed", tone: "warning" },
  interested: { label: "Interested", tone: "success" },
  not_for_me: { label: "Not for me", tone: "neutral" },
  submitted: { label: "Submitted", tone: "progress" },
  under_review: { label: "Under review", tone: "progress" },
  published: { label: "Published", tone: "success" },
  owned: { label: "Owned", tone: "success" },
  locked: { label: "Locked", tone: "neutral" },
  // Collaborative playbook document (lib/types/playbook-workspace.ts)
  ready_for_review: { label: "Ready for expert review", tone: "progress" },
  in_collaboration: { label: "Expert collaboration", tone: "progress" },
  under_curation: { label: "Under curation", tone: "progress" },
  finalized: { label: "Finalized", tone: "success" },
  // Contribution states in the workspace
  open: { label: "Open", tone: "warning" },
  resolved: { label: "Resolved", tone: "neutral" },
  /** Conversation stage. The other two it can take (consultation_scheduled,
      consultation_completed) are already defined above as project statuses. */
  active: { label: "Active", tone: "progress" },
  // Expert engagement stages (lib/types/opportunity.ts)
  new: { label: "New", tone: "progress" },
  reviewing: { label: "Reviewing", tone: "progress" },
  accepted: { label: "Accepted", tone: "success" },
  contributing: { label: "Contributing", tone: "progress" },
  call_scheduled: { label: "Call scheduled", tone: "progress" },
  call_completed: { label: "Call completed", tone: "success" },
  playbook_contribution: { label: "Playbook contribution", tone: "progress" },
  declined: { label: "Declined", tone: "neutral" },
  intake_pending: { label: "Client intake", tone: "progress" },
  intake_submitted: { label: "Brief submitted", tone: "success" },
  // Contribution lifecycle (lib/types/expert.ts)
  changes_requested: { label: "Changes requested", tone: "warning" },
  // Referral states (lib/types/expert.ts)
  unused: { label: "Unused", tone: "neutral" },
  claimed: { label: "Claimed", tone: "progress" },
  activated: { label: "Activated", tone: "success" },
  expired: { label: "Expired", tone: "neutral" },
  revoked: { label: "Withdrawn", tone: "danger" },
};

/**
 * The tone a status resolves to, exported so a caller can key other UI off
 * the same taxonomy the badge itself uses — a CTA verb, a priority accent —
 * without duplicating this lookup and risking the two drifting apart.
 */
export function statusTone(status: string): Tone {
  return (STATUS_LABELS[status] ?? { tone: "neutral" as Tone }).tone;
}

export function StatusBadge({
  status,
  variant = "pill",
  className,
}: {
  status: string;
  /**
   * `bare` drops the pill, the dot and the tone colour, leaving the label as
   * an uppercase caption. For places where the status is context rather than
   * a signal to act on, and a row of coloured chips would compete with the
   * content beside it.
   */
  variant?: "pill" | "bare";
  className?: string;
}) {
  const entry = STATUS_LABELS[status] ?? { label: status, tone: "neutral" as Tone };

  if (variant === "bare") {
    return (
      <span className={cn("text-xs uppercase tracking-wider text-gray-500", className)}>
        {entry.label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "relative inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        "before:size-1.5 before:rounded-full before:content-['']",
        toneClasses[entry.tone],
        className,
      )}
    >
      {entry.label}
    </span>
  );
}
