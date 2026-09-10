/**
 * What a piece of pasted in-game text is actually allowed to prove.
 *
 * Morning Tibia's whole value is that it never states a fact it has not been told, so the
 * pipeline has to keep four things apart that a naive model collapses into two:
 *
 * - **unknown**  — nobody looked. The app says nothing.
 * - **absent**   — a *complete* source was read and did not mention this thing, and the
 *                  domain says that source would have mentioned it if it were happening.
 *                  This is real knowledge, and the opposite of "unknown".
 * - **present**  — a source explicitly said it is happening.
 * - **state**    — a source (a Guide NPC) reported one of a change's documented states.
 *                  Some of those states are "nothing is happening"; that is still knowledge.
 *
 * The `unknown`/`absent` distinction is the one that used to be lost. "The World Board did
 * not mention Yasir" and "nobody read the World Board" both produced "not verified", which
 * told a reader who *had* read the board that the app had learnt nothing from it.
 */
export type Knowledge = "unknown" | "absent" | "present" | "state";

/**
 * How much of a source the paste represents.
 *
 * Only a `complete` source can ever settle a negative, because only an exhaustive listing
 * makes silence meaningful. A `partial` paste is one or more true observations with no claim
 * about anything it does not mention.
 */
export type SourceCompleteness = "complete" | "partial";

/**
 * Why a World Board paste counts as a complete reading. Recorded rather than reduced to a
 * boolean so the UI can say *how* it knows, and so a future source of completeness does not
 * silently change the meaning of existing data.
 *
 * - `preamble`   — the paste contains the board's own opening line. The only marker available
 *                  when the board printed no messages at all, which is a real state: nothing
 *                  running means nothing listed.
 * - `recognised` — the paste contains at least one board message. Using the board writes its
 *                  whole current listing to the Server Log in one action, and the game offers
 *                  no way to produce a partial one, so a message in the log implies the
 *                  listing it came from.
 * - `none`       — not a board reading. Guide replies and Towncryer shouts land here, and
 *                  neither can settle an absence.
 */
export type BoardCompletenessBasis = "preamble" | "recognised" | "none";

export interface BoardEvidence {
  completeness: SourceCompleteness;
  basis: BoardCompletenessBasis;
  /** How many board messages were recognised, for the paste receipt. */
  recognisedCount: number;
}

export interface GuideEvidence {
  /** World Change ids a Guide reply established a documented state for. */
  answeredChangeIds: string[];
  /**
   * Lines that are unmistakably a Guide NPC speaking ("Guide Luke: …") but whose wording is
   * not in the catalog. Surfaced instead of dropped: a reply the app cannot read is a gap in
   * the catalog, and staying silent about it is how such gaps survive.
   */
  unrecognisedReplies: string[];
}
