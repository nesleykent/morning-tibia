import type { ParsedMerchantHint, ParsedSignal } from "@/types/parser";
import { parseBoardLog } from "./parseBoardLog";
import { parseGuideLog } from "./parseGuideLog";

/**
 * Mini World Changes (World Board) and World Changes (Guide NPC) are two distinct game
 * mechanics with disjoint catalogs of source text — a board message never collides with a
 * Guide NPC reply. That lets a single pasted block of text (server log, chat log, or a mix
 * of both copy-pasted together) be checked against both catalogs at once, so the user
 * doesn't have to split their paste across two tabs.
 */
export interface CombinedParseResult {
  miniWorldChangeSignals: ParsedSignal[];
  worldChangeSignals: ParsedSignal[];
  merchantHints: ParsedMerchantHint[];
  unmatchedLineCount: number;
  /** Only the board half of the paste can ever be a complete snapshot — see parseBoardLog. */
  isCompleteSnapshot: boolean;
  inactiveMerchantIds: ParsedMerchantHint["merchantId"][];
}

export function parseGameText(rawText: string): CombinedParseResult {
  const board = parseBoardLog(rawText);
  const guide = parseGuideLog(rawText);

  const totalLines = rawText.split("\n").filter((line) => line.trim().length > 0).length;
  const matchedCount = board.signals.length + board.merchantHints.length + guide.signals.length;

  return {
    miniWorldChangeSignals: board.signals,
    worldChangeSignals: guide.signals,
    merchantHints: board.merchantHints,
    unmatchedLineCount: Math.max(0, totalLines - matchedCount),
    isCompleteSnapshot: board.isCompleteSnapshot,
    inactiveMerchantIds: board.inactiveMerchantIds,
  };
}
