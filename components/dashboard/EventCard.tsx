"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActiveEvent, UpcomingEvent } from "@/types/event";

interface ActiveEventsCardProps {
  events: ActiveEvent[];
  onAdd: (event: Omit<ActiveEvent, "id">) => void;
  onRemove: (id: string) => void;
}

export function ActiveEventsCard({ events, onAdd, onRemove }: ActiveEventsCardProps) {
  const [title, setTitle] = useState("");
  const [bonus, setBonus] = useState("");

  const submit = () => {
    if (!title.trim()) return;
    onAdd({ title: title.trim(), bonus: bonus.trim() });
    setTitle("");
    setBonus("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span aria-hidden="true">🎉</span> Active events
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground">No active events added yet.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border/70 bg-muted/30 px-2.5 py-1.5 text-sm"
              >
                <span className="truncate">
                  {event.title}
                  {event.bonus && <span className="text-muted-foreground"> — {event.bonus}</span>}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${event.title}`}
                  onClick={() => onRemove(event.id)}
                  className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-col gap-1.5 border-t border-border/60 pt-3 sm:flex-row">
          <Input placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="Bonus (optional)" value={bonus} onChange={(e) => setBonus(e.target.value)} />
          <Button type="button" size="sm" variant="secondary" onClick={submit} className="shrink-0">
            <Plus /> Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface UpcomingEventsCardProps {
  events: UpcomingEvent[];
  onAdd: (event: Omit<UpcomingEvent, "id">) => void;
  onRemove: (id: string) => void;
}

export function UpcomingEventsCard({ events, onAdd, onRemove }: UpcomingEventsCardProps) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [note, setNote] = useState("");

  const submit = () => {
    if (!title.trim()) return;
    onAdd({ title: title.trim(), startDate: startDate.trim() || null, note: note.trim() });
    setTitle("");
    setStartDate("");
    setNote("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span aria-hidden="true">📅</span> Next eventos
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground">No upcoming events scheduled yet.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border/70 bg-muted/30 px-2.5 py-1.5 text-sm"
              >
                <span className="truncate">
                  {event.title}
                  {event.startDate && <span className="text-muted-foreground"> ({event.startDate})</span>}
                  {event.note && <span className="text-muted-foreground"> — {event.note}</span>}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${event.title}`}
                  onClick={() => onRemove(event.id)}
                  className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-col gap-1.5 border-t border-border/60 pt-3 sm:flex-row">
          <Input placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="Date (optional)" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <Button type="button" size="sm" variant="secondary" onClick={submit} className="shrink-0">
            <Plus /> Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
