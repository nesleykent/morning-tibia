import type { Metadata } from "next";
import { Sunrise } from "lucide-react";
import { ViewerSettingsProvider } from "@/lib/context/ViewerSettingsContext";
import { TopStatusBar } from "@/components/dashboard/TopStatusBar";
import { fetchDromeRotation } from "@/lib/data/wikiContentClient";
import "./globals.css";

export const metadata: Metadata = {
  title: "Morning Tibia — Daily World Briefing",
  description:
    "Check today's Tibia world conditions and generate a polished daily briefing for WhatsApp, Discord, Telegram or your guild channel.",
};

export const viewport = {
  themeColor: "#14171c",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Fetched here too (not just in app/page.tsx) since the status bar's Drome countdown
  // lives in the layout, above the page — Next.js dedupes identical build-time fetches.
  const drome = await fetchDromeRotation(new Date());

  return (
    <html lang="en">
      <body>
        <ViewerSettingsProvider>
          <div className="flex min-h-dvh flex-col">
            <div className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
              <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-4 py-2.5">
                <span className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gold/15 text-gold">
                    <Sunrise className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold tracking-tight">Morning Tibia</span>
                </span>
                <TopStatusBar drome={drome} />
              </div>
            </div>
            <main className="flex-1">{children}</main>
          </div>
        </ViewerSettingsProvider>
      </body>
    </html>
  );
}
