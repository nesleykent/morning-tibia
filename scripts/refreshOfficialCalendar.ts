/**
 * Read Tibia.com's official Event Schedule and write it to lib/data/officialCalendar.json,
 * the committed capture the build publishes when the live page cannot be read.
 *
 *   npm run calendar:refresh
 *
 * Run it anywhere the page is actually reachable. CipSoft puts the calendar behind a
 * Cloudflare challenge that answers unattended requests with HTTP 403, so a scheduled
 * runner will usually be refused; that is not an error to act on, and the script says so
 * and exits 0 without touching the file, leaving the last good capture in place. The file
 * is only ever overwritten by a fetch that actually succeeded and parsed.
 *
 * Uses the same parser the build uses (lib/data/tibiaCalendarMapping.ts), so a capture is
 * byte-identical to what a successful live build would have published.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { assembleCalendarEvents, calendarMonthUrl, parseCalendarMonth, type CalendarMonth } from "@/lib/data/tibiaCalendarMapping";
import { toTibiaDayKey } from "@/lib/utils/date";

/** Capture a wider span than a build reads, so one refresh survives several weeks. */
const MONTH_OFFSETS = [-1, 0, 1, 2, 3];
const OUTPUT = fileURLToPath(new URL("../lib/data/officialCalendar.json", import.meta.url));

async function fetchMonth(year: number, month: number): Promise<CalendarMonth> {
  const url = calendarMonthUrl(year, month);
  const response = await fetch(url, {
    headers: {
      "User-Agent": "MorningTibia/1.0 (static site build; +https://github.com/nesleykent/morning-tibia)",
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return parseCalendarMonth(await response.text());
}

async function main(): Promise<void> {
  const now = new Date();
  const [year, month] = toTibiaDayKey(now).split("-").map(Number);
  let months: CalendarMonth[];
  try {
    months = await Promise.all(MONTH_OFFSETS.map((offset) => {
      const date = new Date(Date.UTC(year!, month! - 1 + offset, 1));
      return fetchMonth(date.getUTCFullYear(), date.getUTCMonth() + 1);
    }));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`[calendar:refresh] Tibia.com could not be read (${reason}).`);
    console.warn("[calendar:refresh] The committed capture was left untouched. This is expected on an unattended runner: the calendar sits behind a Cloudflare challenge that only a real browser clears.");
    return;
  }

  const events = assembleCalendarEvents(months);
  const days = months.flatMap((page) => page.days.map((day) => day.date)).sort();
  if (events.length === 0) {
    // Five months that parse to no complete period at all is far likelier to be a changed
    // layout than a genuinely empty span, and overwriting a good capture with it loses
    // real data. A build treats an empty *live* read as valid; a capture is not rewritten.
    console.warn("[calendar:refresh] The pages parsed but produced no complete period; refusing to overwrite the capture.");
    return;
  }

  writeFileSync(OUTPUT, `${JSON.stringify({
    $comment: "Events read from Tibia.com's official Event Schedule and committed here so a build can publish them without re-fetching. Regenerate with `npm run calendar:refresh`; do not hand-edit.",
    capturedAt: new Date().toISOString(),
    coversFrom: days[0],
    coversTo: days.at(-1),
    source: "tibia.com",
    events,
  }, null, 2)}\n`);
  console.info(`[calendar:refresh] Wrote ${events.length} periods covering ${days[0]}..${days.at(-1)} to lib/data/officialCalendar.json`);
  for (const event of events) console.info(`  ${event.startAt.slice(0, 10)} -> ${event.endAt.slice(0, 10)}  ${event.title}`);
}

await main();
