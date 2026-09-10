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
 * How an opportunity reads in the briefing.
 *
 * Everything here is composed from the structured catalog entry — kind, bestiary profile,
 * achievement metadata, availability — plus that entry's own localized sentence. The formatter
 * never interprets NPC prose and never restates a domain fact in words of its own, which is
 * how the old pipeline ended up printing "Boss disponível: Raging Mage" for a state where the
 * boss cannot be fought.
 */

const KIND_LABEL: Lang<Record<OpportunityDefinition["kind"], string>> = {
  pt: {
    bestiary: "Bestiary",
    boss: "Boss",
    mount: "Montaria",
    achievement: "Achievement",
    quest: "Quest",
    item: "Item",
    access: "Acesso",
    service: "Serviço",
    hunting: "Caçada",
    progress: "Progresso da World Change",
  },
  en: {
    bestiary: "Bestiary",
    boss: "Boss",
    mount: "Mount",
    achievement: "Achievement",
    quest: "Quest",
    item: "Item",
    access: "Access",
    service: "Service",
    hunting: "Hunt",
    progress: "World Change progress",
  },
  es: {
    bestiary: "Bestiary",
    boss: "Jefe",
    mount: "Montura",
    achievement: "Achievement",
    quest: "Quest",
    item: "Objeto",
    access: "Acceso",
    service: "Servicio",
    hunting: "Cacería",
    progress: "Progreso de la World Change",
  },
  pl: {
    bestiary: "Bestiary",
    boss: "Boss",
    mount: "Wierzchowiec",
    achievement: "Osiągnięcie",
    quest: "Quest",
    item: "Przedmiot",
    access: "Dostęp",
    service: "Usługa",
    hunting: "Łowy",
    progress: "Postęp World Change",
  },
};

/** "500 mortes" / "500 kills" — the bestiary entry's completion cost. */
function killsPhrase(kills: number, language: BriefingLanguage): string {
  return pick(
    {
      pt: `${kills} mortes`,
      en: `${kills} kills`,
      es: `${kills} muertes`,
      pl: `${kills} zabójstw`,
    },
    language,
  );
}

function charmPhrase(points: number, language: BriefingLanguage): string {
  return pick(
    {
      pt: `${points} Charm Points`,
      en: `${points} Charm Points`,
      es: `${points} Charm Points`,
      pl: `${points} Charm Points`,
    },
    language,
  );
}

type AchievementFacts = NonNullable<OpportunityDefinition["achievement"]>;

/** "2 pontos · Premium" — used when the achievement *is* the opportunity's subject. */
function achievementPointsPhrase(
  achievement: AchievementFacts,
  language: BriefingLanguage,
): string {
  const points = pick(
    {
      pt: `${achievement.points} ${achievement.points === 1 ? "ponto" : "pontos"}`,
      en: `${achievement.points} ${achievement.points === 1 ? "point" : "points"}`,
      es: `${achievement.points} ${achievement.points === 1 ? "punto" : "puntos"}`,
      pl: `${achievement.points} pkt`,
    },
    language,
  );
  return achievement.premium ? `${points} · Premium` : points;
}

/** "achievement Trail of the Ape God" — used when it rides along with something else. */
function achievementNamePhrase(
  achievement: AchievementFacts,
  language: BriefingLanguage,
): string {
  const label = pick(
    { pt: "achievement", en: "achievement", es: "achievement", pl: "osiągnięcie" },
    language,
  );
  return `${label} ${achievement.name}`;
}

/**
 * The availability marker, and the reason this module exists.
 *
 * `available-today` gets no marker at all — the section is called "today", so saying it twice
 * is noise. The other two are always marked, because an unmarked line is read as a promise:
 * "Raging Mage — Boss" with nothing after it says go and fight him, which today is false.
 */
function availabilityMarker(
  availability: OpportunityDefinition["availability"],
  language: BriefingLanguage,
): string | null {
  if (availability === "available-today") return null;
  if (availability === "progressable-today") {
    return pick(
      { pt: "dá para avançar hoje", en: "progress only", es: "solo progreso", pl: "tylko postęp" },
      language,
    );
  }
  return pick(
    {
      pt: "vale a partir do próximo Server Save",
      en: "pays off after the next server save",
      es: "cuenta desde el próximo Server Save",
      pl: "zadziała po następnym server save",
    },
    language,
  );
}

/** The word that tells a reader the next sentence is somebody's opinion, not the game's rule. */
function advisoryMarker(language: BriefingLanguage): string {
  return pick({ pt: "Dica", en: "Tip", es: "Consejo", pl: "Wskazówka" }, language);
}

function exclusiveMarker(language: BriefingLanguage): string {
  return pick(
    { pt: "só neste estado", en: "only in this state", es: "solo en este estado", pl: "tylko w tym stanie" },
    language,
  );
}

export interface OpportunityLine {
  /** `Starving Wolf — Bestiary · 500 mortes · 15 Charm Points · só neste estado` */
  headline: string;
  /** The catalog's own localized sentence. Only things the game does. */
  detail: string;
  /**
   * Community judgement, already prefixed with its own marker ("Dica:" / "Tip:"), or null.
   * Carried separately and marked so a recommended level can never be read as a requirement.
   */
  advisory: string | null;
}

export interface OpportunityGroup {
  emoji: string;
  /** `OVERHUNTING` — the enabling change, upper-cased like every other briefing heading. */
  label: string;
  lines: OpportunityLine[];
}

/**
 * Deliberately not carried here: the recognised state's label. Those labels are English
 * catalog strings, and dropping one into a Portuguese heading is the same mixed-language
 * mistake the Mini World Change narratives had. Which state is in force is already stated, in
 * the reader's language, immediately above in WORLD CHANGES and again inside each `detail`.
 */

export function formatOpportunityLine(
  opportunity: Opportunity,
  language: BriefingLanguage,
): OpportunityLine {
  const { definition } = opportunity;
  const parts: string[] = [pick(KIND_LABEL, language)[definition.kind]];

  if (definition.bestiary) {
    parts.push(killsPhrase(definition.bestiary.kills, language));
    parts.push(charmPhrase(definition.bestiary.charmPoints, language));
  }
  // An achievement is printed for every kind that grants one, not just for `kind:
  // "achievement"` — the Stampede entry is a bestiary opportunity that happens to hand out
  // "Trail of the Ape God", and dropping that would lose the most actionable part. When the
  // achievement is secondary it is named only; its grade and points are catalog-page detail
  // and would push an already-dense line past the point of being scannable.
  if (definition.achievement) {
    parts.push(
      definition.kind === "achievement"
        ? achievementPointsPhrase(definition.achievement, language)
        : achievementNamePhrase(definition.achievement, language),
    );
  }
  if (definition.bosstiary) parts.push(definition.bosstiary);
  if (definition.exclusive) parts.push(exclusiveMarker(language));

  const marker = availabilityMarker(definition.availability, language);
  if (marker) parts.push(marker);

  const advisory = definition.advisory?.[language];
  return {
    headline: `${definition.subject} — ${parts.join(" · ")}`,
    detail: definition.detail[language],
    advisory: advisory ? `${advisoryMarker(language)}: ${advisory}` : null,
  };
}

/**
 * The order the availability tiers are offered in, and how much of the budget the two weaker
 * ones are guaranteed.
 *
 * A straight priority sort gives `available-today` everything: a full Guide sweep establishes
 * sixteen changes with something available right now, which is more than the whole section is
 * allowed to print. That would hide the tier that is actually perishable — "kill enough
 * deeplings today or the mine refloods", "200 actions today or the hive holds" — because those
 * expire at the next server save and a briefing read tomorrow is too late. So the two weaker
 * tiers keep a small reserve, and anything they don't use goes back to the top tier.
 */
const TIER_ORDER = ["available-today", "progressable-today", "unlocks-future"] as const;
const RESERVED: Partial<Record<OpportunityAvailability, number>> = {
  "progressable-today": 2,
  "unlocks-future": 2,
};

interface Candidate {
  key: string;
  line: OpportunityLine;
  availability: OpportunityAvailability;
}

/**
 * Groups the opportunities under the change that created them, then spends the line budget
 * breadth-first so every state that has something to offer gets heard.
 *
 * Grouping is what removes the "Fire from the Earth — graças a Fire from the Earth" problem at
 * the root rather than special-casing it: with the enabling change as a heading there is no
 * connector phrase left to repeat, and a reader can see at a glance which of today's states is
 * worth their morning.
 *
 * Breadth matters as much as grouping. A straight "take the first N" cut let one busy change
 * eat the whole budget — a drained Awash alone contributes four lines — so the Overhunting
 * wolves, the only thing on the board that exists nowhere else, fell off the bottom. Taking one
 * line per change first keeps the section answering "what does today make possible" rather than
 * "what does today's noisiest change make possible".
 */
export function groupOpportunities(
  opportunities: Opportunity[],
  language: BriefingLanguage,
  limit: number,
): { groups: OpportunityGroup[]; hiddenCount: number } {
  // Groups appear in the order of their best opportunity, since `opportunities` arrives sorted.
  const ordered: OpportunityGroup[] = [];
  const byKey = new Map<string, OpportunityGroup>();
  const candidates: Candidate[] = [];

  for (const opportunity of opportunities) {
    const key = `${opportunity.emoji}|${opportunity.conditionName}`;
    if (!byKey.has(key)) {
      const group: OpportunityGroup = {
        emoji: opportunity.emoji,
        label: opportunity.conditionName.toUpperCase(),
        lines: [],
      };
      byKey.set(key, group);
      ordered.push(group);
    }
    candidates.push({
      key,
      line: formatOpportunityLine(opportunity, language),
      availability: opportunity.definition.availability,
    });
  }

  const taken = new Set<Candidate>();
  let budget = Math.max(0, limit);
  const rankOf = (candidate: Candidate) => TIER_ORDER.indexOf(candidate.availability);

  /**
   * Spends up to `allowance` on `pool`, at most one line per group per pass.
   *
   * `bestOnly` is what stops a reserve from doing harm. Without it the `unlocks-future` pass
   * could reach a change the main pass had not got to yet and represent it by its *weakest*
   * line — Overhunting appearing as "trap the wolves for tomorrow" while the Starving Wolf
   * bestiary entry, the thing that exists only today, went unmentioned. A reserve may add a
   * second line to a change already spoken for, or bring in a change whose best line is in this
   * tier anyway; it may never speak for a change over that change's own better offer.
   */
  const spend = (pool: Candidate[], allowance: number, bestOnly: boolean) => {
    const seenGroups = new Set<string>();
    let left = Math.min(allowance, budget);
    for (const candidate of pool) {
      if (left <= 0) break;
      if (taken.has(candidate) || seenGroups.has(candidate.key)) continue;
      if (
        bestOnly &&
        candidates.some(
          (other) =>
            other.key === candidate.key && !taken.has(other) && rankOf(other) < rankOf(candidate),
        )
      ) {
        continue;
      }
      seenGroups.add(candidate.key);
      taken.add(candidate);
      byKey.get(candidate.key)!.lines.push(candidate.line);
      left -= 1;
      budget -= 1;
    }
  };

  const reserve = TIER_ORDER.reduce((total, tier) => total + (RESERVED[tier] ?? 0), 0);
  for (const tier of TIER_ORDER) {
    const pool = candidates.filter((c) => c.availability === tier);
    const reserved = RESERVED[tier];
    spend(pool, reserved ?? Math.max(0, budget - reserve), reserved !== undefined);
  }

  // Unspent reserve is left unspent, on purpose.
  //
  // It used to be handed back to a general round-robin, which filled the last slot or two with
  // whatever happened to be next — a second Golden Servant under Their Master's Voice while
  // Iron Servant, the third entry of the same set, stayed out. A change represented by two of
  // its three near-identical entries reads like an error; represented by its best one, with the
  // set named in that line's own sentence, it reads like an editor made a choice. The briefing
  // is the summary and the catalog view is the complete list, so spending a spare line on the
  // second-best offer of a change already shown buys nothing.

  // Within a group, keep the catalog's own priority order rather than the order the budget
  // happened to fill them in.
  const rank = new Map(candidates.map((candidate, index) => [candidate.line, index]));
  for (const group of ordered) {
    group.lines.sort((a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0));
  }

  return {
    groups: ordered.filter((group) => group.lines.length > 0),
    hiddenCount: candidates.length - taken.size,
  };
}
