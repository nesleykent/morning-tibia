"use client";

import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActiveEvent, UpcomingEvent } from "@/types/event";

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
    <ul className="flex flex-col gap-1.5">
      {events.map((event) => (
        <li key={event.id} className="rounded-md border border-border/70 bg-muted/30 px-2.5 py-1.5 text-sm">
          <div className="flex items-start justify-between gap-2">
            <span className="font-medium">{event.title}</span>
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
          <p className="text-xs text-muted-foreground">{event.detail}</p>
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

export function UpcomingEventsCard({ events }: { events: UpcomingEvent[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span aria-hidden="true">📅</span> Next eventos
        </CardTitle>
        {WIKI_CREDIT}
      </CardHeader>
      <CardContent>
        <EventList events={events} emptyLabel="Nothing scheduled yet." />
      </CardContent>
    </Card>
  );
}
