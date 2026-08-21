import type { Metadata } from "next";
import { ContactContent } from "@/components/landing/contact-content";

export const metadata: Metadata = {
  title: "Contact — TailoredIQ",
  description: "Apply to join the TailoredIQ network or get in touch with our team.",
  openGraph: {
    title: "Contact TailoredIQ",
    description: "Apply for membership or reach out.",
  },
};

export default function ContactPage() {
  return <ContactContent />;
}
