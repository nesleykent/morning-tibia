import type {
  ParsedMerchantHint,
  ParsedMiniWorldChangeSignal,
  ParsedWorldChangeSignal,
} from "@/types/parser";
import type { MerchantId } from "@/types/merchant";
import type { BoardEvidence, GuideEvidence } from "@/types/evidence";
import { parseBoardLog, type ParseBoardOptions } from "./parseBoardLog";
import { parseTowncryerLog } from "./parseTowncryerLog";
import { parseGuideLog } from "./parseGuideLog";
import { MINI_WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/miniWorldChanges";

/**
 * Checks one pasted block of text against all three in-game sources at once.
 *
 * Tibiopedia asks for the World Board log and the Guide NPC chat in two separate boxes.
 * Morning Tibia accepts one paste instead, which is strictly less work for the player and
 * costs nothing in accuracy: the three catalogs share no text, so a board line can never be
 * mistaken for a Guide reply or a Towncryer shout. Whatever the player copied out of their
 * client, they can drop it in.
 *
 * What each source is allowed to conclude stays strictly separate, though:
 *
 * - World Board  → Mini World Changes, and (only when the reading is *complete* — see
 *                  ParseBoardOptions) the negative that unlisted changes are not running.
 * - Towncryer    → Mini World Changes, positives only, but sometimes with a variant the
 *                  board doesn't give.
 * - Guide NPC    → World Changes only, positives only.
 *
 * So Guide text can never touch a Mini World Change, board text can never touch a World
 * Change, and nothing but a complete board reading can ever mark anything inactive.
 *
 * The result keeps `unknown` and `absent` apart all the way through (see types/evidence.ts):
 * what a source *did not mention* is only ever reported as absent when that source was
 * complete, and what nobody asked about is reported as nothing at all.
 */
export interface CombinedParseResult {
  miniWorldChangeSignals: ParsedMiniWorldChangeSignal[];
  worldChangeSignals: ParsedWorldChangeSignal[];
  merchantHints: ParsedMerchantHint[];
  /** Mini World Changes a complete board reading proves are not running. Empty otherwise. */
  inactiveMiniWorldChangeIds: string[];
  /** Merchants a complete board reading proves are not trading. Empty otherwise. */
  inactiveMerchantIds: MerchantId[];
  /** What the board paste was, and why we think so. */
  board: BoardEvidence;
  /** What the Guide replies established, and what they said that we could not read. */
  guide: GuideEvidence;
  /** Convenience alias for `board.completeness === "complete"`. */
  isCompleteBoardReading: boolean;
  /** True when nothing at all was recognised, so the UI can say so instead of silently doing nothing. */
  isEmpty: boolean;
}

export function parseGameText(
  rawText: string,
  options: ParseBoardOptions = {},
): CombinedParseResult {
  const board = parseBoardLog(rawText, options);
  const towncryer = parseTowncryerLog(rawText);
  const guide = parseGuideLog(rawText);

  // Merge the two Mini World Change sources. When both mention the same change, prefer the
  // signal that actually carries a variant — that is how a Towncryer shout fills in the
  // Jungle Camp faction the World Board leaves open, without either source overwriting the
  // other with less information.
  const byChangeId = new Map<string, ParsedMiniWorldChangeSignal>();
  for (const signal of [...board.signals, ...towncryer.signals]) {
    const existing = byChangeId.get(signal.changeId);
    if (!existing || (existing.variantId === null && signal.variantId !== null)) {
      byChangeId.set(signal.changeId, signal);
    }
  }
  const miniWorldChangeSignals = Array.from(byChangeId.values());

  const inactiveMiniWorldChangeIds: string[] = [];
  const inactiveMerchantIds: MerchantId[] = [];

  if (board.isCompleteReading) {
    // Only the board's own listing licenses a negative, and even then only for changes the
    // board is capable of reporting. A silent change (Beaver Breakout, Shipwrecked) is
    // absent from every board reading ever printed, so its absence is not evidence — and an
    // always-active one (Forsaken) is never "not running" at all. Treating either as
    // inactive would be the app inventing certainty out of a source's silence.
    //
    // A Towncryer shout in the same paste can add a change but never subtract one, so
    // `byChangeId` (not just board.signals) is the right exclusion set.
    for (const def of MINI_WORLD_CHANGE_DEFINITIONS) {
      if (def.detection !== "announced") continue;
      if (!byChangeId.has(def.id)) inactiveMiniWorldChangeIds.push(def.id);
    }

    const yasirSeen = [...board.merchantHints, ...towncryer.merchantHints].some(
      (hint) => hint.merchantId === "yasir",
    );
    if (!yasirSeen) inactiveMerchantIds.push("yasir");
  }

  const merchantHints = [...board.merchantHints, ...towncryer.merchantHints].filter(
    (hint, index, all) => all.findIndex((h) => h.merchantId === hint.merchantId) === index,
  );

  return {
    miniWorldChangeSignals,
    worldChangeSignals: guide.signals,
    merchantHints,
    inactiveMiniWorldChangeIds,
    inactiveMerchantIds,
    board: {
      completeness: board.isCompleteReading ? "complete" : "partial",
      basis: board.completenessBasis,
      recognisedCount: board.recognisedCount,
    },
    guide: {
      answeredChangeIds: guide.signals.map((signal) => signal.changeId),
      unrecognisedReplies: guide.unrecognisedReplies,
    },
    isCompleteBoardReading: board.isCompleteReading,
    isEmpty:
      miniWorldChangeSignals.length === 0 &&
      guide.signals.length === 0 &&
      guide.unrecognisedReplies.length === 0 &&
      merchantHints.length === 0 &&
      !board.isCompleteReading,
  };
}
