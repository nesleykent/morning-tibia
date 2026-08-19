"use client";

import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const WIKI_CREDIT = (
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
);

function EventList({ events, emptyLabel }: { events: (ActiveEvent | UpcomingEvent)[]; emptyLabel: string }) {
  if (events.length === 0) {
    return <p className="text-xs text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <ul className="flex max-h-72 flex-col gap-1.5 overflow-y-auto pr-1">
      {events.map((event) => (
        <li key={event.id} className="rounded-md border border-border/70 bg-muted/30 px-2.5 py-1.5 text-sm">
          <div className="flex items-start justify-between gap-2">
            <span className="font-medium">
              <span aria-hidden="true">{eventEmoji(event.title)}</span> {event.title}
            </span>
            {event.url && (
              <a
                href={event.url}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-muted-foreground hover:text-foreground"
                aria-label={`${event.title} on TibiaWiki`}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{eventDetail(event)}</p>
        </li>
      ))}
    </ul>
  );
}

export function ActiveEventsCard({ events }: { events: ActiveEvent[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span aria-hidden="true">🎉</span> Active events
        </CardTitle>
        {WIKI_CREDIT}
      </CardHeader>
      <CardContent>
        <EventList events={events} emptyLabel="No official events are currently active." />
      </CardContent>
    </Card>
  );
}

export function UpcomingEventsCard({
  events,
  windowDays,
  onWindowDaysChange,
}: {
  events: UpcomingEvent[];
  windowDays: number;
  onWindowDaysChange: (days: number) => void;
}) {
  const visibleEvents = events.filter((event) => event.daysUntil <= windowDays);
  const hiddenCount = Math.max(0, events.length - visibleEvents.length);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>
              <span aria-hidden="true">📅</span> Upcoming events
            </CardTitle>
            {WIKI_CREDIT}
          </div>
          <Select value={String(windowDays)} onValueChange={(value) => onWindowDaysChange(Number(value))}>
            <SelectTrigger className="w-24 shrink-0" aria-label="How many days ahead to show">
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
        <EventList events={visibleEvents} emptyLabel="Nothing scheduled in this window." />
        {hiddenCount > 0 && (
          <p className="mt-1.5 text-xs text-muted-foreground">+{hiddenCount} more scheduled later</p>
        )}
      </CardContent>
    </Card>
  );
}
