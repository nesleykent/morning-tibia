import type { ParseResult, ParsedMerchantHint, ParsedSignal } from "@/types/parser";
import { MINI_WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/miniWorldChanges";
import { BOARD_MESSAGES } from "./boardMessages";
import { normalizeForMatch } from "./textMatch";

const LABEL_BY_ID = new Map(
  MINI_WORLD_CHANGE_DEFINITIONS.map((def) => [def.id, def.label]),
);

const WORLD_BOARD_PREAMBLE =
  "You see the world board. This board will notify you of currently active mini world changes all over Tibia.";

const NORMALIZED_PREAMBLE = normalizeForMatch(WORLD_BOARD_PREAMBLE);

/**
 * Matches World Board text against the canonical board-message catalog.
 *
 * A paste containing at least one recognized World Board entry represents the
 * current board reading. The World Board lists active Mini World Changes only,
 * therefore every catalog entry absent from that reading is inactive.
 *
 * This rule is independent of client timestamps. The official board preamble
 * also identifies a complete reading, including the valid case where no Mini
 * World Change is currently active.
 */
export function parseBoardLog(rawText: string): ParseResult {
  const normalizedInput = normalizeForMatch(rawText);
  const signals: ParsedSignal[] = [];
  const merchantHints: ParsedMerchantHint[] = [];
  let matchedCount = 0;

  for (const entry of BOARD_MESSAGES) {
    const normalizedEntry = normalizeForMatch(entry.text);

    if (!normalizedEntry || !normalizedInput.includes(normalizedEntry)) {
      continue;
    }

    matchedCount += 1;

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
      label: LABEL_BY_ID.get(entry.changeId) ?? entry.changeId,
      matchedText: entry.text,
      state: entry.state ?? null,
      detail: entry.detail ?? "",
    });
  }

  const hasRecognizedBoardEntry =
    signals.length > 0 || merchantHints.length > 0;

  const isCompleteSnapshot =
    normalizedInput.includes(NORMALIZED_PREAMBLE) ||
    hasRecognizedBoardEntry;

  const inactiveMerchantIds: ParseResult["inactiveMerchantIds"] = [];

  if (isCompleteSnapshot) {
    const seenChangeIds = new Set(
      signals.map((signal) => signal.changeId),
    );

    for (const def of MINI_WORLD_CHANGE_DEFINITIONS) {
      if (seenChangeIds.has(def.id)) continue;

      signals.push({
        changeId: def.id,
        label: def.label,
        matchedText: "",
        state: "inactive",
        detail: "",
      });
    }

    const yasirIsActive = merchantHints.some(
      (hint) => hint.merchantId === "yasir",
    );

    if (!yasirIsActive) {
      inactiveMerchantIds.push("yasir");
    }
  }

  const totalLines = rawText
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .length;

  return {
    signals,
    merchantHints,
    unmatchedLineCount: Math.max(0, totalLines - matchedCount),
    isCompleteSnapshot,
    inactiveMerchantIds,
  };
}
