import type { DailyDigest, MiniWorldChangeEntry } from "@/lib/dashboard/dailyDigest";
import type { Merchant } from "@/types/merchant";

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

export function composeDispatch(
  digest: DailyDigest,
  merchants: Record<string, Merchant>,
): DispatchStanza[] {
  const stanzas: DispatchStanza[] = [];

  // ── What is happening ────────────────────────────────────────────────────
  const running = [...digest.mini.needsVariant, ...digest.mini.running].filter(
    (e, i, all) => all.findIndex((x) => x.definition.id === e.definition.id) === i,
  );

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
  const guideLines = digest.world.noteworthy.map((entry) => [
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
        options: [
          { id: "Carlin", label: "Carlin" },
          { id: "Liberty Bay", label: "Liberty Bay" },
          { id: "Ankrahmun", label: "Ankrahmun" },
        ],
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
  if (digest.mini.silent.length > 0) {
    stanzas.push({
      id: "silent",
      heading: "Nothing announces these",
      lines: digest.mini.silent.map((entry) => [
        t(`${entry.definition.name} — `),
        em(entry.definition.howToCheck ?? ""),
      ]),
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
          em(digest.mini.notRunning.map((e) => e.definition.name).join(", ") + "."),
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
