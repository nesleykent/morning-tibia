/** Keep source titles intact while reusing existing wiki-based presentation data. */
export function eventLookupTitle(title: string): string {
  const aliases: Record<string, string> = {
    "Full Moon": "Grimvale",
    "Colours of Magic": "The Colours of Magic",
    "XP/Skill Event": "Double Experience and Skill Events",
    "Hot Cuisine Month": "Hot Cuisine Quest",
    "Rapid Respawn": "Rapid Respawn Events",
    "Lightbearer": "The Lightbearer",
    "New Year": "New Year's Season",
    "Tibia Anniversary": "Tibia's Anniversary",
  };
  return aliases[title] ?? title;
}
