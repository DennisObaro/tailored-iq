import type { Metadata } from "next";
import { DM_Sans, Great_Vibes } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// The founder-note signature on the marketing pages, and nothing else — it
// ships as its own `--font-great-vibes` variable rather than joining the sans
// stack so the dashboard never pulls it.
const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TailoredIQ",
  description: "Bring us the challenge. We'll help you find relevant experience and turn it into a practical path forward.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: next-themes writes data-theme onto <html>
    // before React hydrates, so the server and client markup differ here by
    // design. It suppresses the warning for this element only.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${dmSans.variable} ${greatVibes.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-975 text-gray-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
