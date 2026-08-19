import type { MiniWorldChangeState } from "./miniWorldChange";
import type { MerchantId } from "./merchant";

/**
 * One thing the parser found in pasted game text. `state` carries whatever the source text
 * actually establishes — including "active" for a change the board confirms is happening
 * but doesn't pinpoint an exact location/stage for (the detail then stays pending until the
 * player supplies it, or a later complete board reading marks it inactive again).
 */
export interface ParsedSignal {
  /** id of a MiniWorldChangeDefinition (board parser) or WorldChangeDefinition (guide parser). */
  changeId: string;
  label: string;
  matchedText: string;
  state: MiniWorldChangeState | null;
  detail: string;
}

/** A hint about a merchant that the source text doesn't fully disambiguate on its own. */
export interface ParsedMerchantHint {
  merchantId: MerchantId;
  candidates: string[];
  matchedText: string;
}

export interface ParseResult {
  signals: ParsedSignal[];
  merchantHints: ParsedMerchantHint[];
  unmatchedLineCount: number;
  /**
   * True only when the pasted text was confidently recognized as a genuine, complete
   * World Board reading (via the board's own fixed preamble text) — never inferred from a
   * fragmentary paste. Only ever set by the board parser; the Guide NPC parser (an
   * individual per-keyword query, not a full-board listing) always reports false, since
   * absence there never implies inactivity.
   */
  isCompleteSnapshot: boolean;
  /**
   * Merchant ids whose only evidence source is this complete board reading and who went
   * unmentioned in it — safe to treat as confirmed inactive. Always empty unless
   * isCompleteSnapshot is true.
   */
  inactiveMerchantIds: MerchantId[];
}
