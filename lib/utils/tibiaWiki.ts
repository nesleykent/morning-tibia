/**
 * Links out to TibiaWiki, the source every catalog in this app was researched against.
 *
 * The tempting shortcut — derive the URL from the catalog's `name` — is wrong, and quietly
 * so. Checked against the live MediaWiki API, bare names miss for eight of the twenty-six
 * Mini World Changes, and "Fury Gates" is worse than a miss: it *redirects* to "Fury
 * Dungeon", an article about the dungeon rather than the change, so the link would resolve
 * and be wrong. TibiaWiki disambiguates these with an explicit suffix instead.
 *
 * So the title is never guessed from a name. Every mapping below was verified to exist:
 *
 * - 23 announced Mini World Changes → `<Name> Mini World Change`
 * - 14 World Changes               → `<Name> World Change`
 * - Forsaken                        → `Forsaken Mine` (the location the rotation happens in)
 * - Beaver Breakout, Shipwrecked    → **no English article exists.** These are the silent
 *   changes the English wiki does not document as Mini World Changes (only TibiaWiki BR
 *   does). They get no link rather than a plausible-looking broken one.
 *
 * Creature and boss names are the exception where derivation is safe: they come from
 * TibiaData's own creature list, which uses the same canonical names as TibiaWiki article
 * titles (spot-checked across fifteen boosted-eligible creatures and bosses — all exact,
 * no redirects).
 */

const WIKI_BASE = "https://tibia.fandom.com/wiki";

/** Turns a verified article title into its URL. Spaces become underscores; everything else
 * is percent-encoded, which leaves apostrophes intact the way Fandom's own URLs do. */
export function tibiaWikiUrl(title: string): string {
  return `${WIKI_BASE}/${encodeURI(title.replace(/ /g, "_"))}`;
}

/**
 * Article title for a Mini World Change, or null where no English article exists.
 * `wikiTitle` on the definition wins; otherwise the verified suffix pattern applies.
 */
export function miniWorldChangeWikiUrl(definition: {
  name: string;
  wikiTitle?: string | null;
}): string | null {
  if (definition.wikiTitle === null) return null;
  if (definition.wikiTitle) return tibiaWikiUrl(definition.wikiTitle);
  return tibiaWikiUrl(`${definition.name} Mini World Change`);
}

/** Article title for a World Change. All fourteen resolve under the verified suffix. */
export function worldChangeWikiUrl(definition: {
  name: string;
  wikiTitle?: string | null;
}): string | null {
  if (definition.wikiTitle === null) return null;
  if (definition.wikiTitle) return tibiaWikiUrl(definition.wikiTitle);
  return tibiaWikiUrl(`${definition.name} World Change`);
}

/** Article for a creature or boss named by TibiaData. Null for an empty name. */
export function creatureWikiUrl(name: string | null | undefined): string | null {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  return tibiaWikiUrl(trimmed);
}
