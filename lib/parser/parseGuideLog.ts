import type { ParsedGuideResult, ParsedWorldChangeSignal } from "@/types/parser";
import { GUIDE_MESSAGES } from "./guideMessages";
import { normalizeForMatch } from "./textMatch";

/**
 * Reads Guide NPC replies out of a pasted chat log.
 *
 * A Guide answers one keyword at a time, so this can only ever establish the state of the
 * World Changes actually asked about. Absence of a keyword means the player didn't ask —
 * never that nothing is happening — so this parser has no completeness concept at all and
 * can never mark anything unchecked or inactive.
 *
 * If a log contains the same World Change twice (asked at the start of a session and again
 * later, across a server save), the LAST reply wins, since that is the more recent truth.
 */
export function parseGuideLog(rawText: string): ParsedGuideResult {
  const normalizedInput = normalizeForMatch(rawText);
  const bestById = new Map<string, { signal: ParsedWorldChangeSignal; index: number }>();

  for (const entry of GUIDE_MESSAGES) {
    const normalizedEntry = normalizeForMatch(entry.text);
    if (!normalizedEntry) continue;

    // lastIndexOf: if the same reply appears twice, anchor on the later occurrence.
    const index = normalizedInput.lastIndexOf(normalizedEntry);
    if (index === -1) continue;

    const existing = bestById.get(entry.changeId);
    if (existing && existing.index >= index) continue;

    bestById.set(entry.changeId, {
      index,
      signal: {
        changeId: entry.changeId,
        stateId: entry.stateId,
        matchedText: entry.text,
      },
    });
  }

  return { signals: Array.from(bestById.values(), (v) => v.signal) };
}
