import { describe, expect, it } from "vitest";
import { deriveOpportunities, type OpportunityInput } from "./deriveOpportunities";
import { createDefaultOverrides } from "@/lib/defaults";

function baseInput(): OpportunityInput {
  const overrides = createDefaultOverrides("Ustebra", new Date(2026, 8, 10));
  return {
    miniWorldChanges: overrides.miniWorldChanges,
    worldChanges: overrides.worldChanges,
    merchants: overrides.merchants,
  };
}

const ids = (input: OpportunityInput) =>
  deriveOpportunities(input).map((opportunity) => opportunity.definition.id);

function setWorldChange(input: OpportunityInput, id: string, stateId: string) {
  input.worldChanges[id] = { id, stateId, updatedAt: null };
}

function setMini(input: OpportunityInput, id: string, variantId: string | null = null) {
  input.miniWorldChanges[id] = { id, status: "active", variantId, updatedAt: null };
}

describe("deriveOpportunities", () => {
  it("returns nothing when nothing has been established", () => {
    // A fresh session knows nothing, so it can recommend nothing. That is the correct output,
    // not a gap: every other behaviour here would be advice built on unverified state.
    expect(deriveOpportunities(baseInput())).toEqual([]);
  });

  describe("the same change offers different things in different states", () => {
    it("offers the deer, the mount and the antler trade while deer are in the region", () => {
      const input = baseInput();
      setWorldChange(input, "overhunting", "stable");
      expect(ids(input)).toEqual(
        expect.arrayContaining([
          "overhunting-white-deer",
          "overhunting-kingly-deer",
          "overhunting-antlers",
        ]),
      );
      expect(ids(input)).not.toContain("overhunting-starving-wolf");
    });

    it("offers the wolves and the trapping instead once the deer are gone", () => {
      const input = baseInput();
      setWorldChange(input, "overhunting", "wolves");
      expect(ids(input)).toEqual(["overhunting-starving-wolf", "overhunting-trap-wolves"]);
      // The whole point: nothing that needs a White Deer may be offered on a wolf day.
      for (const blocked of [
        "overhunting-white-deer",
        "overhunting-kingly-deer",
        "overhunting-antlers",
      ]) {
        expect(ids(input)).not.toContain(blocked);
      }
    });

    it("stops offering Wild Horse taming when the horses are back in the pen", () => {
      const escaped = baseInput();
      setWorldChange(escaped, "horse-station", "escaped");
      expect(ids(escaped)).toContain("horse-station-war-horse");

      const penned = baseInput();
      setWorldChange(penned, "horse-station", "normal");
      expect(ids(penned)).toEqual(["horse-station-rental"]);
    });

    it("only offers the Princes once a faction dominates, not merely leads", () => {
      const advantage = baseInput();
      setWorldChange(advantage, "demon-war", "shaburak-advantage");
      expect(ids(advantage)).toEqual(["demon-war-shaburak-lord"]);

      const dominant = baseInput();
      setWorldChange(dominant, "demon-war", "shaburak-dominant");
      expect(ids(dominant)).toEqual(
        expect.arrayContaining(["demon-war-shaburak-lord", "demon-war-shaburak-prince"]),
      );
    });

    it("only offers the Deepling boss in stage 3, and the coral that earns it in stage 2", () => {
      const stage2 = baseInput();
      setWorldChange(stage2, "deeplings", "floodgates-open");
      expect(ids(stage2)).toContain("deeplings-coral-mine");
      expect(ids(stage2)).not.toContain("deeplings-boss");

      const stage3 = baseInput();
      setWorldChange(stage3, "deeplings", "arcanum-breached");
      expect(ids(stage3)).toContain("deeplings-boss");
      // Boss access cannot be earned during stage 3, so the coral mission is not offered here.
      expect(ids(stage3)).not.toContain("deeplings-coral-mine");
    });
  });

  describe("evidence gating", () => {
    it("ignores a Mini World Change that a complete board ruled out", () => {
      const input = baseInput();
      input.miniWorldChanges["stampede"] = {
        id: "stampede",
        status: "inactive",
        variantId: null,
        updatedAt: null,
      };
      expect(ids(input)).toEqual([]);
    });

    it("ignores a Mini World Change nobody checked", () => {
      expect(ids(baseInput())).not.toContain("stampede-terrified-elephant");
    });

    it("will not guess a variant the source never named", () => {
      const input = baseInput();
      setMini(input, "jungle-camp", null);
      // The World Board confirms the fight without saying who is winning, and each faction
      // brings a different boss. Offering either would be a coin flip presented as a fact.
      expect(ids(input)).toEqual([]);

      setMini(input, "jungle-camp", "dworcs");
      expect(ids(input)).toEqual(["jungle-camp-oodok"]);
    });

    it("offers a location-variant change even before the location is known", () => {
      // Fury Gates never names its city, so waiting for the variant would mean never offering
      // the dungeon at all — unlike Jungle Camp, nothing about *what* is there depends on it.
      const input = baseInput();
      setMini(input, "fury-gates", null);
      expect(ids(input)).toEqual(
        expect.arrayContaining(["fury-gates-dungeon", "fury-gates-dragonling"]),
      );
    });

    it("needs Yasir to be trading, not merely recorded", () => {
      const input = baseInput();
      expect(ids(input)).not.toContain("yasir-si-ariki");

      input.merchants.yasir = { ...input.merchants.yasir!, activityState: "inactive" };
      expect(ids(input)).not.toContain("yasir-si-ariki");

      input.merchants.yasir = { ...input.merchants.yasir!, activityState: "pending-location" };
      expect(ids(input)).toContain("yasir-si-ariki");
    });
  });

  describe("ordering", () => {
    it("puts what can be had today above what today only advances or unlocks", () => {
      const input = baseInput();
      setWorldChange(input, "awash", "drained-quota-open");
      const availabilities = deriveOpportunities(input).map((o) => o.definition.availability);
      expect(availabilities).toEqual([
        ...availabilities.filter((a) => a === "available-today"),
        ...availabilities.filter((a) => a !== "available-today"),
      ]);
      expect(availabilities.at(-1)).toBe("unlocks-future");
    });

    it("puts what exists only in this state above what is merely convenient now", () => {
      const input = baseInput();
      setWorldChange(input, "mage-tower", "portal-open");
      const first = deriveOpportunities(input)[0]!;
      expect(first.definition.exclusive).toBe(true);
    });
  });

  it("orders by exactly the documented keys, and by nothing partial", () => {
    // A total order, asserted directly. The reason this test exists: a Charm Points tiebreak
    // that only applied "when both sides are bestiary entries" is intransitive (Iron Servant
    // 30 > Deepling Scout 25 on charm, Deepling Scout > Groam on name, Groam > Iron Servant on
    // name), and Array.prototype.sort given a cycle returns whatever the engine likes. The
    // symptom was a change quietly surfacing its second-best opportunity.
    const input = baseInput();
    setWorldChange(input, "awash", "drained-quota-open");
    setWorldChange(input, "masters-voice", "passable");
    setWorldChange(input, "overhunting", "wolves");
    setMini(input, "spider-nest");

    const rank = (o: ReturnType<typeof deriveOpportunities>[number]) =>
      [
        { "available-today": 0, "progressable-today": 1, "unlocks-future": 2 }[
          o.definition.availability
        ],
        o.definition.exclusive ? 0 : 1,
        o.definition.prerequisites?.length ?? 0,
      ] as const;

    const sorted = deriveOpportunities(input);
    for (let i = 1; i < sorted.length; i += 1) {
      const previous = rank(sorted[i - 1]!);
      const current = rank(sorted[i]!);
      const firstDifference = previous.findIndex((value, index) => value !== current[index]);
      if (firstDifference === -1) {
        // Every key tied, so the names must be in order — nothing else may reorder them.
        expect(
          sorted[i - 1]!.definition.subject.localeCompare(sorted[i]!.definition.subject),
          `${sorted[i - 1]!.definition.subject} before ${sorted[i]!.definition.subject}`,
        ).toBeLessThanOrEqual(0);
      } else {
        expect(previous[firstDifference]!, `position ${i}`).toBeLessThan(current[firstDifference]!);
      }
    }
  });

  it("represents Their Master's Voice by one servant, with the set named in its own line", () => {
    // All three servants are separate, researched catalog entries and all three stay. The
    // briefing shows the change once; which one it picks is settled by the order above, and the
    // line it prints carries the whole set's value so nothing is lost by the cut.
    const input = baseInput();
    setWorldChange(input, "masters-voice", "passable");

    const servants = deriveOpportunities(input).filter((o) => o.definition.bestiary);
    expect(servants.map((o) => o.definition.subject)).toEqual([
      "Diamond Servant",
      "Golden Servant",
      "Iron Servant",
    ]);
    expect(servants[0]!.definition.detail.en).toMatch(/all three entries/i);
    expect(servants[0]!.definition.detail.en).toMatch(/130 Charm Points/);
  });

  it("carries the enabling condition through, so a line can be traced back to it", () => {
    const input = baseInput();
    setMini(input, "poacher-caves", "ghost-wolves");
    const [ghostWolf] = deriveOpportunities(input);
    expect(ghostWolf?.conditionName).toBe("Poacher Caves");
    expect(ghostWolf?.conditionState).toBe("Vengeful ghost wolves dominate");
    expect(ghostWolf?.emoji).toBe("🏹");
  });
});
