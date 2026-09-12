/**
 * Sourced at build time from Tibia.com's official calendar, with TibiaWiki as an
 * availability fallback (see lib/data/eventContentClient.ts). Refreshes on deploy.
 * Carries structured timestamps rather than pre-formatted prose so the formatter can
 * render relative dates in the selected briefing language.
 */
export type EventCertainty = "confirmed" | "estimated";

export interface EventSourceMetadata {
  source?: "tibia.com" | "tibiawiki";
  /** Plain text from the official tooltip, in the source's original language. */
  description?: string | null;
}

export interface OfficialCalendarEvent {
  id: string;
  title: string;
  description: string | null;
  url: string;
  startAt: string;
  endAt: string;
  source: "tibia.com";
}

export interface ActiveEvent extends EventSourceMetadata {
  id: string;
  title: string;
  url: string | null;
  /** ISO timestamp for when the event ends. */
  endAt: string;
  daysRemaining: number;
  /**
   * Server-save instant for the official start date of this occurrence when
   * the source exposes a complete period for the event.
   */
  scheduledStartAt?: string | null;
}

export interface UpcomingEvent extends EventSourceMetadata {
  id: string;
  title: string;
  url: string | null;
  /** ISO timestamp for when the event starts. */
  startAt: string;
  /** Available from the official calendar; permits client-side promotion/expiry. */
  endAt?: string;
  daysUntil: number;
  /** "estimated" when the source hedges with "might" (a recurring/inferred date). */
  certainty: EventCertainty;
  /** 0-based position among entries sharing this exact title (e.g. a recurring event
   * with two windows this year) — lets the formatter label "1st/2nd window" etc. */
  occurrenceIndex: number;
  occurrenceCount: number;
}
