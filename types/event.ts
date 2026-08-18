/**
 * Sourced at build time from TibiaWiki's Active Events / Upcoming Events gadget pages
 * (community-maintained live mirrors of tibia.com's own event calendar — see
 * lib/data/wikiContentClient.ts). Not user-editable; refreshes on the next deploy.
 */
export interface ActiveEvent {
  id: string;
  title: string;
  detail: string;
  url: string | null;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  detail: string;
  url: string | null;
}
