import type { Metadata } from "next";
import { AboutContent } from "@/components/landing/about-content";

export const metadata: Metadata = {
  title: "About — TailoredIQ",
  description:
    "TailoredIQ was built to make Africa's experience capital accessible — connecting users with seasoned operators.",
  openGraph: {
    title: "About TailoredIQ",
    description: "Why TailoredIQ exists and the people building it.",
  },
};

export default function AboutPage() {
  return <AboutContent />;
}
