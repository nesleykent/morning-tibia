import type { BriefingLanguage } from "./translations";

type Lang<T> = Record<BriefingLanguage, T>;
function pick<T>(map: Lang<T>, language: BriefingLanguage): T {
  return map[language];
}

/**
 * A change's narrative depends on the variant that is running, so resolvers take the
 * variant's label (or null when the source confirmed the change without naming one).
 */
type Resolver = (variantLabel: string | null, language: BriefingLanguage) => string;

/** Wording that doesn't change with the variant. */
function simple(map: Lang<string>): Resolver {
  return (_variantLabel, language) => pick(map, language);
}

/**
 * Wording with two forms: one for "we know which one", one for "confirmed running but the
 * source never says which". The second is not a fallback — for Fury Gates and Nomads it is
 * the normal case, and saying it plainly is the whole point.
 */
function byVariant(map: Lang<(variantLabel: string | null) => string>): Resolver {
  return (variantLabel, language) => pick(map, language)(variantLabel);
}

const NARRATIVES: Record<string, Resolver> = {
  "fury-gates": byVariant({
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
  warpath: byVariant({
    pt: (place) =>
      place
        ? `Bibby Bloodbath e sua tripulação estão acampadas: ${place}.`
        : "Bibby Bloodbath e sua tripulação estão em marcha — o acampamento pode estar em um de três lugares.",
    en: (place) =>
      place
        ? `Bibby Bloodbath and her crew are camped ${place.toLowerCase()}.`
        : "Bibby Bloodbath and her crew are on the warpath — the camp could be at any of three places.",
    es: (place) =>
      place
        ? `Bibby Bloodbath y su tripulación acampan: ${place.toLowerCase()}.`
        : "Bibby Bloodbath y su tripulación están en marcha — el campamento puede estar en uno de tres lugares.",
    pl: (place) =>
      place
        ? `Bibby Bloodbath i jej załoga obozują: ${place.toLowerCase()}.`
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
  "spirit-grounds": byVariant({
    pt: (region) => `Um Spirit Gate está aberto em ${region ?? "uma das três regiões"}.`,
    en: (region) => `A Spirit Gate is open in ${region ?? "one of the three regions"}.`,
    es: (region) => `Hay un Spirit Gate abierto en ${region ?? "una de las tres regiones"}.`,
    pl: (region) => `Spirit Gate jest otwarta w ${region ?? "jednym z trzech regionów"}.`,
  }),
  "nightmare-isles": byVariant({
    pt: (place) =>
      place
        ? `As Nightmare Isles estão acessíveis por ${place.toLowerCase()}.`
        : "As Nightmare Isles estão acessíveis em algum ponto de Darama.",
    en: (place) =>
      place
        ? `The Nightmare Isles are reachable via ${place.toLowerCase()}.`
        : "The Nightmare Isles are reachable somewhere in Darama.",
    es: (place) =>
      place
        ? `Las Nightmare Isles son accesibles por ${place.toLowerCase()}.`
        : "Las Nightmare Isles son accesibles en algún punto de Darama.",
    pl: (place) =>
      place
        ? `Nightmare Isles są dostępne przez ${place.toLowerCase()}.`
        : "Nightmare Isles są dostępne gdzieś w Daramie.",
  }),
  "fire-from-the-earth": simple({
    pt: "O vulcão Hellgore em Goroma está em erupção, trazendo criaturas mais fortes junto com a lava.",
    en: "The Hellgore volcano on Goroma is erupting, bringing stronger creatures along with the lava.",
    es: "El volcán Hellgore en Goroma está en erupción, trayendo criaturas más fuertes junto con la lava.",
    pl: "Wulkan Hellgore na Goroma wybucha, sprowadzając silniejsze stworzenia razem z lawą.",
  }),
  nomads: byVariant({
    pt: (camp) =>
      camp
        ? `Os nômades acamparam em Kha'labal: ${camp.toLowerCase()}.`
        : "Os nômades acamparam em algum lugar de Kha'labal — um dos quatro acampamentos possíveis.",
    en: (camp) =>
      camp
        ? `The nomads have camped in Kha'labal — ${camp.toLowerCase()}.`
        : "The nomads have camped somewhere in Kha'labal — one of the four possible camps.",
    es: (camp) =>
      camp
        ? `Los nómadas acamparon en Kha'labal: ${camp.toLowerCase()}.`
        : "Los nómadas acamparon en algún lugar de Kha'labal — uno de los cuatro campamentos posibles.",
    pl: (camp) =>
      camp
        ? `Nomadzi rozbili obóz w Kha'labal: ${camp.toLowerCase()}.`
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
      phase === "Poachers dominate"
        ? "Caçadores furtivos estão devastando a vida selvagem ao norte do Green Claw Swamp."
        : phase === "Vengeful ghost wolves dominate"
          ? "Espíritos vingativos tomaram o lugar dos animais ao norte do Green Claw Swamp."
          : "Os animais selvagens dominam a área ao norte do Green Claw Swamp.",
    en: (phase) =>
      phase === "Poachers dominate"
        ? "Poachers are ravaging the wildlife north of the Green Claw Swamp."
        : phase === "Vengeful ghost wolves dominate"
          ? "Vengeful ghost wolves have taken over north of the Green Claw Swamp."
          : "Wild animals dominate the area north of the Green Claw Swamp.",
    es: (phase) =>
      phase === "Poachers dominate"
        ? "Los cazadores furtivos devastan la fauna al norte del Green Claw Swamp."
        : phase === "Vengeful ghost wolves dominate"
          ? "Espíritus vengativos han tomado el control al norte del Green Claw Swamp."
          : "Los animales salvajes dominan la zona al norte del Green Claw Swamp.",
    pl: (phase) =>
      phase === "Poachers dominate"
        ? "Kłusownicy dziesiątkują dziką przyrodę na północ od Green Claw Swamp."
        : phase === "Vengeful ghost wolves dominate"
          ? "Mściwe duchy przejęły teren na północ od Green Claw Swamp."
          : "Dzikie zwierzęta dominują na terenie na północ od Green Claw Swamp.",
  }),
  "jungle-camp": byVariant({
    pt: (side) =>
      side === "Hunters dominate"
        ? "Os caçadores dominam as terras sagradas de Trapwood — Arthom the Hunter pode aparecer."
        : side === "Dworcs dominate"
          ? "Os dworcs dominam as terras sagradas de Trapwood — Oodok Witchmaster pode aparecer."
          : "Caçadores e dworcs disputam as terras sagradas de Trapwood — o World Board não diz quem está ganhando.",
    en: (side) =>
      side === "Hunters dominate"
        ? "The hunters hold Trapwood's holy grounds — Arthom the Hunter may show up."
        : side === "Dworcs dominate"
          ? "The dworcs hold Trapwood's holy grounds — Oodok Witchmaster may show up."
          : "Hunters and dworcs are fighting over Trapwood's holy grounds — the World Board doesn't say who's winning.",
    es: (side) =>
      side === "Hunters dominate"
        ? "Los cazadores dominan las tierras sagradas de Trapwood — puede aparecer Arthom the Hunter."
        : side === "Dworcs dominate"
          ? "Los dworcs dominan las tierras sagradas de Trapwood — puede aparecer Oodok Witchmaster."
          : "Cazadores y dworcs luchan por las tierras sagradas de Trapwood — el World Board no dice quién gana.",
    pl: (side) =>
      side === "Hunters dominate"
        ? "Myśliwi kontrolują święte ziemie Trapwood — może pojawić się Arthom the Hunter."
        : side === "Dworcs dominate"
          ? "Dworcowie kontrolują święte ziemie Trapwood — może pojawić się Oodok Witchmaster."
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
  chyllfroest: simple({
    pt: "Uma ponte de gelo liga Svargrond a uma ilha congelada onde monstros foram avistados.",
    en: "An ice bridge now connects Svargrond to a frosty island where monsters have been sighted.",
    es: "Un puente de hielo conecta Svargrond con una isla helada donde se avistaron monstruos.",
    pl: "Lodowy most łączy teraz Svargrond z mroźną wyspą, na której zauważono potwory.",
  }),
};

/**
 * Returns the sentence for a Mini World Change that is confirmed running. `variantLabel` is
 * the running variant's label, or null when the source proved it is running without saying
 * which form it took. Returns null when nothing has been authored for this change.
 *
 * Not-running and not-checked changes never reach here — the briefing decides how (and
 * whether) to word those, and must never describe them as if something were happening.
 */
export function getMiniWorldChangeNarrative(
  changeId: string,
  variantLabel: string | null,
  language: BriefingLanguage,
): string | null {
  const resolver = NARRATIVES[changeId];
  return resolver ? resolver(variantLabel, language) : null;
}
