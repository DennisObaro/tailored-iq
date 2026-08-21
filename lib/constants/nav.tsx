import {
  DashboardSquare01Icon as DashboardSquare01Stroke,
  Briefcase01Icon as Briefcase01Stroke,
  ClipboardIcon as ClipboardStroke,
  UserCircle02Icon as UserCircle02Stroke,
  Award01Icon as Award01Stroke,
} from "@hugeicons-pro/core-stroke-rounded";
import {
  DashboardSquare01Icon as DashboardSquare01Solid,
  Briefcase01Icon as Briefcase01Solid,
  ClipboardIcon as ClipboardSolid,
  UserCircle02Icon as UserCircle02Solid,
  Award01Icon as Award01Solid,
} from "@hugeicons-pro/core-solid-rounded";
import {
  HomeIconStroke,
  HomeIconSolid,
  ChatIconStroke,
  ChatIconSolid,
  PlaybooksIconStroke,
  PlaybooksIconSolid,
  ExpertsIconStroke,
  ExpertsIconSolid,
  ConversationsIconStroke,
  ConversationsIconSolid,
  ReportsIconStroke,
  ReportsIconSolid,
} from "@/components/icons/nav-icons";
import { Settings } from "@/components/icons";
import { hugeiconsAdapter } from "@/components/icons/hugeicon";
import type { Role } from "@/lib/types";
import type { IconPair } from "@/components/ui/nav-icon";

export interface NavItem {
  label: string;
  href: string;
  icon: IconPair;
}

// Nav items with no equivalent in the sourced Figma icon set stay on
// Hugeicons Pro; hugeiconsAdapter gives those the same
// (props) => <svg /> shape as the Figma-sourced components, so NavIcon
// doesn't need to know or care where any given icon comes from.

const DashboardSquare01: IconPair = { Stroke: hugeiconsAdapter(DashboardSquare01Stroke), Solid: hugeiconsAdapter(DashboardSquare01Solid) };
const Briefcase01: IconPair = { Stroke: hugeiconsAdapter(Briefcase01Stroke), Solid: hugeiconsAdapter(Briefcase01Solid) };
const Clipboard: IconPair = { Stroke: hugeiconsAdapter(ClipboardStroke), Solid: hugeiconsAdapter(ClipboardSolid) };
const UserCircle02: IconPair = { Stroke: hugeiconsAdapter(UserCircle02Stroke), Solid: hugeiconsAdapter(UserCircle02Solid) };
const Award01: IconPair = { Stroke: hugeiconsAdapter(Award01Stroke), Solid: hugeiconsAdapter(Award01Solid) };

// Figma-sourced (file QmKaB3nn1udOAZvu5JAgOE, frame 747:518).
const Home: IconPair = { Stroke: HomeIconStroke, Solid: HomeIconSolid };
const Chat: IconPair = { Stroke: ChatIconStroke, Solid: ChatIconSolid };
const Playbooks: IconPair = { Stroke: PlaybooksIconStroke, Solid: PlaybooksIconSolid };
const Experts: IconPair = { Stroke: ExpertsIconStroke, Solid: ExpertsIconSolid };
const Conversations: IconPair = { Stroke: ConversationsIconStroke, Solid: ConversationsIconSolid };
const Reports: IconPair = { Stroke: ReportsIconStroke, Solid: ReportsIconSolid };

export const CLIENT_NAV: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Ask TailoredIQ", href: "/chat", icon: Chat },
  { label: "Executive summaries", href: "/reports", icon: Reports },
  { label: "Playbooks", href: "/playbooks", icon: Playbooks },
  { label: "Experts", href: "/experts", icon: Experts },
  { label: "Conversations", href: "/conversations", icon: Conversations },
];

export const EXPERT_NAV: NavItem[] = [
  { label: "Home", href: "/expert/dashboard", icon: Home },
  { label: "Opportunities", href: "/expert/opportunities", icon: Briefcase01 },
  { label: "Projects", href: "/expert/projects", icon: DashboardSquare01 },
  { label: "Calls", href: "/expert/calls", icon: Conversations },
  { label: "Contributions", href: "/expert/contributions", icon: Clipboard },
  { label: "Insights", href: "/expert/insights", icon: Reports },
  { label: "Conversations", href: "/conversations", icon: Conversations },
  { label: "Rewards", href: "/expert/rewards", icon: Award01 },
  { label: "Profile", href: "/expert/profile", icon: UserCircle02 },
];

// Settings is a dropdown menu item, not a persistent-selection nav link,
// so it takes the plain icon rather than a stroke/solid IconPair.
export const SETTINGS_NAV = { label: "Settings", href: "/settings", icon: Settings };

export function getNavItems(role: Role): NavItem[] {
  return role === "expert" ? EXPERT_NAV : CLIENT_NAV;
}
