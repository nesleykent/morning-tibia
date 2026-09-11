import { describe, expect, it } from "vitest";
import { getWorldChangeNarrative } from "./worldChangeNarratives";
import { WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/worldChanges";
import type { BriefingLanguage } from "./translations";

const LANGUAGES: BriefingLanguage[] = ["pt", "en", "es", "pl"];

describe("getWorldChangeNarrative", () => {
  it("returns null for an unknown changeId", () => {
    expect(getWorldChangeNarrative("not-a-real-id", "slumbering", "pt")).toBeNull();
  });

  it("returns null for a state the change doesn't have", () => {
    expect(getWorldChangeNarrative("swamp-fever", "burning", "pt")).toBeNull();
  });

  it("switches Demon War's headline by which faction is winning", () => {
    const shaburak = getWorldChangeNarrative("demon-war", "shaburak-advantage", "en");
    const askarak = getWorldChangeNarrative("demon-war", "askarak-advantage", "en");

    expect(shaburak?.headline).toContain("Shaburak");
    expect(askarak?.headline).toContain("Askarak");
    expect(shaburak?.headline).not.toBe(askarak?.headline);
  });

  it("switches Awash's body by whether today's deepling quota was met", () => {
    const met = getWorldChangeNarrative("awash", "drained-quota-met", "en");
    const open = getWorldChangeNarrative("awash", "drained-quota-open", "en");

    expect(met?.body).toMatch(/stay open/);
    expect(open?.body).toMatch(/still need/);
    expect(met?.body).not.toBe(open?.body);
  });

  it("distinguishes Thornfire breaking out from Thornfire being fought back", () => {
    const breakingOut = getWorldChangeNarrative("thornfire", "breaking-out", "en");
    const beingFought = getWorldChangeNarrative("thornfire", "being-fought", "en");

    expect(breakingOut).not.toBeNull();
    expect(beingFought).not.toBeNull();
    expect(breakingOut?.headline).not.toBe(beingFought?.headline);
  });

  it("distinguishes Overhunting dwindling from the deer leaving outright", () => {
    const dwindling = getWorldChangeNarrative("overhunting", "dwindling", "en");
    const leaving = getWorldChangeNarrative("overhunting", "leaving", "en");

    expect(dwindling?.headline).not.toBe(leaving?.headline);
  });

  it("has fully localized text for every documented state of every World Change", () => {
    for (const def of WORLD_CHANGE_DEFINITIONS) {
      for (const state of def.states) {
        for (const language of LANGUAGES) {
          expect(
            getWorldChangeNarrative(def.id, state.id, language),
            `${def.id}/${state.id}/${language}`,
          ).not.toBeNull();
        }
      }
    }
  });
});

describe("no claim stronger than the researched state", () => {
  // The four changes whose narratives had drifted furthest from their sources. Each assertion
  // below is the sourced consequence of that stage; the phrasing that used to be here was the
  // formatter's own reading of the NPC line.
  const en = (changeId: string, stateId: string) => {
    const narrative = getWorldChangeNarrative(changeId, stateId, "en")!;
    return `${narrative.headline} ${narrative.body ?? ""}`;
  };

  it("Demon War reports the spawn each stage actually causes, not who 'controls' the dungeon", () => {
    // TibiaWiki, Demon Wars spoiler: advantage spawns that faction's Lords on its tower's upper
    // floors; dominance adds the Princes. Neither faction ever holds the whole complex.
    expect(en("demon-war", "stalemate")).toMatch(/stalemate/i);
    expect(en("demon-war", "stalemate")).toMatch(/no Lords or Princes present/i);

    expect(en("demon-war", "shaburak-advantage")).toMatch(/Shaburak Lords spawn.*western tower/i);
    expect(en("demon-war", "shaburak-advantage")).toMatch(/Princes do not yet/i);
    expect(en("demon-war", "askarak-advantage")).toMatch(/Askarak Lords spawn.*eastern tower/i);

    expect(en("demon-war", "shaburak-dominant")).toMatch(/Shaburak Lords and Princes spawn.*western tower/i);
    expect(en("demon-war", "askarak-dominant")).toMatch(/Askarak Lords and Princes spawn.*eastern tower/i);

    // "Occupy their towers" is the stalemate's own fact and the reason no Lord spawns; what the
    // section still must never say is that either side *controls* the complex, which no stage
    // of this change ever produces.
    for (const stateId of ["stalemate", "shaburak-advantage", "shaburak-dominant"]) {
      expect(en("demon-war", stateId), stateId).not.toMatch(/control|holds the/i);
    }
  });

  it("Mage Tower never says the boss is available, and closes the portal only as the source does", () => {
    // The Energized Raging Mage stands there whenever the portal is open and still cannot be
    // fought until the world has killed 2000 Yielothaxes. The section reports the world state;
    // the boss, with its real conditions, is an opportunity.
    expect(en("mage-tower", "portal-open")).not.toMatch(/can be fought|available|boss/i);
    expect(en("mage-tower", "portal-open")).toMatch(/holding the dimensional portal open/i);
    // The portal collapses about five minutes after the kill, and the Guide reply carries no
    // timestamp for that kill. So the state sentence says "collapsing" and stops: no countdown,
    // and no claim that it has already shut. When it reopens is the opportunity's ⏳ line, where
    // it can be said as a consequence rather than as a clock.
    expect(en("mage-tower", "mage-slain")).toMatch(/collapsing/i);
    expect(en("mage-tower", "mage-slain")).not.toMatch(/\d+\s*minute/i);
    expect(en("mage-tower", "mage-slain")).not.toMatch(/has closed|is closed|already closed/i);
  });

  it("Master's Voice reports the slime and nothing it infers from the other state", () => {
    // No source says the "covered in slime" state is passable; that was read off the *other*
    // state's reply. And there is no documented "Golden Servants phase" at all.
    expect(en("masters-voice", "passable")).toMatch(/covered in slime/i);
    expect(en("masters-voice", "passable")).not.toMatch(/can be walked|passable/i);
    expect(en("masters-voice", "passable")).not.toMatch(/Golden Servants phase/i);
    // …and it does say what clearing the fungus is *for*, which is the whole reason anybody
    // walks into a slime-covered tower.
    expect(en("masters-voice", "passable")).toMatch(/servant waves/i);
    expect(en("masters-voice", "passable")).toMatch(/Mad Mage/i);
  });

  it("Awash tells the two drained states apart from the state itself, not from its name", () => {
    expect(en("awash", "drained-quota-met")).toMatch(/Enough Deeplings have already been killed/i);
    expect(en("awash", "drained-quota-open")).toMatch(/More Deeplings still need to be killed/i);
    expect(en("awash", "drained-quota-met")).not.toBe(en("awash", "drained-quota-open"));
  });

  it("never promises a boss, a portal or an area in the World Changes section", () => {
    // Those are availability claims, and availability belongs to the opportunity catalog where
    // it is typed and can be checked. Prose here may describe the world, never offer it.
    for (const def of WORLD_CHANGE_DEFINITIONS) {
      for (const state of def.states) {
        const text = en(def.id, state.id);
        expect(text, `${def.id}/${state.id}`).not.toMatch(/boss available|available: |can be fought/i);
      }
    }
  });
});
