import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchActiveEvents, fetchDromeRotation, fetchUpcomingEvents } from "./wikiContentClient";

const ACTIVE_EVENTS_HTML = `<div class="mw-content-ltr mw-parser-output" lang="en" dir="ltr"><div style="display:flex;flex-flow: column;"><div data-type="active" style="order:13;"><a href="/wiki/Hot_Cuisine_Quest" title="Hot Cuisine Quest">Hot Cuisine Quest</a> is currently active with <b>13 days</b> remaining ending on August 31.</div><br /></div></div>`;

const UPCOMING_EVENTS_HTML = `<div class="mw-content-ltr mw-parser-output" lang="en" dir="ltr"><div style="display:flex;flex-flow: column;"><div data-type="upcoming" style="order:3;"><a href="/wiki/A_Pirate%27s_Death_to_Me" title="A Pirate&#39;s Death to Me">A Pirate's Death to Me</a> will start in <b>3 days</b> on August 21.</div><br /><div data-type="upcoming" style="order:49;"><a href="/wiki/Rapid_Respawn_Events" title="Rapid Respawn Events">Rapid Respawn Events</a> <i>might</i>  start in <b>49 days</b> on October 06.</div><div data-type="upcoming" style="order:44;"><a href="/wiki/Annual_Autumn_Vintage" title="Annual Autumn Vintage">Annual Autumn Vintage</a> will start in <b>44 days</b> on October 1.</div><br /><div data-type="upcoming" style="order:60;"><a href="/wiki/Annual_Autumn_Vintage" title="Annual Autumn Vintage">Annual Autumn Vintage</a> will start in <b>60 days</b> on October 17.</div></div></div>`;

const DROME_ROTATION_HTML = `<div class="mw-content-ltr mw-parser-output" lang="en" dir="ltr"><center>
<table class="wikitable">

<tbody><tr>
<th>Current rotation
</th>
<td><b>#133</b>
</td></tr>
<tr>
<th>Current rotation started
</th>
<td><b>13 days, 12h, 39 min ago</b>
</td></tr>
<tr>
<th>Next rotation starts in
</th>
<td><b>0 days, 11h, 21 min</b>
</td></tr></tbody></table></center></div>`;

function mockFetchOnce(html: string) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ parse: { text: { "*": html } } }),
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

const REFERENCE = new Date("2026-08-18T12:00:00Z");

describe("fetchActiveEvents", () => {
  it("computes an ISO end timestamp from the wiki's own day countdown", async () => {
    mockFetchOnce(ACTIVE_EVENTS_HTML);
    const events = await fetchActiveEvents(REFERENCE);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      title: "Hot Cuisine Quest",
      url: "https://tibia.fandom.com/wiki/Hot_Cuisine_Quest",
      daysRemaining: 13,
    });
    expect(events[0]!.endAt).toBe(new Date(REFERENCE.getTime() + 13 * 86400000).toISOString());
  });
});

describe("fetchUpcomingEvents", () => {
  it("computes startAt, sorts by daysUntil, and flags estimated ('might') entries", async () => {
    mockFetchOnce(UPCOMING_EVENTS_HTML);
    const events = await fetchUpcomingEvents(REFERENCE);
    // Sorted by daysUntil (3, 44, 49, 60) — Rapid Respawn's 49 days sits between the
    // two Annual Autumn Vintage windows (44, 60), not after both.
    expect(events.map((e) => e.title)).toEqual([
      "A Pirate's Death to Me",
      "Annual Autumn Vintage",
      "Rapid Respawn Events",
      "Annual Autumn Vintage",
    ]);
    expect(events[0]!.certainty).toBe("confirmed");
    expect(events[0]!.startAt).toBe(new Date(REFERENCE.getTime() + 3 * 86400000).toISOString());
    const rapidRespawn = events.find((e) => e.title === "Rapid Respawn Events")!;
    expect(rapidRespawn.certainty).toBe("estimated");
  });

  it("tags repeated titles with an occurrence index/count instead of hiding the duplication", async () => {
    mockFetchOnce(UPCOMING_EVENTS_HTML);
    const events = await fetchUpcomingEvents(REFERENCE);
    const vintages = events.filter((e) => e.title === "Annual Autumn Vintage");
    expect(vintages).toHaveLength(2);
    expect(vintages[0]!.occurrenceIndex).toBe(0);
    expect(vintages[0]!.occurrenceCount).toBe(2);
    expect(vintages[1]!.occurrenceIndex).toBe(1);
    expect(vintages[1]!.occurrenceCount).toBe(2);
  });
});

describe("fetchDromeRotation", () => {
  it("computes an ISO endsAt timestamp from the wiki's countdown", async () => {
    mockFetchOnce(DROME_ROTATION_HTML);
    const drome = await fetchDromeRotation(REFERENCE);
    expect(drome?.rotationNumber).toBe("#133");
    const expectedMinutes = 11 * 60 + 21;
    expect(drome?.endsAt).toBe(new Date(REFERENCE.getTime() + expectedMinutes * 60000).toISOString());
  });

  it("returns null when the page can't be fetched", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    expect(await fetchDromeRotation(REFERENCE)).toBeNull();
  });
});
