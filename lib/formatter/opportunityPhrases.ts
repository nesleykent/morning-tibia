import type {
  Opportunity,
  OpportunityAvailability,
  OpportunityDefinition,
} from "@/types/opportunity";
import type { BriefingLanguage } from "./translations";

type Lang<T> = Record<BriefingLanguage, T>;
function pick<T>(map: Lang<T>, language: BriefingLanguage): T {
  return map[language];
}

/**
 * What today's world state is worth, as lines the bulletin can set.
 *
 * Every line is composed from the structured catalog entry — bestiary profile, achievement
 * metadata, kind, availability, and the authored `detail`/`caveat`/`advisory` prose — so the
 * formatter never interprets NPC text and never restates a domain fact in words of its own.
 *
 * ## Markers, not qualifiers
 *
 * This module used to end most lines with an implementation note: "só neste estado", "só
 * progresso hoje", "vale após o Server Save". Those are the catalog's own vocabulary leaking
 * into a message people forward to their guild — they describe how the app models an entry,
 * not anything a player does. They are gone.
 *
 * What replaces them is a *marker*: each line declares what kind of thing it is, and the
 * renderer gives that kind an emoji. A reader learns the vocabulary once — 🎯 is a bestiary
 * entry, 🏆 an achievement, 🔄 something to go and do, ⚔️ what is spawning, 💡 someone's
 * advice, ⏳ what changes at the next server save — and every entry afterwards is scannable
 * without a single word of scaffolding.
 *
 * The state-dependent facts that the qualifiers used to gesture at are not lost. They are
 * written properly, as sentences, in the narratives and in `detail`: "Wild Horses não estão
 * disponíveis para domesticação neste estado" says what "só neste estado" only hinted at.
 */

/**
 * Kinds whose whole content is *the change itself*, restated.
 *
 * An access route and an NPC service are what the state sentence above them already says.
 * Horse Station is the clearest case: the state reads "os serviços estão funcionando
 * normalmente, e com os cavalos no cercado nenhum Wild Horse aparece", and the `service`
 * entry underneath said the same sentence again in different words.
 *
 * `hunting` is deliberately *not* ambient, though it used to be. What is spawning in a
 * changed area is the single most operational fact a hunting state has, and dropping it left
 * "o vulcão está em erupção" with no mention of the Demons and Dragons that erupting brings.
 */
const AMBIENT_KINDS: readonly OpportunityDefinition["kind"][] = ["access", "service"];

export function isAmbient(definition: OpportunityDefinition): boolean {
  return AMBIENT_KINDS.includes(definition.kind);
}

/**
 * The marker vocabulary. The renderer owns the glyphs; this module only says what a line *is*.
 *
 * `counter` is declared and currently never emitted, and that is deliberate rather than an
 * oversight: the live progress figures a Guide reports ("3 actions have been taken", "0 of
 * 200") are discarded by the parser, which matches only the stable leading sentence of a reply
 * (see lib/parser/guideMessages.ts). There is no structured counter in the project to render,
 * and inventing one is the one thing a briefing must never do. The marker exists so that the
 * day those numbers are captured, the editorial rule is already here.
 */
export type NoteIcon =
  | "bestiary"
  | "boss"
  | "mount"
  | "tamingItem"
  | "outfit"
  | "achievement"
  | "progress"
  | "creatures"
  | "counter"
  | "advisory"
  | "deadline";

export interface BriefingNote {
  icon: NoteIcon;
  /** Bolded and followed by a colon when present: `🎯 *Deepling Scout:* 1.000 mortes…` */
  subject: string | null;
  text: string;
  /** Kept so a deadline-bound line can survive the per-change cap. */
  availability: OpportunityAvailability;
}

const NUMBER_LOCALE: Record<BriefingLanguage, string> = {
  pt: "pt-BR",
  en: "en-US",
  es: "es-ES",
  pl: "pl-PL",
};

/**
 * "1.000 mortes" — grouped for the reader's locale.
 *
 * The word is translated here where the rest of the catalog keeps official terms in English.
 * "Charm Points", "boss", "achievement" and every creature name are what a Brazilian player
 * actually says; "kills" in a line that otherwise reads as Portuguese is the one that looked
 * like a string that never got localized.
 */
function killsPhrase(kills: number, language: BriefingLanguage): string {
  const count = kills.toLocaleString(NUMBER_LOCALE[language]);
  return pick(
    {
      pt: `${count} ${kills === 1 ? "morte" : "mortes"}`,
      en: `${count} ${kills === 1 ? "kill" : "kills"}`,
      es: `${count} ${kills === 1 ? "muerte" : "muertes"}`,
      pl: `${count} zabójstw`,
    },
    language,
  );
}

/** The Bestiary's own name, which is what a grouped line is about rather than any one creature. */
function bestiaryWord(language: BriefingLanguage): string {
  return pick({ pt: "Bestiary", en: "Bestiary", es: "Bestiary", pl: "Bestiary" }, language);
}

/** "Death Priest, Elder Mummy and Grave Guard" — Tibia nouns, localized conjunction only. */
function creatureListPhrase(creatures: readonly string[], language: BriefingLanguage): string {
  if (creatures.length <= 1) return creatures[0] ?? "";
  const and = pick({ pt: "e", en: "and", es: "y", pl: "i" }, language);
  return `${creatures.slice(0, -1).join(", ")} ${and} ${creatures[creatures.length - 1]}`;
}

/**
 * "1.000 mortes, 25 Charm Points cada" — the shared cost of a grouped bestiary line.
 *
 * A comma, not "and": the two figures are the same pair a single-creature line already prints
 * as "1.000 mortes, 25 Charm Points", and setting them as a conjunction where the ungrouped
 * line sets them as a pair made the two shapes look like different kinds of fact. The
 * conjunction this line does need belongs to the creature list in front of it.
 */
function eachPhrase(kills: number, charmPoints: number, language: BriefingLanguage): string {
  const count = kills.toLocaleString(NUMBER_LOCALE[language]);
  return pick(
    {
      pt: `${count} mortes, ${charmPoints} Charm Points cada`,
      en: `${count} kills, ${charmPoints} Charm Points each`,
      es: `${count} muertes, ${charmPoints} Charm Points cada uno`,
      pl: `po ${count} zabójstw, ${charmPoints} Charm Points`,
    },
    language,
  );
}

function pointsPhrase(points: number, language: BriefingLanguage): string {
  return pick(
    {
      pt: `${points} achievement ${points === 1 ? "point" : "points"}`,
      en: `${points} achievement ${points === 1 ? "point" : "points"}`,
      es: `${points} achievement ${points === 1 ? "point" : "points"}`,
      pl: `${points} pkt achievement`,
    },
    language,
  );
}

/**
 * The first letter upper-cased, for a clause that opens its own sentence.
 *
 * An achievement's requirement is authored as a clause ("break 50 Ornate Canopic Jars") because
 * that is how it reads in the catalog. In the bulletin it opens the line, right after the
 * achievement's own name and a colon, so it is a sentence and starts like one. Doing it here
 * rather than in the catalog keeps the authored text in one form.
 */
function opensSentence(text: string): string {
  return text.length === 0 ? text : text[0]!.toUpperCase() + text.slice(1);
}

/** Sentence-final punctuation, added only when the authored text lacks it. */
function sentence(text: string): string {
  return /[.!?…]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`;
}

/**
 * `🏆 *Fearless:* Break 50 Ornate Canopic Jars; 1 achievement point.`
 *
 * A semicolon between the requirement and what it pays, because the requirement is a clause
 * that may carry commas of its own — "Kill 400 Enraged or Desperate White Deer in total",
 * "three times, in any colour" — and a comma there ranked the reward with whatever the clause
 * was already listing, so the eye could not find where the requirement ended.
 *
 * The shape is fixed, and the name position is load-bearing: it holds the achievement's own
 * name and nothing else. It used to hold `subject` whenever an achievement rode along with a
 * boss or a mount, which printed "Groam: achievement Eye of the Deep, 1 achievement point" and
 * put a monster where a reader expects the achievement to be.
 *
 * "Premium" is not appended. It is a fact about the account, not about the morning, and a
 * reader who has no Premium has it on every second line of a bulletin they cannot act on
 * anyway; the catalog page still carries the flag.
 */
function achievementNote(
  definition: OpportunityDefinition,
  language: BriefingLanguage,
): BriefingNote {
  const { name, points, requirement } = definition.achievement!;
  return {
    icon: "achievement",
    subject: name,
    text: sentence(`${opensSentence(requirement[language])}; ${pointsPhrase(points, language)}`),
    availability: definition.availability,
  };
}

/**
 * The marker a named opportunity carries, from what it is.
 *
 * Bosses and mounts used to share the errand marker with everything else, which is the one
 * distinction a reader scanning a busy morning most wants: 👹 says a boss is reachable today,
 * 🐎 says a mount can be tamed, and neither is a chore to be worked through. A Bosstiary boss
 * is emphatically not a bestiary creature, and printing it with 🎯 conflated the two systems.
 */
const KIND_ICON: Partial<Record<OpportunityDefinition["kind"], NoteIcon>> = {
  boss: "boss",
  mount: "mount",
  outfit: "outfit",
  timing: "deadline",
  "taming-item": "tamingItem",
};

/**
 * The one line that says what this opportunity *is*.
 *
 * The branch order is the reader's order of interest, not the catalog's: a creature with a
 * bestiary profile is a bestiary line whatever else it also grants, a boss is a boss and a
 * mount is a mount however they are earned, an entry that *is* an achievement is an
 * achievement, a hunting state is a list of what spawns, and everything else is something to
 * go and do. One opportunity produces exactly one of these.
 *
 * An achievement no longer wins that race from third place. It used to, which meant every boss
 * and every mount that happens to grant one was printed as an achievement line under the
 * creature's name. Where an entry both is a thing and grants an achievement, the achievement
 * gets its own line instead (see notesForOpportunity).
 */
function headlineNote(
  definition: OpportunityDefinition,
  language: BriefingLanguage,
): BriefingNote {
  const qualifier = definition.qualifier?.[language];
  const { availability } = definition;

  if (definition.bestiary) {
    const { kills, charmPoints } = definition.bestiary;
    const facts = [killsPhrase(kills, language), `${charmPoints} Charm Points`];
    if (qualifier) facts.push(qualifier);
    return {
      icon: "bestiary",
      subject: definition.subject,
      text: sentence(facts.join(", ")),
      availability,
    };
  }

  if (definition.kind === "achievement") return achievementNote(definition, language);

  // A hunting state's whole content is what is spawning, which is a list, not an errand.
  if (definition.kind === "hunting") {
    return {
      icon: "creatures",
      subject: null,
      text: sentence(definition.detail[language]),
      availability,
    };
  }

  // Everything else is an errand. A `progress` entry describes the doing itself, so its
  // sentence stands alone unless the catalog gave it a `label` — the few errands ("Keep the
  // mine open", "Restart the Steamship") whose sentence does not say what the errand is
  // called. A named thing — a boss, a mount, an outfit, an item, a quest — always keeps its
  // name in front of it, or the bulletin never says what you are going after.
  //
  // The qualifier is not appended here. On these kinds it restates what `detail` already
  // spells out, and the two together read as a stutter: "Use uma Decorative Ribbon ou Music
  // Box em um deles (com Decorative Ribbon ou Music Box)."
  const named =
    definition.kind === "boss" ||
    definition.kind === "mount" ||
    definition.kind === "outfit" ||
    definition.kind === "item" ||
    definition.kind === "taming-item" ||
    definition.kind === "quest";
  if (definition.kind === "timing") {
    return {
      icon: "deadline",
      subject: null,
      text: sentence(definition.detail[language]),
      availability,
    };
  }
  return {
    icon: KIND_ICON[definition.kind] ?? "progress",
    subject: definition.label?.[language] ?? (named ? definition.subject : null),
    text: sentence(definition.detail[language]),
    availability,
  };
}

/**
 * Every line one opportunity contributes: what it is, then anything that changes at the
 * next server save, then anything a person merely recommends.
 *
 * `caveat` is admitted only for `unlocks-future`, where it is the whole point — what today's
 * effort buys tomorrow. On an entry available right now a caveat is a detail for the catalog
 * page ("a single platform can hold more than ten creatures"), and the bulletin is not the
 * place for it.
 *
 * `advisory` always gets its own line and its own marker, because it is explicitly *not* a
 * fact the game enforces. A recommended level folded into a line of spawn data reads exactly
 * like spawn data, and the reader has no way to tell which half CipSoft guarantees.
 */
export function notesForOpportunity(
  opportunity: Opportunity,
  language: BriefingLanguage,
): BriefingNote[] {
  const { definition } = opportunity;
  const notes: BriefingNote[] = [headlineNote(definition, language)];

  // A boss or a mount that also grants an achievement gets a second line for it, rather than
  // being *replaced* by it. Two facts, two lines: "Groam can appear in the mine while it is
  // drained" and "Eye of the Deep: defeat Groam; 1 achievement point" are different things to
  // know, and folding them into one put the boss's name where the achievement's belongs.
  if (definition.achievement && definition.kind !== "achievement") {
    notes.push(achievementNote(definition, language));
  }

  if (definition.availability === "unlocks-future" && definition.caveat) {
    notes.push({
      icon: "deadline",
      subject: null,
      text: sentence(definition.caveat[language]),
      availability: definition.availability,
    });
  }

  if (definition.advisory) {
    notes.push({
      icon: "advisory",
      subject: null,
      text: sentence(definition.advisory[language]),
      availability: definition.availability,
    });
  }

  return notes;
}

/**
 * Bestiary entries of one change that cost exactly the same, as one line instead of several.
 *
 * ## Why
 *
 * A bestiary line is a name and two numbers. When a change offers seven creatures that all
 * complete at 1,000 kills for 25 Charm Points, seven lines print the same two numbers seven
 * times and the block stops being scannable. Named together they read as what they are: a tomb
 * full of 1,000-kill entries.
 *
 * ## What may be grouped
 *
 * Only within one change, and only on an exact match of kills *and* Charm Points, because the
 * grouped line states one cost for everything it names. A creature that carries anything else
 * worth a line stays on its own, since a group has nowhere to put it:
 *
 * - an achievement, which would otherwise be a 🏆 line hanging off a name no longer present;
 * - a `qualifier`, which is per-creature text appended to its own line;
 * - an `advisory`, for the same reason;
 * - a place in a chain (`leadsTo`, or being another entry's target);
 * - a subject that some *other* opportunity of this change also names, which is how a creature
 *   with a mount hanging off it (Crystal Wolf, Ladybug) keeps a line the mount can point at.
 */
function groupKeyOf(opportunity: Opportunity): string | null {
  const { definition } = opportunity;
  if (definition.kind !== "bestiary" || !definition.bestiary) return null;
  if (definition.achievement || definition.qualifier || definition.advisory) return null;
  if (definition.leadsTo) return null;
  return `${definition.bestiary.kills}/${definition.bestiary.charmPoints}`;
}

/** One rendered unit: a single opportunity, or several creatures that share a bestiary line. */
type Unit =
  | { kind: "single"; opportunity: Opportunity }
  | { kind: "group"; opportunities: Opportunity[] };

function unitsFor(opportunities: Opportunity[]): Unit[] {
  const chainTargets = new Set(
    opportunities.map((o) => o.definition.leadsTo).filter(Boolean) as string[],
  );
  /** Subjects an opportunity of some *other* kind also claims, so the creature keeps its line. */
  const claimedSubjects = new Set(
    opportunities
      .filter((o) => o.definition.kind !== "bestiary")
      .map((o) => o.definition.subject),
  );

  const keyed = opportunities.map((opportunity) => {
    const key = groupKeyOf(opportunity);
    if (key === null) return { opportunity, key: null };
    if (chainTargets.has(opportunity.definition.id)) return { opportunity, key: null };
    if (claimedSubjects.has(opportunity.definition.subject)) return { opportunity, key: null };
    return { opportunity, key };
  });

  // A key with one member is not a group; it renders as itself, in its own place in the order.
  const counts = new Map<string, number>();
  for (const { key } of keyed) {
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const units: Unit[] = [];
  const emitted = new Set<string>();
  for (const { opportunity, key } of keyed) {
    if (!key || (counts.get(key) ?? 0) < 2) {
      units.push({ kind: "single", opportunity });
      continue;
    }
    // The group takes the position of its first member, so ordering stays the catalog's.
    if (emitted.has(key)) continue;
    emitted.add(key);
    units.push({
      kind: "group",
      opportunities: keyed
        .filter((candidate) => candidate.key === key)
        .map((candidate) => candidate.opportunity),
    });
  }
  return units;
}

/**
 * `🎯 *Bestiary:* Kollos, Spidris and Spidris Elite; 1,000 kills, 25 Charm Points each.`
 *
 * A semicolon parts the creatures from their cost, for the same reason it parts an
 * achievement's requirement from its points: the list in front of it is already comma
 * separated, so a comma there made "Spidris Elite" and "1,000 kills" read as two more items
 * of one list. Parted, the line has two halves — who, then what they cost — and the commas
 * inside each half stay unambiguous.
 */
function groupedBestiaryNote(
  opportunities: Opportunity[],
  language: BriefingLanguage,
): BriefingNote {
  const { bestiary, availability } = opportunities[0]!.definition;
  const names = opportunities
    .map((opportunity) => opportunity.definition.subject)
    .sort((a, b) => a.localeCompare(b));
  return {
    icon: "bestiary",
    subject: bestiaryWord(language),
    text: sentence(
      `${creatureListPhrase(names, language)}; ${eachPhrase(
        bestiary!.kills,
        bestiary!.charmPoints,
        language,
      )}`,
    ),
    availability,
  };
}

/**
 * The notes one change contributes, from at most `limit` of its rendered units.
 *
 * The cap counts units rather than raw opportunities, so grouping seven creatures into one line
 * buys back six places for things that are not creatures. An entry never loses its own deadline
 * or advisory halfway through, and ordering is the catalog's, with one exception: an
 * `unlocks-future` entry is pulled in even when the cap is spent, because that tier is the only
 * one with a deadline. "Kill enough deeplings today or the mine refloods" is worth nothing read
 * tomorrow; a bestiary entry that will still be there all week loses nothing.
 */
export function notesForChange(
  opportunities: Opportunity[],
  language: BriefingLanguage,
  limit: number,
): BriefingNote[] {
  const relevant = opportunities.filter((o) => !isAmbient(o.definition));
  const units = unitsFor(relevant);
  const kept = units.slice(0, Math.max(0, limit));

  const deadline = units.find(
    (unit) =>
      unit.kind === "single" &&
      unit.opportunity.definition.availability === "unlocks-future",
  );
  if (deadline && !kept.includes(deadline)) kept.push(deadline);

  return kept.flatMap((unit) =>
    unit.kind === "group"
      ? [groupedBestiaryNote(unit.opportunities, language)]
      : notesForOpportunity(unit.opportunity, language),
  );
}
