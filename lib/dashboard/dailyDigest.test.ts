import { describe, expect, it } from "vitest";
import { buildDailyDigest } from "./dailyDigest";
import { createDefaultMiniWorldChangeValues } from "@/lib/defaults/miniWorldChanges";
import { createDefaultWorldChangeValues } from "@/lib/defaults/worldChanges";

function base() {
  return {
    mini: createDefaultMiniWorldChangeValues(),
    world: createDefaultWorldChangeValues(),
  };
}

describe("buildDailyDigest", () => {
  it("does not treat a fresh session as checked", () => {
    const { mini, world } = base();
    const digest = buildDailyDigest(mini, world);

    // Forsaken defaults to active because it always is — that must not masquerade as the
    // player having pasted anything.
    expect(digest.mini.checked).toBe(false);
    expect(digest.world.checked).toBe(false);
  });

  it("puts silent changes in their own group, never in 'not checked'", () => {
    const { mini, world } = base();
    const digest = buildDailyDigest(mini, world);

    const silentIds = digest.mini.silent.map((e) => e.definition.id).sort();
    expect(silentIds).toEqual(["beaver-breakout", "shipwrecked"]);

    const uncheckedIds = digest.mini.unchecked.map((e) => e.definition.id);
    expect(uncheckedIds).not.toContain("beaver-breakout");
    expect(uncheckedIds).not.toContain("shipwrecked");
  });

  it("moves a silent change out of the action list once the player answers", () => {
    const { mini, world } = base();
    mini["shipwrecked"] = {
      id: "shipwrecked",
      status: "active",
      variantId: null,
      updatedAt: null,
    };
    const digest = buildDailyDigest(mini, world);

    expect(digest.mini.silent.map((e) => e.definition.id)).toEqual(["beaver-breakout"]);
    // ...but it stays visible in the reference group so the answer can be revised.
    expect(digest.mini.allSilent).toHaveLength(2);
  });

  it("separates a running change that still needs a detail from one that doesn't", () => {
    const { mini, world } = base();
    mini["fury-gates"] = { id: "fury-gates", status: "active", variantId: null, updatedAt: null };
    mini["stampede"] = { id: "stampede", status: "active", variantId: null, updatedAt: null };

    const digest = buildDailyDigest(mini, world);
    expect(digest.mini.needsVariant.map((e) => e.definition.id)).toContain("fury-gates");
    expect(digest.mini.running.map((e) => e.definition.id)).toContain("stampede");
    expect(digest.mini.running.map((e) => e.definition.id)).not.toContain("fury-gates");
  });

  it("counts Forsaken as needing a detail until the player looks", () => {
    const { mini, world } = base();
    const digest = buildDailyDigest(mini, world);
    expect(digest.mini.needsVariant.map((e) => e.definition.id)).toContain("forsaken");
  });

  it("splits World Changes into noteworthy and quiet by the state's own flag", () => {
    const { mini, world } = base();
    world["horestis"] = { id: "horestis", stateId: "slumbering", updatedAt: null };
    world["demon-war"] = { id: "demon-war", stateId: "askarak-dominant", updatedAt: null };

    const digest = buildDailyDigest(mini, world);
    expect(digest.world.quiet.map((e) => e.definition.id)).toEqual(["horestis"]);
    expect(digest.world.noteworthy.map((e) => e.definition.id)).toEqual(["demon-war"]);
    expect(digest.world.checked).toBe(true);
  });
});
