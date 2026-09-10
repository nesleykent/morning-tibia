import type { Metadata } from "next";
import { Sunrise } from "lucide-react";
import { Inter, Spectral } from "next/font/google";
import { ViewerSettingsProvider } from "@/lib/context/ViewerSettingsContext";
import { TopStatusBar } from "@/components/dashboard/TopStatusBar";
import { fetchDromeRotation } from "@/lib/data/wikiContentClient";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
// A text serif with real colour on screen — the dispatch is meant to be read, not scanned.
const serif = Spectral({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-serif", display: "swap" });

export const metadata: Metadata = {
  title: "Morning Tibia: Daily World Briefing",
  description:
    "Check today's Tibia world conditions and generate a polished daily briefing for WhatsApp, Discord, Telegram or your guild channel.",
};

export const viewport = {
  themeColor: "#0b0d16",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Fetched here too (not just in app/page.tsx) since the status bar's Drome countdown
  // lives in the layout, above the page — Next.js dedupes identical build-time fetches.
  const drome = await fetchDromeRotation(new Date());

  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <ViewerSettingsProvider>
          <div className="flex min-h-dvh flex-col">
            {/* No backdrop-blur here: Safari has a well-known bug where backdrop-filter on a
                position:sticky ancestor corrupts hit-testing/paint order for portalled
                popover content (our Select/Popover dropdowns render via a body-level
                Portal) — a solid background avoids it entirely. */}
            {/* Transparent: the dawn field is the page, and a filled bar would cut it. */}
            <div className="mx-auto flex max-w-[760px] flex-wrap items-center justify-between gap-x-5 gap-y-2 px-5 pt-6 sm:px-8">
              <span className="flex items-center gap-2">
                <Sunrise className="h-4 w-4 text-gold" />
                <span className="text-[13px] font-medium tracking-[-0.01em]">Morning Tibia</span>
              </span>
              <TopStatusBar drome={drome} />
            </div>
            <main className="flex-1">{children}</main>
          </div>
        </ViewerSettingsProvider>
      </body>
    </html>
  );
}
