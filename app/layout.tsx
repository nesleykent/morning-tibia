import type { Metadata } from "next";
import { Sunrise } from "lucide-react";
import { Inter, Spectral } from "next/font/google";
import { ViewerSettingsProvider } from "@/lib/context/ViewerSettingsContext";
import { TopStatusBar } from "@/components/dashboard/TopStatusBar";
import { fetchDromeRotation } from "@/lib/data/wikiContentClient";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
// A text serif with real colour on screen — the dispatch is meant to be read, not scanned.
const serif = Spectral({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Morning Tibia: Daily World Briefing",
  description:
    "Check today's Tibia world conditions and generate a polished daily briefing for WhatsApp, Discord, Telegram or your guild channel.",
};

export const viewport = {
  themeColor: "#f5f0e6",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Fetched here too (not just in app/page.tsx) since the status bar's Drome countdown
  // lives in the chrome, above the page — Next.js dedupes identical build-time fetches.
  const drome = await fetchDromeRotation(new Date());

  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <ViewerSettingsProvider>
          <div className="flex min-h-dvh flex-col">
            {/* The application's only chrome: a hairline strip that names the product and
                carries the two countdowns and the timezone, since those are true no matter
                which view is open.

                Opaque, never blurred. WebKit corrupts hit-testing and paint order for
                body-portalled popover content when a `backdrop-filter` sits on a sticky
                ancestor, and every dropdown in this app is portalled. */}
            <header className="sticky top-0 z-40 border-b border-line bg-surface">
              <div className="mx-auto flex h-[var(--appbar-h)] w-full max-w-[1600px] flex-wrap items-center justify-between gap-x-4 gap-y-0 px-5 lg:px-7">
                <span className="flex shrink-0 items-center gap-2 max-[379px]:w-full">
                  <Sunrise className="h-[15px] w-[15px] text-gold" aria-hidden="true" />
                  <span className="prose-serif text-[15px] font-medium tracking-[-0.005em] text-ink">
                    Morning Tibia
                  </span>
                </span>
                <TopStatusBar drome={drome} />
              </div>
            </header>
            <main className="flex-1">{children}</main>
          </div>
        </ViewerSettingsProvider>
      </body>
    </html>
  );
}
