"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { convertTimeBetweenZones } from "@/lib/utils/timezone";
import type { WarzoneSchedule } from "@/types/warzone";

interface WarzoneScheduleCardProps {
  schedule: WarzoneSchedule | null;
  isLoading: boolean;
  error: string | null;
  viewerTimeZone: string;
}

export function WarzoneScheduleCard({ schedule, isLoading, error, viewerTimeZone }: WarzoneScheduleCardProps) {
  const [referenceDate] = useState(() => new Date());

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
          <ul className="flex flex-wrap gap-1.5">
            {schedule.executions.map((execution) => {
              const time = schedule.timezone
                ? convertTimeBetweenZones(execution.scheduleTime, schedule.timezone, viewerTimeZone, referenceDate)
                : execution.scheduleTime;
              return (
                <li
                  key={execution.executionId}
                  className="rounded-md border border-border/70 bg-muted/40 px-2 py-1 text-xs font-medium"
                >
                  {time}
                  {execution.warzoneSequence && (
                    <span className="ml-1 font-normal text-muted-foreground">({execution.warzoneSequence})</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
