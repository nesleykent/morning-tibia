import { MINI_WORLD_CHANGES_BY_ID, SPIRIT_GROUND_SETS } from "@/lib/defaults/miniWorldChanges";
import { getTranslation, type BriefingLanguage } from "./translations";

type Lang<T> = Record<BriefingLanguage, T>;
function pick<T>(map: Lang<T>, language: BriefingLanguage): T {
  return map[language];
}

/**
 * A change's narrative depends on the variant that is running, so resolvers take the
 * variant's *id* (or null when the source confirmed the change without naming one).
 *
 * The id, not the label. Passing the English label and interpolating it — sometimes through
 * `.toLowerCase()` — produced sentences like "As Nightmare Isles estão acessíveis por darama's
 * northernmost coast": half Portuguese, half an English catalog string with its capitals
 * stripped. A variant is a closed set, so each language can simply name every member.
 */
type Resolver = (
  variantId: string | null,
  language: BriefingLanguage,
  contentId: string | null,
) => string;

/** Wording that doesn't change with the variant. */
function simple(map: Lang<string>): Resolver {
  return (_variantId, language) => pick(map, language);
}

/** "and" / "e" / "y" / "i" — the one word that changes when a list of Tibia nouns is localized. */
const AND: Lang<string> = { pt: "e", en: "and", es: "y", pl: "i" };

/** "Ghost, Ghoul, Bonelord and Mummy", with only the conjunction translated. */
function creatureList(creatures: readonly string[], language: BriefingLanguage): string {
  if (creatures.length <= 1) return creatures[0] ?? "";
  return `${creatures.slice(0, -1).join(", ")} ${pick(AND, language)} ${creatures[creatures.length - 1]}`;
}

/**
 * A change whose sentence names the variant, with the variant's own name written out in each
 * language. `null` is the normal case for Fury Gates and Nomads, not a fallback: those sources
 * confirm the change without ever saying where.
 */
function byNamedVariant(
  names: Lang<Record<string, string>>,
  sentence: Lang<(name: string | null) => string>,
): Resolver {
  return (variantId, language) => {
    const name = variantId ? (pick(names, language)[variantId] ?? null) : null;
    return pick(sentence, language)(name);
  };
}

/**
 * The options a change still has, named, in the reader's language and in catalog order.
 *
 * The ids come from lib/defaults/miniWorldChanges.ts rather than from a second list here, so
 * the sentence cannot drift out of step with the picker the player answers it in: add a city
 * to the catalog and it appears in this sentence the same day. The localized names come from
 * the same tables the "we do know" wording uses.
 *
 * This is what replaced "which one isn't known yet". A variant nobody has looked at is not
 * unknowable; it is a short list, and printing the list is what turns the sentence from a
 * shrug into something a reader can act on.
 */
function optionsOf(
  changeId: string,
  names: Lang<Record<string, string>>,
  language: BriefingLanguage,
): string {
  const variants = MINI_WORLD_CHANGES_BY_ID.get(changeId)?.variants ?? [];
  const labels = variants
    .map((variant) => pick(names, language)[variant.id])
    .filter((label): label is string => Boolean(label));
  return getTranslation(language).orList(labels);
}

/**
 * Wording with two forms: one for "we know which one", one for "confirmed running but the
 * source never says which". The second is not a fallback — for Fury Gates and Nomads it is
 * the normal case, and saying it plainly is the whole point.
 */
function byVariant(map: Lang<(variantId: string | null) => string>): Resolver {
  return (variantId, language) => pick(map, language)(variantId);
}

/**
 * Variant names, per language, keyed by the variant id from lib/defaults/miniWorldChanges.ts.
 *
 * Place and creature names that are official Tibia nouns stay identical in every language —
 * that is the product rule, and it is why these tables repeat themselves for cities. What does
 * get translated is everything around them: "Darama's northernmost coast" is a description, not
 * a name, and leaving it in English produced the half-and-half prose this replaced.
 */
const CITY_NAMES: Record<string, string> = {
  abdendriel: "Ab'Dendriel",
  ankrahmun: "Ankrahmun",
  carlin: "Carlin",
  darashia: "Darashia",
  edron: "Edron",
  kazordoon: "Kazordoon",
  "liberty-bay": "Liberty Bay",
  "port-hope": "Port Hope",
  thais: "Thais",
  venore: "Venore",
};

const REGION_NAMES: Record<string, string> = {
  darama: "Darama",
  ghostlands: "Ghostlands",
  vengoth: "Vengoth",
};

const everyLanguage = <T,>(value: T): Lang<T> => ({ pt: value, en: value, es: value, pl: value });

const NIGHTMARE_PORTALS: Lang<Record<string, string>> = {
  pt: {
    "daramas-northernmost-coast": "na costa mais ao norte de Darama",
    "the-river-near-drefia": "no rio perto de Drefia",
    "the-ankrahmun-tar-pits": "nos poços de piche de Ankrahmun",
  },
  en: {
    "daramas-northernmost-coast": "on Darama's northernmost coast",
    "the-river-near-drefia": "by the river near Drefia",
    "the-ankrahmun-tar-pits": "in the Ankrahmun tar pits",
  },
  es: {
    "daramas-northernmost-coast": "en la costa más al norte de Darama",
    "the-river-near-drefia": "junto al río cerca de Drefia",
    "the-ankrahmun-tar-pits": "en los pozos de alquitrán de Ankrahmun",
  },
  pl: {
    "daramas-northernmost-coast": "na najbardziej wysuniętym na północ wybrzeżu Daramy",
    "the-river-near-drefia": "przy rzece koło Drefii",
    "the-ankrahmun-tar-pits": "w smolistych dołach Ankrahmun",
  },
};

const NOMAD_CAMPS: Lang<Record<string, string>> = {
  pt: {
    "northeast-of-the-shadow-tomb": "a nordeste do Shadow Tomb",
    "south-of-the-tarpit-tomb": "ao sul do Tarpit Tomb",
    "south-of-the-ancient-ruins-tomb": "ao sul do Ancient Ruins Tomb",
    "northeast-of-the-ancient-ruins-tomb": "a nordeste do Ancient Ruins Tomb",
  },
  en: {
    "northeast-of-the-shadow-tomb": "north-east of the Shadow Tomb",
    "south-of-the-tarpit-tomb": "south of the Tarpit Tomb",
    "south-of-the-ancient-ruins-tomb": "south of the Ancient Ruins Tomb",
    "northeast-of-the-ancient-ruins-tomb": "north-east of the Ancient Ruins Tomb",
  },
  es: {
    "northeast-of-the-shadow-tomb": "al noreste del Shadow Tomb",
    "south-of-the-tarpit-tomb": "al sur del Tarpit Tomb",
    "south-of-the-ancient-ruins-tomb": "al sur del Ancient Ruins Tomb",
    "northeast-of-the-ancient-ruins-tomb": "al noreste del Ancient Ruins Tomb",
  },
  pl: {
    "northeast-of-the-shadow-tomb": "na północny wschód od Shadow Tomb",
    "south-of-the-tarpit-tomb": "na południe od Tarpit Tomb",
    "south-of-the-ancient-ruins-tomb": "na południe od Ancient Ruins Tomb",
    "northeast-of-the-ancient-ruins-tomb": "na północny wschód od Ancient Ruins Tomb",
  },
};

const WARPATH_CAMPS: Lang<Record<string, string>> = {
  pt: {
    "north-of-the-jakundaf-desert": "ao norte do Jakundaf Desert",
    "north-of-carlin": "ao norte de Carlin",
    "east-of-the-femor-hills": "a leste das Femor Hills",
  },
  en: {
    "north-of-the-jakundaf-desert": "north of the Jakundaf Desert",
    "north-of-carlin": "north of Carlin",
    "east-of-the-femor-hills": "east of the Femor Hills",
  },
  es: {
    "north-of-the-jakundaf-desert": "al norte del Jakundaf Desert",
    "north-of-carlin": "al norte de Carlin",
    "east-of-the-femor-hills": "al este de las Femor Hills",
  },
  pl: {
    "north-of-the-jakundaf-desert": "na północ od Jakundaf Desert",
    "north-of-carlin": "na północ od Carlin",
    "east-of-the-femor-hills": "na wschód od Femor Hills",
  },
};

const FORSAKEN_SETS: Lang<Record<string, string>> = {
  pt: {
    rorcs: "Rorcs",
    "leaf-golems": "Leaf Golems e Forest Furies",
    cyclopes: "Cyclopes",
    "lost-dwarves": "Drillworms e Lost Dwarves",
  },
  en: {
    rorcs: "Rorcs",
    "leaf-golems": "Leaf Golems and Forest Furies",
    cyclopes: "Cyclopes",
    "lost-dwarves": "Drillworms and Lost Dwarves",
  },
  es: {
    rorcs: "Rorcs",
    "leaf-golems": "Leaf Golems y Forest Furies",
    cyclopes: "Cyclopes",
    "lost-dwarves": "Drillworms y Lost Dwarves",
  },
  pl: {
    rorcs: "Rorki",
    "leaf-golems": "Leaf Golemy i Forest Furie",
    cyclopes: "Cyklopy",
    "lost-dwarves": "Drillwormy i Lost Dwarves",
  },
};

/**
 * "We haven't checked which creatures are in the Forsaken Mine yet. It can be…"
 *
 * The mine is never off, so this is the *only* thing there is not to know about it, and it
 * reads the same whether nobody has looked at all or somebody confirmed the mine without
 * naming the set. Those are one knowledge state, and printing them differently would tell the
 * reader about a distinction the app makes internally rather than about the mine.
 *
 * It replaced "the inhabitants rotated at server save, look down from the first floor before
 * descending" — an instruction, in a message that gets forwarded to a guild channel where it
 * addresses the wrong person. The four rotations named plainly are what a reader can act on.
 */
function forsakenRotationUnknown(language: BriefingLanguage): string {
  const sets = optionsOf("forsaken", FORSAKEN_SETS, language);
  return pick(
    {
      pt: `Ainda não conferimos quais criaturas estão na Forsaken Mine. Pode ser uma destas rotações: ${sets}.`,
      en: `We haven't checked which creatures are in the Forsaken Mine yet. It can be one of these rotations: ${sets}.`,
      es: `Todavía no comprobamos qué criaturas están en la Forsaken Mine. Puede ser una de estas rotaciones: ${sets}.`,
      pl: `Nie sprawdziliśmy jeszcze, jakie stwory są w Forsaken Mine. Może to być jedna z tych rotacji: ${sets}.`,
    },
    language,
  );
}

const NARRATIVES: Record<string, Resolver> = {
  "fury-gates": (variantId, language) => {
    const city = variantId ? CITY_NAMES[variantId] : null;
    if (city) {
      return pick(
        {
          pt: `Um fiery fury gate se abriu perto de ${city}.`,
          en: `A fiery fury gate has opened near ${city}.`,
          es: `Se abrió una fiery fury gate cerca de ${city}.`,
          pl: `W pobliżu ${city} otworzyła się fiery fury gate.`,
        },
        language,
      );
    }
    const cities = optionsOf("fury-gates", everyLanguage(CITY_NAMES), language);
    return pick(
      {
        pt: `Ainda não conferimos qual Fury Gate está ativo. Pode ser perto de uma destas cidades: ${cities}.`,
        en: `We haven't checked which Fury Gate is active yet. It can be near one of these cities: ${cities}.`,
        es: `Todavía no comprobamos qué Fury Gate está activo. Puede estar cerca de una de estas ciudades: ${cities}.`,
        pl: `Nie sprawdziliśmy jeszcze, który Fury Gate jest aktywny. Może być przy jednym z tych miast: ${cities}.`,
      },
      language,
    );
  },
  "hive-outpost": simple({
    pt: "Uma infestação da Hive foi avistada a sudoeste de Liberty Bay.",
    en: "A Hive infestation has been sighted south-west of Liberty Bay.",
    es: "Se avistó una infestación de la Hive al suroeste de Liberty Bay.",
    pl: "Na południowy zachód od Liberty Bay zaobserwowano inwazję Hive.",
  }),
  warpath: (variantId, language) => {
    const place = variantId ? pick(WARPATH_CAMPS, language)[variantId] : null;
    if (place) {
      return pick(
        {
          pt: `Bibby Bloodbath e sua tripulação estão acampadas ${place}.`,
          en: `Bibby Bloodbath and her crew are camped ${place}.`,
          es: `Bibby Bloodbath y su tripulación acampan ${place}.`,
          pl: `Bibby Bloodbath i jej załoga obozują ${place}.`,
        },
        language,
      );
    }
    const places = optionsOf("warpath", WARPATH_CAMPS, language);
    return pick(
      {
        pt: `Ainda não conferimos onde o acampamento de Bibby Bloodbath está. Pode ser em um destes lugares: ${places}.`,
        en: `We haven't checked where Bibby Bloodbath's camp is yet. It can be at one of these places: ${places}.`,
        es: `Todavía no comprobamos dónde está el campamento de Bibby Bloodbath. Puede ser en uno de estos lugares: ${places}.`,
        pl: `Nie sprawdziliśmy jeszcze, gdzie stoi obóz Bibby Bloodbath. Może być w jednym z tych miejsc: ${places}.`,
      },
      language,
    );
  },
  "devovorgas-essence": simple({
    pt: "Devovorga's essence está disponível em Vengoth para entrar em sua guarida.",
    en: "Devovorga's essence is available at Vengoth to enter its lair.",
    es: "La esencia de Devovorga está disponible en Vengoth para entrar a su guarida.",
    pl: "Esencja Devovorgi jest dostępna w Vengoth, by wejść do jej legowiska.",
  }),
  "chakoya-iceberg": simple({
    pt: "Um grande iceberg encalhou na costa ao norte de Port Hope, habitado por estranhas criaturas peludas.",
    en: "A big iceberg has washed up at the coast north of Port Hope, inhabited by strange white furballs.",
    es: "Un gran iceberg encalló en la costa al norte de Port Hope, habitado por extrañas criaturas peludas.",
    pl: "Wielka góra lodowa osiadła na wybrzeżu na północ od Port Hope, zamieszkana przez dziwne włochate stwory.",
  }),
  // Two unknowns, answered separately: the board names the region, and nothing at all names
  // which of the three hunting grounds is behind the gate.
  "spirit-grounds": (variantId, language, contentId) => {
    const region = variantId ? REGION_NAMES[variantId] : null;
    const gate = pick(
      {
        pt: `Um Spirit Gate está aberto em ${region ?? "uma das três regiões"}.`,
        en: `A Spirit Gate is open in ${region ?? "one of the three regions"}.`,
        es: `Hay un Spirit Gate abierto en ${region ?? "una de las tres regiones"}.`,
        pl: `Spirit Gate jest otwarta w ${region ?? "jednym z trzech regionów"}.`,
      },
      language,
    );

    const set = SPIRIT_GROUND_SETS.find((candidate) => candidate.id === contentId);
    if (set) {
      const creatures = creatureList(set.creatures, language);
      return `${gate} ${pick(
        {
          pt: `Do outro lado estão ${creatures}.`,
          en: `Behind it are ${creatures}.`,
          es: `Del otro lado están ${creatures}.`,
          pl: `Po drugiej stronie są ${creatures}.`,
        },
        language,
      )}`;
    }

    // Just the question. The twelve creature names it could be answered with are a line of
    // their own (see spiritGroundOptionsLine), because a state sentence carrying all three
    // sets was a 240-character italic paragraph that a reader on a phone skipped.
    return `${gate} ${pick(
      {
        pt: "Ainda não conferimos qual dos três terrenos de caça está do outro lado.",
        en: "We haven't checked which of the three hunting grounds is behind it.",
        es: "Todavía no comprobamos cuál de los tres terrenos de caza está del otro lado.",
        pl: "Nie sprawdziliśmy jeszcze, który z trzech terenów łowieckich jest po drugiej stronie.",
      },
      language,
    )}`;
  },
  "nightmare-isles": byNamedVariant(NIGHTMARE_PORTALS, {
    pt: (place) =>
      place
        ? `O portal para as Nightmare Isles está ${place}.`
        : "O portal para as Nightmare Isles está em algum ponto de Darama.",
    en: (place) =>
      place
        ? `The portal to the Nightmare Isles is ${place}.`
        : "The portal to the Nightmare Isles is somewhere in Darama.",
    es: (place) =>
      place
        ? `El portal a las Nightmare Isles está ${place}.`
        : "El portal a las Nightmare Isles está en algún punto de Darama.",
    pl: (place) =>
      place
        ? `Portal do Nightmare Isles jest ${place}.`
        : "Portal do Nightmare Isles jest gdzieś w Daramie.",
  }),
  "fire-from-the-earth": simple({
    pt: "O vulcão Hellgore em Goroma está em erupção, trazendo criaturas mais fortes junto com a lava.",
    en: "The Hellgore volcano on Goroma is erupting, bringing stronger creatures along with the lava.",
    es: "El volcán Hellgore en Goroma está en erupción, trayendo criaturas más fuertes junto con la lava.",
    pl: "Wulkan Hellgore na Goroma wybucha, sprowadzając silniejsze stworzenia razem z lawą.",
  }),
  nomads: (variantId, language) => {
    const camp = variantId ? pick(NOMAD_CAMPS, language)[variantId] : null;
    if (camp) {
      return pick(
        {
          pt: `Os nômades acamparam em Kha'labal, ${camp}.`,
          en: `The nomads have camped in Kha'labal, ${camp}.`,
          es: `Los nómadas acamparon en Kha'labal, ${camp}.`,
          pl: `Nomadzi rozbili obóz w Kha'labal, ${camp}.`,
        },
        language,
      );
    }
    const camps = optionsOf("nomads", NOMAD_CAMPS, language);
    return pick(
      {
        pt: `Ainda não conferimos qual acampamento nômade está ativo. Pode ser um destes lugares: ${camps}.`,
        en: `We haven't checked which Nomad camp is active yet. It can be one of these locations: ${camps}.`,
        es: `Todavía no comprobamos qué campamento nómada está activo. Puede ser uno de estos lugares: ${camps}.`,
        pl: `Nie sprawdziliśmy jeszcze, który obóz nomadów jest aktywny. Może to być jedno z tych miejsc: ${camps}.`,
      },
      language,
    );
  },
  bored: simple({
    pt: "A bruxa Wyda está entediada e recebe visitas.",
    en: "The witch Wyda is bored and taking visitors.",
    es: "La bruja Wyda está aburrida y recibe visitas.",
    pl: "Wiedźma Wyda się nudzi i przyjmuje gości.",
  }),
  "noodles-is-gone": simple({
    pt: "Noodles fugiu do castelo. Pegue uma coleira com King Tibianus e procure pela península de Thais.",
    en: "Noodles has left the castle. Get a leash from King Tibianus and search the Thaian peninsula.",
    es: "Noodles se escapó del castillo. Pide una correa a King Tibianus y busca por la península de Thais.",
    pl: "Noodles uciekł z zamku. Weź smycz od King Tibianus i przeszukaj półwysep Thais.",
  }),
  kingsday: simple({
    pt: "É Kingsday em Thais. A celebração está em andamento.",
    en: "It's Kingsday in Thais. The celebration is underway.",
    es: "Es Kingsday en Thais. La celebración está en curso.",
    pl: "W Thais trwa Kingsday.",
  }),
  thawing: simple({
    pt: "Neve suficiente derreteu perto de Svargrond para revelar Ice Flowers.",
    en: "Enough snow has melted near Svargrond to reveal Ice Flowers.",
    es: "Suficiente nieve se ha derretido cerca de Svargrond para revelar Ice Flowers.",
    pl: "W pobliżu Svargrond stopiło się wystarczająco dużo śniegu, by odsłonić Ice Flowers.",
  }),
  "spider-nest": simple({
    pt: "Um ninho inteiro de aranhas precisa ser exterminado. Mamma Longlegs está à solta.",
    en: "A whole nest of spiders needs exterminating. Mamma Longlegs is on the loose.",
    es: "Todo un nido de arañas necesita ser exterminado. Mamma Longlegs anda suelta.",
    pl: "Całe gniazdo pająków wymaga eksterminacji. Mamma Longlegs jest na wolności.",
  }),
  "poacher-caves": byVariant({
    pt: (phase) =>
      phase === "game"
        ? "Os animais selvagens dominam a área ao norte do Green Claw Swamp."
        : phase === "poachers"
          ? "Caçadores furtivos estão devastando a vida selvagem ao norte do Green Claw Swamp."
          : phase === "ghost-wolves"
            ? "Ghost Wolves e Gloom Wolves tomaram o lugar dos animais ao norte do Green Claw Swamp."
            : "Ainda não conferimos quem domina as cavernas ao norte do Green Claw Swamp. Podem ser os animais selvagens, os caçadores furtivos ou os Ghost Wolves.",
    en: (phase) =>
      phase === "game"
        ? "Wild animals dominate the area north of the Green Claw Swamp."
        : phase === "poachers"
          ? "Poachers are ravaging the wildlife north of the Green Claw Swamp."
          : phase === "ghost-wolves"
            ? "Ghost Wolves and Gloom Wolves have taken over north of the Green Claw Swamp."
            : "We haven't checked who dominates the caves north of the Green Claw Swamp yet. It can be the wild animals, the poachers or the Ghost Wolves.",
    es: (phase) =>
      phase === "game"
        ? "Los animales salvajes dominan la zona al norte del Green Claw Swamp."
        : phase === "poachers"
          ? "Los cazadores furtivos devastan la fauna al norte del Green Claw Swamp."
          : phase === "ghost-wolves"
            ? "Los Ghost Wolves y Gloom Wolves han tomado el control al norte del Green Claw Swamp."
            : "Todavía no comprobamos quién domina las cuevas al norte del Green Claw Swamp. Pueden ser los animales salvajes, los cazadores furtivos o los Ghost Wolves.",
    pl: (phase) =>
      phase === "game"
        ? "Dzikie zwierzęta dominują na terenie na północ od Green Claw Swamp."
        : phase === "poachers"
          ? "Kłusownicy dziesiątkują dziką przyrodę na północ od Green Claw Swamp."
          : phase === "ghost-wolves"
            ? "Ghost Wolves i Gloom Wolves przejęły teren na północ od Green Claw Swamp."
            : "Nie sprawdziliśmy jeszcze, kto panuje w jaskiniach na północ od Green Claw Swamp. Mogą to być dzikie zwierzęta, kłusownicy albo Ghost Wolves.",
  }),
  "jungle-camp": byVariant({
    pt: (side) =>
      side === "hunters"
        ? "Os caçadores dominam as terras sagradas de Trapwood."
        : side === "dworcs"
          ? "Os dworcs dominam as terras sagradas de Trapwood."
          : "Ainda não conferimos quem está controlando o Jungle Camp. Podem ser os Hunters ou os Dworcs.",
    en: (side) =>
      side === "hunters"
        ? "The hunters hold Trapwood's holy grounds."
        : side === "dworcs"
          ? "The dworcs hold Trapwood's holy grounds."
          : "We haven't checked who's controlling the Jungle Camp yet. It can be either Hunters or Dworcs.",
    es: (side) =>
      side === "hunters"
        ? "Los cazadores dominan las tierras sagradas de Trapwood."
        : side === "dworcs"
          ? "Los dworcs dominan las tierras sagradas de Trapwood."
          : "Todavía no comprobamos quién controla el Jungle Camp. Pueden ser los Hunters o los Dworcs.",
    pl: (side) =>
      side === "hunters"
        ? "Myśliwi kontrolują święte ziemie Trapwood."
        : side === "dworcs"
          ? "Dworcowie kontrolują święte ziemie Trapwood."
          : "Nie sprawdziliśmy jeszcze, kto kontroluje Jungle Camp. Mogą to być Hunters albo Dworcs.",
  }),
  grimvale: simple({
    pt: "A lua cheia tem um efeito estranho sobre a ilha de Grimvale.",
    en: "The full moon has a strange effect on the island of Grimvale.",
    es: "La luna llena tiene un efecto extraño sobre la isla de Grimvale.",
    pl: "Pełnia księżyca dziwnie wpływa na wyspę Grimvale.",
  }),
  stampede: simple({
    pt: "Os elefantes de Tiquanda foram provocados por Ape God e estão em estampida.",
    en: "Tiquanda's elephants have been stirred into a stampede by the Ape God.",
    es: "Los elefantes de Tiquanda fueron provocados por Ape God y están en estampida.",
    pl: "Słonie z Tiquandy zostały pobudzone przez Ape God i wpadły w stampede.",
  }),
  "bank-robbery": simple({
    pt: "Bancos das principais cidades costeiras estão sendo roubados.",
    en: "Banks in major coastal towns are being robbed.",
    es: "Se están robando bancos en las principales ciudades costeras.",
    pl: "W głównych nadmorskich miastach napadane są banki.",
  }),
  "river-runs-deep": simple({
    pt: "O rio de Zao Steppe está cheio. Há mais peixes que o normal.",
    en: "The Zao Steppe river runs deep. There's more fish than usual.",
    es: "El río de Zao Steppe está crecido. Hay más peces de lo normal.",
    pl: "Rzeka w Zao Steppe jest pełna. Ryb jest więcej niż zwykle.",
  }),
  lumberjack: simple({
    pt: "As árvores reais da Rainha estão sendo derrubadas.",
    en: "The Queen's own royal trees are being cut down.",
    es: "Los árboles reales de la Reina están siendo talados.",
    pl: "Królewskie drzewa Królowej są wycinane.",
  }),
  "down-the-drain": simple({
    pt: "O rio ao sul do acampamento de fora-da-lei está inundando uma pequena ilha, agora acessível.",
    en: "The river south of the outlaw camp is flooding a small island, now reachable.",
    es: "El río al sur del campamento de forajidos inunda una pequeña isla, ahora accesible.",
    pl: "Rzeka na południe od obozu banitów zalewa małą wyspę, teraz dostępną.",
  }),
  "beaver-breakout": simple({
    pt: "Os Giant Beavers estão soltos em Silvertides, Marapur. Dá para domar a montaria.",
    en: "The Giant Beavers are loose at Silvertides in Marapur. The mount can be tamed.",
    es: "Los Giant Beavers están sueltos en Silvertides, Marapur. Se puede domar la montura.",
    pl: "Giant Beavery są na wolności w Silvertides w Marapur. Można oswoić wierzchowca.",
  }),
  shipwrecked: simple({
    pt: "Um navio pirata naufragou na costa norte de Krailos, o melhor respawn de Pirate Corsair do jogo.",
    en: "A pirate ship has wrecked on Krailos' north coast, the game's best Pirate Corsair respawn.",
    es: "Un barco pirata naufragó en la costa norte de Krailos, el mejor respawn de Pirate Corsair del juego.",
    pl: "Statek piracki rozbił się na północnym wybrzeżu Krailos, najlepszy respawn Pirate Corsair w grze.",
  }),
  forsaken: (variantId, language) => {
    const set = variantId ? pick(FORSAKEN_SETS, language)[variantId] : null;
    if (!set) return forsakenRotationUnknown(language);
    return pick(
      {
        pt: `A Forsaken Mine está tomada por ${set}.`,
        en: `The Forsaken Mine is inhabited by ${set} today.`,
        es: `La Forsaken Mine está ocupada por ${set}.`,
        pl: `Forsaken Mine zamieszkują dziś ${set}.`,
      },
      language,
    );
  },
  chyllfroest: simple({
    pt: "Uma ponte de gelo liga Svargrond a uma ilha congelada onde monstros foram avistados.",
    en: "An ice bridge now connects Svargrond to a frosty island where monsters have been sighted.",
    es: "Un puente de hielo conecta Svargrond con una isla helada donde se avistaron monstruos.",
    pl: "Lodowy most łączy teraz Svargrond z mroźną wyspą, na której zauważono potwory.",
  }),
};

/**
 * Returns the sentence for a Mini World Change that is confirmed running. `variantId` is the
 * running variant's id, or null when the source proved it is running without saying which form
 * it took. Returns null when nothing has been authored for this change.
 *
 * Not-running and not-checked changes never reach here — the briefing decides how (and
 * whether) to word those, and must never describe them as if something were happening.
 */
export function getMiniWorldChangeNarrative(
  changeId: string,
  variantId: string | null,
  language: BriefingLanguage,
  contentId: string | null = null,
): string | null {
  const resolver = NARRATIVES[changeId];
  return resolver ? resolver(variantId, language, contentId) : null;
}

/**
 * The three hunting grounds a Spirit Gate could be hiding, as its own scannable line.
 *
 * Semicolons, not commas: each option is itself a list of four creatures, and a comma join ran
 * the twelve of them together into one unreadable string. Returns null for every change that
 * has no second axis, and for a Spirit Gate somebody has already looked through.
 */
export function getMiniWorldChangeContentOptions(
  changeId: string,
  contentId: string | null,
  language: BriefingLanguage,
): string | null {
  if (changeId !== "spirit-grounds" || contentId !== null) return null;
  const options = getTranslation(language).orList(
    SPIRIT_GROUND_SETS.map((candidate) => creatureList(candidate.creatures, language)),
    "; ",
  );
  return pick(
    {
      pt: `Pode ser ${options}.`,
      en: `It can be ${options}.`,
      es: `Puede ser ${options}.`,
      pl: `Może to być ${options}.`,
    },
    language,
  );
}

/**
 * What it reads like when the player went and looked, and there was nothing there.
 *
 * Only silent changes get these, and only because only a silent change can produce a negative
 * worth printing. An announced change's absence is proved by a board reading twenty at a time,
 * and the bulletin already reduces those to one sentence; a silent change's absence costs
 * somebody a trip to Krailos, and it answers a question the rest of the guild cannot answer
 * any other way. Saying nothing would leave "not checked" and "checked, nothing there"
 * looking identical in the one place they are most different.
 *
 * Written as observations rather than as states — what the player saw, not what the app
 * concluded from it.
 */
const ABSENT_NARRATIVES: Record<string, Lang<string>> = {
  "beaver-breakout": {
    pt: "Os Giant Beavers continuam no cercado em Silvertides. Não dá para domar a montaria hoje.",
    en: "The Giant Beavers are still penned at Silvertides. The mount cannot be tamed today.",
    es: "Los Giant Beavers siguen en el corral de Silvertides. Hoy no se puede domar la montura.",
    pl: "Giant Beavery wciąż siedzą w zagrodzie w Silvertides. Dziś nie oswoisz wierzchowca.",
  },
  shipwrecked: {
    pt: "A costa norte de Krailos está limpa, sem navio naufragado nem piratas na estepe.",
    en: "Krailos' north coast is clear, with no wreck and no pirates on the steppe.",
    es: "La costa norte de Krailos está despejada, sin naufragio ni piratas en la estepa.",
    pl: "Północne wybrzeże Krailos jest puste, bez wraku i bez piratów na stepie.",
  },
};

export function getMiniWorldChangeAbsentNarrative(
  changeId: string,
  language: BriefingLanguage,
): string | null {
  const map = ABSENT_NARRATIVES[changeId];
  return map ? pick(map, language) : null;
}

/**
 * What it reads like on a day nobody has been to look.
 *
 * Only the unannounced changes get one, because they are the only ones that appear in the
 * bulletin unchecked: nothing in the game reports them, so their absence from the message
 * would be silence a reader cannot interpret. The sentence's whole job is to close that gap —
 * it says nobody has looked, and then names what the answer could be, which is the same move
 * the Fury Gate and Bibby Bloodbath sentences make for an unnamed variant.
 *
 * Never an instruction. "Go to Silvertides and look at the pen" is what the catalog page's
 * `howToCheck` is for, addressed to the player using the app; this line is read by a guild
 * channel full of people who did not generate it.
 */
const UNCHECKED_NARRATIVES: Record<string, (language: BriefingLanguage) => string> = {
  "beaver-breakout": (language) =>
    pick(
      {
        pt: "Ainda não conferimos o cercado em Silvertides. Nada anuncia esta mudança: os Giant Beavers podem estar soltos ou ainda presos.",
        en: "We haven't checked the pen at Silvertides yet. Nothing announces this change: the Giant Beavers may be loose or still penned.",
        es: "Todavía no comprobamos el corral en Silvertides. Nada anuncia este cambio: los Giant Beavers pueden estar sueltos o seguir encerrados.",
        pl: "Nie sprawdziliśmy jeszcze zagrody w Silvertides. Nic tego nie ogłasza: Giant Beavery mogą być na wolności albo wciąż w zagrodzie.",
      },
      language,
    ),
  shipwrecked: (language) =>
    pick(
      {
        pt: "Ainda não conferimos a costa norte de Krailos. Nada anuncia esta mudança: pode haver um navio naufragado com piratas na estepe, ou a costa pode estar limpa.",
        en: "We haven't checked Krailos' north coast yet. Nothing announces this change: there may be a wreck with pirates on the steppe, or the coast may be clear.",
        es: "Todavía no comprobamos la costa norte de Krailos. Nada anuncia este cambio: puede haber un naufragio con piratas en la estepa, o la costa puede estar despejada.",
        pl: "Nie sprawdziliśmy jeszcze północnego wybrzeża Krailos. Nic tego nie ogłasza: może tam być wrak z piratami na stepie, albo wybrzeże może być puste.",
      },
      language,
    ),
  forsaken: forsakenRotationUnknown,
};

/**
 * The sentence for an unannounced change nobody has checked today, or null for a change that
 * has none — which is every announced one, and they never reach here.
 */
export function getMiniWorldChangeUncheckedNarrative(
  changeId: string,
  language: BriefingLanguage,
): string | null {
  const resolve = UNCHECKED_NARRATIVES[changeId];
  return resolve ? resolve(language) : null;
}
