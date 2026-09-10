/**
 * "the world list", "boosted creature and boss and market prices" — a list as a person
 * would say it, for dropping into the middle of a sentence.
 *
 * Shared between the failure banner and the briefing panel, which both have to name the same
 * set of broken feeds in running prose.
 */
export function formatList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
