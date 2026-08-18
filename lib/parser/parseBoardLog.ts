import type { ParseResult, ParsedMerchantHint, ParsedSignal } from "@/types/parser";
import { MINI_WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/miniWorldChanges";
import { BOARD_MESSAGES } from "./boardMessages";
import { normalizeForMatch } from "./textMatch";

const LABEL_BY_ID = new Map(MINI_WORLD_CHANGE_DEFINITIONS.map((def) => [def.id, def.label]));

/**
 * Matches pasted World Board text (copied from the Adventurer's Island board, or a
 * server log containing it) against the known catalog of board messages. Uses plain
 * substring matching against normalized text rather than regex — the messages are long,
 * distinctive sentences, so exact-substring is both simpler and safer than pattern
 * matching here.
 */
export function parseBoardLog(rawText: string): ParseResult {
  const normalizedInput = normalizeForMatch(rawText);
  const signals: ParsedSignal[] = [];
  const merchantHints: ParsedMerchantHint[] = [];
  let matchedCount = 0;

  for (const entry of BOARD_MESSAGES) {
    const normalizedEntry = normalizeForMatch(entry.text);
    if (!normalizedEntry || !normalizedInput.includes(normalizedEntry)) continue;
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
      note: entry.note ?? null,
    });
  }

  const totalLines = rawText.split("\n").filter((line) => line.trim().length > 0).length;

  return {
    signals,
    merchantHints,
    unmatchedLineCount: Math.max(0, totalLines - matchedCount),
  };
}
