import type { Metadata } from "next";
import { PrivacyContent } from "@/components/landing/privacy-content";

export const metadata: Metadata = {
  title: "Privacy Policy — TailoredIQ",
  description:
    "How TailoredIQ collects, uses, stores, and protects personal data across its curated expert network.",
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
