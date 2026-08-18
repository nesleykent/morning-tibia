import type { MiniWorldChangeState } from "@/types/miniWorldChange";

/**
 * The World Board (Adventurer's Guild, floor +1, near Charos) prints one line per
 * currently active Mini World Change. Message text is verbatim from TibiaWiki's
 * documentation of the board ("The World Board", community-documented under CC-BY-SA —
 * https://tibia.fandom.com/wiki/The_World_Board), not derived from any fansite's tool.
 *
 * Where the board confirms a change is active but doesn't carry enough detail to set an
 * exact stage/location, `note` is set instead of `state` — the parser surfaces it as a
 * hint rather than guessing a value.
 */
export interface BoardMessageEntry {
  text: string;
  changeId?: string;
  state?: MiniWorldChangeState;
  detail?: string;
  note?: string;
  merchantHint?: { merchantId: "rashid" | "yasir"; candidates: string[] };
}

export const BOARD_MESSAGES: BoardMessageEntry[] = [
  {
    text: "A fiery fury gate has opened near one of the major cities somewhere in Tibia.",
    changeId: "fury-gate",
    state: "active",
  },
  {
    text: "A big iceberg has been washed up at the coast north of Port Hope. It seems to be inhabited by strange white furballs.",
    changeId: "big-iceberg",
    note: "Board confirms Big Iceberg / Chakoya is active — set the exact stage below.",
  },
  {
    text: "The wild animals north of the Green Claw Swamp clearly dominate the area. But poachers come here to hunt them.",
    changeId: "poacher-caves",
    state: "stage1",
  },
  {
    text: "Poachers are ravaging the wildlife north of the Green Claw Swamp. But the animals seem to fight back!",
    changeId: "poacher-caves",
    state: "stage2",
  },
  {
    text: "Poachers have slaughtered nearly all wild animals north of the Green Claw Swamp. But vengeful spirits show up there now!",
    changeId: "poacher-caves",
    state: "stage3",
  },
  {
    text: "A hive infestation has been sighted south-west of Liberty Bay! An unnerving humming and buzzing is filling the air.",
    changeId: "hive-outpost",
    state: "active",
  },
  {
    text: "Strange sounds echo through Trapwood as hunters and dworcs fight over the holy grounds and the game that roams there.",
    changeId: "jungle-camp",
    state: "active",
  },
  {
    text: "A sandstorm travels through Darama, leading to isles full of deadly creatures inside a nightmare. Avoid the northernmost coast!",
    changeId: "nightmare-isles",
    state: "location",
    detail: "Darama's northernmost coast",
  },
  {
    text: "A sandstorm travels through Darama, leading to isles full of deadly creatures inside a nightmare. Avoid the river near Drefia!",
    changeId: "nightmare-isles",
    state: "location",
    detail: "River near Drefia",
  },
  {
    text: "A sandstorm travels through Darama, leading to isles full of deadly creatures inside a nightmare. Avoid the Ankrahmun tar pits!",
    changeId: "nightmare-isles",
    state: "location",
    detail: "Ankrahmun tar pits",
  },
  {
    text: "The full moon has a strange impact on the island of Grimvale. The small forest there seems darker, filled with nightly howls.",
    changeId: "grimvale",
    state: "active",
  },
  {
    text: "Stampede! The Ape God has stirred up Tiquanda's elephants again!",
    changeId: "stampede",
    state: "active",
  },
  {
    text: "Several banks in major coastal towns are being robbed! The thieves are still on the loose!",
    changeId: "bank-robbery",
    state: "active",
  },
  {
    text: "Nomads travel the eternal sands of Ankrahmun's desert. There must be a camp somewhere.",
    changeId: "darama-nomads",
    note: "Board confirms the Darama Nomads are active — the camp's exact spot isn't in the board text.",
  },
  {
    text: "Judging by the unnerved mammoths in Svargrond, enough snow has melted away to reveal some very special flora.",
    changeId: "thawing",
    note: "Board confirms Thawing is active — set the exact stage below.",
  },
  {
    text: "The river in Zao Steppe runs deep, there may be more fish than usual!",
    changeId: "river-runs-deep",
    state: "active",
  },
  {
    text: "Not again! Noodles has taken some royal freedom and left the castle, after him in the name of the king!",
    changeId: "noodles",
    note: "Board confirms Noodles has left the castle — his exact spot isn't in the board text.",
  },
  {
    text: "Oriental ships sighted! A trader for exotic creature products may currently be visiting Carlin, Ankrahmun or Liberty Bay.",
    merchantHint: { merchantId: "rashid", candidates: ["Carlin", "Ankrahmun", "Liberty Bay"] },
  },
  {
    text: "Looks like the Queen's own royal trees are being cut down! The lumberjacks responsible shall be put to justice.",
    changeId: "lumberjack",
    state: "active",
  },
  {
    text: "The volcano on Goroma sends its fiery message into the sky. A lot of creatures are flooding the lands together with its lava.",
    changeId: "goroma-volcano",
    note: "Board confirms Goroma Volcano is active — set the exact stage below.",
  },
  {
    text: "Hail to the King! It's Kingsday in Thais, join the celebration!",
    changeId: "thais-kingsday",
    state: "active",
  },
  {
    text: "The river south of the outlaw camp is flooding. A small island there should now be reachable safely.",
    changeId: "down-the-drain",
    state: "active",
  },
  {
    text: "Sharpen your sword! The witch Wyda seems to be bored so pay her a visit!",
    changeId: "bored-witch",
    state: "active",
  },
  {
    text: "Bibby Bloodbath and her crew are roaming the lands, destroying everything in their path.",
    changeId: "bibbys-bloodbath",
    note: "Board confirms Bibby's Bloodbath is active — her exact spot isn't in the board text.",
  },
  {
    text: "A whole nest of spiders needs to be exterminated as Mamma Longlegs is on the loose.",
    changeId: "spiders-nest",
    state: "active",
  },
  {
    text: "In case you have some spare tentacle pieces, you can now use Devovorga's very essence to enter a boss lair!",
    changeId: "devovorga-essence",
    note: "Board confirms Devovorga Essence is active — set the exact stage below.",
  },
  {
    text: "An ice bridge now connects Svargrond to a frosty island, where monsters and a strange frozen creature have been sighted.",
    changeId: "chyllfroest",
    state: "active",
  },
  {
    text: "Adventurers have told of a Spirit Gate in the Daramian mountains. Fight the restless undead!",
    changeId: "spirit-gate",
    state: "location",
    detail: "Darama",
  },
  {
    text: "Adventurers have told of a Spirit Gate in the Ghostlands. Fight the restless undead!",
    changeId: "spirit-gate",
    state: "location",
    detail: "Ghostlands",
  },
  {
    text: "Adventurers have told of a Spirit Gate in Vengoth. Fight the restless undead!",
    changeId: "spirit-gate",
    state: "location",
    detail: "Vengoth",
  },
];
