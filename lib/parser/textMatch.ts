/** Collapses whitespace and lowercases so pasted text with line-wraps or curly quotes still matches. */
export function normalizeForMatch(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
