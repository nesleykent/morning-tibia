import { describe, expect, it } from "vitest";
import {
  creatureWikiUrl,
  miniWorldChangeWikiUrl,
  tibiaWikiUrl,
  worldChangeWikiUrl,
} from "./tibiaWiki";
import { MINI_WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/miniWorldChanges";
import { WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/worldChanges";

/** Titles verified against the live MediaWiki API when this mapping was written. */
const NO_ENGLISH_ARTICLE = ["beaver-breakout", "shipwrecked"];

describe("tibiaWikiUrl", () => {
  it("underscores spaces and leaves apostrophes readable", () => {
    expect(tibiaWikiUrl("Goshnar's Greed")).toBe(
      "https://tibia.fandom.com/wiki/Goshnar's_Greed",
    );
  });
});

describe("miniWorldChangeWikiUrl", () => {
  it("uses the suffixed title, not the bare name", () => {
    // The bare name redirects to "Fury Dungeon" — an article about the dungeon, not the
    // change. A derived-from-name URL would resolve and be wrong.
    expect(miniWorldChangeWikiUrl({ name: "Fury Gates" })).toBe(
      "https://tibia.fandom.com/wiki/Fury_Gates_Mini_World_Change",
    );
  });

  it("honours an explicit override", () => {
    expect(miniWorldChangeWikiUrl({ name: "Forsaken", wikiTitle: "Forsaken Mine" })).toBe(
      "https://tibia.fandom.com/wiki/Forsaken_Mine",
    );
  });

  it("returns null where the definition says no article exists", () => {
    expect(miniWorldChangeWikiUrl({ name: "Shipwrecked", wikiTitle: null })).toBeNull();
  });
});

describe("worldChangeWikiUrl", () => {
  it("uses the suffixed title", () => {
    expect(worldChangeWikiUrl({ name: "Awash" })).toBe(
      "https://tibia.fandom.com/wiki/Awash_World_Change",
    );
  });
});

describe("catalog coverage", () => {
  it("resolves a link for every Mini World Change except the two with no article", () => {
    for (const definition of MINI_WORLD_CHANGE_DEFINITIONS) {
      const url = miniWorldChangeWikiUrl(definition);
      if (NO_ENGLISH_ARTICLE.includes(definition.id)) {
        expect(url, definition.id).toBeNull();
      } else {
        expect(url, definition.id).toMatch(/^https:\/\/tibia\.fandom\.com\/wiki\/\S+$/);
      }
    }
  });

  it("resolves a link for all fourteen World Changes", () => {
    for (const definition of WORLD_CHANGE_DEFINITIONS) {
      expect(worldChangeWikiUrl(definition), definition.id).toMatch(
        /^https:\/\/tibia\.fandom\.com\/wiki\/\S+_World_Change$/,
      );
    }
  });
});

describe("creatureWikiUrl", () => {
  it("maps a boosted name straight to its article", () => {
    expect(creatureWikiUrl("Pirate Corsair")).toBe(
      "https://tibia.fandom.com/wiki/Pirate_Corsair",
    );
  });

  it("is null when there is no name to link", () => {
    expect(creatureWikiUrl(null)).toBeNull();
    expect(creatureWikiUrl("  ")).toBeNull();
  });
});
