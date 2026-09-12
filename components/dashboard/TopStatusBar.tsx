"use client";

import { Server, Timer } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useViewerSettings } from "@/lib/context/ViewerSettingsContext";
import { getNextServerSave } from "@/lib/utils/serverSave";
import { formatCountdownClock } from "@/lib/formatter/dateFormat";
import { COMMON_TIME_ZONES } from "@/lib/utils/timezoneList";
import { useNowMs } from "@/lib/utils/clock";
import { getDromeRotation } from "@/lib/drome/dromeRotation";

/**
 * Lives inline inside app/layout.tsx's single top bar, alongside the brand mark — not a bar of
 * its own. Its two countdowns and the timezone selector sit above everything else, since
 * they're relevant no matter what the view beneath is doing.
 *
 * Everything here is sans and small: it is instrumentation, not editorial.
 */
export function TopStatusBar() {
  const nowMs = useNowMs();
  const now = new Date(nowMs);
  const drome = nowMs > 0 ? getDromeRotation(now) : null;
  const { viewerTimeZone, setViewerTimeZone } = useViewerSettings();

  const serverSaveMsLeft = nowMs > 0 ? getNextServerSave(now).getTime() - nowMs : null;
  const dromeMsLeft = drome?.endsAt ? new Date(drome.endsAt).getTime() - nowMs : null;

  return (
    <div className="flex min-w-0 items-center justify-end gap-x-4 gap-y-1 text-[11.5px]">
      {serverSaveMsLeft !== null && (
        <span
          className="flex shrink-0 items-center gap-1.5 text-ink-faint"
          title="Time until the next server save (10:00 CET/CEST)"
        >
          <Server className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">Server save</span>
          <Clock>{formatCountdownClock(serverSaveMsLeft)}</Clock>
        </span>
      )}
      {dromeMsLeft !== null && (
        <span
          className="hidden shrink-0 items-center gap-1.5 text-ink-faint md:flex"
          title="Time until the current Tibia Drome rotation ends"
        >
          <Timer className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Drome{drome?.rotationNumber ? ` ${drome.rotationNumber}` : ""}</span>
          <Clock>{formatCountdownClock(Math.max(0, dromeMsLeft))}</Clock>
        </span>
      )}
      <Select value={viewerTimeZone} onValueChange={setViewerTimeZone}>
        <SelectTrigger
          className="h-7 w-auto max-w-[190px] shrink-0 gap-1 border-transparent bg-transparent px-1.5 text-[11.5px] text-ink-soft shadow-none hover:bg-accent"
          aria-label="Show times in"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {COMMON_TIME_ZONES.map((tz) => (
            <SelectItem key={tz.value} value={tz.value}>
              {tz.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Tabular so a ticking countdown doesn't shuffle the bar sideways once a second. */
function Clock({ children }: { children: React.ReactNode }) {
  return <span className="tnum font-medium text-ink">{children}</span>;
}
