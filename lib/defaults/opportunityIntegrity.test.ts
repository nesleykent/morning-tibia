import { describe, expect, it } from "vitest";
import { OPPORTUNITIES } from "./opportunities";
import { bestiaryProfile } from "./bestiary";
import { MINI_WORLD_CHANGES_BY_ID } from "./miniWorldChanges";
import { WORLD_CHANGES_BY_ID } from "./worldChanges";
import { BRIEFING_LANGUAGES } from "@/lib/formatter/translations";

const LANGUAGES = BRIEFING_LANGUAGES.map((entry) => entry.value);

/**
 * Structural guarantees about the opportunity catalog.
 *
 * These are not style checks. Each one closes a way the catalog could quietly start telling
 * the reader something untrue — a trigger pointing at a state the game does not have, a claim
 * with no source behind it, a bestiary number typed in by hand and mistyped, or a sentence
 * that exists in one language and silently falls back to `undefined` in another.
 */
describe("opportunity catalog", () => {
  it("gives every entry a unique id", () => {
    const ids = OPPORTUNITIES.map((definition) => definition.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only ever triggers on a state or variant the game actually has", () => {
    for (const definition of OPPORTUNITIES) {
      const trigger = definition.trigger;

      if (trigger.kind === "world-change") {
        const change = WORLD_CHANGES_BY_ID.get(trigger.changeId);
        expect(change, `${definition.id}: unknown World Change ${trigger.changeId}`).toBeDefined();
        expect(trigger.stateIds.length, `${definition.id}: no states`).toBeGreaterThan(0);
        for (const stateId of trigger.stateIds) {
          expect(
            change!.states.some((state) => state.id === stateId),
            `${definition.id}: ${trigger.changeId} has no state "${stateId}"`,
          ).toBe(true);
        }
        continue;
      }

      if (trigger.kind === "mini-world-change") {
        const change = MINI_WORLD_CHANGES_BY_ID.get(trigger.changeId);
        expect(change, `${definition.id}: unknown change ${trigger.changeId}`).toBeDefined();
        for (const variantId of trigger.variantIds ?? []) {
          expect(
            change!.variants.some((variant) => variant.id === variantId),
            `${definition.id}: ${trigger.changeId} has no variant "${variantId}"`,
          ).toBe(true);
        }
        continue;
      }

      expect(trigger.merchantId).toBe("yasir");
    }
  });

  it("never scopes an opportunity to a variant of a change that has none", () => {
    // A variant-scoped trigger on a plain on/off change could never fire, so it would be a
    // researched fact silently switched off.
    for (const definition of OPPORTUNITIES) {
      if (definition.trigger.kind !== "mini-world-change") continue;
      if (!definition.trigger.variantIds) continue;
      const change = MINI_WORLD_CHANGES_BY_ID.get(definition.trigger.changeId)!;
      expect(change.variants.length, `${definition.id}`).toBeGreaterThan(0);
    }
  });

  it("derives bestiary numbers rather than letting them be typed in", () => {
    for (const definition of OPPORTUNITIES) {
      if (!definition.bestiary) continue;
      const { difficulty, occurrence, kills, charmPoints } = definition.bestiary;
      expect({ kills, charmPoints }, definition.id).toEqual({
        kills: bestiaryProfile(difficulty, occurrence).kills,
        charmPoints: bestiaryProfile(difficulty, occurrence).charmPoints,
      });
    }
  });

  it("gives every bestiary opportunity a bestiary profile, and no other kind one", () => {
    for (const definition of OPPORTUNITIES) {
      if (definition.kind === "bestiary") {
        expect(definition.bestiary, `${definition.id} is a bestiary entry`).toBeDefined();
      }
    }
  });

  it("has a localized detail in every briefing language", () => {
    for (const definition of OPPORTUNITIES) {
      for (const language of LANGUAGES) {
        expect(definition.detail[language], `${definition.id}/${language}`).toBeTruthy();
        expect(definition.caveat?.[language] ?? "ok", `${definition.id}/${language} caveat`).toBeTruthy();
        expect(definition.advisory?.[language] ?? "ok", `${definition.id}/${language} advisory`).toBeTruthy();
      }
    }
  });

  it("keeps community judgement out of the factual lines", () => {
    // `detail` and `caveat` are things the game does. A recommended level, a superlative or a
    // "best source" is a person's conclusion and belongs in `advisory`, where it is rendered
    // behind a "Tip:" marker. Without this the two read identically and a reader cannot tell
    // which half of a sentence CipSoft actually guarantees.
    const judgement =
      /\b(recommended|recomendado|se recomienda|zalecany|best |melhor|mejor |najlepsz|good spot|bom lugar)\b/i;

    for (const definition of OPPORTUNITIES) {
      for (const language of LANGUAGES) {
        expect(definition.detail[language], `${definition.id}/${language} detail`).not.toMatch(
          judgement,
        );
        expect(
          definition.caveat?.[language] ?? "",
          `${definition.id}/${language} caveat`,
        ).not.toMatch(judgement);
      }
    }

    // …and the field is actually used, so the rule above is a real separation rather than a
    // ban that was satisfied by deleting the guidance.
    expect(OPPORTUNITIES.filter((definition) => definition.advisory).length).toBeGreaterThan(0);
  });

  it("cites a source for every claim", () => {
    for (const definition of OPPORTUNITIES) {
      expect(definition.sources.length, `${definition.id} has no source`).toBeGreaterThan(0);
      for (const source of definition.sources) {
        expect(source, definition.id).toMatch(/^https:\/\/tibia\.fandom\.com\/wiki\//);
      }
    }
  });

  it("covers more than achievements", () => {
    // The catalog this replaced could express nothing else, which meant a state whose value was
    // a mount, a boss or a bestiary entry reported as having no opportunities at all.
    const kinds = new Set(OPPORTUNITIES.map((definition) => definition.kind));
    for (const kind of ["bestiary", "boss", "mount", "quest", "item", "access", "service", "hunting", "progress"]) {
      expect(kinds, kind).toContain(kind);
    }
    const achievementOnly = OPPORTUNITIES.filter((d) => d.kind === "achievement").length;
    expect(achievementOnly).toBeLessThan(OPPORTUNITIES.length / 2);
  });

  it("never claims something is available today when the payoff is after the server save", () => {
    // The failure this guards against, stated as a rule a machine can hold: if an entry's own
    // sentence says the effect lands at the *next* server save, the entry cannot also be
    // telling the reader to go and get it now.
    //
    // Deliberately not "every progress entry is future": a change can advance inside one day
    // (clearing the Mad Mage dungeon's fungus, waking the Fire-Feathered Serpent), and calling
    // those future would be the opposite mistake — hiding work that pays off this morning.
    for (const definition of OPPORTUNITIES) {
      if (!/next server save/i.test(definition.detail.en)) continue;
      expect(definition.availability, definition.id).not.toBe("available-today");
    }
  });

  it("uses all three availability tiers", () => {
    const tiers = new Set(OPPORTUNITIES.map((definition) => definition.availability));
    expect(tiers).toEqual(
      new Set(["available-today", "progressable-today", "unlocks-future"]),
    );
  });

  it("does not attach an opportunity to a state that blocks it", () => {
    // The two cases the old catalog got wrong, locked in by id so they cannot silently return.
    const byId = new Map(OPPORTUNITIES.map((d) => [d.id, d]));

    // Askarak/Shaburak Princes only spawn once a faction *dominates*; the old catalog also
    // offered them in the mere-advantage stage, where they do not exist.
    for (const id of ["demon-war-shaburak-prince", "demon-war-askarak-prince"]) {
      const trigger = byId.get(id)!.trigger;
      expect(trigger.kind === "world-change" && trigger.stateIds, id).toEqual([
        id.includes("shaburak") ? "shaburak-dominant" : "askarak-dominant",
      ]);
    }

    // Nothing about White Deer may be offered in the starving-wolf state, and nothing about
    // Wild Horses while the horses are penned.
    const deerStates = ["stable", "dwindling", "leaving"];
    for (const id of ["overhunting-white-deer", "overhunting-kingly-deer", "overhunting-deer-hunt"]) {
      const trigger = byId.get(id)!.trigger;
      expect(trigger.kind === "world-change" && trigger.stateIds, id).toEqual(deerStates);
    }
    const horse = byId.get("horse-station-war-horse")!.trigger;
    expect(horse.kind === "world-change" && horse.stateIds).toEqual(["escaped"]);
  });
});
