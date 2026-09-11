import type { ParsedGuideResult, ParsedWorldChangeSignal } from "@/types/parser";
import { GUIDE_MESSAGES, NON_STATE_REPLIES } from "./guideMessages";
import { normalizeForMatch } from "./textMatch";

/** `Guide Luke: <reply>` — the one shape that unmistakably marks a line as a Guide speaking. */
const GUIDE_SPEAKER = /(?:^|\s)Guide\s+[A-Z][\w'-]*\s*:\s*(.+)$/;

/**
 * The catalog entry with its trailing sentence punctuation removed, so a reply that carries on
 * past the quoted text still matches.
 *
 * Live replies routinely continue where TibiaWiki's transcript stops: "…dominate the complex,
 * while the Askarak are weakened." against a catalog entry ending "…dominate the complex.".
 * Anchoring on the full string including its full stop dropped those replies entirely, which
 * is how two of the fourteen World Changes could be answered by a Guide and still be reported
 * as never checked.
 *
 * Only the *final* punctuation is stripped. Interior full stops are load-bearing — they are
 * what keeps "Horestis's body has been desecrated. His curse now hangs…" apart from
 * "Horestis's body has been desecrated. By now, his curse has ended…".
 */
function matchKey(text: string): string {
  return normalizeForMatch(text).replace(/[.!,;:]+$/, "");
}

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
 *
 * Replies that are unmistakably a Guide speaking but whose wording is not in the catalog are
 * collected rather than dropped. That is the honest report of "the game told us something and
 * we could not read it", and it is the only way a missing catalog entry ever surfaces. Guide
 * small talk is filtered out first (see NON_STATE_REPLIES), because a greeting reported as
 * unreadable teaches the reader to ignore the list that is supposed to catch real gaps.
 */
export function parseGuideLog(rawText: string): ParsedGuideResult {
  const normalizedInput = normalizeForMatch(rawText);
  const bestById = new Map<string, { signal: ParsedWorldChangeSignal; index: number }>();

  for (const entry of GUIDE_MESSAGES) {
    for (const wording of [entry.text, ...(entry.alsoMatches ?? [])]) {
      const key = matchKey(wording);
      if (!key) continue;

      // lastIndexOf: if the same reply appears twice, anchor on the later occurrence.
      const index = normalizedInput.lastIndexOf(key);
      if (index === -1) continue;

      const existing = bestById.get(entry.changeId);
      if (existing && existing.index >= index) continue;

      bestById.set(entry.changeId, {
        index,
        signal: {
          changeId: entry.changeId,
          stateId: entry.stateId,
          matchedText: wording,
        },
      });
    }
  }

  const known = new Set(GUIDE_MESSAGES.flatMap((e) => [matchKey(e.text), ...(e.alsoMatches ?? []).map(matchKey)]));
  const unrecognisedReplies: string[] = [];
  for (const line of rawText.split(/\r?\n/)) {
    const spoken = GUIDE_SPEAKER.exec(line)?.[1]?.trim();
    if (!spoken) continue;
    const key = matchKey(spoken);
    if (!key) continue;
    // A known reply may be quoted in full or truncated by the client's line wrapping, so treat
    // "starts with a catalog entry" and "is the start of one" as recognised alike.
    if (NON_STATE_REPLIES.some((pattern) => pattern.test(spoken))) continue;
    const recognised = [...known].some((entry) => key.startsWith(entry) || entry.startsWith(key));
    if (!recognised && !unrecognisedReplies.includes(spoken)) unrecognisedReplies.push(spoken);
  }

  return {
    signals: Array.from(bestById.values(), (v) => v.signal),
    unrecognisedReplies,
  };
}
