import type { MerchantId } from "./merchant";
import type { BoardCompletenessBasis } from "./evidence";

/**
 * One Mini World Change the pasted text proves is currently running.
 *
 * There is no "inactive" signal here on purpose: no single message can ever say a change is
 * NOT running. Inactivity is only ever derived, at the parse-result level, from a complete
 * World Board reading — see `ParsedBoardResult.isCompleteReading`.
 */
export interface ParsedMiniWorldChangeSignal {
  changeId: string;
  /** The variant the source named, or null when the source confirms activity without it. */
  variantId: string | null;
  matchedText: string;
  source: "board" | "towncryer";
}

/** One World Change state a Guide NPC reply establishes. */
export interface ParsedWorldChangeSignal {
  changeId: string;
  stateId: string;
  matchedText: string;
}

/** A merchant the text places somewhere, without necessarily disambiguating where. */
export interface ParsedMerchantHint {
  merchantId: MerchantId;
  candidates: string[];
  matchedText: string;
}

export interface ParsedBoardResult {
  signals: ParsedMiniWorldChangeSignal[];
  merchantHints: ParsedMerchantHint[];
  /** Board messages (and merchant hints) recognised in the paste, for the receipt. */
  recognisedCount: number;
  /**
   * Why this counts as a whole board reading, or `"none"` for a fragment. See
   * `BoardCompletenessBasis`: either the board's own opening line is present, or the reader
   * declared the paste complete.
   *
   * Completeness is the ONLY thing that licenses marking unmentioned changes inactive, and it
   * is never inferred from the presence of some recognised message — a player who pastes a
   * single line has told us nothing about the other changes.
   */
  completenessBasis: BoardCompletenessBasis;
  /** Convenience for `completenessBasis !== "none"`. */
  isCompleteReading: boolean;
}

export interface ParsedTowncryerResult {
  signals: ParsedMiniWorldChangeSignal[];
  merchantHints: ParsedMerchantHint[];
}

export interface ParsedGuideResult {
  signals: ParsedWorldChangeSignal[];
  /**
   * Lines that are unmistakably a Guide NPC speaking but whose wording is not in the catalog.
   * Kept so a reply the app cannot read is reported as unread rather than vanishing — the
   * difference between "the Guide said nothing about this" and "we could not parse what the
   * Guide said" matters to anyone deciding whether to trust the briefing.
   */
  unrecognisedReplies: string[];
}
