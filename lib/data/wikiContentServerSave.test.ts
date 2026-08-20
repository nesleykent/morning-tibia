import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchActiveEvents,
  fetchUpcomingEvents,
} from "./wikiContentClient";

function response(html: string) {
  return {
    ok: true,
    json: async () => ({
      parse: {
        text: {
          "*": html,
        },
      },
    }),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("event server-save metadata", () => {
  it("resolves an active event start from its generic /Dates page", async () => {
    const activeHtml =
      '<div data-type="active"><a href="/wiki/Example_Event" title="Example Event">Example Event</a> is currently active with <b>5 days</b> remaining ending on August 25.</div>';

    const datesHtml =
      "<ul><li>2026-06-20</li><li>2026-07-20</li><li>2026-08-20</li><li>2026-11-20</li></ul>";

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        const url = String(input);

        return url.includes("page=Example%20Event%2FDates")
          ? response(datesHtml)
          : response(activeHtml);
      }),
    );

    const events = await fetchActiveEvents(
      new Date("2026-08-20T01:30:00.000Z"),
    );

    expect(events).toHaveLength(1);
    expect(events[0]!.title).toBe("Example Event");
    expect(events[0]!.scheduledStartAt).toBe(
      "2026-08-20T08:00:00.000Z",
    );
  });

  it("uses the event's server-save instant for upcoming startAt", async () => {
    const upcomingHtml =
      '<div data-type="upcoming"><a href="/wiki/Example_Upcoming" title="Example Upcoming">Example Upcoming</a> will start in <b>2 days</b> on August 21.</div>';

    const datesHtml =
      "<ul><li>2026-08-21</li><li>2026-11-20</li></ul>";

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        const url = String(input);

        return url.includes("page=Example%20Upcoming%2FDates")
          ? response(datesHtml)
          : response(upcomingHtml);
      }),
    );

    const events = await fetchUpcomingEvents(
      new Date("2026-08-19T12:00:00.000Z"),
    );

    expect(events).toHaveLength(1);
    expect(events[0]!.startAt).toBe(
      "2026-08-21T08:00:00.000Z",
    );
  });
});
