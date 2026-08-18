import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchActiveEvents, fetchDromeRotation, fetchUpcomingEvents } from "./wikiContentClient";

const ACTIVE_EVENTS_HTML = `<div class="mw-content-ltr mw-parser-output" lang="en" dir="ltr"><div style="display:flex;flex-flow: column;"><div data-type="active" style="order:13;"><a href="/wiki/Hot_Cuisine_Quest" title="Hot Cuisine Quest">Hot Cuisine Quest</a> is currently active with <b>13 days</b> remaining ending on August 31.</div><br /></div></div>`;

const UPCOMING_EVENTS_HTML = `<div class="mw-content-ltr mw-parser-output" lang="en" dir="ltr"><div style="display:flex;flex-flow: column;"><div data-type="upcoming" style="order:3;"><a href="/wiki/A_Pirate%27s_Death_to_Me" title="A Pirate&#39;s Death to Me">A Pirate's Death to Me</a> will start in <b>3 days</b> on August 21.</div><br /><div data-type="upcoming" style="order:49;"><a href="/wiki/Rapid_Respawn_Events" title="Rapid Respawn Events">Rapid Respawn Events</a> <i>might</i>  start in <b>49 days</b> on October 06.</div></div></div>`;

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

describe("fetchActiveEvents", () => {
  it("parses title, detail, and link from the rendered gadget HTML", async () => {
    mockFetchOnce(ACTIVE_EVENTS_HTML);
    const events = await fetchActiveEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      title: "Hot Cuisine Quest",
      url: "https://tibia.fandom.com/wiki/Hot_Cuisine_Quest",
    });
    expect(events[0]!.detail).toMatch(/currently active with 13 days remaining ending on August 31/);
  });
});

describe("fetchUpcomingEvents", () => {
  it("parses multiple entries and decodes HTML entities in titles", async () => {
    mockFetchOnce(UPCOMING_EVENTS_HTML);
    const events = await fetchUpcomingEvents();
    expect(events).toHaveLength(2);
    expect(events[0]!.title).toBe("A Pirate's Death to Me");
    expect(events[0]!.detail).toMatch(/start in 3 days on August 21/);
    expect(events[1]!.detail).toMatch(/might.*start in 49 days on October 06/i);
  });
});

describe("fetchDromeRotation", () => {
  it("extracts rotation number, started-ago, and next-in from the wikitable", async () => {
    mockFetchOnce(DROME_ROTATION_HTML);
    const drome = await fetchDromeRotation();
    expect(drome).toEqual({
      rotationNumber: "#133",
      startedAgo: "13 days, 12h, 39 min ago",
      nextRotationIn: "0 days, 11h, 21 min",
    });
  });

  it("returns null when the page can't be fetched", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    expect(await fetchDromeRotation()).toBeNull();
  });
});
