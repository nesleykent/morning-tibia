/**
 * Sourced at build time from Tibia.com's official event calendar, with the Tibia
 * client's own `eventschedule.json` as the only fallback when that page cannot be
 * fetched, parsed or validated. Both are CipSoft data, so every event carries the
 * single source "tibia.com"; TibiaWiki and other third-party sources never establish
 * an event's existence, dates or active/upcoming status.
 * Carries structured timestamps rather than pre-formatted prose so the formatter can
 * render relative dates in the selected briefing language.
 */
export type EventCertainty = "confirmed" | "estimated";

export interface EventSourceMetadata {
  source?: "tibia.com";
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
   * Server-save instant this occurrence began at. Always present for published
   * events: an active event without a verified start boundary cannot be
   * reconciled against the current Tibia day and is dropped rather than shown.
   */
  scheduledStartAt?: string | null;
}

export interface UpcomingEvent extends EventSourceMetadata {
  id: string;
  title: string;
  url: string | null;
  /** ISO timestamp for when the event starts. */
  startAt: string;
  /** The official ending save; permits client-side promotion/expiry between builds. */
  endAt?: string;
  daysUntil: number;
  /** Official periods are always "confirmed"; the field remains for the UI's labelling. */
  certainty: EventCertainty;
  /** 0-based position among entries sharing this exact title (e.g. a recurring event
   * with two windows this year) — lets the formatter label "1st/2nd window" etc. */
  occurrenceIndex: number;
  occurrenceCount: number;
}
