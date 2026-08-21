import {
  Store01Icon,
  UserGroupIcon,
  UserCheck01Icon,
  UserAdd01Icon,
  ChartUpIcon,
  AiBrain01Icon,
  Wallet01Icon,
  HierarchyIcon,
  Compass01Icon,
} from "@hugeicons-pro/core-stroke-rounded";
import { hugeiconsAdapter } from "@/components/icons/hugeicon";
import type { Suggestion } from "@/components/chat/suggestion-carousel";

/**
 * Questions rather than topics: the composer is asking what decision you
 * are facing, and a decision is easier to recognise than a category.
 * One flat strip — the carousel drifts through it continuously, so the
 * order is the reading order rather than a set of interchangeable groups.
 */
export const SUGGESTED_QUESTIONS: Suggestion[] = [
  { text: "Should we enter a new market now?", icon: hugeiconsAdapter(Store01Icon) },
  { text: "How do I build a stronger leadership team?", icon: hugeiconsAdapter(UserGroupIcon) },
  { text: "How can we retain our best people?", icon: hugeiconsAdapter(UserCheck01Icon) },
  { text: "Should we hire a COO at this stage?", icon: hugeiconsAdapter(UserAdd01Icon) },
  { text: "How do I scale without losing efficiency?", icon: hugeiconsAdapter(ChartUpIcon) },
  { text: "Where should we start with AI adoption?", icon: hugeiconsAdapter(AiBrain01Icon) },
  { text: "Raise more capital, or focus on profitability?", icon: hugeiconsAdapter(Wallet01Icon) },
  { text: "How do we restructure a growing team?", icon: hugeiconsAdapter(HierarchyIcon) },
  { text: "How do I prepare for a major decision?", icon: hugeiconsAdapter(Compass01Icon) },
];
