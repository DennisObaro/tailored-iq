import type { Notification } from "@/lib/types";
import { DEMO_CLIENT_ID, DEMO_EXPERT_ID, DEMO_DUAL_ID } from "./users.fixture";

const d = (day: number) => `2026-07-${String(day).padStart(2, "0")}T11:00:00.000Z`;

export const seedNotifications: Notification[] = [
  {
    id: "notif_1",
    userId: DEMO_CLIENT_ID,
    type: "playbook_ready",
    title: "Your playbook is ready",
    body: "The Talent Retention Playbook for \"Getting management trainees to take development seriously\" is ready to view.",
    linkHref: "/playbooks/playbook_1",
    read: true,
    createdAt: d(6),
  },
  {
    id: "notif_2",
    userId: DEMO_CLIENT_ID,
    type: "expert_matched",
    title: "Experts matched to your challenge",
    body: "We found 2 experts relevant to \"Scaling operations across three new facilities\".",
    linkHref: "/projects/project_3",
    read: true,
    createdAt: d(13),
  },
  {
    id: "notif_3",
    userId: DEMO_CLIENT_ID,
    type: "booking_confirmed",
    title: "Consultation confirmed",
    body: "Your consultation about market expansion is scheduled.",
    linkHref: "/consultations/consultation_2",
    read: false,
    createdAt: d(10),
  },
  {
    id: "notif_4",
    userId: DEMO_EXPERT_ID,
    type: "opportunity_new",
    title: "New opportunity available",
    body: "A leadership development challenge matches your expertise.",
    linkHref: "/expert/opportunities/opportunity_1",
    read: false,
    createdAt: d(19),
  },
  {
    id: "notif_5",
    userId: DEMO_EXPERT_ID,
    type: "opportunity_new",
    title: "New opportunity available",
    body: "A people & culture challenge matches your expertise.",
    linkHref: "/expert/opportunities/opportunity_2",
    read: false,
    createdAt: d(20),
  },
  {
    id: "notif_6",
    userId: DEMO_DUAL_ID,
    type: "playbook_ready",
    title: "Your playbook is ready",
    body: "The Governance Readiness Playbook is ready to view.",
    linkHref: "/playbooks/playbook_6",
    read: false,
    createdAt: d(7),
  },
];
