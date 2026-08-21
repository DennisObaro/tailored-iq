import type { Metadata } from "next";
import { TermsContent } from "@/components/landing/terms-content";

export const metadata: Metadata = {
  title: "Terms & Conditions — TailoredIQ",
  description:
    "TailoredIQ Expert Network Terms, Ethics & Compliance Framework — the obligations every expert, advisor, and contributor agrees to.",
};

export default function TermsPage() {
  return <TermsContent />;
}
