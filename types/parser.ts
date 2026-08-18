import type { MiniWorldChangeState } from "./miniWorldChange";

/**
 * One thing the parser found in pasted game text. `state`/`detail` are omitted when the
 * source text confirms a change is active but doesn't carry enough detail to set an exact
 * value (e.g. the board says "Hive is active" but not which stage) — those surface as a
 * note the user resolves manually instead of a value we'd be guessing at.
 */
export interface ParsedSignal {
  miniWorldChangeId: string;
  label: string;
  matchedText: string;
  state: MiniWorldChangeState | null;
  detail: string;
  note: string | null;
}

/** A hint about a merchant that the source text doesn't fully disambiguate on its own. */
export interface ParsedMerchantHint {
  merchantId: "yasir" | "rashid";
  candidates: string[];
  matchedText: string;
}

export interface ParseResult {
  signals: ParsedSignal[];
  merchantHints: ParsedMerchantHint[];
  unmatchedLineCount: number;
}
