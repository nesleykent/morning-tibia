/**
 * A Mini World Change: one of the 24 short, randomly-occurring world states Tibia rotates
 * through (TibiaWiki, "Mini World Changes"). They cannot be triggered by players, come
 * with no warning, and last a few hours.
 *
 * A player has exactly two documented ways to learn about them, and Morning Tibia models
 * both because they carry *different* amounts of information:
 *
 * - **The World Board** (Adventurer's Guild floor +1, near Charos) prints one line per
 *   currently active MWC into the server log. Because it is a listing, a *complete*
 *   reading also proves which changes are NOT active.
 * - **The Towncryer** (Thais, around the depot and docks) shouts one MWC at a time. It is
 *   an announcement, never a listing, so it can only ever prove that one change is active
 *   — silence about the other 23 means nothing. For two changes (Jungle Camp, and the
 *   Nightmare Isles/Spirit Grounds wording) the shout actually reveals *more* than the
 *   board does.
 *
 * This is a different game mechanic from "World Changes" (types/worldChange.ts), which are
 * player-influenced, longer-running, and checked by asking a Guide NPC a keyword. Do not
 * merge the two lists.
 */

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

export interface MiniWorldChangeVariant {
  id: string;
  label: string;
}

export interface MiniWorldChangeDefinition {
  id: string;
  /** Canonical TibiaWiki Mini World Change name. */
  name: string;
  shortLabel: string;
  emoji: string;
  /** Where it happens, per TibiaWiki's own Location field. */
  location: string;
  /**
   * The closed set of forms this change can take. Empty for a plain on/off change (most of
   * them) — an empty list means "it's either running or it isn't", with nothing further to
   * pin down, so the UI must not offer a choice.
   */
  variants: readonly MiniWorldChangeVariant[];
  variantKind: MiniWorldChangeVariantKind | null;
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
  updatedAt: string | null;
}
