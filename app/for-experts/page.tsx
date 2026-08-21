import type { Metadata } from "next";
import { ExpertsLanding } from "@/components/landing/experts-landing";

export const metadata: Metadata = {
  title: "For Experts — TailoredIQ",
  description:
    "Join TailoredIQ's curated network of African and diaspora experts. Share your experience through advisory conversations and contributed knowledge.",
  openGraph: {
    title: "For Experts — TailoredIQ",
    description: "Turn your hard-won experience into advisory engagements across Africa.",
  },
};

export default function ForExpertsPage() {
  return <ExpertsLanding />;
}
