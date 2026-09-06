import type { ParsedMerchantHint, ParsedMiniWorldChangeSignal, ParsedTowncryerResult } from "@/types/parser";
import { TOWNCRYER_MESSAGES } from "./towncryerMessages";
import { normalizeForMatch } from "./textMatch";

/**
 * Reads Towncryer shouts out of a pasted log.
 *
 * A shout proves one Mini World Change is running, and for Jungle Camp, Poacher Caves,
 * Nightmare Isles and Spirit Grounds it also names the variant — for Jungle Camp that is
 * the only way to learn the winning faction without walking to Tiquanda.
 *
 * There is no completeness concept here, by design. The Towncryer announces changes one at
 * a time as he walks his route; a log that mentions him once says nothing about the other
 * 23 changes. So this parser only ever produces positive signals, and nothing it returns
 * can mark anything inactive.
 */
export function parseTowncryerLog(rawText: string): ParsedTowncryerResult {
  const normalizedInput = normalizeForMatch(rawText);
  const signals: ParsedMiniWorldChangeSignal[] = [];
  const merchantHints: ParsedMerchantHint[] = [];

  for (const entry of TOWNCRYER_MESSAGES) {
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
      source: "towncryer",
    });
  }

  return { signals, merchantHints };
}
