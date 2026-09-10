import type { BriefingLanguage } from "./translations";

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
type Resolver = (variantId: string | null, language: BriefingLanguage) => string;

/** Wording that doesn't change with the variant. */
function simple(map: Lang<string>): Resolver {
  return (_variantId, language) => pick(map, language);
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

const NARRATIVES: Record<string, Resolver> = {
  "fury-gates": byNamedVariant(everyLanguage(CITY_NAMES), {
    pt: (city) =>
      city
        ? `Um fiery fury gate se abriu perto de ${city}.`
        : "Um fiery fury gate se abriu perto de uma das grandes cidades — ainda não se sabe qual.",
    en: (city) =>
      city
        ? `A fiery fury gate has opened near ${city}.`
        : "A fiery fury gate has opened near one of the major cities — which one isn't known yet.",
    es: (city) =>
      city
        ? `Se abrió una fiery fury gate cerca de ${city}.`
        : "Se abrió una fiery fury gate cerca de una de las grandes ciudades — todavía no se sabe cuál.",
    pl: (city) =>
      city
        ? `W pobliżu ${city} otworzyła się fiery fury gate.`
        : "W pobliżu jednego z większych miast otworzyła się fiery fury gate — nie wiadomo jeszcze którego.",
  }),
  "hive-outpost": simple({
    pt: "Uma infestação da Hive foi avistada a sudoeste de Liberty Bay.",
    en: "A Hive infestation has been sighted south-west of Liberty Bay.",
    es: "Se avistó una infestación de la Hive al suroeste de Liberty Bay.",
    pl: "Na południowy zachód od Liberty Bay zaobserwowano inwazję Hive.",
  }),
  warpath: byNamedVariant(WARPATH_CAMPS, {
    pt: (place) =>
      place
        ? `Bibby Bloodbath e sua tripulação estão acampadas ${place}.`
        : "Bibby Bloodbath e sua tripulação estão em marcha — o acampamento pode estar em um de três lugares.",
    en: (place) =>
      place
        ? `Bibby Bloodbath and her crew are camped ${place}.`
        : "Bibby Bloodbath and her crew are on the warpath — the camp could be at any of three places.",
    es: (place) =>
      place
        ? `Bibby Bloodbath y su tripulación acampan ${place}.`
        : "Bibby Bloodbath y su tripulación están en marcha — el campamento puede estar en uno de tres lugares.",
    pl: (place) =>
      place
        ? `Bibby Bloodbath i jej załoga obozują ${place}.`
        : "Bibby Bloodbath i jej załoga są na wojennej ścieżce — obóz może być w jednym z trzech miejsc.",
  }),
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
  "spirit-grounds": byNamedVariant(everyLanguage(REGION_NAMES), {
    pt: (region) => `Um Spirit Gate está aberto em ${region ?? "uma das três regiões"}.`,
    en: (region) => `A Spirit Gate is open in ${region ?? "one of the three regions"}.`,
    es: (region) => `Hay un Spirit Gate abierto en ${region ?? "una de las tres regiones"}.`,
    pl: (region) => `Spirit Gate jest otwarta w ${region ?? "jednym z trzech regionów"}.`,
  }),
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
  nomads: byNamedVariant(NOMAD_CAMPS, {
    pt: (camp) =>
      camp
        ? `Os nômades acamparam em Kha'labal, ${camp}.`
        : "Os nômades acamparam em algum lugar de Kha'labal — um dos quatro acampamentos possíveis.",
    en: (camp) =>
      camp
        ? `The nomads have camped in Kha'labal, ${camp}.`
        : "The nomads have camped somewhere in Kha'labal — one of the four possible camps.",
    es: (camp) =>
      camp
        ? `Los nómadas acamparon en Kha'labal, ${camp}.`
        : "Los nómadas acamparon en algún lugar de Kha'labal — uno de los cuatro campamentos posibles.",
    pl: (camp) =>
      camp
        ? `Nomadzi rozbili obóz w Kha'labal, ${camp}.`
        : "Nomadzi rozbili obóz gdzieś w Kha'labal — w jednym z czterech możliwych miejsc.",
  }),
  bored: simple({
    pt: "A bruxa Wyda está entediada e recebe visitas.",
    en: "The witch Wyda is bored and taking visitors.",
    es: "La bruja Wyda está aburrida y recibe visitas.",
    pl: "Wiedźma Wyda się nudzi i przyjmuje gości.",
  }),
  "noodles-is-gone": simple({
    pt: "Noodles fugiu do castelo — pegue uma coleira com King Tibianus e procure pela península de Thais.",
    en: "Noodles has left the castle — get a leash from King Tibianus and search the Thaian peninsula.",
    es: "Noodles se escapó del castillo — pide una correa a King Tibianus y busca por la península de Thais.",
    pl: "Noodles uciekł z zamku — weź smycz od King Tibianus i przeszukaj półwysep Thais.",
  }),
  kingsday: simple({
    pt: "É Kingsday em Thais — a celebração está em andamento.",
    en: "It's Kingsday in Thais — the celebration is underway.",
    es: "Es Kingsday en Thais — la celebración está en curso.",
    pl: "W Thais trwa Kingsday.",
  }),
  thawing: simple({
    pt: "Neve suficiente derreteu perto de Svargrond para revelar Ice Flowers.",
    en: "Enough snow has melted near Svargrond to reveal Ice Flowers.",
    es: "Suficiente nieve se ha derretido cerca de Svargrond para revelar Ice Flowers.",
    pl: "W pobliżu Svargrond stopiło się wystarczająco dużo śniegu, by odsłonić Ice Flowers.",
  }),
  "spider-nest": simple({
    pt: "Um ninho inteiro de aranhas precisa ser exterminado — Mamma Longlegs está à solta.",
    en: "A whole nest of spiders needs exterminating — Mamma Longlegs is on the loose.",
    es: "Todo un nido de arañas necesita ser exterminado — Mamma Longlegs anda suelta.",
    pl: "Całe gniazdo pająków wymaga eksterminacji — Mamma Longlegs jest na wolności.",
  }),
  "poacher-caves": byVariant({
    pt: (phase) =>
      phase === "game"
        ? "Os animais selvagens dominam a área ao norte do Green Claw Swamp."
        : phase === "poachers"
          ? "Caçadores furtivos estão devastando a vida selvagem ao norte do Green Claw Swamp."
          : phase === "ghost-wolves"
            ? "Ghost Wolves e Gloom Wolves tomaram o lugar dos animais ao norte do Green Claw Swamp."
            : "Há uma disputa nas cavernas ao norte do Green Claw Swamp — ainda não se sabe quem domina.",
    en: (phase) =>
      phase === "game"
        ? "Wild animals dominate the area north of the Green Claw Swamp."
        : phase === "poachers"
          ? "Poachers are ravaging the wildlife north of the Green Claw Swamp."
          : phase === "ghost-wolves"
            ? "Ghost Wolves and Gloom Wolves have taken over north of the Green Claw Swamp."
            : "The caves north of the Green Claw Swamp are contested — who holds them isn't known yet.",
    es: (phase) =>
      phase === "game"
        ? "Los animales salvajes dominan la zona al norte del Green Claw Swamp."
        : phase === "poachers"
          ? "Los cazadores furtivos devastan la fauna al norte del Green Claw Swamp."
          : phase === "ghost-wolves"
            ? "Los Ghost Wolves y Gloom Wolves han tomado el control al norte del Green Claw Swamp."
            : "Las cuevas al norte del Green Claw Swamp están en disputa — todavía no se sabe quién domina.",
    pl: (phase) =>
      phase === "game"
        ? "Dzikie zwierzęta dominują na terenie na północ od Green Claw Swamp."
        : phase === "poachers"
          ? "Kłusownicy dziesiątkują dziką przyrodę na północ od Green Claw Swamp."
          : phase === "ghost-wolves"
            ? "Ghost Wolves i Gloom Wolves przejęły teren na północ od Green Claw Swamp."
            : "Jaskinie na północ od Green Claw Swamp są sporne — nie wiadomo jeszcze, kto je trzyma.",
  }),
  "jungle-camp": byVariant({
    pt: (side) =>
      side === "hunters"
        ? "Os caçadores dominam as terras sagradas de Trapwood."
        : side === "dworcs"
          ? "Os dworcs dominam as terras sagradas de Trapwood."
          : "Caçadores e dworcs disputam as terras sagradas de Trapwood — o World Board não diz quem está ganhando.",
    en: (side) =>
      side === "hunters"
        ? "The hunters hold Trapwood's holy grounds."
        : side === "dworcs"
          ? "The dworcs hold Trapwood's holy grounds."
          : "Hunters and dworcs are fighting over Trapwood's holy grounds — the World Board doesn't say who's winning.",
    es: (side) =>
      side === "hunters"
        ? "Los cazadores dominan las tierras sagradas de Trapwood."
        : side === "dworcs"
          ? "Los dworcs dominan las tierras sagradas de Trapwood."
          : "Cazadores y dworcs luchan por las tierras sagradas de Trapwood — el World Board no dice quién gana.",
    pl: (side) =>
      side === "hunters"
        ? "Myśliwi kontrolują święte ziemie Trapwood."
        : side === "dworcs"
          ? "Dworcowie kontrolują święte ziemie Trapwood."
          : "Myśliwi i dworcowie walczą o święte ziemie Trapwood — World Board nie mówi, kto wygrywa.",
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
    pt: "O rio de Zao Steppe está cheio — há mais peixes que o normal.",
    en: "The Zao Steppe river runs deep — there's more fish than usual.",
    es: "El río de Zao Steppe está crecido — hay más peces de lo normal.",
    pl: "Rzeka w Zao Steppe jest pełna — ryb jest więcej niż zwykle.",
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
    pt: "Os Giant Beavers estão soltos em Silvertides, Marapur — dá para domar a montaria.",
    en: "The Giant Beavers are loose at Silvertides in Marapur — the mount can be tamed.",
    es: "Los Giant Beavers están sueltos en Silvertides, Marapur — se puede domar la montura.",
    pl: "Giant Beavery są na wolności w Silvertides w Marapur — można oswoić wierzchowca.",
  }),
  shipwrecked: simple({
    pt: "Um navio pirata naufragou na costa norte de Krailos — o melhor respawn de Pirate Corsair do jogo.",
    en: "A pirate ship has wrecked on Krailos' north coast — the game's best Pirate Corsair respawn.",
    es: "Un barco pirata naufragó en la costa norte de Krailos — el mejor respawn de Pirate Corsair del juego.",
    pl: "Statek piracki rozbił się na północnym wybrzeżu Krailos — najlepszy respawn Pirate Corsair w grze.",
  }),
  forsaken: byNamedVariant(FORSAKEN_SETS, {
    pt: (set) =>
      set
        ? `A Forsaken Mine está tomada por ${set}.`
        : "A Forsaken Mine mudou de habitantes no server save — olhe do primeiro andar antes de descer.",
    en: (set) =>
      set
        ? `The Forsaken Mine is inhabited by ${set} today.`
        : "The Forsaken Mine's inhabitants rotated at server save — look down from the first floor before descending.",
    es: (set) =>
      set
        ? `La Forsaken Mine está ocupada por ${set}.`
        : "La Forsaken Mine cambió de habitantes en el server save — mira desde el primer piso antes de bajar.",
    pl: (set) =>
      set
        ? `Forsaken Mine zamieszkują dziś ${set}.`
        : "Mieszkańcy Forsaken Mine zmienili się po server save — zajrzyj z pierwszego piętra przed zejściem.",
  }),
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
): string | null {
  const resolver = NARRATIVES[changeId];
  return resolver ? resolver(variantId, language) : null;
}
