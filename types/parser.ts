import type { MerchantId } from "./merchant";

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
  /**
   * True only when the paste contains the World Board's own fixed opening line
   * ("This board will notify you of currently active mini world changes all over Tibia."),
   * which is the one thing that identifies the text as a whole board reading rather than a
   * fragment someone copied a couple of lines out of.
   *
   * This is the ONLY thing that licenses marking unmentioned changes inactive, and it is
   * never inferred from the presence of some recognised message — a player who pastes a
   * single line has told us nothing about the other 23 changes. It is deliberately a
   * conservative test: a genuine full reading whose first line was trimmed off is treated
   * as a fragment, which loses a little convenience but cannot wrongly clear a change the
   * player would then miss.
   */
  isCompleteReading: boolean;
}

export interface ParsedTowncryerResult {
  signals: ParsedMiniWorldChangeSignal[];
  merchantHints: ParsedMerchantHint[];
}

export interface ParsedGuideResult {
  signals: ParsedWorldChangeSignal[];
}
