/**
 * Verbatim Guide NPC reply text for Tibia's 14 World Changes.
 *
 * How a player gets these in game: greet any Guide NPC (Guide Elena in Venore, Guide Luke
 * in Thais, Guide Tiko in Port Hope, …), say "world change" to have them recite the keyword
 * list, then say a keyword. The reply describes the current state on that world.
 *
 * Provenance — this catalog is not guesswork, and where it is weaker the entry says so:
 *
 * - Every one of the 14 keywords has at least one reply verified verbatim against live
 *   Guide NPC transcripts recorded by the community project github.com/s2ward/tibia
 *   (the per-city Guide transcripts under data/npcs/text), which captures whole
 *   conversations as they happened.
 * - The remaining states of each cycle come from TibiaWiki's per-change articles.
 * - Several replies quoted on the wiki trail off mid-sentence, because the live reply
 *   continues with a varying counter (Deeplings, Hive Born: "N actions have been taken") or a
 *   trailing clause the wiki omits (Demon War: "…dominate the complex, while the Askarak are
 *   weakened"). Those entries are the stable leading sentence, which is already unique enough
 *   to identify the state, and parseGuideLog matches them as a prefix — so a reply that
 *   continues past the catalog text still resolves. Matching the full string including its
 *   final full stop, as this used to, silently lost every reply with a continuation.
 * - `unverifiedWording: true` marks text that is plausible and sourced from a secondary fan
 *   site but that could not be confirmed verbatim anywhere primary. If such wording is
 *   slightly off the parser simply never matches it — it fails silently and safely rather
 *   than mis-reporting a state.
 *
 * `stateId` must be one of the `states` declared for that change in
 * lib/defaults/worldChanges.ts; a test enforces that the two files stay in step.
 */
export interface GuideMessageEntry {
  text: string;
  changeId: string;
  stateId: string;
  /**
   * Other wordings of the same reply that must also match. Two things make this necessary:
   * TibiaWiki transcribes some replies with typos the live client does not have (and vice
   * versa), and CipSoft has reworded a few over the years. Listing the variants is safer than
   * loosening the matcher, because each variant is still an exact, reviewable string.
   */
  alsoMatches?: readonly string[];
  /** Wording sourced from a secondary fan reference and not confirmed verbatim. */
  unverifiedWording?: boolean;
}

/**
 * Things a Guide says that are not an answer about a World Change state.
 *
 * Without this the honest report "the game told us something and we could not read it" fills up
 * with lines nobody ever needs read: the greeting every Guide opens with, and the counter
 * sentence that trails the Deeplings and Hive Born replies. A fourteen-world log sweep produced
 * three such lines per world and not one of them was a gap in the catalog.
 *
 * Kept deliberately narrow. Each pattern is anchored on wording that no state reply uses, so a
 * genuinely unknown reply still surfaces instead of being swallowed here.
 */
export const NON_STATE_REPLIES: readonly RegExp[] = [
  // "Hello there, Player and welcome to Thais! Would you like some information and a map guide?"
  // — and its Carlin, Edron, Darashia and Kingsday variants, which differ only in the opening.
  /would you like some information and a map guide/i,
  /information or a map i can help you/i,
  // "31 actions against the Deeplings have been taken. This position will hold for a while." and
  // "0 actions have been taken against the Hive Born. 200 actions are necessary…". The state is
  // already settled by the sentence before it; this one only counts. No state reply starts with
  // a number, so the anchor cannot collide with one.
  /^\d+\s+actions?\b/i,
];

export const GUIDE_MESSAGES: GuideMessageEntry[] = [
  // ── Horestis ────────────────────────────────────────────────────────────────
  // Leading sentence only; the live reply continues "I wouldn't disrupt his sleep...".
  {
    text: "Horestis near Ankrahmun is slumbering in his tomb.",
    changeId: "horestis",
    stateId: "slumbering",
  },
  {
    text: "The great Pharaoh Horestis near Ankrahmun has risen from his slumber to crush all intruders.",
    changeId: "horestis",
    stateId: "risen",
  },
  {
    text: "Horestis's body has been desecrated. His curse now hangs over Ankrahmun like the shadow of the vulture and his tomb is almost empty.",
    changeId: "horestis",
    stateId: "desecrated",
  },
  {
    text: "Horestis's body has been desecrated. By now, his curse has ended though. His minions are recovering slowly.",
    changeId: "horestis",
    stateId: "curse-ended",
  },

  // ── Twisted Waters ──────────────────────────────────────────────────────────
  {
    text: "The great lake near Port Hope is clean.",
    changeId: "twisted-waters",
    stateId: "clean",
  },
  {
    text: "Corpses are piling up in the great lake near Port Hope and the water is about to become dirty",
    changeId: "twisted-waters",
    stateId: "turning",
  },
  {
    text: "The great lake near Port Hope is dirty. Shimmer swimmers can be seen under the surface.",
    changeId: "twisted-waters",
    stateId: "dirty-swimmers",
  },
  {
    text: "The great lake near Port Hope is dirty. No shimmer swimmers have been seen under the surface for quite some time now.",
    changeId: "twisted-waters",
    stateId: "dirty-exhausted",
  },

  // ── Awash ───────────────────────────────────────────────────────────────────
  {
    text: "The mine tunnels under Kazordoon are currently flooded. Coal is needed to get the waterpumps running.",
    changeId: "awash",
    stateId: "flooded",
  },
  {
    text: "The mine tunnels under Kazordoon are currently flooded, but enough coal has been delivered to keep the waterpumps running.",
    changeId: "awash",
    stateId: "flooded-coal-delivered",
  },
  {
    text: "The water in the mine tunnels under Kazordoon is drained and enough deeplings have been killed today to ensure it remains that way.",
    changeId: "awash",
    stateId: "drained-quota-met",
  },
  {
    text: "The water in the mine tunnels under Kazordoon is drained, but deeplings are trying to flood the mines again.",
    changeId: "awash",
    stateId: "drained-quota-open",
  },
  {
    text: "Too many deeplings survived during the last five days, they will flood the tunnels and nothing can stop them.",
    changeId: "awash",
    stateId: "overrun",
  },

  // ── Steamship ───────────────────────────────────────────────────────────────
  {
    text: "The steamship from Thais to Kazordoon is currently not running - coal is needed to activate the service once again.",
    changeId: "steamship",
    stateId: "not-running",
  },
  {
    text: "The steamship from Thais to Kazordoon is currently not running, but enough coal has been delivered to start the working week tomorrow.",
    changeId: "steamship",
    stateId: "coal-delivered",
  },

  // ── Overhunting ─────────────────────────────────────────────────────────────
  {
    text: "There are white deer roaming the region near Ab'Dendriel. Don't slay too many of them, or they will leave the region.",
    changeId: "overhunting",
    stateId: "stable",
  },
  {
    text: "The number of white deer near Ab'Dendriel seems to be dwindling. If that continues, we will have to watch out for some starving wolves.",
    changeId: "overhunting",
    stateId: "dwindling",
  },
  {
    text: "Too many white deer have already been slain near Ab'Dendriel. Their population will leave the region soon.",
    changeId: "overhunting",
    stateId: "leaving",
  },
  {
    text: "Starving wolves are roaming the region near Ab'Dendriel. As long as they are there, no white deer will return.",
    changeId: "overhunting",
    stateId: "wolves",
  },
  {
    text: "Starving wolves are roaming the region near Ab'Dendriel, but enough have been driven away and the deer population will return soon.",
    changeId: "overhunting",
    stateId: "wolves-receding",
  },

  // ── Demon War ───────────────────────────────────────────────────────────────
  {
    text: "The demon war is in a stalemate once again.",
    changeId: "demon-war",
    stateId: "stalemate",
  },
  {
    text: "The Shaburak demons are in advantage right now.",
    alsoMatches: ["The Shaburak are in advantage right now."],
    changeId: "demon-war",
    stateId: "shaburak-advantage",
  },
  {
    text: "The Shaburak have summoned their leaders and dominate the complex.",
    changeId: "demon-war",
    stateId: "shaburak-dominant",
  },
  {
    text: "The Askarak demons are in advantage right now.",
    changeId: "demon-war",
    stateId: "askarak-advantage",
  },
  {
    text: "The Askarak are in advantage right now.",
    changeId: "demon-war",
    stateId: "askarak-advantage",
  },
  {
    text: "The Askarak have summoned their leaders and dominate the complex.",
    changeId: "demon-war",
    stateId: "askarak-dominant",
  },

  // ── Sea Serpent (The Fire-Feathered Serpent) ────────────────────────────────
  {
    text: "The Fire-Feathered Serpent is fast asleep.",
    changeId: "sea-serpent",
    stateId: "asleep",
  },
  {
    text: "The Fire-Feathered Serpent dreams and the earth is bleeding lava.",
    changeId: "sea-serpent",
    stateId: "dreaming",
  },
  {
    text: "The Fire-Feathered Serpent is awake. Renegade Quara control the sunken regions of Oramond.",
    changeId: "sea-serpent",
    stateId: "awake",
  },

  // ── Deeplings (leading sentence; the live reply ends with an action counter) ─
  {
    text: "The creatures of the deep are currently hiding in the black waters beneath.",
    changeId: "deeplings",
    stateId: "hiding",
  },
  {
    text: "God-king Qjell seems to be pleased, the floodgates to the Drowned Library have opened.",
    changeId: "deeplings",
    stateId: "floodgates-open",
  },
  {
    text: "The inner arcanum of the deep has been breached.",
    changeId: "deeplings",
    stateId: "arcanum-breached",
  },

  // ── Hive Born (same trailing-counter caveat) ────────────────────────────────
  {
    text: "The hive is well defended and prepared for war.",
    changeId: "hive-born",
    stateId: "defended",
  },
  {
    text: "The defences of the hive are breached. The hive structure to the east is open.",
    changeId: "hive-born",
    stateId: "breached",
  },
  {
    text: "The hives defences have fallen. Its armies are confused and in shambles. All structures are open for invaders.",
    changeId: "hive-born",
    stateId: "fallen",
  },

  // ── Mage Tower ──────────────────────────────────────────────────────────────
  {
    text: "The raging mage is currently in his tower in Zao and experimenting with the portal into another dimension.",
    changeId: "mage-tower",
    stateId: "portal-open",
  },
  {
    text: "The raging mage in Zao has been slain and the portal into another dimension will close.",
    changeId: "mage-tower",
    stateId: "mage-slain",
    unverifiedWording: true,
  },

  // ── Their Master's Voice ────────────────────────────────────────────────────
  {
    text: "The strange tower with the servants on Edron is covered in slime.",
    changeId: "masters-voice",
    stateId: "passable",
  },
  {
    text: "The strange tower with the servants on Edron currently seems to be completely impassable because of a severe slime outbreak.",
    changeId: "masters-voice",
    stateId: "impassable",
    unverifiedWording: true,
  },

  // ── Thornfire ───────────────────────────────────────────────────────────────
  {
    // Verified against a live Guide reply (Ustebra, 2026-09-10). TibiaWiki's transcript of the
    // same line spells it "bellow", which is kept as a variant so either source parses.
    text: "Countless firestarters are in their cells below Shadowthorn, but right now they are safely guarded.",
    alsoMatches: [
      "Countless firestarters are in their cells bellow Shadowthorn, but right now they are safely guarded.",
    ],
    changeId: "thornfire",
    stateId: "guarded",
  },
  {
    text: "Most guards and elves preventing the firestarters from breaking out have been slain. Shadowthorn is in danger of being set ablaze.",
    changeId: "thornfire",
    stateId: "breaking-out",
    unverifiedWording: true,
  },
  {
    text: "Shadowthorn burns, and the followers of the bog with it!",
    changeId: "thornfire",
    stateId: "burning",
  },
  {
    text: "Shadowthorn burns, but the Tibians have been successfully fighting the fire as well as the firefighters.",
    changeId: "thornfire",
    stateId: "being-fought",
    unverifiedWording: true,
  },

  // ── Swamp Fever ─────────────────────────────────────────────────────────────
  // All three tiers, captured from live Guide replies across fourteen worlds on 2026-09-11.
  // A 2012 TibiaWiki Talk-page comment had named exactly these three and quoted none of them,
  // so the catalog carried only the first and this change came back unanswered on eleven of
  // those fourteen worlds. The middle tier is the one that matters editorially: the fever is
  // still contained, and the medicine that keeps it contained is running out.
  {
    text: "The swamp fever in Venore is currently under control and there is enough medicine for everyone.",
    changeId: "swamp-fever",
    stateId: "under-control",
  },
  {
    text: "The swamp fever in Venore is currently under control, but medicine is direly needed to prevent the next outbreak.",
    changeId: "swamp-fever",
    stateId: "medicine-needed",
  },
  {
    text: "The swamp fever has broken out in Venore and feverish citizens are roaming the streets.",
    changeId: "swamp-fever",
    stateId: "outbreak",
  },

  // ── Horse Station (keyword "Horses") ───────────────────────────────────────
  {
    text: "The horse services near Thais and Venore are working normally.",
    changeId: "horse-station",
    stateId: "normal",
    unverifiedWording: true,
  },
  {
    text: "Horses are on the loose near Thais! As long as there haven't been enough horses chased back into the pen, the service is on hold.",
    changeId: "horse-station",
    stateId: "escaped",
  },
];
