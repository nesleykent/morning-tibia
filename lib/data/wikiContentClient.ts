import "server-only";
import type { ActiveEvent, EventCertainty, UpcomingEvent } from "@/types/event";
import type { DromeRotationInfo } from "@/types/drome";

const WIKI_API_BASE = "https://tibia.fandom.com/api.php";
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Build-time only. Fetches rendered HTML from TibiaWiki's "gadget" pages — small,
 * template-computed fragments the wiki itself keeps live (e.g. "starts in 3 days on
 * August 21", recalculated on every page render). These mirror tibia.com's own event
 * calendar and Tibiadrome's documented fixed bi-weekly rotation, without needing to
 * scrape tibia.com directly (which sits behind a Cloudflare bot challenge) or reimplement
 * the date math ourselves. The MediaWiki API doesn't send CORS headers, so this only
 * works from a Node/build environment, never from the browser — callers must be Server
 * Components or scripts that run during `next build`, not client code.
 */
async function fetchWikiPageHtml(page: string): Promise<string | null> {
  try {
    const url = `${WIKI_API_BASE}?action=parse&page=${encodeURIComponent(page)}&format=json&prop=text`;
    const res = await fetch(url, {
      headers: { "User-Agent": "MorningTibia/1.0 (static site build; +https://github.com/nesleykent/morning-tibia)" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { parse?: { text?: { "*"?: string } } };
    return json.parse?.text?.["*"] ?? null;
  } catch {
    return null;
  }
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractDivBlocks(html: string, dataType: string): string[] {
  const pattern = new RegExp(`<div data-type="${dataType}"[^>]*>([\\s\\S]*?)</div>`, "g");
  const blocks: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    blocks.push(match[1]!);
  }
  return blocks;
}

function extractLinkTitleAndHref(block: string): { title: string; href: string | null } {
  const linkMatch = block.match(/<a[^>]*href="([^"]+)"[^>]*title="([^"]+)"[^>]*>/);
  if (linkMatch) {
    return { title: decodeEntities(linkMatch[2]!), href: `https://tibia.fandom.com${linkMatch[1]}` };
  }
  const textOnly = decodeEntities(block.replace(/<[^>]+>/g, "").trim());
  return { title: textOnly, href: null };
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

/** The gadget's own "N days" countdown, already computed by the wiki relative to its
 * render time — using it directly (rather than parsing "on Month Day" and guessing the
 * year) avoids any year-rollover ambiguity. */
function extractDaysNumber(strippedBlockText: string): number {
  const match = stripTags(strippedBlockText).match(/(\d+)\s*days?/i);
  return match ? Number(match[1]) : 0;
}

export async function fetchActiveEvents(referenceDate: Date): Promise<ActiveEvent[]> {
  const html = await fetchWikiPageHtml("Active_Events");
  if (!html) return [];
  return extractDivBlocks(html, "active").map((block, index) => {
    const { title, href } = extractLinkTitleAndHref(block);
    const strippedBlock = block.replace(/<a[^>]*>.*?<\/a>/, "");
    const daysRemaining = extractDaysNumber(strippedBlock);
    const endAt = new Date(referenceDate.getTime() + daysRemaining * DAY_MS).toISOString();
    return { id: `active-${index}-${title}`, title, url: href, endAt, daysRemaining };
  });
}

export async function fetchUpcomingEvents(referenceDate: Date): Promise<UpcomingEvent[]> {
  const html = await fetchWikiPageHtml("Upcoming_Events");
  if (!html) return [];

  const raw = extractDivBlocks(html, "upcoming").map((block, index) => {
    const { title, href } = extractLinkTitleAndHref(block);
    const strippedBlock = block.replace(/<a[^>]*>.*?<\/a>/, "");
    const daysUntil = extractDaysNumber(strippedBlock);
    const certainty: EventCertainty = /\bmight\b/i.test(strippedBlock) ? "estimated" : "confirmed";
    const startAt = new Date(referenceDate.getTime() + daysUntil * DAY_MS).toISOString();
    return { id: `upcoming-${index}-${title}`, title, url: href, startAt, daysUntil, certainty };
  });

  // Sort chronologically — don't rely on the wiki's own DOM order.
  raw.sort((a, b) => a.daysUntil - b.daysUntil);

  // Some recurring events (e.g. a two-window seasonal sale) appear more than once with
  // the identical title — tag each occurrence so the formatter can label them distinctly
  // instead of presenting apparent duplicates with no context.
  const occurrenceCounts = new Map<string, number>();
  for (const event of raw) occurrenceCounts.set(event.title, (occurrenceCounts.get(event.title) ?? 0) + 1);
  const seenSoFar = new Map<string, number>();

  return raw.map((event) => {
    const occurrenceIndex = seenSoFar.get(event.title) ?? 0;
    seenSoFar.set(event.title, occurrenceIndex + 1);
    return { ...event, occurrenceIndex, occurrenceCount: occurrenceCounts.get(event.title)! };
  });
}

function parseDurationToMinutes(text: string | null): number | null {
  if (!text) return null;
  const match = text.match(/(\d+)\s*days?,\s*(\d+)h,\s*(\d+)\s*min/i);
  if (!match) return null;
  return Number(match[1]) * 24 * 60 + Number(match[2]) * 60 + Number(match[3]);
}

export async function fetchDromeRotation(referenceDate: Date): Promise<DromeRotationInfo | null> {
  const html = await fetchWikiPageHtml("Tibiadrome/Rotation");
  if (!html) return null;

  const extractRow = (label: string): string | null => {
    const pattern = new RegExp(`<th>${label}[^<]*</th>\\s*<td><b>([^<]+)</b>`, "i");
    const match = html.match(pattern);
    return match ? decodeEntities(match[1]!.trim()) : null;
  };

  // Each call finds the first (leftmost) match, and "Current rotation</th>" occurs
  // earlier in the source than "Current rotation started</th>", so order matters here
  // but no lookahead is needed to keep them from colliding.
  const rotationNumber = extractRow("Current rotation");
  const nextRotationInMinutes = parseDurationToMinutes(extractRow("Next rotation starts in"));
  const endsAt =
    nextRotationInMinutes !== null
      ? new Date(referenceDate.getTime() + nextRotationInMinutes * 60_000).toISOString()
      : null;

  return { rotationNumber, endsAt };
}
