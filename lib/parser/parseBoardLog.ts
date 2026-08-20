import type { ParseResult, ParsedMerchantHint, ParsedSignal } from "@/types/parser";
import { MINI_WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/miniWorldChanges";
import { BOARD_MESSAGES } from "./boardMessages";
import { normalizeForMatch } from "./textMatch";

const LABEL_BY_ID = new Map(MINI_WORLD_CHANGE_DEFINITIONS.map((def) => [def.id, def.label]));

/**
 * The World Board's own fixed opening line (TibiaWiki, "The World Board"). Its presence is
 * the one safe signal that a paste is a genuine, complete board reading rather than a
 * fragment — only then is it correct to infer that an unmentioned Mini World Change (or
 * Yasir, via the Oriental Trader message) is currently inactive.
 */
const WORLD_BOARD_PREAMBLE =
  "You see the world board. This board will notify you of currently active mini world changes all over Tibia.";
const NORMALIZED_PREAMBLE = normalizeForMatch(WORLD_BOARD_PREAMBLE);

const SERVER_LOG_TIMESTAMP_RE = /^(\d{1,2}:\d{2}:\d{2})\s+/;

/**
 * Tibia's server log may contain a complete World Board reading without copying the
 * board preamble. In that form, active Mini World Changes are emitted as a burst of
 * canonical board messages sharing the same HH:MM:SS timestamp.
 *
 * Two or more distinct canonical World Board entries at one timestamp identify a
 * complete snapshot. A single timestamped entry remains fragmentary.
 */
function hasCompleteTimestampBatch(rawText: string): boolean {
  const entriesByTimestamp = new Map<string, Set<string>>();

  for (const rawLine of rawText.split("\n")) {
    const line = rawLine.trim();
    const timestampMatch = line.match(SERVER_LOG_TIMESTAMP_RE);
    if (!timestampMatch) continue;

    const timestamp = timestampMatch[1]!;
    const messageText = line.replace(SERVER_LOG_TIMESTAMP_RE, "");
    const normalizedLine = normalizeForMatch(messageText);

    if (!normalizedLine) continue;

    for (const entry of BOARD_MESSAGES) {
      const normalizedEntry = normalizeForMatch(entry.text);
      if (!normalizedEntry || !normalizedLine.includes(normalizedEntry)) continue;

      const canonicalKey = entry.changeId
        ? `change:${entry.changeId}`
        : entry.merchantHint
          ? `merchant:${entry.merchantHint.merchantId}`
          : normalizedEntry;

      const entries =
        entriesByTimestamp.get(timestamp) ?? new Set<string>();

      entries.add(canonicalKey);
      entriesByTimestamp.set(timestamp, entries);
    }
  }

  return Array.from(entriesByTimestamp.values()).some(
    (entries) => entries.size >= 2,
  );
}

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
    });
  }

  const isCompleteSnapshot =
    normalizedInput.includes(NORMALIZED_PREAMBLE) ||
    hasCompleteTimestampBatch(rawText);
  const inactiveMerchantIds: ParseResult["inactiveMerchantIds"] = [];

  if (isCompleteSnapshot) {
    const seenChangeIds = new Set(signals.map((signal) => signal.changeId));
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
    if (!merchantHints.some((hint) => hint.merchantId === "yasir")) {
      inactiveMerchantIds.push("yasir");
    }
  }

  const totalLines = rawText.split("\n").filter((line) => line.trim().length > 0).length;

  return {
    signals,
    merchantHints,
    unmatchedLineCount: Math.max(0, totalLines - matchedCount),
    isCompleteSnapshot,
    inactiveMerchantIds,
  };
}
