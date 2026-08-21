import type { Metadata } from "next";
import { ClientLandingPage } from "@/components/landing/client-landing-page";

export const metadata: Metadata = {
  title: "TailoredIQ — Africa's Expert Network",
  description:
    "A curated network connecting users with experienced African and diaspora professionals for context-rich insight and advisory support.",
  openGraph: {
    title: "TailoredIQ — Africa's Expert Network",
    description:
      "Curated peer network of senior operators across African markets and the diaspora.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function HomePage() {
  return <ClientLandingPage />;
}
