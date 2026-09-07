import { describe, expect, it } from "vitest";
import { deriveAchievementOpportunities } from "./opportunities";
import { ACHIEVEMENT_OPPORTUNITIES } from "@/lib/defaults/achievements";
import {
  createDefaultMiniWorldChangeValues,
  MINI_WORLD_CHANGES_BY_ID,
} from "@/lib/defaults/miniWorldChanges";
import { createDefaultWorldChangeValues, WORLD_CHANGES_BY_ID } from "@/lib/defaults/worldChanges";
import { createDefaultMerchants } from "@/lib/defaults/merchants";

function baseInput() {
  return {
    miniWorldChanges: createDefaultMiniWorldChangeValues(),
    worldChanges: createDefaultWorldChangeValues(),
    merchants: createDefaultMerchants(new Date(2026, 8, 7)),
  };
}

describe("achievement opportunity catalog integrity", () => {
  it("only references changes that exist", () => {
    for (const def of ACHIEVEMENT_OPPORTUNITIES) {
      const t = def.trigger;
      if (t.kind === "mini-world-change") {
        expect(MINI_WORLD_CHANGES_BY_ID.has(t.changeId), `${def.id} → ${t.changeId}`).toBe(true);
      } else if (t.kind === "world-change") {
        expect(WORLD_CHANGES_BY_ID.has(t.changeId), `${def.id} → ${t.changeId}`).toBe(true);
      }
    }
  });

  it("only references variants and states that exist", () => {
    // This is the guard that stops a catalog rename from silently producing an achievement
    // opportunity that can never fire, or worse, one keyed to a state the game doesn't have.
    for (const def of ACHIEVEMENT_OPPORTUNITIES) {
      const t = def.trigger;
      if (t.kind === "mini-world-change" && t.variantId) {
        const mwc = MINI_WORLD_CHANGES_BY_ID.get(t.changeId)!;
        expect(
          mwc.variants.some((v) => v.id === t.variantId),
          `${def.id} → ${t.changeId}/${t.variantId}`,
        ).toBe(true);
      }
      if (t.kind === "world-change") {
        const wc = WORLD_CHANGES_BY_ID.get(t.changeId)!;
        expect(t.stateIds.length, `${def.id} has no stateIds`).toBeGreaterThan(0);
        for (const stateId of t.stateIds) {
          expect(
            wc.states.some((s) => s.id === stateId),
            `${def.id} → ${t.changeId}/${stateId}`,
          ).toBe(true);
        }
      }
    }
  });

  it("gives every entry a unique id, a task, a reason and a source", () => {
    const ids = ACHIEVEMENT_OPPORTUNITIES.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const def of ACHIEVEMENT_OPPORTUNITIES) {
      expect(def.task.length, `${def.id} task`).toBeGreaterThan(10);
      expect(def.whyToday.length, `${def.id} whyToday`).toBeGreaterThan(10);
      expect(def.source.startsWith("https://"), `${def.id} source`).toBe(true);
    }
  });
});

describe("deriving opportunities from today's state", () => {
  it("produces nothing at all when nothing has been checked", () => {
    // The most important case: an untouched session must not recommend anything.
    const result = deriveAchievementOpportunities(baseInput());
    expect(result).toEqual([]);
  });

  it("produces nothing for a change confirmed NOT running", () => {
    const input = baseInput();
    input.miniWorldChanges["stampede"] = {
      id: "stampede",
      status: "inactive",
      variantId: null,
      updatedAt: null,
    };
    expect(deriveAchievementOpportunities(input)).toEqual([]);
  });

  it("surfaces an opportunity once the change is established as running", () => {
    const input = baseInput();
    input.miniWorldChanges["stampede"] = {
      id: "stampede",
      status: "active",
      variantId: null,
      updatedAt: null,
    };

    const result = deriveAchievementOpportunities(input);
    expect(result).toHaveLength(1);
    expect(result[0]?.definition.achievement).toBe("Trail of the Ape God");
    expect(result[0]?.definition.strength).toBe("required");
    expect(result[0]?.evidence).toContain("Stampede");
  });

  it("respects World Change state: only the qualifying states count", () => {
    const input = baseInput();

    input.worldChanges["demon-war"] = { id: "demon-war", stateId: "stalemate", updatedAt: null };
    expect(deriveAchievementOpportunities(input)).toEqual([]);

    input.worldChanges["demon-war"] = {
      id: "demon-war",
      stateId: "askarak-dominant",
      updatedAt: null,
    };
    const result = deriveAchievementOpportunities(input);
    expect(result.map((o) => o.definition.achievement)).toEqual(["Askarak Nemesis"]);
    // The opposing faction's achievement must NOT appear.
    expect(result.map((o) => o.definition.id)).not.toContain("shaburak-nemesis");
  });

  it("does not offer Biodegradable when the lake is clean", () => {
    const input = baseInput();
    input.worldChanges["twisted-waters"] = {
      id: "twisted-waters",
      stateId: "clean",
      updatedAt: null,
    };
    expect(deriveAchievementOpportunities(input)).toEqual([]);

    input.worldChanges["twisted-waters"] = {
      id: "twisted-waters",
      stateId: "dirty-swimmers",
      updatedAt: null,
    };
    expect(deriveAchievementOpportunities(input).map((o) => o.definition.id)).toEqual([
      "biodegradable",
    ]);
  });

  it("offers all five Devovorga incarnations when the portal is open", () => {
    const input = baseInput();
    input.miniWorldChanges["devovorgas-essence"] = {
      id: "devovorgas-essence",
      status: "active",
      variantId: null,
      updatedAt: null,
    };
    const result = deriveAchievementOpportunities(input);
    expect(result).toHaveLength(5);
    expect(result.every((o) => o.definition.achievement.startsWith("Slayer of"))).toBe(true);
  });

  it("treats a silent change as a real opportunity source once the player confirms it", () => {
    // Beaver Breakout can never come from a paste — only the player reporting what they saw.
    const input = baseInput();
    input.miniWorldChanges["beaver-breakout"] = {
      id: "beaver-breakout",
      status: "active",
      variantId: null,
      updatedAt: null,
    };
    const result = deriveAchievementOpportunities(input);
    expect(result.map((o) => o.definition.achievement)).toEqual(["Beaver Away"]);
    expect(result[0]?.definition.prerequisites).toBeTruthy();
  });

  it("uses Yasir's trading state, not merely that he was seen", () => {
    const input = baseInput();
    input.merchants.yasir = {
      ...input.merchants.yasir!,
      activityState: "inactive",
      location: "",
    };
    expect(deriveAchievementOpportunities(input)).toEqual([]);

    input.merchants.yasir = {
      ...input.merchants.yasir!,
      activityState: "pending-location",
      location: "",
    };
    expect(deriveAchievementOpportunities(input).map((o) => o.definition.id)).toEqual(["si-ariki"]);
  });

  it("never yields an opportunity for a change that is merely unchecked", () => {
    // Belt and braces across the entire catalog, so a future default change can't leak.
    const input = baseInput();
    const result = deriveAchievementOpportunities(input);
    expect(result).toEqual([]);
  });
});
