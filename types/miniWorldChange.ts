/**
 * A Mini World Change: one of the short, randomly-occurring world states Tibia rotates
 * through. They cannot be triggered by players, come with no warning, and last a few hours.
 *
 * Two sources *announce* them, and they carry different amounts of information:
 *
 * - **The World Board** (Adventurer's Guild floor +1, near Charos) prints one line per
 *   currently active change into the server log. Because it is a listing, a *complete*
 *   reading also proves which announced changes are NOT running.
 * - **The Towncryer** (Thais, around the depot and docks) shouts one change at a time. It
 *   is an announcement, never a listing, so it can only ever prove a change IS running.
 *   For Jungle Camp it is the only source that names the winning faction.
 *
 * Crucially, **not every Mini World Change is announced at all.** TibiaWiki BR documents
 * *mini world changes silenciosas* — silent ones — which neither source can report, so the
 * player has to go and look. Modelling every change as announced would make a complete
 * board reading appear to prove they are not running, which is exactly the kind of false
 * certainty this app must never produce. See `MiniWorldChangeDetection`.
 *
 * This is a different game mechanic from "World Changes" (types/worldChange.ts), which are
 * player-influenced, longer-running, and checked by asking a Guide NPC a keyword. Do not
 * merge the two lists.
 */

/**
 * How — and whether — a player can find out that this change is running.
 *
 * - `announced`    — the World Board lists it and the Towncryer shouts it. Absence from a
 *                    complete board reading is real evidence it is not running.
 * - `silent`       — **no** source reports it (TibiaWiki BR: "mini world change
 *                    silenciosa, portanto é necessário checar pessoalmente"). Absence from
 *                    the board proves nothing whatsoever, because the board could never
 *                    have mentioned it. Only going to look — or, for Shipwrecked, a map
 *                    revealed by the Measuring Tibia Quest — can settle it.
 * - `always-active` — the change never stops; what rotates is *which* variant is in effect
 *                    (the Forsaken Mine's creature set changes each server save). "Not
 *                    running" is not a state it has, so the only open question is which
 *                    variant, and only looking answers it.
 */
export type MiniWorldChangeDetection = "announced" | "silent" | "always-active";

/**
 * What the player actually knows about a Mini World Change right now. These are knowledge
 * states, not game states — the game itself only has "running" or "not running".
 *
 * - `unchecked`  — no evidence at all this session. Never rendered as "inactive".
 * - `inactive`   — a COMPLETE World Board reading did not mention it. This is the only
 *                  evidence that can prove a negative; a Towncryer shout or a partial
 *                  board paste can never produce it.
 * - `active`     — confirmed running. If the change has `variants`, `variantId` says which
 *                  one, or stays null when the source didn't reveal it (e.g. the board
 *                  announces a Fury Gate without naming the city).
 */
export type MiniWorldChangeStatus = "unchecked" | "inactive" | "active";

/**
 * What a variant *means* for a given change, so the UI and briefing can word it correctly
 * ("open near Thais" vs "the Dworcs dominate" vs "poachers dominate the area").
 */
export type MiniWorldChangeVariantKind = "location" | "faction" | "phase";

/**
 * What a change's `contents` are a set of. One value today, and the field exists so a second
 * change with a second axis has somewhere to say what its axis means.
 */
export type MiniWorldChangeContentKind = "creature-set";

export interface MiniWorldChangeVariant {
  id: string;
  label: string;
}

/**
 * One thing a player can see when they go and look at a `silent` change.
 *
 * Silent changes are the only ones a player can settle *only* with their own eyes, and the
 * app used to ask them for the answer in its own vocabulary: a "Running" button and a "No"
 * button. Nobody stands on the Krailos steppe deciding whether the change is "running". They
 * see a wrecked ship, or they see an empty coastline. These are those two sights, written the
 * way the player would describe them.
 *
 * `establishes` is the whole mapping. A silent change is binary — TibiaWiki BR documents no
 * stages for either of the two — so the sight the player reports determines the knowledge
 * state exactly, and nothing extra needs storing: `status` alone says which observation was
 * made. See `observations` on the definition.
 */
export interface MiniWorldChangeObservation {
  id: string;
  /** What the player sees, in the words they would use for it. */
  label: string;
  /** The knowledge state that seeing this establishes. */
  establishes: Extract<MiniWorldChangeStatus, "active" | "inactive">;
}

export interface MiniWorldChangeDefinition {
  id: string;
  /** Canonical TibiaWiki Mini World Change name. */
  name: string;
  /**
   * Override for the TibiaWiki article title, when it isn't `<name> Mini World Change`.
   * Explicit `null` means no English article exists and the UI must show no link — see
   * lib/utils/tibiaWiki.ts for why this is never derived from `name` alone.
   */
  wikiTitle?: string | null;
  shortLabel: string;
  emoji: string;
  /** Where it happens, per TibiaWiki's own Location field. */
  location: string;
  /**
   * The places the daily bulletin names, one entry per distinct place.
   *
   * `location` is written for the catalog page, where a full sentence of orientation is
   * welcome — "Reached via Darama, Ghostlands or Vengoth". In a bulletin the place rides on
   * the change's own name, read at a glance, and those English connectives are the one place
   * English prose leaks into a Portuguese message.
   *
   * Every entry is a strict shortening of `location`: the same places, with the orientation
   * removed. Never a place the catalog does not already name. Omitted wherever `location` is
   * already just a place, which the renderer falls back to as a single entry.
   *
   * A **list**, because the bulletin punctuates independent places and one place's own name
   * differently: the renderer joins these with semicolons, so Horse Station's two ends of the
   * Thaian road read `(Thais; Venore)` while the lake that a comma merely locates stays
   * `(Lake Equivocolao, Port Hope)`. A single string could not tell the two apart, and the
   * catalog is the only place that knows which it is.
   */
  briefingLocations?: readonly string[];
  /**
   * Set when the variant *is* the place, rather than a spot inside a place the change always
   * occupies. Spirit Grounds is the only one: its gate opens in Darama, the Ghostlands or
   * Vengoth, which are three different corners of the world, so `briefingLocations` can only
   * honestly hold all three and the bulletin must narrow to the one the board named. Contrast
   * Nightmare Isles, whose three portal spots are all in Kha'labal, and Fury Gates, which
   * always leads to the same Fury Dungeon whichever city the gate is in — for those the fixed
   * region stays right whether or not anyone has named the variant.
   */
  variantIsBriefingLocation?: boolean;
  /**
   * The closed set of forms this change can take. Empty for a plain on/off change (most of
   * them) — an empty list means "it's either running or it isn't", with nothing further to
   * pin down, so the UI must not offer a choice.
   */
  variants: readonly MiniWorldChangeVariant[];
  variantKind: MiniWorldChangeVariantKind | null;
  /**
   * A second closed set, independent of `variants`, for a change that has two unknowns rather
   * than one.
   *
   * Spirit Grounds is the case this exists for, and it is not a modelling nicety: TibiaWiki
   * states plainly that "although there are 3 portals and 3 hunting grounds, they do not
   * correspond", so knowing the gate is in Ghostlands tells you nothing about whether the
   * ground behind it holds Ghouls or Phantasms. One slot could hold one of those facts and
   * would have to throw the other away: the board and the Towncryer both name the gate, so
   * `variants` keeps it, and what is inside has nowhere else to live.
   *
   * The two axes differ in kind as well as in value. A gate is announced; what is behind it is
   * announced by nothing at all, so `contents` is settled only by going and looking, the same
   * way an `observations` answer is.
   */
  contents?: readonly MiniWorldChangeVariant[];
  contentKind?: MiniWorldChangeContentKind;
  /** Whether any in-game source announces this change at all — see the type's docs. */
  detection: MiniWorldChangeDetection;
  /**
   * For `silent` and `always-active` changes: how the player actually finds out, in one
   * short sentence. The UI shows this instead of pretending a paste could settle it.
   */
  howToCheck?: string;
  /**
   * The sights a player can come back with, for a `silent` change. Exactly two, because both
   * documented silent changes are binary: the beavers are out or they are penned; the wreck
   * is on the coast or the coast is clear.
   *
   * Present only where `detection === "silent"`. An announced change is settled by a board
   * reading and an always-active one is never off, so neither has anything to observe.
   */
  observations?: readonly MiniWorldChangeObservation[];
  /** True when the World Board's own message text names which variant is running. */
  boardNamesVariant: boolean;
  /** True when the Towncryer's shout names which variant is running. */
  towncryerNamesVariant: boolean;
  description: string;
  /**
   * Extra player-facing context that is genuinely useful but is NOT a state the app can
   * know — e.g. Noodles' known server-save spawn points. Kept out of `variants` on purpose
   * so it can never be mistaken for something the player has confirmed.
   */
  reference?: readonly string[];
}

export interface MiniWorldChangeValue {
  id: string;
  status: MiniWorldChangeStatus;
  /** Only meaningful while `status === "active"`; null means "active, variant unknown". */
  variantId: string | null;
  /**
   * Which of the definition's `contents` is inside, for the one change that has them. Null is
   * the normal state rather than an error: nothing announces it.
   *
   * Optional because a value written to localStorage before this field existed parses back
   * without it, and a stored day should keep working across a deploy.
   */
  contentId?: string | null;
  updatedAt: string | null;
}
