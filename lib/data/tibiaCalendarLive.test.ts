import { expect, it } from "vitest";
import { fetchTibiaCalendarEvents } from "./tibiaCalendarClient";

/** Explicit opt-in: the normal test suite is deterministic and needs no network.
 * This deliberately exercises the official source without the availability fallback. */
it.runIf(process.env.TIBIA_CALENDAR_LIVE === "1")("fetches and extracts the live Tibia.com calendar", async () => {
  const events = await fetchTibiaCalendarEvents(new Date());
  expect(events.length).toBeGreaterThan(0);
  expect(events.every((event) => event.source === "tibia.com" && Date.parse(event.startAt) < Date.parse(event.endAt))).toBe(true);
  console.info("Official calendar:", events.map(({ title, startAt, endAt }) => ({ title, startAt, endAt })));
}, 30_000);
