import type { ParsedBoardResult, ParsedMerchantHint, ParsedMiniWorldChangeSignal } from "@/types/parser";
import { BOARD_MESSAGES, WORLD_BOARD_PREAMBLE } from "./boardMessages";
import { normalizeForMatch } from "./textMatch";

const NORMALIZED_PREAMBLE = normalizeForMatch(WORLD_BOARD_PREAMBLE);

/**
 * Reads World Board text out of a pasted server log.
 *
 * The board prints one line per currently active Mini World Change, so each recognised line
 * proves that change is running — and, where the wording names one, which variant.
 *
 * The delicate part is the negative. Because the board is an exhaustive listing, a
 * *complete* reading also proves every unlisted change is not running. But that only holds
 * if we actually know the paste is complete, and the only honest evidence for that is the
 * board's own opening line. Matching a recognised message is emphatically NOT evidence: a
 * player who copies one interesting line has said nothing whatsoever about the other 23
 * changes, and treating that as a full reading would silently mark them all inactive.
 *
 * (This function used to do exactly that — `preamble || anyRecognisedEntry` — so a
 * one-line paste wiped the board. The completeness rule now matches what the type
 * documents.)
 */
export function parseBoardLog(rawText: string): ParsedBoardResult {
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

  return {
    signals,
    merchantHints,
    isCompleteReading: normalizedInput.includes(NORMALIZED_PREAMBLE),
  };
}
