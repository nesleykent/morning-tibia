import { describe, expect, it } from "vitest";
import { generateBriefingMessage } from "./generateBriefing";
import type { BriefingInput } from "./briefingModel";
import { createDefaultOverrides } from "@/lib/defaults";
import { OPPORTUNITIES } from "@/lib/defaults/opportunities";
import { WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/worldChanges";
import { MINI_WORLD_CHANGES_BY_ID } from "@/lib/defaults/miniWorldChanges";
import { notesForChange, notesForOpportunity } from "./opportunityPhrases";
import { NAME_LINE } from "@/lib/testing/briefingLines";
import type { OpportunityDefinition } from "@/types/opportunity";

/**
 * One rule, checked from every angle it can be broken from: **a change may only offer what the
 * stage it is actually in offers.**
 *
 * The failure this guards against is not cosmetic. A reader who is told that Feverish Citizens
 * are worth hunting on a day the fever is contained, or that a Starving Wolf is available on a
 * White Deer day, walks somewhere and finds nothing there; and because the rest of the bulletin
 * is right, they have no reason to doubt the one line that is wrong. Every assertion below is a
 * pair: what this stage must say, and what a *neighbouring* stage's content must not leak into
 * it.
 *
 * The second half of the file checks the marker vocabulary, which is the other half of the same
 * promise: 🎯 is a Bestiary creature, 👹 a boss, 🐎 a mount, 🏆 an achievement, 👕 an outfit. A
 * Bosstiary boss printed as 🎯 tells the reader it can be ground for Charm Points, which is a
 * different game system with different rewards.
 */

const REFERENCE = new Date("2026-09-11T12:00:00Z");

function input(language: BriefingInput["language"] = "en"): BriefingInput {
  return {
    world: "Gentebra",
    referenceDate: REFERENCE,
    overrides: createDefaultOverrides("Gentebra", REFERENCE),
    boostedCreature: { kind: "creature", name: "Corym Skirmisher", imageUrl: null },
    boostedBoss: { kind: "boss", name: "Ratmiral", imageUrl: null },
    warzoneSchedule: null,
    activeEvents: [],
    upcomingEvents: [],
    drome: null,
    language,
    viewerTimeZone: "America/Sao_Paulo",
    upcomingEventsWindowDays: 14,
    marketTrendBasis: "last",
  };
}

function setWorld(target: BriefingInput, id: string, stateId: string): BriefingInput {
  target.overrides.worldChanges[id] = { id, stateId, updatedAt: null };
  return target;
}

function setMini(target: BriefingInput, id: string, variantId: string | null = null): BriefingInput {
  target.overrides.miniWorldChanges[id] = { id, status: "active", variantId, updatedAt: null };
  return target;
}

/** The whole bulletin for a single World Change in a single state. */
function world(id: string, stateId: string, language: BriefingInput["language"] = "en"): string {
  return generateBriefingMessage(setWorld(input(language), id, stateId));
}

/** The whole bulletin for a single Mini World Change, with or without its variant. */
function mini(
  id: string,
  variantId: string | null = null,
  language: BriefingInput["language"] = "en",
): string {
  return generateBriefingMessage(setMini(input(language), id, variantId));
}

/**
 * Every note line the bulletin printed, with its marker and its bold markup taken off.
 *
 * The comparison below is against what an opportunity *would* print, built from the same
 * `notesForOpportunity` the renderer calls. That matters: matching on `detail` alone silently
 * passes for bestiary and achievement entries, whose lines are composed from their structured
 * fields and never contain their `detail` text at all, so a leak of exactly those two kinds
 * would go unnoticed by the check meant to catch it.
 */
function renderedNotes(message: string): string[] {
  // Scoped to the change blocks. The headline facts at the top of the bulletin use some of the
  // same glyphs (👹 is the boosted boss up there), and they are not opportunity lines.
  //
  // The name line's shape comes from lib/testing/briefingLines.ts rather than a copy here.
  // A copy is what this was, and when the place moved onto the name line it stopped matching
  // anything: `renderedNotes` returned an empty array for every message, and the two leak
  // checks at the bottom of this file — the most load-bearing assertions in it — passed
  // vacuously instead of failing.
  const isNameLine = (line: string) => NAME_LINE.test(line) && line !== line.toUpperCase();
  return message
    .split(/\n\n+/)
    .filter((block) => block.split("\n").some(isNameLine))
    .flatMap((block) => block.split("\n"))
    .filter((line) => /^(?:🎯|👹|🐎|👕|🏆|🔄|⚔️|📊|💡|⏳) /.test(line))
    .map((line) => line.replace(/^\S+\s+/, "").replace(/\*/g, ""));
}

/** The lines one catalog entry can contribute, in the same shape `renderedNotes` returns. */
function textsOf(definition: OpportunityDefinition): string[] {
  return notesForOpportunity(
    { definition, conditionName: "", conditionState: null, emoji: "" },
    "en",
  ).map((note) => (note.subject ? `${note.subject}: ${note.text}` : note.text));
}

/**
 * Every line a given set of catalog entries could produce together.
 *
 * Runs the renderer's own `notesForChange`, which is the point: grouping is a property of the
 * *set* (three creatures that cost the same become one line), so a per-entry comparison cannot
 * recognise a legitimate grouped line and would report it as a leak.
 */
function allowedLines(definitions: OpportunityDefinition[]): Set<string> {
  return new Set(
    notesForChange(
      definitions.map((definition) => ({
        definition,
        conditionName: "",
        conditionState: null,
        emoji: "",
      })),
      "en",
      Number.MAX_SAFE_INTEGER,
    ).map((note) => (note.subject ? `${note.subject}: ${note.text}` : note.text)),
  );
}

/** The block a named change contributed, so a leak is attributed to the right subject. */
function blockFor(message: string, name: string): string {
  const block = message.split(/\n\n+/).find((part) => part.includes(`*${name}*`));
  expect(block, `no block for ${name}`).toBeDefined();
  return block!;
}

describe("manually checked states name their options instead of shrugging", () => {
  it("Fury Gates: unselected lists every city, selected names the one", () => {
    const unselected = mini("fury-gates");
    expect(unselected).toMatch(/We haven't checked which Fury Gate is active yet/);
    expect(unselected).toContain("Ab'Dendriel");
    expect(unselected).toContain("Thais or Venore");
    // The failure mode being closed: telling the reader the answer is out of reach.
    expect(unselected).not.toMatch(/isn't known|unknown|doesn't say/i);

    const selected = mini("fury-gates", "thais");
    expect(selected).toContain("A fiery fury gate has opened near Thais.");
    // Scoped to this change's block: the bulletin as a whole always carries the three
    // changes nothing announces, whose own lines say nobody has checked them.
    expect(blockFor(selected, "Fury Gates")).not.toMatch(/haven't checked/i);
    // Either way the block still says what is behind the gate.
    for (const message of [unselected, selected]) {
      expect(message).toContain("Furyosa");
      expect(message).toContain("🐎 *Dragonling:*");
    }
  });

  it("Nomads: unselected lists the four camps, selected names the one", () => {
    const unselected = mini("nomads");
    expect(unselected).toMatch(/We haven't checked which Nomad camp is active yet/);
    for (const camp of ["Shadow Tomb", "Tarpit Tomb", "Ancient Ruins Tomb"]) {
      expect(unselected, camp).toContain(camp);
    }
    // Both nomads cost the same, so they share a line.
    expect(unselected).toContain(
      "🎯 *Bestiary:* Nomad (Blue) and Nomad (Female); 500 kills, 15 Charm Points each.",
    );

    const selected = mini("nomads", "south-of-the-tarpit-tomb");
    expect(selected).toContain("The nomads have camped in Kha'labal, south of the Tarpit Tomb.");
    expect(blockFor(selected, "Nomads")).not.toMatch(/haven't checked/i);
  });

  it("Jungle Camp: unselected names both factions and offers neither boss", () => {
    const unselected = mini("jungle-camp");
    expect(unselected).toMatch(/We haven't checked who's controlling the Jungle Camp yet/);
    expect(unselected).toContain("Hunters or Dworcs");
    expect(unselected).not.toMatch(/Arthom|Oodok/);

    const hunters = mini("jungle-camp", "hunters");
    expect(hunters).toContain("The hunters hold Trapwood's holy grounds.");
    expect(hunters).toContain("Arthom the Hunter");
    expect(hunters).not.toContain("Oodok");

    const dworcs = mini("jungle-camp", "dworcs");
    expect(dworcs).toContain("Oodok Witchmaster");
    expect(dworcs).not.toContain("Arthom");
  });

  it("Forsaken: unchecked and running-but-unnamed are the same sentence", () => {
    // The mine is never off, so "nobody has looked" and "confirmed running, nobody said which
    // rotation" are one knowledge state. Printing them differently would tell the reader about
    // a distinction the app makes internally rather than about the mine.
    const nobodyLooked = generateBriefingMessage(input());
    const runningUnnamed = mini("forsaken");
    const sentence =
      "_We haven't checked which creatures are in the Forsaken Mine yet. It can be one of these rotations: Rorcs, Leaf Golems and Forest Furies, Cyclopes or Drillworms and Lost Dwarves._";

    expect(nobodyLooked).toContain(sentence);
    expect(runningUnnamed).toContain(sentence);

    // Once a rotation is known the block names it, and drops the list of what else it could be.
    const known = blockFor(mini("forsaken", "lost-dwarves"), "Forsaken");
    expect(known).toContain("The Forsaken Mine is inhabited by Drillworms and Lost Dwarves today.");
    expect(known).not.toMatch(/haven't checked/i);
    expect(known).not.toContain("Rorcs");

    // And it is never an errand: "look down from the first floor before descending" was an
    // instruction addressed to whoever pasted the log, in a message forwarded to everyone else.
    expect(nobodyLooked).not.toMatch(/look down|first floor|descending/i);
  });

  it("Forsaken: never says a mine that cannot stop is not running", () => {
    // "inactive" is not a state an always-active change has, so a stored one is stale or
    // hand-set data. It must not drop the change out of the section, and it must not print
    // the flat "not running" line a board-ruled-out change gets: the mine is certainly
    // occupied, and all that is unknown is by what.
    const target = input();
    target.overrides.miniWorldChanges["forsaken"] = {
      id: "forsaken",
      status: "inactive",
      variantId: null,
      updatedAt: null,
    };
    const block = blockFor(generateBriefingMessage(target), "Forsaken");
    expect(block).toMatch(/haven't checked which creatures are in the Forsaken Mine/);
    expect(block).not.toMatch(/not running/i);
  });

  it("Spirit Grounds: the gate and the ground behind it are two separate answers", () => {
    // TibiaWiki: "although there are 3 portals and 3 hunting grounds, they do not correspond".
    // So naming the region answers nothing about what is inside, and the block has to say so.
    // The question is the state line; the twelve names it could be answered with are a line of
    // their own, so the italic paragraph stays short enough to read on a phone.
    const gateOnly = mini("spirit-grounds", "ghostlands");
    expect(gateOnly).toContain(
      "_A Spirit Gate is open in Ghostlands. We haven't checked which of the three hunting grounds is behind it._",
    );
    expect(gateOnly).toContain(
      "⚔️ It can be Ghost, Ghoul, Bonelord and Mummy; Nightstalker, Banshee, Souleater and Braindeath; or Nightmare, Nightmare Scion, Spectre and Phantasm.",
    );
    // …and nothing that depends on the ground is offered until somebody looks.
    expect(gateOnly).not.toMatch(/🎯 \*Bestiary:\*/);
    expect(gateOnly).not.toContain("🎯 *Phantasm:*");
    expect(gateOnly).not.toMatch(/check when you arrive/i);

    const answered = generateBriefingMessage(
      (() => {
        const target = setMini(input(), "spirit-grounds", "ghostlands");
        target.overrides.miniWorldChanges["spirit-grounds"]!.contentId = "nightmares";
        return target;
      })(),
    );
    expect(answered).toContain(
      "Behind it are Nightmare, Nightmare Scion, Spectre and Phantasm.",
    );
    expect(answered).toContain(
      "🎯 *Bestiary:* Nightmare, Nightmare Scion and Spectre; 1,000 kills, 25 Charm Points each.",
    );
    // Phantasm is Hard where the other three are Medium, so it gets its own numbers.
    expect(answered).toContain("🎯 *Phantasm:* 2,500 kills, 50 Charm Points.");
    expect(blockFor(answered, "Spirit Grounds")).not.toMatch(/haven't checked/);
    // …and the question's option list is gone once it has been answered.
    expect(answered).not.toMatch(/⚔️ It can be/);
    // The other two grounds stay out of it.
    expect(answered).not.toContain("Ghoul");
    expect(answered).not.toContain("Souleater");
  });

  it("Deeplings: stage 3 says which Guardians it could be, having not checked", () => {
    const stage3 = world("deeplings", "arcanum-breached");
    expect(stage3).toMatch(/We haven't checked which Deepling Guardian is available today/);
    for (const guardian of ["Tanjis", "Obujos", "Jaul"]) {
      expect(stage3, guardian).toContain(guardian);
    }
    expect(stage3).not.toMatch(/isn't known|unknowable/i);
  });

  it("never tells the reader a selectable fact is unknowable, in any language", () => {
    const shrugs =
      /isn't known|not known yet|doesn't say who|check when you arrive|no se sabe|nie wiadomo|não se sabe/i;
    for (const language of ["pt", "en", "es", "pl"] as const) {
      for (const id of [
        "fury-gates",
        "nomads",
        "jungle-camp",
        "warpath",
        "poacher-caves",
        "spirit-grounds",
      ]) {
        expect(mini(id, null, language), `${id}/${language}`).not.toMatch(shrugs);
      }
    }
  });
});

describe("a stage offers what it has, and nothing a neighbouring stage has", () => {
  it("Swamp Fever: both contained stages trade medicine, only the outbreak hunts the citizens", () => {
    // Three stages, and the middle one was the reason the log sweep happened: eleven of fourteen
    // worlds answered "under control, but medicine is direly needed" and the catalog could read
    // none of it.
    for (const stateId of ["under-control", "medicine-needed"]) {
      const contained = world("swamp-fever", stateId);
      expect(contained).toContain("🍀 *Slug Drug:*");
      expect(contained).toContain("🏆 *Doctor! Doctor!:* Deliver 100 Medicine Pouches to Ottokar; 2 achievement points.");
      // The spawn is throttled by the medicine deliveries, so this is not a hunt worth walking to.
      expect(contained).not.toContain("Feverish Citizen");
      expect(contained).not.toContain("Afflicted");
      // And no invented call to action to restart an event players cannot restart.
      expect(contained).not.toMatch(/reactivate|restart the (fever|event)/i);
    }

    // Only the running-short stage can say the deliveries are holding something back.
    expect(world("swamp-fever", "medicine-needed")).toContain("Hold the fever back");
    expect(world("swamp-fever", "under-control")).not.toContain("Hold the fever back");

    const outbreak = world("swamp-fever", "outbreak");
    expect(outbreak).toContain("🎯 *Feverish Citizen:* 500 kills, 15 Charm Points.");
    expect(outbreak).toContain("👕 *Afflicted Outfits Quest:*");
  });

  it("Thornfire: guarded offers the Overseers and the release, not the fire", () => {
    const guarded = world("thornfire", "guarded");
    expect(guarded).toContain("The firestarters are still imprisoned beneath Shadowthorn.");
    expect(guarded).toContain("🎯 *Elf Overseer:* 5 kills, 50 Charm Points.");
    expect(guarded).toMatch(/free the firestarters.*Shadowthorn will burn after the next server save/);
    // Removed wording: neither of these describes anything the reader does.
    expect(guarded).not.toMatch(/safely guarded|strip the moss/i);
    // Crystal Wolf and the Firefighter achievement belong to the burning stages.
    expect(guarded).not.toContain("Crystal Wolf");
    expect(guarded).not.toContain("Firefighter");

    expect(world("thornfire", "burning")).toContain("Crystal Wolf");
  });

  it("Twisted Waters: clean offers contamination, dirty offers the fish", () => {
    const clean = world("twisted-waters", "clean");
    expect(clean).toContain("The lake near Port Hope is currently clean.");
    expect(clean).toMatch(/1,000 corpses have been thrown in server-wide.*after the next server save/);
    // Biodegradable is 50 fished Shimmer Swimmers, and there are none to fish in a clean lake.
    expect(clean).not.toContain("Biodegradable");
    expect(clean).not.toContain("Shimmer Swimmer:");

    const dirty = world("twisted-waters", "dirty-swimmers");
    expect(dirty).toContain("Shimmer Swimmer");
    expect(dirty).toContain("Biodegradable");
  });

  it("Awash: drained offers the scouts, the boss and the quota; flooded offers the coal", () => {
    const drained = world("awash", "drained-quota-open");
    expect(drained).toContain("The mine near Kazordoon is currently drained, giving access to the Eyes of the Deep.");
    expect(drained).toContain("🎯 *Deepling Scout:* 1,000 kills, 25 Charm Points.");
    expect(drained).toContain("🏆 *Invader of the Deep:* Kill 300 Deepling Scouts; 2 achievement points.");
    expect(drained).toMatch(/^👹 \*Groam:\* Can appear/m);
    expect(drained).toContain("🏆 *Eye of the Deep:* Defeat Groam; 1 achievement point.");
    expect(drained).toMatch(/🔄 \*Keep the mine open:\*.*after the next server save/);
    // The achievement is for killing Groam, never for talking to him or doing his tasks.
    expect(drained).not.toMatch(/talk to Groam|Groam's tasks/i);

    const flooded = world("awash", "flooded");
    expect(flooded).toContain("Coal");
    expect(flooded).not.toContain("Deepling Scout:");
    expect(flooded).not.toContain("Groam");
  });

  it("Steamship: the coal errand, without sending the reader to a Guide", () => {
    const idle = world("steamship", "not-running");
    expect(idle).toMatch(/🔄 \*Restart the Steamship:\* Deliver Coal to Junkar/);
    expect(idle).toContain("200 pieces of Coal");
    expect(idle).toContain("💡 Firestarters, The Lost and Stonerefiners are good sources of Coal.");
    // The bulletin is built out of Guide replies; telling its reader to go and ask one is the
    // generator handing back its own job.
    expect(idle).not.toMatch(/ask a Guide|Guide NPC/i);
    // Coal Miner has no TibiaWiki article, so the briefing must not claim it exists.
    expect(idle).not.toContain("Coal Miner");
  });

  it("Horse Station: escaped horses offer every horse, the mount and the recall", () => {
    const escaped = world("horse-station", "escaped");
    // The three ordinary horses cost the same and share a line; the Wild Horse does not, and
    // the mount points at it by name anyway.
    expect(escaped).toContain(
      "🎯 *Bestiary:* Horse (Brown), Horse (Grey) and Horse (Taupe); 250 kills, 5 Charm Points each.",
    );
    expect(escaped).toContain("🎯 *Wild Horse:* 5 kills, 10 Charm Points.");
    expect(escaped).toContain("🐎 *War Horse:* Use Sugar Oat or a Music Box on a Wild Horse to tame it.");
    expect(escaped).toContain("🏆 *Lucky Horseshoe:* Tame a Wild Horse; 1 achievement point.");
    expect(escaped).toMatch(/🔄 \*Restore horse rentals:\* Lure the escaped Horses back/);
    expect(escaped).not.toContain("Natural Born Cowboy");
    // Spawn trivia stays on the catalog page.
    expect(escaped).not.toMatch(/every three hours|groups of 0/i);

    // Penned, the state sentence still *names* Wild Horses, because their absence is the whole
    // point of the state. What it must not do is offer them.
    const penned = world("horse-station", "normal");
    expect(penned).toMatch(/no Wild Horse spawns/);
    expect(penned).not.toMatch(/🎯 \*Wild Horse:\*/);
    expect(penned).not.toMatch(/🐎 \*War Horse:\*/);
  });

  it("Overhunting: the deer stage never mentions the wolves as available", () => {
    const deer = world("overhunting", "dwindling");
    expect(deer).toContain("🎯 *White Deer:* 250 kills, 5 Charm Points.");
    expect(deer).toMatch(/🐎 \*Kingly Deer:\* Kill White Deer until an Enraged White Deer appears/);
    expect(deer).toContain("🏆 *Friend of Elves:* Tame an Enraged White Deer; 1 achievement point.");
    expect(deer).toContain(
      "🏆 *Deer Hunt:* Kill 400 Enraged or Desperate White Deer in total; 1 achievement point.",
    );
    expect(deer).toMatch(/Starving Wolves will take their place/);
    // Named as a consequence, never as something to go and hunt today.
    expect(deer).not.toContain("🎯 *Starving Wolf:*");
    // Enraged and Desperate deer have no Bestiary entry of their own.
    expect(deer).not.toContain("🎯 *Enraged White Deer:*");
    expect(deer).not.toContain("🎯 *Desperate White Deer:*");

    const wolves = world("overhunting", "wolves");
    expect(wolves).toContain("🎯 *Starving Wolf:* 500 kills, 15 Charm Points.");
    expect(wolves).not.toContain("White Deer:");
    expect(wolves).not.toContain("Kingly Deer");
  });

  it("Demon War: the stalemate has its Demons, and neither Lords nor Princes", () => {
    const stalemate = world("demon-war", "stalemate");
    expect(stalemate).toContain("The war between the Shaburak and Askarak is currently in a stalemate.");
    expect(stalemate).toContain(
      "🎯 *Bestiary:* Askarak Demon and Shaburak Demon; 1,000 kills, 25 Charm Points each.",
    );
    expect(stalemate).toMatch(/🔄 \*Shift the balance:\* A 100-kill advantage.*400-kill advantage/s);
    // The state sentence names Lords and Princes to say there are none; no line may offer them.
    expect(stalemate).not.toMatch(/🎯 \*(Shaburak|Askarak) (Lord|Prince):\*/);
    expect(stalemate).not.toContain("Nemesis");

    const dominant = world("demon-war", "shaburak-dominant");
    expect(dominant).toContain("Shaburak Lord");
    expect(dominant).toContain("Shaburak Prince");
    expect(dominant).not.toContain("Askarak Lord");
  });

  it("Sea Serpent: asleep hunts Seacrest, awake hunts Renegades", () => {
    const asleep = world("sea-serpent", "asleep");
    expect(asleep).toContain("🎯 *Seacrest Serpent:* 2,500 kills, 50 Charm Points.");
    expect(asleep).toContain("🐎 *Titanica:*");
    // The threshold is the one this stage is actually counting towards, and the stage advances
    // the instant the kills land rather than at a server save.
    expect(asleep).toMatch(
      /🔄 \*Make the Serpent dream:\* 1,000 Seacrest Serpents killed server-wide take the Serpent into its dreaming stage\./,
    );
    expect(asleep).toMatch(/The change lands at once, without waiting for a server save\./);
    expect(asleep).not.toMatch(/every 1,000/i);
    expect(asleep).not.toContain("Renegade Quara");
    // Snake Charmer needs the mission that only exists once it wakes.
    expect(asleep).not.toContain("Snake Charmer");

    // …and the dreaming stage counts to the cumulative 2,000, not to another 1,000 from zero.
    const dreaming = world("sea-serpent", "dreaming");
    expect(dreaming).toMatch(/Another 1,000 Seacrest Serpents, 2,000 in all, wake the Serpent/);

    const awake = world("sea-serpent", "awake");
    expect(awake).toContain("Renegade Quara");
    expect(awake).toMatch(/2,000 Renegade Quara killed server-wide send the Serpent back to sleep/);
    expect(awake).toContain("🏆 *Snake Charmer:*");
    expect(awake).not.toContain("🎯 *Seacrest Serpent:*");
  });

  it("Deeplings: stage 2 mines coral and previews stage 3; stage 3 delivers it", () => {
    const stage2 = world("deeplings", "floodgates-open");
    expect(stage2).toContain("God-king Qjell seems pleased. The Drowned Library is open.");
    expect(stage2).toMatch(/🔄 \*Coral Mine:\* Mine your own Crates Full of Coral/);
    expect(stage2).toContain("Mine at least 10 crates");
    expect(stage2).toMatch(/⏳ Once the passage is completed, stage 3 begins after the next server save\./);
    // The preview is labelled as the next stage, never as something reachable today.
    expect(stage2).toMatch(/👹 \*Next stage:\* Tanjis, Obujos and Jaul become available/);
    expect(stage2).toMatch(/🐎 \*Manta Ray:\* The Manta Ray area becomes accessible during the next stage\./);
    expect(stage2).not.toMatch(/access is saved between cycles/i);

    const stage3 = world("deeplings", "arcanum-breached");
    expect(stage3).toMatch(/🎯 \*Manta Ray:\* 1,000 kills, 25 Charm Points/);
    expect(stage3).toMatch(/🐎 \*Manta Ray:\* Use a Foxtail on a Manta Ray/);
    expect(stage3).toContain("🏆 *Beneath the Sea:* Tame a Manta Ray; 3 achievement points.");
    // Boss access can only be earned in stage 2, so the coral errand is not offered here.
    expect(stage3).not.toContain("Coral Mine");
  });

  it("Hive Born: stage 3 is expanded, and never carries a days-left figure", () => {
    const stage3 = world("hive-born", "fallen");
    expect(stage3).toMatch(/👹 \*Bosstiary:\* Chopper, Fleshslicer, Maw, Mindmasher, Rotspit and Shadowstalker/);
    expect(stage3).toContain("🎯 *Ladybug:* 500 kills, 15 Charm Points.");
    // Two steps, two lines, and the clover's line names no single source for the Gooey Mass:
    // the Insectoid Cells are one, and Hive Overseer, Maw and The Mean Masher drop them too.
    expect(stage3).toContain(
      "🍀 *Four-Leaf Clover:* Use a Gooey Mass for a chance to obtain the Ladybug taming item.",
    );
    expect(stage3).toContain("🐎 *Ladybug:* Use a Four-Leaf Clover on a Ladybug to tame it.");
    expect(stage3).toContain("🏆 *Lovely Dots:* Tame a Ladybug; 3 achievement points.");
    // TibiaWiki spells the mount "Lady Bug" and the creature "Ladybug"; the reader sees one.
    expect(stage3).not.toContain("Lady Bug");
    // The stage's own Bestiary, from the areas it opens, not one featured creature.
    expect(stage3).toContain(
      "🎯 *Bestiary:* Kollos, Spidris and Spidris Elite; 1,000 kills, 25 Charm Points each.",
    );
    expect(stage3).toContain("🎯 *Hive Overseer:* 2,500 kills, 50 Charm Points.");
    // …and not the creatures that also live at the Hive Outpost, which are no reason to come.
    for (const shared of ["Waspoid", "Crawler", "Spitter", "Insectoid Worker"]) {
      expect(stage3, shared).not.toContain(shared);
    }
    expect(stage3).toMatch(/👕 \*Insectoid Outfit:\* The quest room in the western inner Hive/);
    expect(stage3).toContain("🏆 *Hive Fighter:* Earn 300 War Exp");
    expect(stage3).toContain("🏆 *Hive War Veteran:* Earn 500 War Exp");
    expect(stage3).toContain("Dung Balls worth 10 War Exp each");

    // The one thing the Guide reply cannot support. Its trailing counter is discarded by the
    // parser, so any figure here would be inferred from a wiki rule about stage length and
    // presented as today's remaining time.
    const hive = blockFor(stage3, "Hive Born");
    expect(hive).not.toMatch(/\b\d+\s*(days?|dias|días|dni)\b/i);
    expect(hive).not.toMatch(/days? left|last day|último dia/i);

    // Stage 1 has none of it.
    const stage1 = world("hive-born", "defended");
    expect(stage1).not.toContain("Chopper");
    expect(stage1).not.toContain("Ladybug");
    expect(stage1).not.toContain("Insectoid Outfit");
  });

  it("Mage Tower: Mageslayer only while the Energized mage is standing there", () => {
    const open = world("mage-tower", "portal-open");
    expect(open).toContain("🎯 *Yielothax:* 1,000 kills, 25 Charm Points.");
    expect(open).toContain(
      "🏆 *Mageslayer:* Defeat the Energized Raging Mage twice; 1 achievement point.",
    );
    expect(open).toMatch(/👹 \*Raging Mage:\*/);

    const slain = world("mage-tower", "mage-slain");
    expect(slain).toContain("The Raging Mage has been defeated and the dimensional portal is collapsing.");
    expect(slain).toContain("👹 *Raging Mage:* Already defeated this cycle.");
    expect(slain).toMatch(
      /⏳ The portal closes shortly after the Raging Mage is defeated\. Once closed, the Another Dimension becomes available again in the next cycle\./,
    );
    // The boss is gone for this cycle, so the achievement that needs him is not on offer.
    expect(slain).not.toContain("Mageslayer");
    // And the app has no kill timestamp, so it may not put a clock on the collapse.
    const tower = blockFor(slain, "The Mage's Tower");
    expect(tower).not.toMatch(/\b\d+\s*(minutes?|minutos?|minut)\b/i);
    expect(tower).not.toMatch(/has closed|already closed/i);
  });

  it("Horestis: the slumbering tomb says what is in it and how the jars work", () => {
    const slumbering = world("horestis", "slumbering");
    expect(slumbering).toMatch(/🔄 \*Ornate Canopic Jars:\*/);
    expect(slumbering).toContain("🏆 *Fearless:* Break 50 Ornate Canopic Jars; 1 achievement point.");
    expect(slumbering).toMatch(/🐎 \*Scorpion King:\* Use a Scorpion Sceptre on a Sandstone Scorpion/);
    // The tomb's whole undead population, not one featured creature. All seven live nowhere
    // else and all seven cost the same, so they are one line rather than seven.
    expect(slumbering).toContain(
      "🎯 *Bestiary:* Death Priest, Elder Mummy, Ghoulish Hyaena, Grave Guard, Sacred Spider, Sandstone Scorpion and Tomb Servant; 1,000 kills, 25 Charm Points each.",
    );
    // Clay Guardian is in the same tomb and also at Middle Spike and Medusa Tower, so it is
    // not a reason to come here.
    expect(slumbering).not.toContain("Clay Guardian");
    // The weakened, non-undead spawn belongs to the states after Horestis has been killed.
    for (const after of ["Grave Robber", "Crypt Defiler", "Honour Guard"]) {
      expect(slumbering, after).not.toContain(after);
    }
    // The nuance everyone gets wrong: the hour is a penalty for failing, not a rate limit.
    expect(slumbering).toMatch(/Only a failed attempt locks the character out for a real-time hour/);
    expect(slumbering).not.toMatch(/one (broken )?jar per hour/i);
    // He is asleep, so he is not a boss waiting to be fought.
    expect(slumbering).not.toMatch(/👹 \*Horestis:\*/);

    expect(world("horestis", "risen")).toMatch(/👹 \*Horestis:\*/);
  });

  it("Master's Voice: the fungus, the servants, the boss and the achievement", () => {
    const passable = world("masters-voice", "passable");
    expect(passable).toMatch(
      /The servants' tower in Edron is covered in slime\. Clearing the fungus triggers the servant waves and unlocks the Mad Mage\./,
    );
    expect(passable).toMatch(/🔄 \*Clear the fungus:\* Clear at least 25 Slime Fungi/);
    expect(passable).toContain("🏆 *Slimer:* Clear 500 Slime Fungi; 1 achievement point.");
    expect(passable).toContain("🎯 *Iron Servant:* 5 kills, 30 Charm Points.");
    expect(passable).toContain(
      "🎯 *Bestiary:* Diamond Servant and Golden Servant; 5 kills, 50 Charm Points each.",
    );
    expect(passable).toMatch(/👹 \*Mad Mage:\*/);
  });

  it("Nightmare Isles and Thawing read as short as they are", () => {
    const isles = mini("nightmare-isles", "daramas-northernmost-coast");
    expect(isles).toContain("The portal to the Nightmare Isles is on Darama's northernmost coast.");
    expect(isles).toContain(
      "⚔️ Platforms linked by teleporting stairs, with Silencers, Retching Horrors, Choking Fears and Terrorsleeps.",
    );
    expect(isles).toContain("💡 TibiaWiki's hunting guide suggests level 250 for every vocation.");
    expect(isles).toContain("🔄 *Nightmare Teddy Quest:* The Nightmare Teddy is guarded on the isles.");
    expect(isles).not.toContain("six Terrorsleeps");
    expect(isles).not.toMatch(/a community recommendation|the game enforces/i);
    expect(isles).not.toMatch(/only exist while the sandstorm/i);

    const thawing = mini("thawing");
    expect(thawing).toContain("_Enough snow has melted near Svargrond to reveal Ice Flowers._");
    expect(thawing).toContain("🏆 *Ice Harvester:* Harvest 10 Ice Flower Seeds; 1 achievement point.");
    // Premium is a fact about the account, not about the morning.
    expect(thawing).not.toContain("Premium");
  });
});

describe("markers say which game system a line belongs to", () => {
  /** Every opportunity's headline marker, gathered by rendering its own state. */
  function markerFor(definitionId: string): string | null {
    const definition = OPPORTUNITIES.find((entry) => entry.id === definitionId)!;
    const target = input();
    if (definition.trigger.kind === "world-change") {
      setWorld(target, definition.trigger.changeId, definition.trigger.stateIds[0]!);
    } else if (definition.trigger.kind === "mini-world-change") {
      setMini(target, definition.trigger.changeId, definition.trigger.variantIds?.[0] ?? null);
      const contentId = definition.trigger.contentIds?.[0];
      if (contentId) {
        target.overrides.miniWorldChanges[definition.trigger.changeId]!.contentId = contentId;
      }
    } else {
      return null;
    }
    // Matched on the entry's own rendered first line, not on its subject: a creature and the
    // mount tamed from it share a name (Ladybug), so a subject match would find either.
    const [first] = textsOf(definition);
    const line = generateBriefingMessage(target)
      .split("\n")
      .find((text) => text.replace(/^\S+\s+/, "").replace(/\*/g, "") === first);
    return line ? (line.split(" ")[0] ?? null) : null;
  }

  it("gives a Bestiary creature 🎯 and a Bosstiary boss 👹", () => {
    expect(markerFor("awash-deepling-scout")).toBe("🎯");
    expect(markerFor("hive-born-ladybug")).toBe("🎯");
    expect(markerFor("awash-groam")).toBe("👹");
    expect(markerFor("hive-born-bosses")).toBe("👹");
    expect(markerFor("horestis-boss")).toBe("👹");
  });

  it("gives a mount 🐎, an achievement 🏆 and an outfit 👕", () => {
    expect(markerFor("horse-station-war-horse")).toBe("🐎");
    expect(markerFor("hive-born-lady-bug-mount")).toBe("🐎");
    expect(markerFor("spirit-grounds-phantasm")).toBe("🎯");
    expect(markerFor("thawing-ice-harvester")).toBe("🏆");
    expect(markerFor("horestis-fearless")).toBe("🏆");
    expect(markerFor("hive-born-insectoid-outfits")).toBe("👕");
  });

  it("groups only creatures that really share one kill count and charm payout", () => {
    // A grouped line states one cost for everything it names, so a set with two difficulties in
    // it stays two lines. Phantasm is the case: Hard where the rest of its Spirit Ground is
    // Medium, and its own line for exactly that reason.
    const ground = generateBriefingMessage(
      (() => {
        const target = setMini(input(), "spirit-grounds", "ghostlands");
        target.overrides.miniWorldChanges["spirit-grounds"]!.contentId = "nightmares";
        return target;
      })(),
    );
    expect(ground).toContain(
      "🎯 *Bestiary:* Nightmare, Nightmare Scion and Spectre; 1,000 kills, 25 Charm Points each.",
    );
    expect(ground).toContain("🎯 *Phantasm:* 2,500 kills, 50 Charm Points.");

    // Iron Servant is 5/30 where the other two are 5/50, so it is not folded in with them.
    const servants = world("masters-voice", "passable");
    expect(servants).toContain(
      "🎯 *Bestiary:* Diamond Servant and Golden Servant; 5 kills, 50 Charm Points each.",
    );
    expect(servants).toContain("🎯 *Iron Servant:* 5 kills, 30 Charm Points.");
  });

  it("keeps a creature on its own line when something else hangs off its name", () => {
    // Grouping is a presentation rule and it has to give way to information. A creature that
    // carries an achievement, or that a mount points at by name, keeps a line to be pointed at.
    const deer = world("overhunting", "dwindling");
    expect(deer).toContain("🎯 *White Deer:* 250 kills, 5 Charm Points.");

    const hive = world("hive-born", "fallen");
    // Ladybug is named by the mount line, so it is never swallowed into a group.
    expect(hive).toContain("🎯 *Ladybug:* 500 kills, 15 Charm Points.");

    // The Princes carry their faction's Nemesis achievement and stay apart from the Lords.
    const dominant = world("demon-war", "shaburak-dominant");
    expect(dominant).toContain("🎯 *Shaburak Prince:* 1,000 kills, 25 Charm Points.");
    expect(dominant).toContain("🏆 *Shaburak Nemesis:*");
  });

  it("never groups across two different changes", () => {
    // Both crypts pay 1,000 kills and 25 Charm Points, and so does the Deepling Scout in a
    // different change entirely. A group is always one change's own creatures.
    const both = setWorld(input(), "demon-war", "stalemate");
    setWorld(both, "awash", "drained-quota-open");
    const message = generateBriefingMessage(both);
    expect(message).toContain(
      "🎯 *Bestiary:* Askarak Demon and Shaburak Demon; 1,000 kills, 25 Charm Points each.",
    );
    expect(message).toContain("🎯 *Deepling Scout:* 1,000 kills, 25 Charm Points.");
    expect(message).not.toContain("Deepling Scout and");
  });

  it("never prints a boss or a mount as a Bestiary entry", () => {
    // 🎯 carries Charm Points and a kill count. A boss line wearing it tells the reader a
    // Bosstiary fight can be ground for charm, which is a different system entirely.
    for (const definition of OPPORTUNITIES) {
      if (definition.kind !== "boss" && definition.kind !== "mount") continue;
      expect(definition.bestiary, `${definition.id} must not carry a bestiary profile`).toBeUndefined();
    }
    for (const definition of OPPORTUNITIES) {
      if (definition.kind !== "bestiary") continue;
      expect(definition.bosstiary, `${definition.id} must not carry a Bosstiary class`).toBeUndefined();
    }
  });

  it("writes every achievement as its own name, its requirement and its points", () => {
    // The shape, and the failure it replaced: an achievement riding along with a boss used to
    // print the boss's name where the achievement's belongs.
    const creatures = new Set(
      OPPORTUNITIES.filter((entry) => entry.bestiary).map((entry) => entry.subject),
    );
    for (const definition of OPPORTUNITIES) {
      const achievement = definition.achievement;
      if (!achievement) continue;
      expect(achievement.points, `${definition.id} points`).toBeGreaterThan(0);
      expect(creatures.has(achievement.name), `${definition.id} names a creature`).toBe(false);
      for (const language of ["pt", "en", "es", "pl"] as const) {
        expect(achievement.requirement[language], `${definition.id}/${language}`).toBeTruthy();
      }
    }

    const drained = world("awash", "drained-quota-open");
    expect(drained).toContain("🏆 *Eye of the Deep:* Defeat Groam; 1 achievement point.");
    expect(drained).not.toContain("🏆 *Groam:*");
  });

  it("counts achievement points as one point or several", () => {
    expect(world("horestis", "slumbering")).toContain("1 achievement point.");
    expect(world("awash", "drained-quota-open")).toContain("2 achievement points.");
    expect(world("hive-born", "fallen")).toContain("3 achievement points.");
    // Never the plural for one.
    expect(world("horestis", "slumbering")).not.toContain("1 achievement points");
  });
});

describe("every stage of every change renders without leaking another's content", () => {
  it("only ever prints the opportunities its own trigger allows", () => {
    // The general form of every assertion above: render each World Change in each of its
    // documented states alone, and check that no opportunity from a state it is NOT in
    // contributed a line. This is what stops a future catalog edit widening a trigger by
    // accident.
    for (const definition of WORLD_CHANGE_DEFINITIONS) {
      for (const state of definition.states) {
        const notes = renderedNotes(
          generateBriefingMessage(setWorld(input(), definition.id, state.id)),
        );
        const allowed = allowedLines(
          OPPORTUNITIES.filter(
            (entry) =>
              entry.trigger.kind === "world-change" &&
              entry.trigger.changeId === definition.id &&
              entry.trigger.stateIds.includes(state.id),
          ),
        );
        for (const line of notes) {
          expect(allowed.has(line), `${definition.id}/${state.id} printed "${line}"`).toBe(true);
        }
      }
    }
  });

  it("keeps a Mini World Change's variant-scoped content behind its variant", () => {
    for (const [changeId, definition] of MINI_WORLD_CHANGES_BY_ID) {
      const scoped = OPPORTUNITIES.filter(
        (entry) =>
          entry.trigger.kind === "mini-world-change" &&
          entry.trigger.changeId === changeId &&
          entry.trigger.variantIds,
      );
      if (scoped.length === 0) continue;

      // Nothing variant-scoped may appear while the variant is still unchecked.
      const unchecked = renderedNotes(generateBriefingMessage(setMini(input(), changeId)));
      for (const entry of scoped) {
        expect(
          unchecked.some((line) => allowedLines([entry]).has(line)),
          `${entry.id} leaked with no variant`,
        ).toBe(false);
      }

      // …and each variant prints only what that variant allows.
      for (const variant of definition.variants) {
        const notes = renderedNotes(generateBriefingMessage(setMini(input(), changeId, variant.id)));
        const allowed = allowedLines(
          OPPORTUNITIES.filter(
            (entry) =>
              entry.trigger.kind === "mini-world-change" &&
              entry.trigger.changeId === changeId &&
              !entry.trigger.contentIds &&
              (entry.trigger.variantIds ?? [variant.id]).includes(variant.id),
          ),
        );
        for (const line of notes) {
          expect(allowed.has(line), `${changeId}/${variant.id} printed "${line}"`).toBe(true);
        }
      }
    }
  });
});

describe("next events say what is worth anticipating", () => {
  function withEvents(events: BriefingInput["upcomingEvents"], language: BriefingInput["language"] = "en") {
    const target = input(language);
    target.upcomingEvents = events;
    return generateBriefingMessage(target);
  }

  const grimvale = {
    id: "grimvale",
    title: "Grimvale Mini World Change",
    url: null,
    startAt: "2026-09-12T08:00:00Z",
    daysUntil: 1,
    certainty: "confirmed" as const,
    occurrenceIndex: 0,
    occurrenceCount: 1,
  };

  const colours = {
    id: "colours",
    title: "The Colours of Magic",
    url: null,
    startAt: "2026-09-15T08:00:00Z",
    daysUntil: 4,
    certainty: "confirmed" as const,
    occurrenceIndex: 0,
    occurrenceCount: 1,
  };

  it("keeps the name, the date and the countdown, then adds what to expect", () => {
    const message = withEvents([grimvale, colours]);
    expect(message).toContain("📆 *NEXT EVENTS*");
    expect(message).toMatch(/🎉 \*Grimvale Mini World Change\*\n\*12 September\*\n⏳ Tomorrow\n/);
    expect(message).toMatch(/🌕 The full moon will transform Grimvale's inhabitants into were-creatures/);
    expect(message).toMatch(/\*The Colours of Magic\*\n\*15 September\*\n⏳ In 4 days\n🔴🔵🟢 Choose a colour/);
  });

  it("surfaces a boss's own date inside the event window", () => {
    // Feroxa is always the 13th, whatever day Grimvale opens, and that is the fact that decides
    // whether tomorrow is a preparation day. It is derived from the occurrence, not written in.
    expect(withEvents([grimvale])).toContain(
      "👹 *Feroxa:* Appears on 13 September. Prepare the Grimvale Quest requirements beforehand if you want to fight her.",
    );

    // Same entry, a month later: the date moves with the occurrence rather than with an edit.
    const october = withEvents([
      { ...grimvale, startAt: "2026-10-12T08:00:00Z", daysUntil: 14 },
    ]);
    expect(october).toContain("Appears on 13 October.");
  });

  it("says nothing extra for an event it has no preview for", () => {
    const message = withEvents([
      { ...grimvale, id: "x", title: "Some Unmodelled Event", startAt: "2026-09-20T08:00:00Z", daysUntil: 9 },
    ]);
    const block = blockFor(message, "Some Unmodelled Event");
    expect(block.split("\n")).toHaveLength(3);
  });

  it("previews every event in every language without a gap", () => {
    for (const language of ["pt", "en", "es", "pl"] as const) {
      const message = withEvents([grimvale, colours], language);
      expect(message, language).not.toContain("undefined");
      expect(message, language).not.toMatch(/\[object/);
    }
  });
});
