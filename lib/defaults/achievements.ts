import type { AchievementOpportunityDefinition } from "@/types/achievement";

const WIKI = "https://tibia.fandom.com/wiki";

/**
 * Achievements that today's world state makes obtainable, researched one by one.
 *
 * Evidence standard: every entry below is backed by an authoritative statement, not by
 * theme-matching. Most come straight from TibiaWiki's own achievement spoiler naming the
 * enabling change — "Obtainable for killing 50 water elementals ... during Down the Drain
 * Mini World Change" — and the rest from a creature page stating the creature only exists
 * under that condition ("Terrified Elephant: only appears during the Stampede Mini World
 * Change"; "Askarak Prince: these creatures will only spawn when their side is on the
 * winning hand in the Arak War").
 *
 * Deliberately NOT included, as examples of the bar:
 *
 * - Fury Gates, Spirit Grounds, Hive Outpost, Nightmare Isles, Chakoya Iceberg and the
 *   Jungle Camp bosses have no achievement whose requirement names them, so they get no
 *   opportunity even though they are clearly "content". Hive Outpost and Chakoya Iceberg
 *   enable a Cartography 101 mission, but a quest mission is not an achievement and is not
 *   modelled as one.
 * - Shipwrecked makes Krailos the best Pirate Corsair respawn in the game, which is
 *   genuinely useful, but no achievement requires Pirate Corsairs, so it is described on
 *   the change itself rather than promoted to an achievement opportunity.
 * - "Mind the Step!" and "Snake Charmer" come from the Twenty Miles Beneath the Sea Quest.
 *   The Fire-Feathered Serpent world change gates parts of that area, but neither spoiler
 *   ties the achievement to a specific documented serpent stage, so no link is asserted.
 */
export const ACHIEVEMENT_OPPORTUNITIES: AchievementOpportunityDefinition[] = [
  // ── Mini World Changes whose achievement spoiler names them outright ─────────
  {
    id: "honest-finder",
    achievement: "Honest Finder",
    grade: 1,
    points: 1,
    premium: false,
    task: "Track down the thief, take back the Bag with Stolen Gold and return it to the robbed bank.",
    whyToday: "The banks are only robbed while this change is running.",
    strength: "required",
    trigger: { kind: "mini-world-change", changeId: "bank-robbery" },
    caveat: "The bag must be handed in before the next server save.",
    source: `${WIKI}/Honest_Finder`,
  },
  {
    id: "goldhunter",
    achievement: "Goldhunter",
    grade: 1,
    points: 2,
    premium: false,
    task: "Return 5 Bags with Stolen Gold in total, across separate Bank Robberies.",
    whyToday: "Each robbery only lets you return one bag, so this is one of the five days you need.",
    strength: "required",
    trigger: { kind: "mini-world-change", changeId: "bank-robbery" },
    caveat: "Cumulative across days — today can only advance it by one.",
    source: `${WIKI}/Goldhunter`,
  },
  {
    id: "trail-of-the-ape-god",
    achievement: "Trail of the Ape God",
    grade: 1,
    points: 1,
    premium: true,
    task: "Kill 5 Terrified Elephants east of Port Hope, near the Deeper Banuta shortcut.",
    whyToday: "Terrified Elephants only appear during Stampede — there is no other way to find them.",
    strength: "required",
    trigger: { kind: "mini-world-change", changeId: "stampede" },
    source: `${WIKI}/Trail_of_the_Ape_God`,
  },
  {
    id: "down-the-drain",
    achievement: "Down the Drain",
    grade: 1,
    points: 2,
    premium: false,
    task: "Kill 50 water elementals in the Water Elemental Dungeon at the Outlaw Camp.",
    whyToday: "The flooded river is what makes that island reachable.",
    strength: "required",
    trigger: { kind: "mini-world-change", changeId: "down-the-drain" },
    source: `${WIKI}/Down_the_Drain_(Achievement)`,
  },
  {
    id: "fire-from-the-earth",
    achievement: "Fire from the Earth",
    grade: 1,
    points: 2,
    premium: true,
    task: "Kill 50 fiery creatures in and on the Hellgore volcano.",
    whyToday: "The eruption is what floods Goroma with those creatures.",
    strength: "required",
    trigger: { kind: "mini-world-change", changeId: "fire-from-the-earth" },
    source: `${WIKI}/Fire_from_the_Earth_(Achievement)`,
  },
  {
    id: "desert-fisher",
    achievement: "Desert Fisher",
    grade: 1,
    points: 1,
    premium: true,
    task: "Fish a Sandfish out of the Zao Steppe river.",
    whyToday: "Sandfish are only catchable while the river runs deep.",
    strength: "required",
    trigger: { kind: "mini-world-change", changeId: "river-runs-deep" },
    source: `${WIKI}/Desert_Fisher`,
  },
  {
    id: "ice-harvester",
    achievement: "Ice Harvester",
    grade: 1,
    points: 1,
    premium: true,
    task: "Use Ice Flowers near Svargrond until you have collected 10 Ice Flower Seeds.",
    whyToday: "The thaw is what uncovers the Ice Flowers.",
    strength: "required",
    trigger: { kind: "mini-world-change", changeId: "thawing" },
    source: `${WIKI}/Ice_Harvester`,
  },
  {
    id: "chest-robber",
    achievement: "Chest Robber",
    grade: 1,
    points: 1,
    premium: true,
    task: "Loot the chest at the nomad camp that is pitched today.",
    whyToday: "Only one of the four camps exists on any given day, and three of them hold a chest.",
    strength: "required",
    trigger: { kind: "mini-world-change", changeId: "nomads" },
    caveat:
      "Needs three different camps across separate days; one of the four has no chest at all.",
    source: `${WIKI}/Chest_Robber`,
  },
  {
    id: "dog-sitter",
    achievement: "Dog Sitter",
    grade: 1,
    points: 1,
    premium: false,
    task: "Get a leash from King Tibianus, find Noodles on the Thaian peninsula and use it on him.",
    whyToday: "Noodles is only out of the castle while this change is running.",
    strength: "required",
    trigger: { kind: "mini-world-change", changeId: "noodles-is-gone" },
    caveat: "Repeatable only once every two weeks.",
    source: `${WIKI}/Dog_Sitter`,
  },
  {
    id: "loyal-subject",
    achievement: "Loyal Subject",
    grade: 1,
    points: 1,
    premium: false,
    task: 'Say "Hello King" to King Tibianus in Thais.',
    whyToday: "It only counts during Kingsday.",
    strength: "required",
    trigger: { kind: "mini-world-change", changeId: "kingsday" },
    source: `${WIKI}/Loyal_Subject`,
  },
  {
    id: "whistle-blower",
    achievement: "Whistle-Blower",
    grade: 1,
    points: 1,
    premium: false,
    task: "Tell Queen Eloise about Chip, the lumberjack cutting the royal trees.",
    whyToday: "Chip is only there to report while the trees are being felled.",
    strength: "required",
    trigger: { kind: "mini-world-change", changeId: "lumberjack" },
    source: `${WIKI}/Whistle-Blower`,
  },
  {
    id: "torn-treasures",
    achievement: "Torn Treasures",
    grade: 1,
    points: 1,
    premium: false,
    task: "Bring Blood Herbs to Wyda until she hands over a Torn Teddy.",
    whyToday: "Wyda only trades this way while she is bored.",
    strength: "required",
    trigger: { kind: "mini-world-change", changeId: "bored" },
    caveat: "The number of Blood Herbs needed is random.",
    source: `${WIKI}/Torn_Treasures`,
  },
  {
    id: "someones-bored",
    achievement: "Someone's Bored",
    grade: 1,
    points: 1,
    premium: false,
    task: "Kill one of the fake giant spiders around Wyda's house.",
    whyToday: "Those illusory spiders only appear while Wyda is bored.",
    strength: "required",
    trigger: { kind: "mini-world-change", changeId: "bored" },
    source: `${WIKI}/Someone%27s_Bored`,
  },
  {
    id: "nestling",
    achievement: "Nestling",
    grade: 1,
    points: 1,
    premium: false,
    task: "Kill Mamma Longlegs at the spider nest near Venore.",
    whyToday: "She is only reachable while the nest is infested.",
    strength: "required",
    trigger: { kind: "mini-world-change", changeId: "spider-nest" },
    caveat: "Needs three kills in total, and the area closes to you after the third.",
    source: `${WIKI}/Nestling`,
  },
  {
    id: "bibbys-bloodbath",
    achievement: "Bibby's Bloodbath",
    grade: 1,
    points: 1,
    premium: false,
    task: "Clear every orc inside the war camp to make Bibby Bloodbath spawn, then kill her.",
    whyToday: "The camp — and therefore the boss — only exists during Warpath.",
    strength: "required",
    trigger: { kind: "mini-world-change", changeId: "warpath" },
    caveat: "Level 50+ recommended; she can only be fought again after about two days.",
    source: `${WIKI}/Bibby%27s_Bloodbath`,
  },
  {
    id: "beaver-away",
    achievement: "Beaver Away",
    grade: 1,
    points: 1,
    premium: true,
    task: "Use a Colourful Water Lily on a loose Giant Beaver at Silvertides to tame it.",
    whyToday: "The beavers are only out of their pen while Beaver Breakout is running.",
    strength: "required",
    trigger: { kind: "mini-world-change", changeId: "beaver-breakout" },
    prerequisites: [
      "Star-Crossed Lovers mission of the Within the Tides Quest",
      "A Colourful Water Lily",
    ],
    source: `${WIKI}/Beaver_Away`,
  },
  {
    id: "icy-glare",
    achievement: "Icy Glare",
    grade: 1,
    points: 1,
    premium: true,
    task: "Use a Melting Horn on a Half-Frozen Ursagrodon three times in a row, deep inside Chyllfroest.",
    whyToday: "The island is only reachable while the ice bridge stands.",
    strength: "required",
    trigger: { kind: "mini-world-change", changeId: "chyllfroest" },
    prerequisites: ["A Melting Horn"],
    source: `${WIKI}/Icy_Glare`,
  },

  // ── Devovorga's Essence: one incarnation per entry, each its own achievement ──
  ...(
    [
      ["Anmothra", 2, false, 2],
      ["Irahsae", 5, true, 2],
      ["Teneshpar", 8, false, 2],
      ["Chikhaton", 12, true, 2],
      ["Phrodomo", 16, false, 2],
    ] as const
  ).map(([boss, pieces, premium, points]) => ({
    id: `slayer-of-${boss.toLowerCase()}`,
    achievement: `Slayer of ${boss}`,
    grade: 1 as const,
    points,
    premium,
    task: `Give the Dread Guardian ${pieces} Tentacle Pieces and defeat ${boss} alone within 10 minutes.`,
    whyToday:
      "The portal at Vengoth is open, which is the only way to fight the incarnations outside the Rise of Devovorga world quest.",
    strength: "required" as const,
    trigger: { kind: "mini-world-change" as const, changeId: "devovorgas-essence" },
    prerequisites: [`${pieces} Tentacle Pieces`],
    caveat:
      boss === "Phrodomo"
        ? "Phrodomo is by far the hardest incarnation — level 200+ before spending 16 pieces."
        : undefined,
    source: `${WIKI}/Slayer_of_${boss}`,
  })),

  // ── World Changes: tied to specific documented states ────────────────────────
  {
    id: "firefighter",
    achievement: "Firefighter",
    grade: 1,
    points: 2,
    premium: false,
    task: "Extinguish 500 fires in Shadowthorn with buckets of bog water.",
    whyToday: "Fires only exist to put out while Shadowthorn is burning.",
    strength: "required",
    trigger: {
      kind: "world-change",
      changeId: "thornfire",
      stateIds: ["burning", "being-fought"],
    },
    prerequisites: ["Prepared Buckets (a Bucket plus a Flask of Embalming Fluid)"],
    caveat: "500 fires is a long grind — cumulative, not a single session.",
    source: `${WIKI}/Firefighter`,
  },
  {
    id: "eye-of-the-deep",
    achievement: "Eye of the Deep",
    grade: 1,
    points: 1,
    premium: false,
    task: "Help kill Groam on the east side of the Sunken Mines.",
    whyToday: "Groam only spawns while the Kazordoon mines are drained and reachable.",
    strength: "required",
    trigger: {
      kind: "world-change",
      changeId: "awash",
      stateIds: ["drained-quota-met", "drained-quota-open"],
    },
    caveat: "He spawns at most once per server save.",
    source: `${WIKI}/Eye_of_the_Deep`,
  },
  {
    id: "shaburak-nemesis",
    achievement: "Shaburak Nemesis",
    grade: 1,
    points: 1,
    premium: true,
    task: "Kill 100 Shaburak Princes in the Demonwar Crypt.",
    whyToday: "Princes only spawn for the faction currently winning the Arak War.",
    strength: "required",
    trigger: {
      kind: "world-change",
      changeId: "demon-war",
      stateIds: ["shaburak-advantage", "shaburak-dominant"],
    },
    caveat: "100 kills is cumulative across many Shaburak-favoured days.",
    source: `${WIKI}/Shaburak_Nemesis`,
  },
  {
    id: "askarak-nemesis",
    achievement: "Askarak Nemesis",
    grade: 1,
    points: 1,
    premium: true,
    task: "Kill 100 Askarak Princes in the Demonwar Crypt.",
    whyToday: "Princes only spawn for the faction currently winning the Arak War.",
    strength: "required",
    trigger: {
      kind: "world-change",
      changeId: "demon-war",
      stateIds: ["askarak-advantage", "askarak-dominant"],
    },
    caveat: "100 kills is cumulative across many Askarak-favoured days.",
    source: `${WIKI}/Askarak_Nemesis`,
  },
  {
    id: "biodegradable",
    achievement: "Biodegradable",
    grade: 1,
    points: 1,
    premium: true,
    task: "Fish Shimmer Swimmers out of Lake Equivocalao, north of Port Hope.",
    whyToday:
      "Shimmer swimmers are in the lake right now — the Guide's own reply says they can be seen under the surface.",
    strength: "required",
    trigger: {
      kind: "world-change",
      changeId: "twisted-waters",
      stateIds: ["dirty-swimmers"],
    },
    caveat: "50 in total, and roughly one is catchable per day — a long-running goal.",
    source: `${WIKI}/Biodegradable`,
  },

  // ── Merchant ─────────────────────────────────────────────────────────────────
  {
    id: "si-ariki",
    achievement: "Si, Ariki!",
    grade: 1,
    points: 1,
    premium: false,
    task: "Sell any creature product to Yasir.",
    whyToday: "Yasir only trades on the days his ship is in port.",
    strength: "required",
    trigger: { kind: "merchant", merchantId: "yasir" },
    source: `${WIKI}/Si,_Ariki!`,
  },
];

export const ACHIEVEMENT_OPPORTUNITIES_BY_ID = new Map(
  ACHIEVEMENT_OPPORTUNITIES.map((definition) => [definition.id, definition]),
);
