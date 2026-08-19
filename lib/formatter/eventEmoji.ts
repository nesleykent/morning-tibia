/** Best-effort per-event icon for known, recurring Tibia events; unrecognized titles
 * (including one-off "Mini World Change" style entries from the events calendar) fall
 * back to a generic celebration emoji. */
const EVENT_EMOJI: Record<string, string> = {
  "Hot Cuisine Quest": "🍳",
  "Rise of Devovorga": "🦑",
  "Last Creep Standing": "🏴‍☠️",
  "A Pirate's Death to Me": "☠️",
  "The Colours of Magic": "🎨",
  Christmas: "🎄",
  "Double Experience and Skill Events": "⬆️",
  "Double Experience Weeks": "⬆️",
  "Double Loot Event": "🎁",
  "Rapid Respawn Events": "⚡",
  "Annual Autumn Vintage": "🍂",
  Halloween: "🎃",
  "The Lightbearer": "🕯️",
  "Winterlight Solstice": "❄️",
  Orcsoberfest: "🍺",
  "A Piece of Cake": "🎂",
  "Valentine's Day": "💘",
  "Masquerade Day": "🎭",
  "Double Daily Reward Month": "🎁",
  Bewitched: "🧙",
  "Flower Month": "🌸",
  "Demon's Lullaby": "😈",
  "Tibia's Anniversary": "🎉",
  "New Year's Season": "🎆",
  "Premium Surprise Week": "🎁",
  "Spring into Life": "🌱",
  "Month of Pranks": "🤡",
};

const DEFAULT_EVENT_EMOJI = "🎉";

export function eventEmoji(title: string): string {
  for (const [key, emoji] of Object.entries(EVENT_EMOJI)) {
    if (title.includes(key)) return emoji;
  }
  return DEFAULT_EVENT_EMOJI;
}
