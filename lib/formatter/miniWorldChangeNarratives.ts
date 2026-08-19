import type { MiniWorldChangeState } from "@/types/miniWorldChange";
import type { BriefingLanguage } from "./translations";

type Lang<T> = Record<BriefingLanguage, T>;
function pick<T>(map: Lang<T>, language: BriefingLanguage): T {
  return map[language];
}

type Resolver = (detail: string, language: BriefingLanguage) => string;
type ChangeNarratives = Partial<Record<MiniWorldChangeState, Resolver>>;

function simple(map: Lang<string>): Resolver {
  return (_detail, language) => pick(map, language);
}

function withLocation(map: Lang<(location: string) => string>): Resolver {
  return (detail, language) => pick(map, language)(detail.trim());
}

function stageText(label: string, stage: 1 | 2 | 3): Resolver {
  return (_detail, language) =>
    pick(
      {
        pt: `${label} está no ${stage}º estágio.`,
        en: `${label} is at stage ${stage}.`,
        es: `${label} está en la etapa ${stage}.`,
        pl: `${label} jest na etapie ${stage}.`,
      },
      language,
    );
}

const NARRATIVES: Record<string, ChangeNarratives> = {
  "fury-gate": {
    active: simple({
      pt: "Um portão de fúria se abriu perto de uma das grandes cidades.",
      en: "A fiery fury gate has opened near one of the major cities.",
      es: "Se abrió una puerta de furia cerca de una de las grandes ciudades.",
      pl: "W pobliżu jednego z większych miast otworzyła się Fury Gate.",
    }),
  },
  "hive-outpost": {
    active: simple({
      pt: "Uma infestação da Hive foi avistada a sudoeste de Liberty Bay.",
      en: "A Hive infestation has been sighted south-west of Liberty Bay.",
      es: "Se avistó una infestación de la Hive al suroeste de Liberty Bay.",
      pl: "Na południowy zachód od Liberty Bay zaobserwowano inwazję Hive.",
    }),
  },
  "bibbys-bloodbath": {
    location: withLocation({
      pt: (location) => `Bibby Bloodbath e sua tripulação estão espalhando destruição${location ? ` perto de ${location}` : ""}.`,
      en: (location) => `Bibby Bloodbath and her crew are roaming the lands${location ? ` near ${location}` : ""}.`,
      es: (location) => `Bibby Bloodbath y su tripulación siembran destrucción${location ? ` cerca de ${location}` : ""}.`,
      pl: (location) => `Bibby Bloodbath i jej załoga sieją zniszczenie${location ? ` w pobliżu ${location}` : ""}.`,
    }),
  },
  "devovorga-essence": {
    stage1: stageText("Devovorga Essence", 1),
    stage2: stageText("Devovorga Essence", 2),
    stage3: stageText("Devovorga Essence", 3),
  },
  "big-iceberg": {
    stage1: stageText("Big Iceberg / Chakoya", 1),
    stage2: stageText("Big Iceberg / Chakoya", 2),
    stage3: stageText("Big Iceberg / Chakoya", 3),
  },
  "spirit-gate": {
    location: withLocation({
      pt: (location) => `Um Spirit Gate está aberto em ${location || "algum lugar de Darama"}.`,
      en: (location) => `A Spirit Gate is open in ${location || "Darama"}.`,
      es: (location) => `Hay un Spirit Gate abierto en ${location || "Darama"}.`,
      pl: (location) => `Spirit Gate jest otwarta w ${location || "Daramie"}.`,
    }),
  },
  "nightmare-isles": {
    location: withLocation({
      pt: (location) => `As Nightmare Isles estão acessíveis${location ? ` perto de ${location}` : ""}.`,
      en: (location) => `The Nightmare Isles are accessible${location ? ` near ${location}` : ""}.`,
      es: (location) => `Las Nightmare Isles están accesibles${location ? ` cerca de ${location}` : ""}.`,
      pl: (location) => `Nightmare Isles są dostępne${location ? ` w pobliżu ${location}` : ""}.`,
    }),
  },
  "goroma-volcano": {
    stage1: stageText("Goroma Volcano", 1),
    stage2: stageText("Goroma Volcano", 2),
    stage3: stageText("Goroma Volcano", 3),
  },
  "darama-nomads": {
    active: simple({
      pt: "Os nômades estão acampados em Kha'labal, ao norte do deserto de Ankrahmun.",
      en: "The nomads are camped in Kha'labal, north of Ankrahmun's desert.",
      es: "Los nómadas acampan en Kha'labal, al norte del desierto de Ankrahmun.",
      pl: "Nomadzi obozują w Kha'labal, na północ od pustyni Ankrahmun.",
    }),
  },
  "bored-witch": {
    active: simple({
      pt: "A bruxa Wyda está entediada e recebe visitas.",
      en: "The witch Wyda is bored and taking visitors.",
      es: "La bruja Wyda está aburrida y recibe visitas.",
      pl: "Wiedźma Wyda się nudzi i przyjmuje gości.",
    }),
  },
  noodles: {
    location: withLocation({
      pt: (location) => `Noodles fugiu do castelo${location ? ` e está em ${location}` : ""}.`,
      en: (location) => `Noodles has left the castle${location ? ` and is in ${location}` : ""}.`,
      es: (location) => `Noodles se escapó del castillo${location ? ` y está en ${location}` : ""}.`,
      pl: (location) => `Noodles uciekł z zamku${location ? ` i jest w ${location}` : ""}.`,
    }),
  },
  "thais-kingsday": {
    active: simple({
      pt: "É Kingsday em Thais — a celebração está em andamento.",
      en: "It's Kingsday in Thais — the celebration is underway.",
      es: "Es Kingsday en Thais — la celebración está en curso.",
      pl: "W Thais trwa Kingsday.",
    }),
  },
  thawing: {
    stage1: stageText("Thawing / Ice Flower", 1),
    stage2: stageText("Thawing / Ice Flower", 2),
    stage3: stageText("Thawing / Ice Flower", 3),
  },
  "spiders-nest": {
    active: simple({
      pt: "Um ninho inteiro de aranhas precisa ser exterminado — Mamma Longlegs está à solta.",
      en: "A whole nest of spiders needs exterminating — Mamma Longlegs is on the loose.",
      es: "Todo un nido de arañas necesita ser exterminado — Mamma Longlegs anda suelta.",
      pl: "Całe gniazdo pająków wymaga eksterminacji — Mamma Longlegs jest na wolności.",
    }),
  },
  "poacher-caves": {
    stage1: simple({
      pt: "Os animais selvagens dominam a área ao norte do Green Claw Swamp.",
      en: "Wild animals dominate the area north of the Green Claw Swamp.",
      es: "Los animales salvajes dominan la zona al norte del Green Claw Swamp.",
      pl: "Dzikie zwierzęta dominują na terenie na północ od Green Claw Swamp.",
    }),
    stage2: simple({
      pt: "Caçadores furtivos estão devastando a vida selvagem ao norte do Green Claw Swamp.",
      en: "Poachers are ravaging the wildlife north of the Green Claw Swamp.",
      es: "Los cazadores furtivos devastan la fauna al norte del Green Claw Swamp.",
      pl: "Kłusownicy dziesiątkują dziką przyrodę na północ od Green Claw Swamp.",
    }),
    stage3: simple({
      pt: "Espíritos vingativos tomaram o lugar dos animais ao norte do Green Claw Swamp.",
      en: "Vengeful spirits have taken over north of the Green Claw Swamp.",
      es: "Espíritus vengativos han tomado el control al norte del Green Claw Swamp.",
      pl: "Mściwe duchy przejęły teren na północ od Green Claw Swamp.",
    }),
  },
  "jungle-camp": {
    active: simple({
      pt: "Caçadores e dworcs estão em confronto pelas terras sagradas de Trapwood.",
      en: "Hunters and dworcs are fighting over Trapwood's holy grounds.",
      es: "Cazadores y dworcs luchan por las tierras sagradas de Trapwood.",
      pl: "Myśliwi i dworcowie walczą o święte ziemie Trapwood.",
    }),
  },
  grimvale: {
    active: simple({
      pt: "A lua cheia tem um efeito estranho sobre a ilha de Grimvale.",
      en: "The full moon has a strange effect on the island of Grimvale.",
      es: "La luna llena tiene un efecto extraño sobre la isla de Grimvale.",
      pl: "Pełnia księżyca dziwnie wpływa na wyspę Grimvale.",
    }),
  },
  stampede: {
    active: simple({
      pt: "Os elefantes de Tiquanda foram provocados por Ape God e estão em estampida.",
      en: "Tiquanda's elephants have been stirred into a stampede by the Ape God.",
      es: "Los elefantes de Tiquanda fueron provocados por Ape God y están en estampida.",
      pl: "Słonie z Tiquandy zostały pobudzone przez Ape God i wpadły w stampede.",
    }),
  },
  "bank-robbery": {
    active: simple({
      pt: "Bancos das principais cidades costeiras estão sendo roubados.",
      en: "Banks in major coastal towns are being robbed.",
      es: "Se están robando bancos en las principales ciudades costeras.",
      pl: "W głównych nadmorskich miastach napadane są banki.",
    }),
  },
  "river-runs-deep": {
    active: simple({
      pt: "O rio de Zao Steppe está cheio — há mais peixes que o normal.",
      en: "The Zao Steppe river runs deep — there's more fish than usual.",
      es: "El río de Zao Steppe está crecido — hay más peces de lo normal.",
      pl: "Rzeka w Zao Steppe jest pełna — ryb jest więcej niż zwykle.",
    }),
  },
  lumberjack: {
    active: simple({
      pt: "As árvores reais da Rainha estão sendo derrubadas.",
      en: "The Queen's own royal trees are being cut down.",
      es: "Los árboles reales de la Reina están siendo talados.",
      pl: "Królewskie drzewa Królowej są wycinane.",
    }),
  },
  "down-the-drain": {
    active: simple({
      pt: "O rio ao sul do acampamento de fora-da-lei está inundando uma pequena ilha, agora acessível.",
      en: "The river south of the outlaw camp is flooding a small island, now reachable.",
      es: "El río al sur del campamento de forajidos inunda una pequeña isla, ahora accesible.",
      pl: "Rzeka na południe od obozu banitów zalewa małą wyspę, teraz dostępną.",
    }),
  },
  chyllfroest: {
    active: simple({
      pt: "Uma ponte de gelo liga Svargrond a uma ilha congelada onde monstros foram avistados.",
      en: "An ice bridge now connects Svargrond to a frosty island where monsters have been sighted.",
      es: "Un puente de hielo conecta Svargrond con una isla helada donde se avistaron monstruos.",
      pl: "Lodowy most łączy teraz Svargrond z mroźną wyspą, na której zauważono potwory.",
    }),
  },
};

/** Returns null when there's no narrative content for this exact (changeId, state) pair —
 * callers should fall back to the compact status-line rendering in that case. */
export function getMiniWorldChangeNarrative(
  changeId: string,
  state: MiniWorldChangeState,
  detail: string,
  language: BriefingLanguage,
): string | null {
  const resolver = NARRATIVES[changeId]?.[state];
  return resolver ? resolver(detail, language) : null;
}
