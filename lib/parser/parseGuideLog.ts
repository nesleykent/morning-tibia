import type { ParseResult, ParsedSignal } from "@/types/parser";
import { MINI_WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/miniWorldChanges";
import { GUIDE_MESSAGES } from "./guideMessages";
import { normalizeForMatch } from "./textMatch";

const LABEL_BY_ID = new Map(MINI_WORLD_CHANGE_DEFINITIONS.map((def) => [def.id, def.label]));

/**
 * Matches a pasted Guide NPC chat log against the known catalog of Guide reply text
 * (see guideMessages.ts) using substring matching on normalized text. If a keyword's
 * reply changed between when the world changed and when it settled (e.g. asking twice),
 * the LAST matching entry per Mini World Change wins, since it appears later in the log.
 */
export function parseGuideLog(rawText: string): ParseResult {
  const normalizedInput = normalizeForMatch(rawText);
  const bestById = new Map<string, ParsedSignal>();
  let matchedCount = 0;

  for (const entry of GUIDE_MESSAGES) {
    const normalizedEntry = normalizeForMatch(entry.text);
    const index = normalizedInput.indexOf(normalizedEntry);
    if (index === -1) continue;
    matchedCount += 1;

    const existing = bestById.get(entry.miniWorldChangeId);
    if (existing && existing.matchedText.length >= 0) {
      const existingIndex = normalizedInput.indexOf(normalizeForMatch(existing.matchedText));
      if (existingIndex > index) continue; // keep the later occurrence
    }

    bestById.set(entry.miniWorldChangeId, {
      miniWorldChangeId: entry.miniWorldChangeId,
      label: LABEL_BY_ID.get(entry.miniWorldChangeId) ?? entry.miniWorldChangeId,
      matchedText: entry.text,
      state: entry.state,
      detail: entry.detail ?? "",
      note: null,
    });
  }

  const totalLines = rawText.split("\n").filter((line) => line.trim().length > 0).length;

  return {
    signals: Array.from(bestById.values()),
    merchantHints: [],
    unmatchedLineCount: Math.max(0, totalLines - matchedCount),
  };
}
