import type {
  Opportunity,
  OpportunityDefinition,
  OpportunityKind,
} from "@/types/opportunity";
import type { BriefingLanguage } from "./translations";

type Lang<T> = Record<BriefingLanguage, T>;
function pick<T>(map: Lang<T>, language: BriefingLanguage): T {
  return map[language];
}

/**
 * How an opportunity reads in the bulletin: one line, under the change that created it.
 *
 * Everything is composed from the structured catalog entry — kind, bestiary profile,
 * achievement metadata, availability — so the formatter never interprets NPC prose and never
 * restates a domain fact in words of its own.
 *
 * The bulletin gets the line; the catalog page gets the paragraph. `detail` and `advisory` are
 * deliberately not rendered here: printed under a state sentence that has already said where
 * you are and what is happening, they repeated it. "Fire from the Earth: the Hellgore volcano
 * is erupting, bringing stronger creatures along with the lava" followed by "Hellgore volcano
 * — hunt, only in this state: in place of the usual Stone Golems come Demons, Dragons…" is
 * one fact spending five lines.
 */

/**
 * Kinds whose whole content is *the change itself*, restated.
 *
 * A hunting ground, an access route and an NPC service are what the state sentence above is
 * already about — Spirit Grounds' only offer is "there is a spirit gate open", which is
 * verbatim what the change's own line says. The concrete kinds name something separable you
 * come away with, so they earn a line of their own.
 */
const AMBIENT_KINDS: readonly OpportunityKind[] = ["hunting", "access", "service"];

export function isAmbient(definition: OpportunityDefinition): boolean {
  return AMBIENT_KINDS.includes(definition.kind);
}

/** Only for the kinds whose chips would otherwise be ambiguous about what they are. */
const KIND_LABEL: Lang<Partial<Record<OpportunityKind, string>>> = {
  pt: { boss: "boss", mount: "montaria", achievement: "achievement", quest: "quest", item: "item", progress: "progresso" },
  en: { boss: "boss", mount: "mount", achievement: "achievement", quest: "quest", item: "item", progress: "progress" },
  es: { boss: "jefe", mount: "montura", achievement: "achievement", quest: "quest", item: "objeto", progress: "progreso" },
  pl: { boss: "boss", mount: "wierzchowiec", achievement: "osiągnięcie", quest: "quest", item: "przedmiot", progress: "postęp" },
};

const NUMBER_LOCALE: Record<BriefingLanguage, string> = {
  pt: "pt-BR",
  en: "en-US",
  es: "es-ES",
  pl: "pl-PL",
};

/**
 * "1.000 kills" — grouped for the reader's locale, and "kills" left in English on purpose.
 * Every Tibian says kills; "1000 mortes" is a translation nobody uses, and it reads as machine
 * output in exactly the place the numbers most need to be trusted.
 */
function killsPhrase(kills: number, language: BriefingLanguage): string {
  return `${kills.toLocaleString(NUMBER_LOCALE[language])} kills`;
}

function pointsPhrase(points: number, language: BriefingLanguage): string {
  return pick(
    {
      pt: `${points} ${points === 1 ? "ponto" : "pontos"}`,
      en: `${points} ${points === 1 ? "point" : "points"}`,
      es: `${points} ${points === 1 ? "punto" : "puntos"}`,
      pl: `${points} pkt`,
    },
    language,
  );
}

/**
 * The availability marker, and the reason this module exists.
 *
 * `available-today` gets no marker: the bulletin is about today, so saying it again is noise.
 * The other two are always marked, because an unmarked line reads as a promise — "Raging Mage
 * — boss" with nothing after it says go and fight him, which today is false.
 */
function availabilityMarker(
  availability: OpportunityDefinition["availability"],
  language: BriefingLanguage,
): string | null {
  if (availability === "available-today") return null;
  if (availability === "progressable-today") {
    return pick(
      { pt: "só progresso hoje", en: "progress only", es: "solo progreso", pl: "tylko postęp" },
      language,
    );
  }
  return pick(
    {
      pt: "vale após o Server Save",
      en: "pays off after the server save",
      es: "cuenta tras el Server Save",
      pl: "liczy się po server save",
    },
    language,
  );
}

function exclusiveMarker(language: BriefingLanguage): string {
  return pick(
    { pt: "só neste estado", en: "only in this state", es: "solo en este estado", pl: "tylko w tym stanie" },
    language,
  );
}

export interface OpportunityLine {
  /** `Starving Wolf: 500 kills, 15 Charm Points, só neste estado` */
  text: string;
  /** Kept so a deadline-bound line can survive the per-change cap. */
  availability: OpportunityDefinition["availability"];
}

/**
 * `Subject: what it is, how much of it (qualifier), and any catch.`
 *
 * Ordinary punctuation, deliberately. The facts used to be chips strung together with middle
 * dots, which is the house style of generated output and reads as such — the line announced
 * that a machine had assembled it before it announced anything about Tibia. A colon after the
 * subject and commas between the facts say the same thing in the reader's own writing system.
 *
 * The qualifier goes in parentheses rather than into the comma list because several of them
 * contain commas of their own ("Chopper, Fleshslicer, Maw…"), and a flat comma list would run
 * the six Hive bosses together with the entry's own attributes into one unreadable string. It
 * attaches to whatever it qualifies: the kind for "achievement (10 Ice Flower Seeds)", and the
 * whole entry for a bestiary line, whose two numbers must not be split apart by it.
 */
export function formatOpportunityLine(
  opportunity: Opportunity,
  language: BriefingLanguage,
): OpportunityLine {
  const { definition } = opportunity;
  const facts: string[] = [];

  const qualifier = definition.qualifier?.[language];
  const parenthesised = qualifier ? ` (${qualifier})` : "";
  let qualifierPlaced = false;

  const kindLabel = pick(KIND_LABEL, language)[definition.kind];
  // A boss's Bosstiary category qualifies the word "boss" rather than standing beside it.
  const opener =
    definition.kind === "boss" && kindLabel && definition.bosstiary
      ? `${kindLabel} ${definition.bosstiary}`
      : (kindLabel ?? definition.bosstiary);
  if (opener) {
    facts.push(`${opener}${parenthesised}`);
    qualifierPlaced = true;
  }

  // A bestiary entry needs no "bestiary" label: a kill count next to a Charm Points figure
  // means one thing in Tibia, and the label would only push the numbers further from the name.
  if (definition.bestiary) {
    facts.push(killsPhrase(definition.bestiary.kills, language));
    facts.push(`${definition.bestiary.charmPoints} Charm Points`);
  }

  if (definition.achievement) {
    if (definition.kind === "achievement") {
      facts.push(pointsPhrase(definition.achievement.points, language));
      if (definition.achievement.premium) facts.push("Premium");
    } else {
      // Riding along with something else, so name it — the subject line does not.
      const label = pick(
        { pt: "achievement", en: "achievement", es: "achievement", pl: "osiągnięcie" },
        language,
      );
      facts.push(`${label} ${definition.achievement.name}`);
    }
  }

  const markers: string[] = [];
  if (definition.exclusive) markers.push(exclusiveMarker(language));

  // "progresso, só progresso hoje" said it twice. When the kind label already carries the
  // idea, the marker adds nothing but width.
  const marker =
    definition.kind === "progress" && definition.availability === "progressable-today"
      ? null
      : availabilityMarker(definition.availability, language);
  if (marker) markers.push(marker);

  // With no kind label to attach to — a bestiary-only line — the qualifier trails the facts,
  // where it qualifies the entry as a whole instead of wedging between kills and Charm Points.
  const described = qualifierPlaced ? facts.join(", ") : `${facts.join(", ")}${parenthesised}`;
  const tail = [described, ...markers].filter(Boolean).join(", ");

  return {
    text: tail ? `${definition.subject}: ${tail}` : definition.subject,
    availability: definition.availability,
  };
}

/**
 * The lines one change contributes to the bulletin, at most `limit` of them.
 *
 * Ordered by the catalog's own ranking, with one exception: an `unlocks-future` line is pulled
 * in even when the cap is spent, because that tier is the only one with a deadline. "Kill
 * enough deeplings today or the mine refloods" is worth nothing read tomorrow; a bestiary
 * entry that will still be there all week loses nothing by waiting.
 */
export function opportunityLinesFor(
  opportunities: Opportunity[],
  language: BriefingLanguage,
  limit: number,
): OpportunityLine[] {
  const lines = opportunities
    .filter((opportunity) => !isAmbient(opportunity.definition))
    .map((opportunity) => formatOpportunityLine(opportunity, language));

  const kept = lines.slice(0, Math.max(0, limit));
  const deadline = lines.find((line) => line.availability === "unlocks-future");
  if (deadline && !kept.includes(deadline)) kept.push(deadline);

  return kept;
}
