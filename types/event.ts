/**
 * Sourced at build time from TibiaWiki's Active Events / Upcoming Events gadget pages
 * (community-maintained live mirrors of tibia.com's own event calendar — see
 * lib/data/wikiContentClient.ts). Not user-editable; refreshes on the next deploy.
 * Carries structured timestamps rather than pre-formatted prose so the formatter can
 * render relative dates in the selected briefing language.
 */
export type EventCertainty = "confirmed" | "estimated";

export interface ActiveEvent {
  id: string;
  title: string;
  url: string | null;
  /** ISO timestamp for when the event ends. */
  endAt: string;
  daysRemaining: number;
  /**
   * Server-save instant for the official start date of this occurrence when
   * TibiaWiki exposes a /Dates page for the event.
   */
  scheduledStartAt?: string | null;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  url: string | null;
  /** ISO timestamp for when the event starts. */
  startAt: string;
  daysUntil: number;
  /** "estimated" when the source hedges with "might" (a recurring/inferred date). */
  certainty: EventCertainty;
  /** 0-based position among entries sharing this exact title (e.g. a recurring event
   * with two windows this year) — lets the formatter label "1st/2nd window" etc. */
  occurrenceIndex: number;
  occurrenceCount: number;
}
