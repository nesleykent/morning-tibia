import type { DailyDigest, MiniWorldChangeEntry } from "@/lib/dashboard/dailyDigest";
import type { Merchant } from "@/types/merchant";
import { TIBIA_LOCATIONS } from "@/lib/defaults/tibiaLocations";
import { YASIR_CITIES } from "@/lib/defaults/merchants";
import { miniWorldChangeWikiUrl } from "@/lib/utils/tibiaWiki";

/**
 * Turns today's world state into sentences a person can read, with holes where the app is
 * missing a fact.
 *
 * This is the heart of the redesign. Every previous version rendered the *data model* — a
 * catalog of twenty-six changes, each a row with a status control — which forced the reader
 * to learn Morning Tibia's internal categories before they could learn anything about Tibia.
 * Here the categories disappear from the surface and only their consequences remain: a
 * running change becomes a clause, and a fact the app cannot know becomes a blank in that
 * clause, which is self-explanatory to anyone who has ever filled in a form.
 *
 * The domain rules are unchanged and still govern everything — they simply express themselves
 * as prose instead of as badges. A change nobody has checked contributes no sentence at all
 * (silence, not a row saying "unknown"). A change a complete board reading ruled out is
 * summarised in one clause at the end rather than nineteen rows. A silent change gets its own
 * sentence because no paste will ever settle it.
 */

export type Segment =
  | { kind: "text"; text: string }
  | { kind: "em"; text: string }
  /** A name that has a verified TibiaWiki article behind it. */
  | { kind: "link"; text: string; href: string }
  | {
      kind: "blank";
      /** `mwc:<changeId>` — what the picker writes back to. */
      target: string;
      /** What the reader is being asked for, e.g. "which city". */
      ask: string;
      /** Rendered when the fact is known. */
      value: string | null;
      options: { id: string; label: string }[];
      /** Locations get a spatial picker; everything else gets a plain list. */
      spatial: boolean;
      /**
       * Several answers can be true at once (boosted regions). The picker toggles instead
       * of replacing, and stays open between choices.
       */
      multi?: boolean;
      /** Chosen option ids — the multi-select counterpart of `value`. */
      selected?: string[];
    };

export interface DispatchStanza {
  id: string;
  /** Small caps heading above the stanza. Null for the opening stanza. */
  heading: string | null;
  lines: Segment[][];
}

/** What each blank asks for, in the words that sentence needs. */
const ASKS: Record<string, string> = {
  "fury-gates": "which city",
  nomads: "which camp",
  warpath: "where",
  forsaken: "which creatures",
  "jungle-camp": "who holds it",
  "spirit-grounds": "which region",
  "nightmare-isles": "where",
  "poacher-caves": "who dominates",
};

const t = (text: string): Segment => ({ kind: "text", text });
const em = (text: string): Segment => ({ kind: "em", text });
const link = (text: string, href: string | null): Segment =>
  href ? { kind: "link", text, href } : { kind: "em", text };

/** "Thais", "Thais and Edron", "Thais, Edron and Carlin" — a list a sentence can hold. */
function formatList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function blankFor(entry: MiniWorldChangeEntry): Segment {
  const { definition, value } = entry;
  const known = definition.variants.find((v) => v.id === value.variantId) ?? null;
  return {
    kind: "blank",
    target: `mwc:${definition.id}`,
    ask: ASKS[definition.id] ?? (definition.variantKind === "location" ? "where" : "which one"),
    value: known?.label ?? null,
    options: definition.variants.map((v) => ({ id: v.id, label: v.label })),
    spatial: definition.variantKind === "location",
  };
}

/**
 * One clause per running change. The wording is deliberately concrete — a place, a creature,
 * a consequence — rather than the change's catalog name, because the name is an index entry
 * and the clause is the thing the player actually acts on.
 */
function clauseFor(entry: MiniWorldChangeEntry): Segment[] | null {
  const { definition: d } = entry;
  const needs = d.variants.length > 0;

  switch (d.id) {
    case "fury-gates":
      return needs
        ? [t("A fury gate burns open near "), blankFor(entry), t(".")]
        : [t("A fury gate is open.")];
    case "nomads":
      return [t("Nomads have pitched camp in Kha'labal — "), blankFor(entry), t(".")];
    case "warpath":
      return [t("Bibby Bloodbath's orcs are camped "), blankFor(entry), t(".")];
    case "forsaken":
      return [t("The Forsaken Mine below Ab'Dendriel is full of "), blankFor(entry), t(".")];
    case "jungle-camp":
      return [t("Hunters and dworcs are fighting over Trapwood; "), blankFor(entry), t(".")];
    case "spirit-grounds":
      return [t("A spirit gate stands open in "), blankFor(entry), t(".")];
    case "nightmare-isles":
      return [t("A sandstorm has opened the Nightmare Isles at "), blankFor(entry), t(".")];
    case "poacher-caves":
      return [t("North of the Green Claw Swamp, "), blankFor(entry), t(".")];
    case "kingsday":
      return [t("It is Kingsday in Thais.")];
    case "stampede":
      return [t("The Ape God has stampeded Tiquanda's elephants.")];
    case "bank-robbery":
      return [t("Banks in the coastal towns have been robbed and the thieves are loose.")];
    case "noodles-is-gone":
      return [t("Noodles has left the castle again.")];
    case "bored":
      return [t("Wyda is bored, and dangerous company.")];
    case "thawing":
      return [t("Enough snow has melted near Svargrond to uncover ice flowers.")];
    case "river-runs-deep":
      return [t("The Zao Steppe river is running deep.")];
    case "lumberjack":
      return [t("The Queen's royal trees are being felled.")];
    case "down-the-drain":
      return [t("The river south of the outlaw camp has flooded a reachable island.")];
    case "chyllfroest":
      return [t("An ice bridge reaches Chyllfroest.")];
    case "grimvale":
      return [t("The full moon is over Grimvale.")];
    case "spider-nest":
      return [t("Mamma Longlegs is loose in the spider nest near Venore.")];
    case "hive-outpost":
      return [t("A hive infestation has been sighted south-west of Liberty Bay.")];
    case "chakoya-iceberg":
      return [t("An iceberg full of chakoyas has washed up north of Port Hope.")];
    case "fire-from-the-earth":
      return [t("Goroma's volcano is erupting.")];
    case "devovorgas-essence":
      return [t("Devovorga's essence is open at Vengoth.")];
    case "beaver-breakout":
      return [t("The giant beavers are loose at Silvertides.")];
    case "shipwrecked":
      return [t("A wrecked pirate ship has grounded on Krailos' north coast.")];
    default:
      return [t(`${d.name} is running.`)];
  }
}

/**
 * A change that never stops (the Forsaken Mine) but whose current form nobody has looked at
 * yet. It is not news — the mine rotates every save whether or not anyone checked — so it
 * belongs with the other "go and look" facts rather than leading the dispatch.
 *
 * Without this rule it was the *only* thing a brand-new visitor saw: a gold blank asking
 * which creatures were down a mine, before the page had said what it was for. The briefing
 * has always applied this rule (see buildBriefingModel); now the page agrees with it.
 */
function isUnresolvedAlwaysActive(entry: MiniWorldChangeEntry): boolean {
  return entry.definition.detection === "always-active" && entry.value.variantId === null;
}

export function composeDispatch(
  digest: DailyDigest,
  merchants: Record<string, Merchant>,
  boostedRegions: string[] = [],
): DispatchStanza[] {
  const stanzas: DispatchStanza[] = [];

  // ── Today's boosted region ───────────────────────────────────────────────
  // No in-game source exists for this, so the player is the only one who can say. It opens
  // the dispatch because it is a fact about the whole day rather than about one change.
  stanzas.push({
    id: "boosted-region",
    heading: null,
    lines: [
      [
        t("Today's boosted region is "),
        {
          kind: "blank",
          target: "region",
          ask: "which regions",
          value: boostedRegions.length > 0 ? formatList(boostedRegions) : null,
          options: TIBIA_LOCATIONS.map((name) => ({ id: name, label: name })),
          spatial: true,
          multi: true,
          selected: boostedRegions,
        },
        t("."),
      ],
    ],
  });

  // ── What is happening ────────────────────────────────────────────────────
  const running = [...digest.mini.needsVariant, ...digest.mini.running]
    .filter((e, i, all) => all.findIndex((x) => x.definition.id === e.definition.id) === i)
    .filter((entry) => !isUnresolvedAlwaysActive(entry));

  const happeningLines = running.map(clauseFor).filter((l): l is Segment[] => l !== null);

  if (happeningLines.length > 0) {
    stanzas.push({ id: "happening", heading: "In the world", lines: happeningLines });
  } else if (digest.mini.checked) {
    stanzas.push({
      id: "happening",
      heading: "In the world",
      lines: [[t("Nothing is stirring today — the board was empty.")]],
    });
  }

  // ── What the guides report ───────────────────────────────────────────────
  // Every answer, not just the interesting ones. A Guide saying the hive is holding or the
  // steamship is out of coal has answered the question; filtering those out left the page
  // silent about six of the fourteen keywords on a day they had all been asked, which reads
  // as "nobody checked" rather than as the report it is.
  const guideLines = [...digest.world.noteworthy, ...digest.world.quiet]
    .sort((a, b) => a.definition.name.localeCompare(b.definition.name))
    .map((entry) => [
      t(`${entry.definition.name}: `),
      em(entry.stateLabel ?? ""),
      t("."),
    ]);
  if (guideLines.length > 0) {
    stanzas.push({ id: "guides", heading: "The guides report", lines: guideLines });
  }

  // ── Merchants ────────────────────────────────────────────────────────────
  const merchantLines: Segment[][] = [];
  const rashid = merchants.rashid;
  const yasir = merchants.yasir;
  if (rashid?.location) merchantLines.push([t(`Rashid is in ${rashid.location}.`)]);
  if (yasir?.activityState === "pending-location" || yasir?.activityState === "location-known") {
    merchantLines.push([
      t("Yasir's ship is in port at "),
      {
        kind: "blank",
        target: "merchant:yasir",
        ask: "which city",
        value: yasir.location || null,
        options: YASIR_CITIES.map((city) => ({ id: city, label: city })),
        spatial: true,
      },
      t("."),
    ]);
  } else if (yasir?.activityState === "inactive") {
    merchantLines.push([t("Yasir is not trading today.")]);
  }
  if (merchantLines.length > 0) {
    stanzas.push({ id: "merchants", heading: "Merchants", lines: merchantLines });
  }

  // ── Things no source can report ──────────────────────────────────────────
  // These get their own stanza because the reason they are unresolved is different in kind:
  // no paste will ever settle them, so the ask is "go and look", not "paste more".
  const goAndLook = [
    ...digest.mini.silent,
    // Forsaken lives here too until the player has looked — see isUnresolvedAlwaysActive.
    ...[...digest.mini.needsVariant, ...digest.mini.running].filter(isUnresolvedAlwaysActive),
  ].filter((e, i, all) => all.findIndex((x) => x.definition.id === e.definition.id) === i);

  if (goAndLook.length > 0) {
    stanzas.push({
      id: "silent",
      heading: "Nothing announces these",
      lines: goAndLook.map((entry) => {
        const line: Segment[] = [
          link(entry.definition.name, miniWorldChangeWikiUrl(entry.definition)),
          t(" — "),
          em(entry.definition.howToCheck ?? ""),
        ];
        // Forsaken keeps its picker here rather than losing it: looking is the only way to
        // settle which creature set is down the mine, so the answer belongs beside the
        // instruction to go and look — not in a clause claiming it as news.
        if (entry.definition.variants.length > 0) {
          line.push(t(" "), blankFor(entry));
        }
        return line;
      }),
    });
  }

  // ── What was ruled out ───────────────────────────────────────────────────
  // Nineteen facts of no interest, reduced to the one sentence they are worth.
  if (digest.mini.notRunning.length > 0) {
    stanzas.push({
      id: "quiet",
      heading: "Quiet today",
      lines: [
        [
          t(
            `${digest.mini.notRunning.length} other changes were on the board and are not running: `,
          ),
          // Each name links to its own article: individually of no interest today, but this
          // is the one place the full catalog is named, so it is worth being able to follow.
          ...digest.mini.notRunning.flatMap((entry, index) => [
            link(entry.definition.name, miniWorldChangeWikiUrl(entry.definition)),
            t(index === digest.mini.notRunning.length - 1 ? "." : ", "),
          ]),
        ],
      ],
    });
  }

  return stanzas;
}

/** True when there is nothing to read yet — drives the opening invitation. */
export function isDispatchEmpty(stanzas: DispatchStanza[]): boolean {
  return stanzas.length === 0;
}
