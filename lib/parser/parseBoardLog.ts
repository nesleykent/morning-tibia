import type { ParsedBoardResult, ParsedMerchantHint, ParsedMiniWorldChangeSignal } from "@/types/parser";
import type { BoardCompletenessBasis } from "@/types/evidence";
import { BOARD_MESSAGES, WORLD_BOARD_PREAMBLE } from "./boardMessages";
import { normalizeForMatch } from "./textMatch";

const NORMALIZED_PREAMBLE = normalizeForMatch(WORLD_BOARD_PREAMBLE);

/**
 * Reads World Board text out of a pasted server log.
 *
 * The board prints one line per currently active Mini World Change, so each recognised line
 * proves that change is running, and, where the wording names one, which variant.
 *
 * The delicate part is the negative. Because the board is an exhaustive listing, a reading of
 * it also proves every unlisted change is not running. That turns on a fact about the game
 * rather than about the text: **using the board writes the whole current listing into the
 * Server Log in one go.** There is no in-game action that produces a partial listing, so any
 * text carrying a recognised board message came from a complete reading, and it can settle
 * absences.
 *
 * This replaced a model that required the reader to tick "this is the whole board". That was
 * built on the belief that a paste might be a fragment someone had cherry-picked, which is not
 * a workflow the game offers: the player clicks the board, the log fills, they copy it. The
 * tick asked for a fact the reader had no way to get wrong and no reason to think about, and
 * left every unticked paste unable to rule anything out.
 *
 * What still cannot settle an absence is text that is not a board reading at all. A Guide
 * reply answers one keyword and says nothing about the rest; a Towncryer shout announces one
 * change as he walks his route and is not a listing. Neither produces a recognised board
 * message, so neither reaches `completenessBasis` and neither can mark anything absent.
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

  const hasPreamble = normalizedInput.includes(NORMALIZED_PREAMBLE);
  const recognisedCount = signals.length + merchantHints.length;

  // The preamble still counts on its own, and it is the only thing that can: a board with
  // nothing running prints no messages, so an empty reading has nothing else to identify it
  // by. Otherwise a recognised message is the marker, because a message only reaches the
  // Server Log by way of a whole reading.
  const basis: BoardCompletenessBasis = hasPreamble
    ? "preamble"
    : recognisedCount > 0
      ? "recognised"
      : "none";

  return {
    signals,
    merchantHints,
    recognisedCount,
    completenessBasis: basis,
    isCompleteReading: basis !== "none",
  };
}
