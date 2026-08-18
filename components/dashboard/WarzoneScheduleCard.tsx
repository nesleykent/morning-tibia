"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { convertTimeToViewerZone, getViewerTimeZone } from "@/lib/utils/timezone";
import type { WarzoneSchedule } from "@/types/warzone";

interface WarzoneScheduleCardProps {
  schedule: WarzoneSchedule | null;
  isLoading: boolean;
  error: string | null;
}

const MARK_VARIANT: Record<string, "active" | "stage2" | "inactive" | "unknown"> = {
  healthy: "active",
  inconclusive: "stage2",
  degraded: "inactive",
  unknown: "unknown",
};

export function WarzoneScheduleCard({ schedule, isLoading, error }: WarzoneScheduleCardProps) {
  // Read once at mount (Intl/Date lookups are impure) — good enough for a same-session label.
  const [viewerTimeZone] = useState(getViewerTimeZone);
  const [referenceDate] = useState(() => new Date());

  const showViewerTime = Boolean(schedule?.timezone) && schedule?.timezone !== viewerTimeZone;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span aria-hidden="true">⚔️</span> Warzone schedule
        </CardTitle>
        <CardDescription>
          From{" "}
          <a
            href="https://nesleykent.github.io/tibia-warzones-schedule/"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-dotted underline-offset-2 hover:text-foreground"
          >
            tibia-warzones-schedule
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-1.5">
            <div className="skeleton h-4 w-40 rounded" />
            <div className="skeleton h-4 w-32 rounded" />
          </div>
        ) : error ? (
          <p className="text-xs text-destructive">Couldn&apos;t load warzone data ({error}).</p>
        ) : !schedule || schedule.executions.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No tracked warzone schedule for this world yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={MARK_VARIANT[schedule.mark] ?? "unknown"}>{schedule.mark}</Badge>
              {schedule.timezone && (
                <span className="text-xs text-muted-foreground">World time: {schedule.timezone}</span>
              )}
              {showViewerTime && (
                <span className="text-xs text-muted-foreground">· Your time: {viewerTimeZone}</span>
              )}
            </div>
            <ul className="flex flex-col gap-1">
              {schedule.executions.map((execution) => (
                <li
                  key={execution.executionId}
                  className="flex flex-wrap items-baseline gap-1.5 rounded-md border border-border/70 bg-muted/40 px-2 py-1 text-xs"
                >
                  <span className="font-medium">{execution.scheduleTime}</span>
                  {showViewerTime && schedule.timezone && (
                    <span className="text-muted-foreground">
                      ({convertTimeToViewerZone(execution.scheduleTime, schedule.timezone, referenceDate)} your time)
                    </span>
                  )}
                  {execution.warzoneSequence && (
                    <span className="text-muted-foreground">— {execution.warzoneSequence}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
