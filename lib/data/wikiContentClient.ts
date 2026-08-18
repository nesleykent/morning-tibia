import "server-only";
import type { ActiveEvent, UpcomingEvent } from "@/types/event";
import type { DromeRotationInfo } from "@/types/drome";

const WIKI_API_BASE = "https://tibia.fandom.com/api.php";

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

export async function fetchActiveEvents(): Promise<ActiveEvent[]> {
  const html = await fetchWikiPageHtml("Active_Events");
  if (!html) return [];
  return extractDivBlocks(html, "active").map((block, index) => {
    const { title, href } = extractLinkTitleAndHref(block);
    const detail = stripTags(block.replace(/<a[^>]*>.*?<\/a>/, "")).replace(/^\s*is\s*/i, "");
    return { id: `active-${index}-${title}`, title, detail, url: href };
  });
}

export async function fetchUpcomingEvents(): Promise<UpcomingEvent[]> {
  const html = await fetchWikiPageHtml("Upcoming_Events");
  if (!html) return [];
  return extractDivBlocks(html, "upcoming").map((block, index) => {
    const { title, href } = extractLinkTitleAndHref(block);
    const detail = stripTags(block.replace(/<a[^>]*>.*?<\/a>/, "")).replace(/^\s*will\s*/i, "");
    return { id: `upcoming-${index}-${title}`, title, detail, url: href };
  });
}

export async function fetchDromeRotation(): Promise<DromeRotationInfo | null> {
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
  return {
    rotationNumber: extractRow("Current rotation"),
    startedAgo: extractRow("Current rotation started"),
    nextRotationIn: extractRow("Next rotation starts in"),
  };
}
