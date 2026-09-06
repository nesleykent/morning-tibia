import { describe, expect, it } from "vitest";
import { MINI_WORLD_CHANGE_DEFINITIONS } from "./miniWorldChanges";
import { WORLD_CHANGE_DEFINITIONS, GUIDE_KEYWORDS } from "./worldChanges";
import { BOARD_MESSAGES } from "@/lib/parser/boardMessages";

/**
 * These lock in facts established from TibiaWiki, not implementation choices — if the game
 * ever changes, these are the tests that should be re-verified against a source first.
 */
describe("Mini World Change catalog", () => {
  it("models 23 changes, the 24th (Oriental Trader) being Yasir's merchant card", () => {
    expect(MINI_WORLD_CHANGE_DEFINITIONS).toHaveLength(23);
    const yasir = BOARD_MESSAGES.filter((m) => m.merchantHint?.merchantId === "yasir");
    expect(yasir).toHaveLength(1);
  });

  it("uses canonical TibiaWiki names", () => {
    const names = MINI_WORLD_CHANGE_DEFINITIONS.map((d) => d.name);
    // Previously mis-named: "Bibby's Bloodbath" is the achievement/boss, not the change,
    // and "Spirit Gate" is only the wording inside the board message.
    expect(names).toContain("Warpath");
    expect(names).toContain("Spirit Grounds");
    expect(names).not.toContain("Bibby's Bloodbath");
    expect(names).not.toContain("Spirit Gate");
  });

  it("gives every change a unique id and unique variant ids", () => {
    const ids = MINI_WORLD_CHANGE_DEFINITIONS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const def of MINI_WORLD_CHANGE_DEFINITIONS) {
      const variantIds = def.variants.map((v) => v.id);
      expect(new Set(variantIds).size, `${def.id} has duplicate variant ids`).toBe(
        variantIds.length,
      );
    }
  });

  it("only gives variants to changes that really have them", () => {
    const withVariants = MINI_WORLD_CHANGE_DEFINITIONS.filter((d) => d.variants.length > 0).map(
      (d) => d.id,
    );
    expect(withVariants.sort()).toEqual(
      [
        "fury-gates", // 10 cities
        "jungle-camp", // hunters vs dworcs
        "nightmare-isles", // 3 portal spots
        "nomads", // 4 camps
        "poacher-caves", // 3 dominance phases
        "spirit-grounds", // 3 regions
        "warpath", // 3 camp spots
      ].sort(),
    );
  });

  it("records that Fury Gates can appear at any of ten cities", () => {
    const fury = MINI_WORLD_CHANGE_DEFINITIONS.find((d) => d.id === "fury-gates")!;
    expect(fury.variants).toHaveLength(10);
    expect(fury.variantKind).toBe("location");
    // Neither in-game source ever names the city — that's the point of the change.
    expect(fury.boardNamesVariant).toBe(false);
    expect(fury.towncryerNamesVariant).toBe(false);
  });

  it("records that only one of four nomad camps is up at a time", () => {
    const nomads = MINI_WORLD_CHANGE_DEFINITIONS.find((d) => d.id === "nomads")!;
    expect(nomads.variants).toHaveLength(4);
    expect(nomads.boardNamesVariant).toBe(false);
  });

  it("records that the Towncryer, not the board, names the Jungle Camp winner", () => {
    const jungle = MINI_WORLD_CHANGE_DEFINITIONS.find((d) => d.id === "jungle-camp")!;
    expect(jungle.boardNamesVariant).toBe(false);
    expect(jungle.towncryerNamesVariant).toBe(true);
  });

  it("keeps Noodles' spawn points as reference only, never as state", () => {
    const noodles = MINI_WORLD_CHANGE_DEFINITIONS.find((d) => d.id === "noodles-is-gone")!;
    expect(noodles.variants).toHaveLength(0);
    expect(noodles.reference?.length).toBeGreaterThan(0);
  });

  it("only references changes and variants that exist from board messages", () => {
    const byId = new Map(MINI_WORLD_CHANGE_DEFINITIONS.map((d) => [d.id, d]));
    for (const entry of BOARD_MESSAGES) {
      if (!entry.changeId) continue;
      const def = byId.get(entry.changeId);
      expect(def, `unknown changeId ${entry.changeId}`).toBeDefined();
      if (entry.variantId) {
        expect(
          def!.variants.some((v) => v.id === entry.variantId),
          `${entry.changeId} has no variant "${entry.variantId}"`,
        ).toBe(true);
      }
    }
  });

  it("covers every modelled change with at least one board message", () => {
    const covered = new Set(BOARD_MESSAGES.map((m) => m.changeId).filter(Boolean));
    for (const def of MINI_WORLD_CHANGE_DEFINITIONS) {
      expect(covered.has(def.id), `no board message for ${def.id}`).toBe(true);
    }
  });
});

describe("World Change catalog", () => {
  it("tracks exactly the 14 official Guide keywords", () => {
    expect(WORLD_CHANGE_DEFINITIONS).toHaveLength(14);
    expect(GUIDE_KEYWORDS.sort()).toEqual(
      [
        "Horestis",
        "Mage Tower",
        "Master's Voice",
        "Swamp Fever",
        "Thornfire",
        "Twisted Waters",
        "Awash",
        "Steamship",
        "Horses",
        "Overhunting",
        "Demon War",
        "Sea Serpent",
        "Deepling",
        "Hive",
      ].sort(),
    );
  });

  it("gives every change at least one documented state, with unique ids", () => {
    for (const def of WORLD_CHANGE_DEFINITIONS) {
      expect(def.states.length, `${def.id} has no states`).toBeGreaterThan(0);
      const ids = def.states.map((s) => s.id);
      expect(new Set(ids).size, `${def.id} has duplicate state ids`).toBe(ids.length);
    }
  });

  it("records Horse Station's two real states and nothing more", () => {
    const horses = WORLD_CHANGE_DEFINITIONS.find((d) => d.id === "horse-station")!;
    expect(horses.guideKeyword).toBe("Horses");
    expect(horses.states.map((s) => s.id).sort()).toEqual(["escaped", "normal"]);
  });

  it("does not share ids with the Mini World Change catalog", () => {
    // The two mechanics are parsed from the same paste; colliding ids would let one
    // mechanic's evidence land on the other's card.
    const miniIds = new Set(MINI_WORLD_CHANGE_DEFINITIONS.map((d) => d.id));
    for (const def of WORLD_CHANGE_DEFINITIONS) {
      expect(miniIds.has(def.id), `${def.id} exists in both catalogs`).toBe(false);
    }
  });
});
