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
  | "place"
  | "bestiary"
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

function achievementWord(language: BriefingLanguage): string {
  return pick(
    { pt: "achievement", en: "achievement", es: "achievement", pl: "osiągnięcie" },
    language,
  );
}

/** Sentence-final punctuation, added only when the authored text lacks it. */
function sentence(text: string): string {
  return /[.!?…]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`;
}

/**
 * The one line that says what this opportunity *is*.
 *
 * The branch order is the reader's order of interest, not the catalog's: a creature with a
 * bestiary profile is a bestiary line whatever else it also grants, an achievement is an
 * achievement, a hunting state is a list of what spawns, and everything else is something to
 * go and do. One opportunity produces exactly one of these.
 */
function headlineNote(
  definition: OpportunityDefinition,
  language: BriefingLanguage,
): BriefingNote {
  const qualifier = definition.qualifier?.[language];
  const { availability } = definition;

  if (definition.bestiary) {
    const facts = [
      killsPhrase(definition.bestiary.kills, language),
      `${definition.bestiary.charmPoints} Charm Points`,
    ];
    if (qualifier) facts.push(qualifier);
    return {
      icon: "bestiary",
      subject: definition.subject,
      text: sentence(facts.join(", ")),
      availability,
    };
  }

  if (definition.achievement) {
    const { name, points, premium } = definition.achievement;
    const facts: string[] = [];
    // When the entry *is* the achievement, its name is the subject and the qualifier says
    // what earns it. When the achievement rides along with something else, the subject is
    // that something and the achievement has to name itself.
    const isTheAchievement = definition.kind === "achievement";
    if (qualifier) facts.push(qualifier);
    if (!isTheAchievement) facts.push(`${achievementWord(language)} ${name}`);
    facts.push(pointsPhrase(points, language));
    if (premium) facts.push("Premium");
    return {
      icon: "achievement",
      subject: isTheAchievement ? name : definition.subject,
      text: sentence(facts.join(", ")),
      availability,
    };
  }

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
  // sentence stands alone; a named thing — a boss, a mount, an item, a quest — keeps its
  // name in front of it, or the bulletin never says what you are going after.
  //
  // The qualifier is not appended here. On these kinds it restates what `detail` already
  // spells out, and the two together read as a stutter: "Use uma Decorative Ribbon ou Music
  // Box em um deles (com Decorative Ribbon ou Music Box)."
  const named =
    definition.kind === "boss" ||
    definition.kind === "mount" ||
    definition.kind === "item" ||
    definition.kind === "quest";
  return {
    icon: "progress",
    subject: named ? definition.subject : null,
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
 * The notes one change contributes, from at most `limit` of its opportunities.
 *
 * The cap counts opportunities rather than lines, so an entry never loses its own deadline or
 * its own advisory halfway through. Ordering is the catalog's, with one exception: an
 * `unlocks-future` entry is pulled in even when the cap is spent, because that tier is the
 * only one with a deadline. "Kill enough deeplings today or the mine refloods" is worth
 * nothing read tomorrow; a bestiary entry that will still be there all week loses nothing.
 */
export function notesForChange(
  opportunities: Opportunity[],
  language: BriefingLanguage,
  limit: number,
): BriefingNote[] {
  const relevant = opportunities.filter((o) => !isAmbient(o.definition));
  const kept = relevant.slice(0, Math.max(0, limit));
  const deadline = relevant.find(
    (opportunity) => opportunity.definition.availability === "unlocks-future",
  );
  if (deadline && !kept.includes(deadline)) kept.push(deadline);

  return kept.flatMap((opportunity) => notesForOpportunity(opportunity, language));
}
