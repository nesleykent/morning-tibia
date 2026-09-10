import { describe, expect, it } from "vitest";
import { composeDispatch, type Segment } from "./composeDispatch";
import { buildDailyDigest } from "@/lib/dashboard/dailyDigest";
import { createDefaultMiniWorldChangeValues } from "@/lib/defaults/miniWorldChanges";
import { createDefaultWorldChangeValues } from "@/lib/defaults/worldChanges";
import { createDefaultMerchants } from "@/lib/defaults/merchants";

/**
 * The composition layer had no tests at all, which is how two shipped features (boosted
 * region, the market basis) got disconnected from the UI without anything failing. These
 * cover the rules the page's meaning depends on.
 */

const REFERENCE_DATE = new Date("2026-09-10T12:00:00Z");

function digestFrom(
  mutate: (mini: ReturnType<typeof createDefaultMiniWorldChangeValues>) => void = () => {},
) {
  const mini = createDefaultMiniWorldChangeValues();
  const world = createDefaultWorldChangeValues();
  mutate(mini);
  return buildDailyDigest(mini, world);
}

function merchants() {
  return createDefaultMerchants(REFERENCE_DATE);
}

function stanzaIds(stanzas: { id: string }[]): string[] {
  return stanzas.map((s) => s.id);
}

function textOf(lines: Segment[][]): string {
  return lines
    .flat()
    .map((s) => {
      if (s.kind === "blank") return s.value ?? `${s.ask}?`;
      return s.text;
    })
    .join("");
}

describe("composeDispatch — first run", () => {
  it("does not lead with the Forsaken clause before anything has been checked", () => {
    const stanzas = composeDispatch(digestFrom(), merchants());
    const happening = stanzas.find((s) => s.id === "happening");

    // Forsaken is always-active, so it used to produce the only sentence a brand-new
    // visitor saw: a gold blank asking which creatures were down a mine.
    expect(happening).toBeUndefined();
  });

  it("keeps Forsaken answerable, in the go-and-look stanza", () => {
    const stanzas = composeDispatch(digestFrom(), merchants());
    const silent = stanzas.find((s) => s.id === "silent");

    expect(silent).toBeDefined();
    const forsakenLine = silent!.lines.find((line) =>
      line.some((s) => s.kind === "link" || s.kind === "em" ? s.text === "Forsaken" : false),
    );
    expect(forsakenLine).toBeDefined();
    // Still fillable — demoting it must not remove the only way to record the answer.
    expect(forsakenLine!.some((s) => s.kind === "blank")).toBe(true);
  });

  it("promotes Forsaken to a real clause once its variant is known", () => {
    const stanzas = composeDispatch(
      digestFrom((mini) => {
        mini.forsaken = { ...mini.forsaken!, status: "active", variantId: "rorcs" };
      }),
      merchants(),
    );
    const happening = stanzas.find((s) => s.id === "happening");
    expect(happening).toBeDefined();
    expect(textOf(happening!.lines)).toContain("Forsaken Mine");
  });
});

describe("composeDispatch — boosted region", () => {
  it("always offers the region blank, since no source can ever supply it", () => {
    const stanzas = composeDispatch(digestFrom(), merchants(), []);
    const region = stanzas.find((s) => s.id === "boosted-region");

    expect(region).toBeDefined();
    const blank = region!.lines.flat().find((s) => s.kind === "blank");
    expect(blank).toMatchObject({ target: "region", multi: true, value: null });
  });

  it("reads the chosen regions back as a sentence", () => {
    const stanzas = composeDispatch(digestFrom(), merchants(), ["Thais", "Edron"]);
    const region = stanzas.find((s) => s.id === "boosted-region")!;

    expect(textOf(region.lines)).toBe("Today's boosted region is Thais and Edron.");
  });

  it("carries the selection so the picker can show what is already chosen", () => {
    const stanzas = composeDispatch(digestFrom(), merchants(), ["Venore"]);
    const blank = stanzas
      .find((s) => s.id === "boosted-region")!
      .lines.flat()
      .find((s): s is Extract<Segment, { kind: "blank" }> => s.kind === "blank")!;

    expect(blank.selected).toEqual(["Venore"]);
  });
});

describe("composeDispatch — links", () => {
  it("links ruled-out changes to their verified wiki articles", () => {
    const stanzas = composeDispatch(
      digestFrom((mini) => {
        mini.grimvale = { ...mini.grimvale!, status: "inactive", variantId: null };
      }),
      merchants(),
    );
    const quiet = stanzas.find((s) => s.id === "quiet")!;
    const grimvale = quiet.lines
      .flat()
      .find((s) => s.kind === "link" && s.text === "Grimvale");

    expect(grimvale).toMatchObject({
      href: "https://tibia.fandom.com/wiki/Grimvale_Mini_World_Change",
    });
  });

  it("leaves silent changes with no English article unlinked rather than guessing", () => {
    const stanzas = composeDispatch(digestFrom(), merchants());
    const silent = stanzas.find((s) => s.id === "silent")!;
    const beaver = silent.lines.flat().find((s) => s.kind !== "blank" && s.text === "Beaver Breakout");

    // Beaver Breakout and Shipwrecked have no English TibiaWiki page; a derived URL would
    // 404, and for Fury Gates it would have resolved to the wrong article entirely.
    expect(beaver?.kind).toBe("em");
  });
});

describe("composeDispatch — merchants", () => {
  it("offers Yasir's three cities from the shared catalog", () => {
    const m = merchants();
    m.yasir = { ...m.yasir!, activityState: "pending-location" };
    const stanzas = composeDispatch(digestFrom(), m);
    const blank = stanzas
      .find((s) => s.id === "merchants")!
      .lines.flat()
      .find((s): s is Extract<Segment, { kind: "blank" }> => s.kind === "blank")!;

    expect(blank.options.map((o) => o.id)).toEqual(["Carlin", "Liberty Bay", "Ankrahmun"]);
  });
});

describe("composeDispatch — stanza order", () => {
  it("opens with the boosted region and closes with what was ruled out", () => {
    const stanzas = composeDispatch(
      digestFrom((mini) => {
        mini.grimvale = { ...mini.grimvale!, status: "active", variantId: null };
        mini.kingsday = { ...mini.kingsday!, status: "inactive", variantId: null };
      }),
      merchants(),
    );

    const ids = stanzaIds(stanzas);
    expect(ids[0]).toBe("boosted-region");
    expect(ids[ids.length - 1]).toBe("quiet");
  });
});
