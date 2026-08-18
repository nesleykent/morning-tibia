import type { Metadata } from "next";
import { Sunrise } from "lucide-react";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-dvh flex-col">
          <div className="border-b border-border bg-card/60">
            <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gold/15 text-gold">
                <Sunrise className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold tracking-tight">Morning Tibia</span>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                Your daily Tibia world briefing
              </span>
            </div>
          </div>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
