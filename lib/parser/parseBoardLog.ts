import type { ParsedBoardResult, ParsedMerchantHint, ParsedMiniWorldChangeSignal } from "@/types/parser";
import type { BoardCompletenessBasis } from "@/types/evidence";
import { BOARD_MESSAGES, WORLD_BOARD_PREAMBLE } from "./boardMessages";
import { normalizeForMatch } from "./textMatch";

const NORMALIZED_PREAMBLE = normalizeForMatch(WORLD_BOARD_PREAMBLE);

export interface ParseBoardOptions {
  /**
   * The reader has said this paste is the whole board.
   *
   * Necessary, not a convenience — and the alternatives were checked before adding it:
   *
   * 1. **The workflow does not know.** Morning Tibia's single input is one free-form box, and
   *    the on-screen instructions are explicitly "paste whatever they told you… in any
   *    combination". A paste may hold a board reading, Guide replies and a Towncryer shout at
   *    once, or a fragment of any of them. Nothing in that flow separates "here is my board
   *    consultation" from "here are the two lines I found interesting", because the product
   *    deliberately never asked the reader to keep them apart.
   * 2. **The text does not say either.** The one marker that would settle it — the opening
   *    line quoted below — is the board object's *look* text and does not travel with the
   *    messages the board prints into the Server Log. Both real logs kept as fixtures in this
   *    repo (2026-08-19 and 2026-09-10) are missing it, which is why preamble-only detection
   *    meant a genuinely complete reading was permanently indistinguishable from a fragment
   *    and nothing could ever be ruled out.
   * 3. **Inferring it from shape is the banned heuristic.** "Seven recognised board lines
   *    therefore a whole board" cannot tell a complete seven-line board from seven lines
   *    copied out of a longer log, and getting it wrong marks twenty-odd changes and Yasir as
   *    confirmed-absent on no evidence — silently, and in the direction that makes a reader
   *    miss something.
   *
   * So the fact lives with the only party that holds it. Automatic detection is still
   * preferred wherever it exists: the preamble alone settles completeness with no tick, and
   * `completenessBasis` records which of the two answered. Leaving the box unticked keeps a
   * paste UNKNOWN rather than guessing, so nothing here can weaken that distinction.
   */
  declaredComplete?: boolean;
}

/**
 * Reads World Board text out of a pasted server log.
 *
 * The board prints one line per currently active Mini World Change, so each recognised line
 * proves that change is running — and, where the wording names one, which variant.
 *
 * The delicate part is the negative. Because the board is an exhaustive listing, a *complete*
 * reading also proves every unlisted change is not running. But that only holds if we actually
 * know the paste is complete, and matching a recognised message is emphatically NOT evidence
 * of that: a player who copies one interesting line has said nothing whatsoever about the
 * other changes, and treating that as a full reading would silently mark them all inactive.
 *
 * (This function used to do exactly that — `preamble || anyRecognisedEntry`.) Completeness now
 * comes from one of exactly two things, both recorded in `completenessBasis`: the board's own
 * opening line, or the reader saying so. Never from the shape of the text.
 */
export function parseBoardLog(rawText: string, options: ParseBoardOptions = {}): ParsedBoardResult {
  const normalizedInput = normalizeForMatch(rawText);
  const signals: ParsedMiniWorldChangeSignal[] = [];
  const merchantHints: ParsedMerchantHint[] = [];

  for (const entry of BOARD_MESSAGES) {
    const normalizedEntry = normalizeForMatch(entry.text);
    if (!normalizedEntry || !normalizedInput.includes(normalizedEntry)) continue;

    if (entry.merchantHint) {
      merchantHints.push({
        merchantId: entry.merchantHint.merchantId,
        candidates: entry.merchantHint.candidates,
        matchedText: entry.text,
      });
      continue;
    }

    if (!entry.changeId) continue;

    signals.push({
      changeId: entry.changeId,
      variantId: entry.variantId ?? null,
      matchedText: entry.text,
      source: "board",
    });
  }

  const hasPreamble = normalizedInput.includes(NORMALIZED_PREAMBLE);

  // The declaration is honoured on its own, with no "…but only if the text looks board-ish"
  // guard. A board with nothing running prints no messages at all, and that empty reading is
  // precisely when ruling changes out is worth most; a guard would make the one case the
  // feature exists for the one case it refuses to handle.
  const basis: BoardCompletenessBasis = hasPreamble
    ? "preamble"
    : options.declaredComplete
      ? "declared"
      : "none";

  return {
    signals,
    merchantHints,
    recognisedCount: signals.length + merchantHints.length,
    completenessBasis: basis,
    isCompleteReading: basis !== "none",
  };
}
