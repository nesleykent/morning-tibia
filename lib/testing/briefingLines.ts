/**
 * What a change's opening line looks like, for the tests that have to find one.
 *
 * `🌀 *Spirit Grounds* _(Darama; Ghostlands; Vengoth)_` — the change names itself, and the
 * place it happens rides on the same line as a parenthesised aside. The aside is optional in
 * both directions: Demon War and Sea Serpent are not anywhere in particular, and a change
 * whose variant *is* the place narrows to the one a source named.
 *
 * Declared once and shared, because four suites need it — the coverage sweep, the two
 * regressions and the close reading — and a private copy in each is a copy free to disagree
 * with the renderer and with the other three. The place used to be a 📍 line of its own, so
 * every one of them matched on `*Name*\n` and every one of them broke the day it moved.
 */
function escapeForRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** The line one named change opens its block with, wherever it sits in the message. */
export function nameLinePattern(emoji: string, name: string): RegExp {
  return new RegExp(`^${escapeForRegExp(`${emoji} *${name}*`)}(?: _\\([^)]+\\)_)?$`, "m");
}

/**
 * Any change's opening line, for scanning a message rather than looking one up.
 *
 * Section headings match the same shape, so a caller that only wants change names has to
 * exclude them — see `isHeading` in generateBriefing.test.ts.
 */
export const NAME_LINE = /^\S+ \*[^*]+\*(?: _\([^)]+\)_)?$/;
