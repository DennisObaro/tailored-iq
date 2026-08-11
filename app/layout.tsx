import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TailoredIQ",
  description: "Bring us the challenge. We'll help you find relevant experience and turn it into a practical path forward.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`dark ${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-975 text-gray-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
