import {
  Home01Icon as Home01Stroke,
  SparklesIcon as SparklesStroke,
  FolderKanbanIcon as FolderKanbanStroke,
  File02Icon as File02Stroke,
  BookOpen01Icon as BookOpen01Stroke,
  UserGroupIcon as UserGroupStroke,
  Comment01Icon as Comment01Stroke,
  DashboardSquare01Icon as DashboardSquare01Stroke,
  Briefcase01Icon as Briefcase01Stroke,
  ClipboardIcon as ClipboardStroke,
  UserCircle02Icon as UserCircle02Stroke,
} from "@hugeicons-pro/core-stroke-rounded";
import {
  Home01Icon as Home01Solid,
  SparklesIcon as SparklesSolid,
  FolderKanbanIcon as FolderKanbanSolid,
  File02Icon as File02Solid,
  BookOpen01Icon as BookOpen01Solid,
  UserGroupIcon as UserGroupSolid,
  Comment01Icon as Comment01Solid,
  DashboardSquare01Icon as DashboardSquare01Solid,
  Briefcase01Icon as Briefcase01Solid,
  ClipboardIcon as ClipboardSolid,
  UserCircle02Icon as UserCircle02Solid,
} from "@hugeicons-pro/core-solid-rounded";
import { Settings } from "lucide-react";
import type { Role } from "@/lib/types";
import type { IconPair } from "@/components/ui/nav-icon";

export interface NavItem {
  label: string;
  href: string;
  icon: IconPair;
}

export const CLIENT_NAV: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: { stroke: Home01Stroke, solid: Home01Solid } },
  { label: "AI Chat", href: "/chat", icon: { stroke: SparklesStroke, solid: SparklesSolid } },
  { label: "Projects", href: "/projects", icon: { stroke: FolderKanbanStroke, solid: FolderKanbanSolid } },
  { label: "Reports", href: "/reports", icon: { stroke: File02Stroke, solid: File02Solid } },
  { label: "Playbooks", href: "/playbooks", icon: { stroke: BookOpen01Stroke, solid: BookOpen01Solid } },
  { label: "Experts", href: "/experts", icon: { stroke: UserGroupStroke, solid: UserGroupSolid } },
  { label: "Conversations", href: "/conversations", icon: { stroke: Comment01Stroke, solid: Comment01Solid } },
];

export const EXPERT_NAV: NavItem[] = [
  { label: "Overview", href: "/expert/dashboard", icon: { stroke: DashboardSquare01Stroke, solid: DashboardSquare01Solid } },
  { label: "Opportunities", href: "/expert/opportunities", icon: { stroke: Briefcase01Stroke, solid: Briefcase01Solid } },
  { label: "Contributions", href: "/expert/contributions/new", icon: { stroke: ClipboardStroke, solid: ClipboardSolid } },
  { label: "Profile", href: "/expert/onboarding", icon: { stroke: UserCircle02Stroke, solid: UserCircle02Solid } },
];

// Unchanged: dropdown menu item, not a persistent-selection nav link — stays lucide-react.
export const SETTINGS_NAV = { label: "Settings", href: "/settings", icon: Settings };

export function getNavItems(role: Role): NavItem[] {
  return role === "expert" ? EXPERT_NAV : CLIENT_NAV;
}
