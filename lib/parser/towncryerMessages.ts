import type { MerchantId } from "@/types/merchant";

/**
 * Everything the Towncryer (Thais, around the depot and docks on Harbour and Main Street)
 * shouts about Mini World Changes, verbatim from TibiaWiki's "Towncryer" article
 * (community-documented under CC-BY-SA — https://tibia.fandom.com/wiki/Towncryer).
 * All 24 Mini World Changes have a documented shout.
 *
 * Why this is a separate catalog from the World Board's, and not just more board text:
 *
 * 1. **A shout is an announcement, never a listing.** The board enumerates every active
 *    change at once, so a complete reading proves a negative. The Towncryer mentions one
 *    change as he walks past. Silence about the other 23 is not evidence of anything, so a
 *    paste containing Towncryer shouts can never mark anything inactive — see
 *    parseTowncryerLog.
 * 2. **It sometimes says more than the board does.** For Jungle Camp the board gives one
 *    line covering both sides, while the Towncryer names the winner outright; that is the
 *    only in-game way to learn the faction short of walking there. Nightmare Isles and
 *    Spirit Grounds also name their location, and Poacher Caves its phase.
 *
 * The Towncryer's non-MWC shouts (Wyrdin's task, the postmaster's guild, the inquisition)
 * are intentionally absent — they are fixed advertising and say nothing about world state.
 */
export interface TowncryerMessageEntry {
  text: string;
  changeId?: string;
  variantId?: string;
  merchantHint?: { merchantId: MerchantId; candidates: string[] };
}

export const TOWNCRYER_MESSAGES: TowncryerMessageEntry[] = [
  {
    text: "Hear ye! Hear ye! Stand and deliver! That's what they shout, robbing banks in main's coastal towns and then hide out. Catch the thieves and make us proud, bring back the gold to please the crowd!",
    changeId: "bank-robbery",
  },
  {
    text: "Hear ye! Hear ye! The witch Wyda seems to be bored. Pay her a visit but sharpen your sword. She might come up with a terrible surprise, are you brave enough to believe your eyes?",
    changeId: "bored",
  },
  {
    text: "A floating vessel of ice is not at all nice when it brings unbidden friends to Port Hope's lands.",
    changeId: "chakoya-iceberg",
  },
  {
    text: "An icy bridge reaches toward an isle of frost and hidden fire, with cold-hearted monsters grim and dire.",
    changeId: "chyllfroest",
  },
  {
    text: "Hear ye! Hear ye! Use Devovorga's Essence to fight an evil presence! Trade your every tentacle piece, to enter a boss' lair with ease!",
    changeId: "devovorgas-essence",
  },
  {
    text: "Hear ye! Hear ye! A river is flooding, south of the outlaw base. Explore a new isle, an unknown place. Don't be afraid, but ready your blade.",
    changeId: "down-the-drain",
  },
  {
    text: "Hear ye! Hear ye! The volcano on Goroma is spitting fire. Creatures are spawning, strong and dire. Lava is heading up the land. Adventurer, be careful or it will be your last stand!",
    changeId: "fire-from-the-earth",
  },
  {
    text: "Hear ye! Hear ye! A fiery gate has opened, threatening a city! Guard the people frightened, their death would be a pity!",
    changeId: "fury-gates",
    // Like the board, the shout never names which city.
  },
  {
    text: "The full moon pale has risen over Grimvale. Help lift the curse, you won't be off worse!",
    changeId: "grimvale",
  },
  {
    text: "A chitinous Hive outpost has been located on Liberty Bay's coast. Make sure those locusts are toast!",
    changeId: "hive-outpost",
  },
  // Jungle Camp — the only in-game source that names the winning faction.
  {
    text: "Beware of Tiquanda's dworcs, you all! In their voodoo circle, heads will fall!",
    changeId: "jungle-camp",
    variantId: "dworcs",
  },
  {
    text: "Hunters in the Tiquanda jungle have made camp, behaving like tramps!",
    changeId: "jungle-camp",
    variantId: "hunters",
  },
  {
    text: "Hear ye! Hear ye! It is Kingsday, people, let us celebrate and sing! Decorate Thais and let the bells ring! Come to the arena to hear the swords cling. Let us rejoice! Hail to the King!",
    changeId: "kingsday",
  },
  {
    text: "Hear ye! Hear ye! North of the Queen's town, the royal trees are cut down. Will you deal with the suspect or report such kind of disrespect?",
    changeId: "lumberjack",
  },
  {
    text: "Near Drefia's mountains, a storm has revealed the entry to a nightmare that can't be sealed. Horrible creatures there spell instant death to all young adventurers who dare take a breath!",
    changeId: "nightmare-isles",
    variantId: "the-river-near-drefia",
  },
  {
    text: "Near Darashia's coast, a storm has revealed the entry to a nightmare that can't be sealed. Horrible creatures there spell instant death to all young adventurers who dare take a breath!",
    changeId: "nightmare-isles",
    variantId: "daramas-northernmost-coast",
  },
  {
    text: "In Ankrahmun's desert, a storm has revealed the entry to a nightmare that can't be sealed. Horrible creatures there spell instant death to all young adventurers who dare take a breath!",
    changeId: "nightmare-isles",
    variantId: "the-ankrahmun-tar-pits",
  },
  {
    text: "Hear ye! Hear ye! Ankrahmun's desert is the nomads' land. Find their camp in the golden sand, and a treasure may be close at hand!",
    changeId: "nomads",
  },
  {
    text: "Hear ye! Hear ye! Noodles is gone, the King in despair! Find the little rascal, look everywhere. Bring him back to get rewarded for your care!",
    changeId: "noodles-is-gone",
  },
  {
    text: "Hear ye! Hear ye! What a lucky and beautiful day! Visit Carlin, Ankrahmun, or Liberty Bay. Yasir, the oriental trader might be there. Gather your creature products, for this chance is rare.",
    merchantHint: { merchantId: "yasir", candidates: ["Carlin", "Ankrahmun", "Liberty Bay"] },
  },
  {
    text: "Wild animals roam beneath the loam of the Orc Lands. The hunters need some helping hands!",
    changeId: "poacher-caves",
    variantId: "game",
  },
  {
    text: "Poachers roam beneath the loam of the Orc Lands. The animals need vengeful pals!",
    changeId: "poacher-caves",
    variantId: "poachers",
  },
  {
    text: "Ghostly animals roam beneath the loam of the Orc Lands. Poaching is stunted, hunters are hunted!",
    changeId: "poacher-caves",
    variantId: "ghost-wolves",
  },
  {
    text: "Hear ye! Hear ye! In Zao Steppe the river runs deep. If you catch a strange fish it is yours to keep.",
    changeId: "river-runs-deep",
  },
  {
    text: "Hear ye! Hear ye! Mamma Longlegs will not rest while she guards her cosy nest. Exterminate its kin in there to finally get rid of her.",
    changeId: "spider-nest",
  },
  {
    text: "Hear ye! Hear ye! In Darashia, a gate has opened to the spirit ground, where nightmares, banshees and ghouls abound!",
    changeId: "spirit-grounds",
    variantId: "darama",
  },
  {
    text: "Hear ye! Hear ye! In the Ghostlands, a gate has opened to the spirit ground, where nightmares, banshees and ghouls abound!",
    changeId: "spirit-grounds",
    variantId: "ghostlands",
  },
  {
    text: "Hear ye! Hear ye! In Vengoth, a gate has opened to the spirit ground, where nightmares, banshees and ghouls abound!",
    changeId: "spirit-grounds",
    variantId: "vengoth",
  },
  {
    text: "Hear ye! Hear ye! Tiquanda's elephants are terrified, the Ape God's footsteps are a scary sight. So hunt for their tusks while they are filled with fright!",
    changeId: "stampede",
  },
  {
    text: "Hear ye! Hear ye! Mammoths silently watch as the snow melts away. It reveals special flowers which are not meant to stay. Grow their seeds to brighten up your day!",
    changeId: "thawing",
  },
  {
    text: "Hear ye! Hear ye! Bibby is back with blood as her track! Wreaking havoc on her path, let her feel your wrath!",
    changeId: "warpath",
  },
];
