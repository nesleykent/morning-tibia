"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
            <div className="flex items-center gap-2">
              <Badge variant={MARK_VARIANT[schedule.mark] ?? "unknown"}>{schedule.mark}</Badge>
              {schedule.timezone && (
                <span className="text-xs text-muted-foreground">{schedule.timezone}</span>
              )}
            </div>
            <ul className="flex flex-wrap gap-1.5">
              {schedule.executions.map((execution) => (
                <li
                  key={execution.executionId}
                  className="rounded-md border border-border/70 bg-muted/40 px-2 py-1 text-xs"
                >
                  {execution.scheduleTime}
                  {execution.warzoneSequence && (
                    <span className="ml-1 text-muted-foreground">({execution.warzoneSequence})</span>
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
