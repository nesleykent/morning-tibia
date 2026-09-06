import type { MerchantId } from "@/types/merchant";

/**
 * Every message the World Board (Adventurer's Guild floor +1, near Charos) can print into
 * the server log, verbatim from TibiaWiki's "The World Board" article
 * (community-documented under CC-BY-SA — https://tibia.fandom.com/wiki/The_World_Board).
 *
 * The board prints one line per *currently active* Mini World Change. That is what makes a
 * complete reading special: because it is an exhaustive listing, a complete reading also
 * proves which changes are NOT running. See parseBoardLog.ts for how completeness is
 * established — it is never guessed from a fragment.
 *
 * `variantId` is set only where the board's own wording names the variant (Spirit Grounds,
 * Nightmare Isles, Poacher Caves). Where the board announces a change without pinning it
 * down — "near one of the major cities somewhere in Tibia", "There must be a camp
 * somewhere", the Jungle Camp line that names neither side — `variantId` is deliberately
 * absent, and the change lands in "active, variant unknown". Filling one in there would be
 * inventing information the player does not have.
 */
export interface BoardMessageEntry {
  text: string;
  changeId?: string;
  variantId?: string;
  merchantHint?: { merchantId: MerchantId; candidates: string[] };
}

/** The board's own fixed opening line — the one reliable marker of a complete reading. */
export const WORLD_BOARD_PREAMBLE =
  "This board will notify you of currently active mini world changes all over Tibia.";

export const BOARD_MESSAGES: BoardMessageEntry[] = [
  {
    text: "A fiery fury gate has opened near one of the major cities somewhere in Tibia.",
    changeId: "fury-gates",
    // No variant: the board says "somewhere in Tibia" and never names the city.
  },
  {
    text: "A big iceberg has been washed up at the coast north of Port Hope. It seems to be inhabited by strange white furballs.",
    changeId: "chakoya-iceberg",
  },
  {
    text: "The wild animals north of the Green Claw Swamp clearly dominate the area. But poachers come here to hunt them.",
    changeId: "poacher-caves",
    variantId: "game",
  },
  {
    text: "Poachers are ravaging the wildlife north of the Green Claw Swamp. But the animals seem to fight back!",
    changeId: "poacher-caves",
    variantId: "poachers",
  },
  {
    text: "Poachers have slaughtered nearly all wild animals north of the Green Claw Swamp. But vengeful spirits show up there now!",
    changeId: "poacher-caves",
    variantId: "ghost-wolves",
  },
  {
    text: "A hive infestation has been sighted south-west of Liberty Bay! An unnerving humming and buzzing is filling the air.",
    changeId: "hive-outpost",
  },
  {
    text: "Strange sounds echo through Trapwood as hunters and dworcs fight over the holy grounds and the game that roams there.",
    changeId: "jungle-camp",
    // No variant: this single line covers both factions. Only the Towncryer says which.
  },
  {
    text: "A sandstorm travels through Darama, leading to isles full of deadly creatures inside a nightmare. Avoid the northernmost coast!",
    changeId: "nightmare-isles",
    variantId: "daramas-northernmost-coast",
  },
  {
    text: "A sandstorm travels through Darama, leading to isles full of deadly creatures inside a nightmare. Avoid the river near Drefia!",
    changeId: "nightmare-isles",
    variantId: "the-river-near-drefia",
  },
  {
    text: "A sandstorm travels through Darama, leading to isles full of deadly creatures inside a nightmare. Avoid the Ankrahmun tar pits!",
    changeId: "nightmare-isles",
    variantId: "the-ankrahmun-tar-pits",
  },
  {
    text: "The full moon has a strange impact on the island of Grimvale. The small forest there seems darker, filled with nightly howls.",
    changeId: "grimvale",
  },
  {
    text: "Stampede! The Ape God has stirred up Tiquanda's elephants again!",
    changeId: "stampede",
  },
  {
    text: "Several banks in major coastal towns are being robbed! The thieves are still on the loose!",
    changeId: "bank-robbery",
  },
  {
    text: "Nomads travel the eternal sands of Ankrahmun's desert. There must be a camp somewhere.",
    changeId: "nomads",
    // No variant: "There must be a camp somewhere" — one of four, unnamed.
  },
  {
    text: "Judging by the unnerved mammoths in Svargrond, enough snow has melted away to reveal some very special flora.",
    changeId: "thawing",
  },
  {
    text: "The river in Zao Steppe runs deep, there may be more fish than usual!",
    changeId: "river-runs-deep",
  },
  {
    text: "Not again! Noodles has taken some royal freedom and left the castle, after him in the name of the king!",
    changeId: "noodles-is-gone",
  },
  {
    text: "Oriental ships sighted! A trader for exotic creature products may currently be visiting Carlin, Ankrahmun or Liberty Bay.",
    merchantHint: { merchantId: "yasir", candidates: ["Carlin", "Ankrahmun", "Liberty Bay"] },
  },
  {
    text: "Looks like the Queen's own royal trees are being cut down! The lumberjacks responsible shall be put to justice.",
    changeId: "lumberjack",
  },
  {
    text: "The volcano on Goroma sends its fiery message into the sky. A lot of creatures are flooding the lands together with its lava.",
    changeId: "fire-from-the-earth",
  },
  {
    text: "Hail to the King! It's Kingsday in Thais, join the celebration!",
    changeId: "kingsday",
  },
  {
    text: "The river south of the outlaw camp is flooding. A small island there should now be reachable safely.",
    changeId: "down-the-drain",
  },
  {
    text: "Sharpen your sword! The witch Wyda seems to be bored so pay her a visit!",
    changeId: "bored",
  },
  {
    text: "Bibby Bloodbath and her crew are roaming the lands, destroying everything in their path.",
    changeId: "warpath",
    // No variant: the board never names which of the three camps it is.
  },
  {
    text: "A whole nest of spiders needs to be exterminated as Mamma Longlegs is on the loose.",
    changeId: "spider-nest",
  },
  {
    text: "In case you have some spare tentacle pieces, you can now use Devovorga's very essence to enter a boss lair!",
    changeId: "devovorgas-essence",
  },
  {
    text: "An ice bridge now connects Svargrond to a frosty island, where monsters and a strange frozen creature have been sighted.",
    changeId: "chyllfroest",
  },
  {
    text: "Adventurers have told of a Spirit Gate in the Daramian mountains. Fight the restless undead!",
    changeId: "spirit-grounds",
    variantId: "darama",
  },
  {
    text: "Adventurers have told of a Spirit Gate in the Ghostlands. Fight the restless undead!",
    changeId: "spirit-grounds",
    variantId: "ghostlands",
  },
  {
    text: "Adventurers have told of a Spirit Gate in Vengoth. Fight the restless undead!",
    changeId: "spirit-grounds",
    variantId: "vengoth",
  },
];
