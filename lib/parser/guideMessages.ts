import type { WorldChangeState } from "@/types/worldChange";

/**
 * Verbatim Guide NPC reply text for Tibia's "World Changes" (asked in-game via keywords
 * like Horestis, Hive, Awash, …; see lib/defaults/worldChanges.ts for the full list —
 * this is a distinct mechanic from "Mini World Changes"), sourced from TibiaWiki's
 * per-change articles (community-documented under CC-BY-SA), not from any fansite's
 * parsing tool.
 *
 * Only World Changes with a documented Guide reply are listed here — no verbatim text is
 * publicly findable anywhere for Swamp Fever, Horse Station, or Insectoid Invasion (both
 * TibiaWiki and a broader web search came up empty), so those stay manual-only rather
 * than guessing at wording. Mage Tower and Thornfire are sourced from a secondary fan
 * reference (tibio-maniak.blogspot.com / a TibiaQA accepted answer) rather than TibiaWiki
 * itself, since TibiaWiki doesn't quote them — flagged per entry. Master's Voice only has
 * one state documented (the dungeon-unavailable message, from the Mad Mage creature
 * page's History section), so only that state auto-detects.
 *
 * A few source quotes end mid-sentence on the wiki itself (Deeplings, Hive Born — the
 * numeric "X actions taken" portion varies and isn't quotable). Those entries use the
 * stable leading sentence as a prefix match, which is enough to disambiguate the stage.
 *
 * Swamp Fever and Horse Station — source: github.com/s2ward/tibia's Guide Elena
 * transcript (a community project recording live NPC dialogue verbatim), mirrored at
 * tibiasecrets.com. Both mechanics likely have more states than are documented here (a
 * 2012 TibiaWiki Talk-page comment on Swamp Fever describes 3 tiers; only the calmest one
 * has ever been publicly transcribed) — only the state below auto-detects, the rest stay
 * manually selectable in the UI.
 */
export interface GuideMessageEntry {
  text: string;
  changeId: string;
  state: WorldChangeState;
  detail?: string;
}

export const GUIDE_MESSAGES: GuideMessageEntry[] = [
  // Horestis
  {
    text: "Horestis near Ankrahmun is slumbering in his tomb.",
    changeId: "horestis",
    state: "inactive",
  },
  {
    text: "The great Pharaoh Horestis near Ankrahmun has risen from his slumber to crush all intruders.",
    changeId: "horestis",
    state: "stage1",
  },
  {
    text: "Horestis's body has been desecrated. His curse now hangs over Ankrahmun like the shadow of the vulture and his tomb is almost empty.",
    changeId: "horestis",
    state: "stage2",
  },
  {
    text: "Horestis's body has been desecrated. By now, his curse has ended though. His minions are recovering slowly.",
    changeId: "horestis",
    state: "stage3",
  },
  // Twisted Waters
  {
    text: "The great lake near Port Hope is clean.",
    changeId: "twisted-waters",
    state: "inactive",
  },
  {
    text: "Corpses are piling up in the great lake near Port Hope and the water is about to become dirty",
    changeId: "twisted-waters",
    state: "stage1",
  },
  {
    text: "The great lake near Port Hope is dirty. Shimmer swimmers can be seen under the surface.",
    changeId: "twisted-waters",
    state: "stage2",
  },
  {
    text: "The great lake near Port Hope is dirty. No shimmer swimmers have been seen under the surface for quite some time now.",
    changeId: "twisted-waters",
    state: "stage3",
  },
  // Awash
  {
    text: "The mine tunnels under Kazordoon are currently flooded. Coal is needed to get the waterpumps running.",
    changeId: "awash",
    state: "inactive",
  },
  {
    text: "The mine tunnels under Kazordoon are currently flooded, but enough coal has been delivered to keep the waterpumps running.",
    changeId: "awash",
    state: "stage1",
  },
  {
    text: "The water in the mine tunnels under Kazordoon is drained and enough deeplings have been killed today to ensure it remains that way.",
    changeId: "awash",
    state: "stage2",
    detail: "Drained — today's quota met",
  },
  {
    text: "The water in the mine tunnels under Kazordoon is drained, but deeplings are trying to flood the mines again.",
    changeId: "awash",
    state: "stage2",
    detail: "Drained — quota not met yet today",
  },
  {
    text: "Too many deeplings survived during the last five days, they will flood the tunnels and nothing can stop them.",
    changeId: "awash",
    state: "stage3",
  },
  // Steamship
  {
    text: "The steamship from Thais to Kazordoon is currently not running - coal is needed to activate the service once again.",
    changeId: "steamship",
    state: "inactive",
  },
  {
    text: "The steamship from Thais to Kazordoon is currently not running, but enough coal has been delivered to start the working week tomorrow.",
    changeId: "steamship",
    state: "stage1",
  },
  // Overhunting (White Deer, Ab'Dendriel)
  {
    text: "There are white deer roaming the region near Ab'Dendriel. Don't slay too many of them, or they will leave the region.",
    changeId: "overhunting-deer",
    state: "stage1",
    detail: "Deer population stable",
  },
  {
    text: "The number of white deer near Ab'Dendriel seems to be dwindling. If that continues, we will have to watch out for some starving wolves.",
    changeId: "overhunting-deer",
    state: "stage2",
    detail: "Deer declining",
  },
  {
    text: "Too many white deer have already been slain near Ab'Dendriel. Their population will leave the region soon.",
    changeId: "overhunting-deer",
    state: "stage2",
    detail: "Deer leaving soon — wolves next server save",
  },
  {
    text: "Starving wolves are roaming the region near Ab'Dendriel. As long as they are there, no white deer will return.",
    changeId: "overhunting-deer",
    state: "stage3",
    detail: "Starving wolves active, no deer",
  },
  // Demon War
  {
    text: "The demon war is in a stalemate once again.",
    changeId: "demon-war",
    state: "inactive",
  },
  {
    text: "The Shaburak demons are in advantage right now.",
    changeId: "demon-war",
    state: "stage1",
    detail: "Shaburak advantage",
  },
  {
    text: "The Shaburak have summoned their leaders and dominate the complex.",
    changeId: "demon-war",
    state: "stage2",
    detail: "Shaburak dominant",
  },
  {
    text: "The Askarak demons are in advantage right now.",
    changeId: "demon-war",
    state: "stage1",
    detail: "Askarak advantage",
  },
  {
    text: "The Askarak are in advantage right now.",
    changeId: "demon-war",
    state: "stage1",
    detail: "Askarak advantage",
  },
  {
    text: "The Askarak have summoned their leaders and dominate the complex.",
    changeId: "demon-war",
    state: "stage2",
    detail: "Askarak dominant",
  },
  // Sea Serpent (The Fire-Feathered Serpent)
  {
    text: "The Fire-Feathered Serpent is fast asleep.",
    changeId: "sea-serpent",
    state: "inactive",
  },
  {
    text: "The Fire-Feathered Serpent dreams and the earth is bleeding lava.",
    changeId: "sea-serpent",
    state: "stage1",
  },
  {
    text: "The Fire-Feathered Serpent is awake. Renegade Quara control the sunken regions of Oramond.",
    changeId: "sea-serpent",
    state: "stage2",
  },
  // Deepling (leading sentence only — the wiki's own quote trails off with "...")
  {
    text: "The creatures of the deep are currently hiding in the black waters beneath.",
    changeId: "deeplings",
    state: "stage1",
  },
  {
    text: "God-king Qjell seems to be pleased, the floodgates to the Drowned Library have opened.",
    changeId: "deeplings",
    state: "stage2",
  },
  {
    text: "The inner arcanum of the deep has been breached.",
    changeId: "deeplings",
    state: "stage3",
  },
  // Hive Born (leading sentence only — the wiki's own quote trails off with "...")
  {
    text: "The hive is well defended and prepared for war.",
    changeId: "hive-born",
    state: "stage1",
  },
  {
    text: "The defences of the hive are breached. The hive structure to the east is open.",
    changeId: "hive-born",
    state: "stage2",
  },
  {
    text: "The hives defences have fallen. Its armies are confused and in shambles. All structures are open for invaders.",
    changeId: "hive-born",
    state: "stage3",
  },
  // Mage Tower — source: tibio-maniak.blogspot.com (not TibiaWiki; moderate confidence,
  // not cross-verified elsewhere, may not cover every possible state)
  {
    text: "The raging mage is currently in his tower in Zao and experimenting with the portal into another dimension.",
    changeId: "mage-tower",
    state: "active",
  },
  {
    text: "The raging mage in Zao has been slain and the portal into another dimension will close.",
    changeId: "mage-tower",
    state: "inactive",
  },
  // Master's Voice — Guide NPC variants observed/documented for the Edron tower.
  {
    text: "The strange tower with the servants on Edron is covered in slime.",
    changeId: "masters-voice",
    state: "active",
    detail: "Slime outbreak",
  },
  {
    text: "The strange tower with the servants on Edron currently seems to be completely impassable because of a severe slime outbreak.",
    changeId: "masters-voice",
    state: "inactive",
  },
  // Thornfire — source: TibiaQA accepted answer (not TibiaWiki itself, but a complete,
  // explicit 4-message transcript). Stage 4 (recovering) reuses "stage2" since our model
  // only has 3 escalation stages — it's a de-escalation after the stage3 peak, not a
  // literal fourth stage, and the detail note carries the distinction.
  {
    text: "Countless firestarters are in their cells bellow Shadowthorn, but right now they are safely guarded.",
    changeId: "thornfire",
    state: "stage1",
  },
  {
    text: "Most guards and elves preventing the firestarters from breaking out have been slain. Shadowthorn is in danger of being set ablaze.",
    changeId: "thornfire",
    state: "stage2",
    detail: "Breaking out",
  },
  {
    text: "Shadowthorn burns, and the followers of the bog with it!",
    changeId: "thornfire",
    state: "stage3",
  },
  {
    text: "Shadowthorn burns, but the Tibians have been successfully fighting the fire as well as the firefighters.",
    changeId: "thornfire",
    state: "stage2",
    detail: "Recovering — fire being fought",
  },
  // Swamp Fever — source: Guide Elena transcript (github.com/s2ward/tibia). Only the calm
  // state is documented; the escalation tiers ("medicine direly needed" / "not under
  // control") have no publicly transcribed verbatim text yet.
  {
    text: "The swamp fever in Venore is currently under control and there is enough medicine for everyone.",
    changeId: "swamp-fever",
    state: "inactive",
  },
  // Horse Station (keyword "Horses") — live Guide NPC dialogue covers both the
  // normal service state and the escaped-horses state.
  {
    text: "The horse services near Thais and Venore are working normally.",
    changeId: "horse-station",
    state: "inactive",
  },
  {
    text: "Horses are on the loose near Thais! As long as there haven't been enough horses chased back into the pen, the service is on hold.",
    changeId: "horse-station",
    state: "active",
  },
];
