"use client";

import { useEffect, useState } from "react";
import { Clock, Server, Timer } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useViewerSettings } from "@/lib/context/ViewerSettingsContext";
import { useIsClient } from "@/hooks/useIsClient";
import { getNextServerSave } from "@/lib/utils/serverSave";
import { formatCountdownClock } from "@/lib/formatter/dateFormat";
import { COMMON_TIME_ZONES } from "@/lib/utils/timezoneList";
import type { DromeRotationInfo } from "@/types/drome";

const TICK_MS = 1000;

function useNow(enabled: boolean): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(id);
  }, [enabled]);
  return now;
}

/**
 * Lives inline inside app/layout.tsx's single top bar, alongside the brand mark — not a
 * bar of its own. Its Drome/server-save countdowns and the timezone selector all sit at
 * the top of the page, above everything else, since they're relevant no matter what the
 * dashboard beneath is doing.
 */
export function TopStatusBar({ drome }: { drome: DromeRotationInfo | null }) {
  const isClient = useIsClient();
  const now = useNow(isClient);
  const { viewerTimeZoneOverride, autoViewerTimeZone, setViewerTimeZoneOverride } = useViewerSettings();

  const timeZoneOptions = COMMON_TIME_ZONES.some((tz) => tz.value === autoViewerTimeZone)
    ? COMMON_TIME_ZONES
    : [{ value: autoViewerTimeZone, label: autoViewerTimeZone }, ...COMMON_TIME_ZONES];

  const serverSaveMsLeft = isClient ? getNextServerSave(now).getTime() - now.getTime() : null;
  const dromeMsLeft = isClient && drome?.endsAt ? new Date(drome.endsAt).getTime() - now.getTime() : null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
      {serverSaveMsLeft !== null && (
        <span
          className="flex items-center gap-1.5 text-muted-foreground"
          title="Time until the next server save (10:00 CET/CEST)"
        >
          <Server className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Server save in{" "}
          <span className="font-mono font-medium text-foreground">{formatCountdownClock(serverSaveMsLeft)}</span>
        </span>
      )}
      {dromeMsLeft !== null && (
        <span
          className="flex items-center gap-1.5 text-muted-foreground"
          title="Time until the current Tibia Drome rotation ends"
        >
          <Timer className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Drome{drome?.rotationNumber ? ` ${drome.rotationNumber}` : ""} ends in{" "}
          <span className="font-mono font-medium text-foreground">
            {formatCountdownClock(Math.max(0, dromeMsLeft))}
          </span>
        </span>
      )}
      <div className="flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <Select
          value={viewerTimeZoneOverride ?? "auto"}
          onValueChange={(value) => setViewerTimeZoneOverride(value === "auto" ? null : value)}
        >
          <SelectTrigger className="h-8 w-[190px] text-xs" aria-label="Show times in">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto ({autoViewerTimeZone})</SelectItem>
            {timeZoneOptions.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
