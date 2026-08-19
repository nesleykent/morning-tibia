"use client";

import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ActiveEvent, UpcomingEvent } from "@/types/event";
import { eventEmoji } from "@/lib/formatter/eventEmoji";
import { formatActiveEventLine, formatUpcomingEventLine } from "@/lib/formatter/phrases";
import { UPCOMING_EVENTS_WINDOW_OPTIONS } from "@/lib/storage/briefingRepository";

function isUpcomingEvent(event: ActiveEvent | UpcomingEvent): event is UpcomingEvent {
  return "startAt" in event;
}

function eventDetail(event: ActiveEvent | UpcomingEvent): string {
  return isUpcomingEvent(event) ? formatUpcomingEventLine(event, "en") : formatActiveEventLine(event, "en");
}

function EventRow({ event, active }: { event: ActiveEvent | UpcomingEvent; active: boolean }) {
  return (
    <li className="rounded-md border border-border/70 bg-muted/30 px-2.5 py-1.5 text-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium">
          <span aria-hidden="true">{eventEmoji(event.title)}</span> {event.title}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          {active && (
            <Badge variant="active" className="text-[10px]">
              Active
            </Badge>
          )}
          {event.url && (
            <a
              href={event.url}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground"
              aria-label={`${event.title} on TibiaWiki`}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{eventDetail(event)}</p>
    </li>
  );
}

interface EventsCardProps {
  activeEvents: ActiveEvent[];
  upcomingEvents: UpcomingEvent[];
  windowDays: number;
  onWindowDaysChange: (days: number) => void;
}

export function EventsCard({ activeEvents, upcomingEvents, windowDays, onWindowDaysChange }: EventsCardProps) {
  const visibleUpcoming = upcomingEvents.filter((event) => event.daysUntil <= windowDays);
  const hiddenCount = Math.max(0, upcomingEvents.length - visibleUpcoming.length);
  const isEmpty = activeEvents.length === 0 && visibleUpcoming.length === 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>
              <span aria-hidden="true">🎉</span> Events
            </CardTitle>
            <CardDescription>
              Live from{" "}
              <a
                href="https://tibia.fandom.com/wiki/Events"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-dotted underline-offset-2 hover:text-foreground"
              >
                TibiaWiki
              </a>
              , refreshed on each deploy
            </CardDescription>
          </div>
          <Select value={String(windowDays)} onValueChange={(value) => onWindowDaysChange(Number(value))}>
            <SelectTrigger className="w-24 shrink-0" aria-label="How many days ahead to show upcoming events">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UPCOMING_EVENTS_WINDOW_OPTIONS.map((days) => (
                <SelectItem key={days} value={String(days)}>
                  {days} days
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <p className="text-xs text-muted-foreground">Nothing active or scheduled in this window.</p>
        ) : (
          <ul className="flex max-h-72 flex-col gap-1.5 overflow-y-auto pr-1">
            {activeEvents.map((event) => (
              <EventRow key={event.id} event={event} active />
            ))}
            {visibleUpcoming.map((event) => (
              <EventRow key={event.id} event={event} active={false} />
            ))}
          </ul>
        )}
        {hiddenCount > 0 && (
          <p className="mt-1.5 text-xs text-muted-foreground">+{hiddenCount} more scheduled later</p>
        )}
      </CardContent>
    </Card>
  );
}
