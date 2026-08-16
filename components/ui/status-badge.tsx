import { cn } from "@/lib/utils/cn";

type Tone = "neutral" | "progress" | "success" | "warning" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-gray-850 text-gray-300 before:bg-gray-400",
  progress: "bg-primary-500/15 text-primary-400 before:bg-primary-400",
  success: "bg-success-500/15 text-success-400 before:bg-success-400",
  warning: "bg-primary-500/15 text-primary-400 before:bg-primary-400",
  danger: "bg-danger-500/15 text-danger-400 before:bg-danger-400",
};

const STATUS_LABELS: Record<string, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "neutral" },
  brief_in_progress: { label: "Brief in progress", tone: "progress" },
  brief_submitted: { label: "Brief submitted", tone: "progress" },
  analysing: { label: "Analysing", tone: "progress" },
  report_ready: { label: "Report ready", tone: "success" },
  expert_matching: { label: "Matching experts", tone: "progress" },
  consultation_scheduled: { label: "Consultation scheduled", tone: "progress" },
  consultation_completed: { label: "Consultation completed", tone: "success" },
  playbook_in_progress: { label: "Playbook in progress", tone: "progress" },
  expert_review: { label: "Expert review", tone: "progress" },
  playbook_ready: { label: "Playbook ready", tone: "success" },
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
  interested: { label: "Interested", tone: "success" },
  not_for_me: { label: "Not for me", tone: "neutral" },
  submitted: { label: "Submitted", tone: "progress" },
  under_review: { label: "Under review", tone: "progress" },
  published: { label: "Published", tone: "success" },
  owned: { label: "Owned", tone: "success" },
  locked: { label: "Locked", tone: "neutral" },
  // Expert engagement stages (lib/types/opportunity.ts)
  new: { label: "New", tone: "progress" },
  reviewing: { label: "Reviewing", tone: "progress" },
  accepted: { label: "Accepted", tone: "success" },
  contributing: { label: "Contributing", tone: "progress" },
  call_scheduled: { label: "Call scheduled", tone: "progress" },
  call_completed: { label: "Call completed", tone: "success" },
  playbook_contribution: { label: "Playbook contribution", tone: "progress" },
  declined: { label: "Declined", tone: "neutral" },
  // Contribution lifecycle (lib/types/expert.ts)
  changes_requested: { label: "Changes requested", tone: "warning" },
  // Referral states (lib/types/expert.ts)
  unused: { label: "Unused", tone: "neutral" },
  claimed: { label: "Claimed", tone: "progress" },
  activated: { label: "Activated", tone: "success" },
  expired: { label: "Expired", tone: "neutral" },
  revoked: { label: "Withdrawn", tone: "danger" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const entry = STATUS_LABELS[status] ?? { label: status, tone: "neutral" as Tone };
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
