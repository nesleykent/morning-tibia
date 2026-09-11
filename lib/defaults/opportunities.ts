import type { LocalizedText, OpportunityDefinition } from "@/types/opportunity";
import { bestiaryProfile } from "./bestiary";
import { SPIRIT_GROUND_SETS } from "./miniWorldChanges";

const WIKI = "https://tibia.fandom.com/wiki";

/** Shorthand for the article a change's own facts were read out of. */
const wc = (title: string) => `${WIKI}/${title}_World_Change/Spoiler`;
const mwc = (title: string) => `${WIKI}/${title}_Mini_World_Change/Spoiler`;

/**
 * What today's *state* of each tracked change actually makes worth doing.
 *
 * ## What changed, and why
 *
 * This replaces a catalog that could only express achievements, and could only key them on a
 * change rather than on the state that change is in. Both limits produced wrong output:
 *
 * - Keying on the change meant Overhunting's entry had to describe either the deer or the
 *   wolves, and got the other half of the cycle wrong. Today's Guide reply says the wolves are
 *   out, which means White Deer, the Kingly Deer mount and the antler trade are all impossible
 *   — and Starving Wolf, a 500-kill / 15-charm bestiary entry, is available and nowhere else.
 * - Modelling only achievements threw away most of what a world state is good for. The single
 *   most valuable thing about Their Master's Voice is three Very Rare bestiary entries that
 *   complete in five kills each for 130 Charm Points between them. No achievement is involved,
 *   so the old catalog said the change offered nothing.
 *
 * ## Evidence standard
 *
 * Every entry is backed by a source that states the relationship, not by theme-matching:
 * TibiaWiki's per-change spoiler, the creature's own page for "only spawns here", the mount's
 * `taming_method`, or the achievement's own spoiler line. Bestiary kill counts and Charm Points
 * are never typed in — they are derived from the creature's published difficulty and occurrence
 * through `bestiaryProfile`, so they cannot be transcribed wrongly.
 *
 * `exclusive: true` is a strong claim and is only set where a source says the thing exists
 * *only* under this condition (Ladybug: "The Hive surface during the Hive Born World Change's
 * third stage"; Ghost Wolf: "Poacher Caves/Gloomy"; Manta Ray: "Fiehonja only in stage 3").
 *
 * ## Availability
 *
 * `availability` is the field that stops the briefing overselling. A boss that exists somewhere
 * in a change is not "available today" unless *this* state puts it in reach: the Raging Mage is
 * standing at his tower in the portal-open state and still cannot be fought until the world has
 * killed 2000 Yielothaxes and the player 250, so he is `progressable-today`, not available.
 */
export const OPPORTUNITIES: OpportunityDefinition[] = [
  // ══ WORLD CHANGE: The Mummy's Curse (Horestis) ═════════════════════════════
  {
    id: "horestis-jars",
    kind: "progress",
    subject: "Ornate Canopic Jar",
    availability: "progressable-today",
    trigger: { kind: "world-change", changeId: "horestis", stateIds: ["slumbering"] },
    // The hourly rule is the half everyone gets wrong, so it is in `detail` rather than in a
    // caveat the bulletin never prints. The cooldown starts on a FAILED attempt; a successful
    // break leaves you free to walk to the next jar immediately, which is what makes clearing
    // several in one visit possible at all.
    detail: {
      pt: "São cinco jars: cada um quebrado dá uma entrada permanente para enfrentar Horestis, e o quinto o acorda. Só a falha trava o personagem por uma hora real, então depois de quebrar um você vai direto ao próximo.",
      en: "There are five jars: each break banks one permanent entry to face Horestis, and the fifth wakes him. Only a failed attempt locks the character out for a real-time hour, so after a successful break you go straight to the next jar.",
      es: "Son cinco jars: cada uno roto da una entrada permanente para enfrentar a Horestis, y el quinto lo despierta. Solo el fallo bloquea al personaje una hora real, así que tras romper uno vas directo al siguiente.",
      pl: "Dzbanów jest pięć: każdy rozbity daje stałe wejście do walki z Horestisem, a piąty go budzi. Tylko nieudana próba blokuje postać na godzinę, więc po udanym rozbiciu idziesz prosto do następnego.",
    },
    caveat: {
      pt: "Costuma levar de 10 a 80 tentativas por jar.",
      en: "It usually takes 10 to 80 tries per jar.",
      es: "Suele llevar de 10 a 80 intentos por jar.",
      pl: "Zwykle potrzeba 10 do 80 prób na jeden dzban.",
    },
    label: {
      pt: "Ornate Canopic Jars",
      en: "Ornate Canopic Jars",
      es: "Ornate Canopic Jars",
      pl: "Ornate Canopic Jars",
    },
    qualifier: {
      pt: "cada jar quebrado é uma entrada",
      en: "each jar broken is one entry",
      es: "cada jar roto es una entrada",
      pl: "każdy rozbity jar to jedno wejście",
    },
    sources: [wc("The_Mummy's_Curse")],
  },
  {
    id: "horestis-boss",
    kind: "boss",
    subject: "Horestis",
    availability: "available-today",
    exclusive: true,
    bosstiary: "Nemesis",
    trigger: { kind: "world-change", changeId: "horestis", stateIds: ["risen"] },
    detail: {
      pt: "O faraó saiu do túmulo e pode ser enfrentado por quem já quebrou um Ornate Canopic Jar.",
      en: "The pharaoh has left his tomb and can be fought by anyone holding an Ornate Canopic Jar credit.",
      es: "El faraón salió de su tumba y puede enfrentarlo quien ya haya roto un Ornate Canopic Jar.",
      pl: "Faraon opuścił grobowiec. Zmierzy się z nim każdy, kto rozbił Ornate Canopic Jar.",
    },
    prerequisites: ["One Ornate Canopic Jar broken (banked from any earlier day)"],
    qualifier: {
      pt: "para quem já quebrou um Ornate Canopic Jar",
      en: "for anyone holding an Ornate Canopic Jar break",
      es: "para quien ya rompió un Ornate Canopic Jar",
      pl: "dla tych, którzy rozbili Ornate Canopic Jar",
    },
    sources: [wc("The_Mummy's_Curse"), `${WIKI}/Horestis`],
  },
  {
    id: "horestis-fearless",
    kind: "achievement",
    subject: "Fearless",
    availability: "progressable-today",
    achievement: {
      name: "Fearless",
      grade: 1,
      points: 1,
      premium: true,
      requirement: {
        pt: "Quebre 50 Ornate Canopic Jars",
        en: "Break 50 Ornate Canopic Jars",
        es: "Rompe 50 Ornate Canopic Jars",
        pl: "Rozbij 50 Ornate Canopic Jars",
      },
    },
    trigger: { kind: "world-change", changeId: "horestis", stateIds: ["slumbering"] },
    detail: {
      pt: "Os 50 jars somam entre todos os ciclos da World Change, cinco por vez.",
      en: "The 50 jars add up across every cycle of the World Change, five at a time.",
      es: "Los 50 jars se acumulan entre todos los ciclos de la World Change, de cinco en cinco.",
      pl: "Te 50 dzbanów sumuje się przez wszystkie cykle World Change, po pięć naraz.",
    },
    sources: [`${WIKI}/Fearless`],
  },
  {
    id: "horestis-scorpion-king",
    kind: "mount",
    subject: "Scorpion King",
    availability: "available-today",
    trigger: { kind: "world-change", changeId: "horestis", stateIds: ["slumbering", "risen"] },
    detail: {
      pt: "Use um Scorpion Sceptre em um Sandstone Scorpion.",
      en: "Use a Scorpion Sceptre on a Sandstone Scorpion.",
      es: "Usa un Scorpion Sceptre en un Sandstone Scorpion.",
      pl: "Użyj Scorpion Sceptre na Sandstone Scorpionie.",
    },
    caveat: {
      pt: "O Scorpion Sceptre pode quebrar no uso, como todo item de domesticação.",
      en: "The Scorpion Sceptre can break on use, like every taming item.",
      es: "El Scorpion Sceptre puede romperse al usarlo, como todo objeto de domesticación.",
      pl: "Scorpion Sceptre może pęknąć przy użyciu, jak każdy przedmiot do oswajania.",
    },
    prerequisites: ["A Scorpion Sceptre"],
    sources: [`${WIKI}/Scorpion_King`, `${WIKI}/Scorpion_Sceptre`],
  },
  {
    id: "horestis-tomb-bestiary",
    kind: "bestiary",
    subject: "Bestiary",
    availability: "available-today",
    exclusive: true,
    bestiary: bestiaryProfile("Medium", "Rare"),
    // The tomb's undead population, which is what is down there *before* Horestis is killed:
    // TibiaWiki's Horestis Tomb page splits its creature lists into "when Horestis' Curse is
    // active" and "not active", and the page's own prose says which is which ("normally
    // populated with Undead creatures specific to the tomb... After Horestis is killed, on the
    // next server save, the tomb's creatures will be replaced by non-undead weaker ones").
    //
    // All seven live nowhere else in Tibia and all seven are Medium/Rare, which is why they are
    // one line: the kill count and the charm payout are the same fact seven times over. Clay
    // Guardian is in the same tomb and is deliberately left out, because it also spawns at
    // Middle Spike and Medusa Tower and so is not a reason to come here.
    creatures: [
      "Death Priest",
      "Elder Mummy",
      "Ghoulish Hyaena",
      "Grave Guard",
      "Sacred Spider",
      "Sandstone Scorpion",
      "Tomb Servant",
    ],
    trigger: { kind: "world-change", changeId: "horestis", stateIds: ["slumbering", "risen"] },
    detail: {
      pt: "A população undead do túmulo, que só existe enquanto Horestis não for morto.",
      en: "The tomb's undead population, which only exists while Horestis is still unkilled.",
      es: "La población no-muerta de la tumba, que solo existe mientras Horestis no sea asesinado.",
      pl: "Nieumarła populacja grobowca, która istnieje tylko, póki Horestis nie zginie.",
    },
    caveat: {
      pt: "Cada jar quebrado enfraquece o spawn do seu andar no próximo Server Save.",
      en: "Each jar broken weakens its floor's spawn at the next server save.",
      es: "Cada jar roto debilita el spawn de su piso en el próximo Server Save.",
      pl: "Każdy rozbity dzban osłabia spawn swojego piętra po następnym server save.",
    },
    sources: [
      `${WIKI}/Horestis_Tomb`,
      `${WIKI}/Grave_Guard`,
      `${WIKI}/Sandstone_Scorpion`,
      `${WIKI}/Death_Priest`,
    ],
  },

  // ══ WORLD CHANGE: The Mage's Tower ═════════════════════════════════════════
  {
    id: "mage-tower-dimension",
    kind: "access",
    subject: "Yielothax Dimension",
    availability: "available-today",
    exclusive: true,
    trigger: { kind: "world-change", changeId: "mage-tower", stateIds: ["portal-open"] },
    detail: {
      pt: "O Raging Mage mantém o portal aberto enquanto estiver vivo. É a única forma de entrar na outra dimensão.",
      en: "The Raging Mage holds the portal open while he lives. The only way into the other dimension.",
      es: "El Raging Mage mantiene el portal abierto mientras viva. La única forma de entrar en la otra dimensión.",
      pl: "Raging Mage utrzymuje portal otwarty, póki żyje, to jedyne wejście do innego wymiaru.",
    },
    prerequisites: ["Mission 2 of The New Frontier Quest"],
    sources: [wc("The_Mage's")],
  },
  {
    id: "mage-tower-yielothax",
    kind: "bestiary",
    subject: "Yielothax",
    availability: "available-today",
    exclusive: true,
    bestiary: bestiaryProfile("Medium", "Common"),
    // Both states, because the Another Dimension does not shut the instant the mage dies: it
    // destabilises and collapses a few minutes later. The qualifier is what keeps the
    // collapsing state honest, since the app has no timestamp for the kill and so cannot say
    // whether those minutes are gone.
    trigger: {
      kind: "world-change",
      changeId: "mage-tower",
      stateIds: ["portal-open", "mage-slain"],
    },
    detail: {
      pt: "Só existem na outra dimensão, acessível enquanto o portal estiver aberto.",
      en: "They exist only in the other dimension, reachable while the portal is open.",
      es: "Solo existen en la otra dimensión, accesible mientras el portal esté abierto.",
      pl: "Występują tylko w innym wymiarze, dostępnym gdy portal jest otwarty.",
    },
    sources: [wc("The_Mage's"), `${WIKI}/Yielothax`],
  },
  {
    id: "mage-tower-uniwheel",
    kind: "mount",
    subject: "Uniwheel",
    availability: "available-today",
    exclusive: true,
    trigger: { kind: "world-change", changeId: "mage-tower", stateIds: ["portal-open"] },
    detail: {
      pt: "Use um Golden Can of Oil no Uniwheel parado dentro da Yielothax Dimension. A montaria só existe ali.",
      en: "Use a Golden Can of Oil on the stationary Uniwheel inside the Yielothax Dimension. The mount exists nowhere else.",
      es: "Usa un Golden Can of Oil en el Uniwheel detenido dentro de la Yielothax Dimension. La montura solo existe ahí.",
      pl: "Użyj Golden Can of Oil na nieruchomym Uniwheel w Yielothax Dimension. Wierzchowiec jest tylko tam.",
    },
    prerequisites: ["A Golden Can of Oil (dropped by Golden Servants and Ethershreck)"],
    qualifier: {
      pt: "com um Golden Can of Oil",
      en: "with a Golden Can of Oil",
      es: "con un Golden Can of Oil",
      pl: "z Golden Can of Oil",
    },
    sources: [`${WIKI}/Uniwheel_(Mount)`, `${WIKI}/Golden_Can_of_Oil`],
  },
  {
    id: "mage-tower-raging-mage",
    kind: "boss",
    subject: "Raging Mage",
    availability: "progressable-today",
    bosstiary: "Archfoe",
    trigger: { kind: "world-change", changeId: "mage-tower", stateIds: ["portal-open"] },
    detail: {
      pt: "Ainda não é enfrentável: o mundo precisa matar 2000 Yielothaxes para enfraquecê-lo, e você precisa de 250 mortes suas para entrar na torre.",
      en: "Not fightable yet: the world must kill 2000 Yielothaxes to weaken him, and you need 250 kills of your own to enter the tower.",
      es: "Todavía no se puede enfrentar: el mundo debe matar 2000 Yielothaxes para debilitarlo, y necesitas 250 muertes propias para entrar a la torre.",
      pl: "Jeszcze nie do pokonania: świat musi zabić 2000 Yielothaxów, by go osłabić, a ty potrzebujesz 250 własnych zabójstw, by wejść do wieży.",
    },
    caveat: {
      pt: "Matá-lo derruba o portal cinco minutos depois, até o próximo Server Save.",
      en: "Killing him collapses the portal five minutes later, until the next server save.",
      es: "Matarlo derriba el portal cinco minutos después, hasta el próximo Server Save.",
      pl: "Jego śmierć zamyka portal po pięciu minutach, aż do następnego server save.",
    },
    qualifier: {
      pt: "depois de 2.000 Yielothaxes no mundo",
      en: "after 2,000 Yielothaxes server-wide",
      es: "tras 2.000 Yielothaxes en el mundo",
      pl: "po 2000 Yielothaxów na serwerze",
    },
    sources: [wc("The_Mage's"), `${WIKI}/Raging_Mage`],
  },
  {
    id: "mage-tower-mageslayer",
    kind: "achievement",
    subject: "Mageslayer",
    availability: "progressable-today",
    achievement: {
      name: "Mageslayer",
      grade: 1,
      points: 1,
      premium: true,
      requirement: {
        pt: "Derrote o Energized Raging Mage duas vezes",
        en: "Defeat the Energized Raging Mage twice",
        es: "Derrota al Energized Raging Mage dos veces",
        pl: "Pokonaj Energized Raging Mage'a dwa razy",
      },
    },
    // Only while the mage is at his tower. The Energized form stands on the top floor from the
    // moment the portal opens, and stops existing the moment it becomes the weakened Raging
    // Mage and dies; offering this achievement in the collapsing stage would be sending
    // somebody to Zao for a boss that is not there.
    trigger: { kind: "world-change", changeId: "mage-tower", stateIds: ["portal-open"] },
    detail: {
      pt: "O Energized Raging Mage ressuscita na hora enquanto o mundo não tiver matado 2.000 Yielothaxes; depois disso ele enfraquece e vira o Raging Mage.",
      en: "The Energized Raging Mage resurrects at once until the world has killed 2,000 Yielothaxes; after that he weakens and becomes the Raging Mage.",
      es: "El Energized Raging Mage resucita al instante mientras el mundo no haya matado 2.000 Yielothaxes; después se debilita y se vuelve el Raging Mage.",
      pl: "Energized Raging Mage od razu się odradza, dopóki świat nie zabije 2000 Yielothaxów; potem słabnie i staje się Raging Mage'em.",
    },
    sources: [wc("The_Mage's"), `${WIKI}/Mageslayer`, `${WIKI}/Energized_Raging_Mage`],
  },
  {
    id: "mage-tower-slain",
    kind: "boss",
    subject: "Raging Mage",
    availability: "progressable-today",
    bosstiary: "Archfoe",
    trigger: { kind: "world-change", changeId: "mage-tower", stateIds: ["mage-slain"] },
    detail: {
      pt: "Já foi derrotado neste ciclo.",
      en: "Already defeated this cycle.",
      es: "Ya fue derrotado en este ciclo.",
      pl: "Już pokonany w tym cyklu.",
    },
    sources: [wc("The_Mage's"), `${WIKI}/Raging_Mage`],
  },
  {
    id: "mage-tower-portal-collapsing",
    kind: "timing",
    subject: "Another Dimension",
    availability: "unlocks-future",
    trigger: { kind: "world-change", changeId: "mage-tower", stateIds: ["mage-slain"] },
    // No figure and no clock. The wiki puts the collapse about five minutes after the kill, but
    // the Guide reply carries no timestamp, so "5 minutes left" would be invented; and the
    // reply saying "collapsing" is not the same as the portal already being shut.
    detail: {
      pt: "O portal se fecha pouco depois da morte do Raging Mage. Fechado, a Another Dimension volta a ficar disponível no próximo ciclo.",
      en: "The portal closes shortly after the Raging Mage is defeated. Once closed, the Another Dimension becomes available again in the next cycle.",
      es: "El portal se cierra poco después de la muerte del Raging Mage. Una vez cerrado, la Another Dimension vuelve a estar disponible en el próximo ciclo.",
      pl: "Portal zamyka się krótko po śmierci Raging Mage'a. Po zamknięciu Another Dimension znów będzie dostępny w kolejnym cyklu.",
    },
    sources: [wc("The_Mage's")],
  },

  // ══ WORLD CHANGE: Their Master's Voice ═════════════════════════════════════
  {
    id: "masters-voice-gobbling",
    kind: "progress",
    subject: "Slime Gobbler",
    availability: "available-today",
    leadsTo: "masters-voice-mad-mage",
    trigger: { kind: "world-change", changeId: "masters-voice", stateIds: ["passable"] },
    label: {
      pt: "Limpar o fungo",
      en: "Clear the fungus",
      es: "Limpiar el hongo",
      pl: "Usunąć grzyb",
    },
    detail: {
      pt: "Limpe pelo menos 25 Slime Fungi com o Slime Gobbler do Servant Sentry para se qualificar para o Mad Mage. Quando todo o fungo cair, começam as ondas de servos.",
      en: "Clear at least 25 Slime Fungi with the Servant Sentry's Slime Gobbler to qualify for the Mad Mage. Once all the fungus is cleared, the servant waves begin.",
      es: "Limpia al menos 25 Slime Fungi con el Slime Gobbler del Servant Sentry para clasificar al Mad Mage. Cuando todo el hongo caiga, empiezan las oleadas de sirvientes.",
      pl: "Usuń co najmniej 25 Slime Fungi Slime Gobblerem od Servant Sentry, by zakwalifikować się do Mad Mage'a. Gdy cały grzyb zniknie, ruszają fale sług.",
    },
    caveat: {
      pt: "Só é possível remover um fungo a cada 5 segundos, leve companhia.",
      en: "Only one fungus every 5 seconds, bring company.",
      es: "Solo un hongo cada 5 segundos, lleva compañía.",
      pl: "Tylko jeden grzyb co 5 sekund, weź towarzystwo.",
    },
    qualifier: {
      pt: "25 fungos liberam o Mad Mage",
      en: "25 fungus tiles unlock the Mad Mage",
      es: "25 hongos liberan al Mad Mage",
      pl: "25 grzybów odblokowuje Mad Mage",
    },
    sources: [wc("Their_Master's_Voice")],
  },
  {
    id: "masters-voice-iron-servant",
    kind: "bestiary",
    subject: "Iron Servant",
    availability: "available-today",
    exclusive: true,
    bestiary: bestiaryProfile("Easy", "Very Rare"),
    trigger: { kind: "world-change", changeId: "masters-voice", stateIds: ["passable"] },
    detail: {
      pt: "Só existem no Mad Mage Dungeon durante esta World Change, e as ondas só começam depois que a masmorra estiver limpa do fungo.",
      en: "They exist only in the Mad Mage Dungeon during this World Change, and the waves only start once the dungeon is clear of fungus.",
      es: "Solo existen en el Mad Mage Dungeon durante esta World Change, y las oleadas solo empiezan tras limpiar el hongo.",
      pl: "Istnieją tylko w Mad Mage Dungeon podczas tej World Change, a fale ruszają dopiero po oczyszczeniu lochu z grzyba.",
    },
    sources: [wc("Their_Master's_Voice"), `${WIKI}/Iron_Servant`],
  },
  {
    id: "masters-voice-golden-servant",
    kind: "bestiary",
    subject: "Golden Servant",
    availability: "available-today",
    exclusive: true,
    bestiary: bestiaryProfile("Medium", "Very Rare"),
    trigger: { kind: "world-change", changeId: "masters-voice", stateIds: ["passable"] },
    detail: {
      pt: "Aparecem nas ondas após a limpeza, e são a fonte do Golden Can of Oil que doma o Uniwheel.",
      en: "They appear in the waves after the clean-up, and are the source of the Golden Can of Oil that tames the Uniwheel.",
      es: "Aparecen en las oleadas tras la limpieza, y son la fuente del Golden Can of Oil que doma el Uniwheel.",
      pl: "Pojawiają się w falach po sprzątaniu i są źródłem Golden Can of Oil do oswojenia Uniwheela.",
    },
    sources: [wc("Their_Master's_Voice"), `${WIKI}/Golden_Servant`],
  },
  {
    id: "masters-voice-diamond-servant",
    kind: "bestiary",
    subject: "Diamond Servant",
    availability: "available-today",
    exclusive: true,
    bestiary: bestiaryProfile("Medium", "Very Rare"),
    trigger: { kind: "world-change", changeId: "masters-voice", stateIds: ["passable"] },
    detail: {
      pt: "Vêm nas ondas junto com Iron e Golden Servants: as três entradas são Very Rare, fecham com 5 mortes cada e somam 130 Charm Points.",
      en: "They come in the waves with the Iron and Golden Servants: all three entries are Very Rare, close at 5 kills each and total 130 Charm Points.",
      es: "Vienen en las oleadas con los Iron y Golden Servants: las tres entradas son Very Rare, se cierran con 5 muertes cada una y suman 130 Charm Points.",
      pl: "Przychodzą w falach z Iron i Golden Servants: wszystkie trzy wpisy są Very Rare, zamykają się po 5 zabójstwach i dają łącznie 130 Charm Points.",
    },
    sources: [wc("Their_Master's_Voice"), `${WIKI}/Diamond_Servant`],
  },
  {
    id: "masters-voice-mad-mage",
    kind: "boss",
    subject: "Mad Mage",
    availability: "available-today",
    exclusive: true,
    // No `bosstiary`: the Mad Mage's TibiaWiki page has no bosstiaryclass, so he is a boss that
    // is not a Bosstiary entry. Claiming a class here would have the bulletin promise Bane
    // points that the game does not pay.
    trigger: { kind: "world-change", changeId: "masters-voice", stateIds: ["passable"] },
    detail: {
      pt: "Aparece depois da última onda de servos, para quem tiver limpado 25 Slime Fungi.",
      en: "Appears after the last servant wave, for anyone who cleared 25 Slime Fungi.",
      es: "Aparece tras la última oleada de sirvientes, para quien haya limpiado 25 Slime Fungi.",
      pl: "Pojawia się po ostatniej fali sług, dla tych, którzy usunęli 25 Slime Fungi.",
    },
    qualifier: {
      pt: "depois do fungo e de todas as ondas",
      en: "after the fungus and every wave",
      es: "tras el hongo y todas las oleadas",
      pl: "po grzybie i wszystkich falach",
    },
    sources: [wc("Their_Master's_Voice"), `${WIKI}/Mad_Mage`],
  },
  {
    id: "masters-voice-slimer",
    kind: "achievement",
    subject: "Slimer",
    availability: "progressable-today",
    achievement: {
      name: "Slimer",
      grade: 1,
      points: 1,
      premium: true,
      requirement: {
        pt: "Limpe 500 Slime Fungi",
        en: "Clear 500 Slime Fungi",
        es: "Limpia 500 Slime Fungi",
        pl: "Usuń 500 Slime Fungi",
      },
    },
    trigger: { kind: "world-change", changeId: "masters-voice", stateIds: ["passable"] },
    detail: {
      pt: "A masmorra tem 350 tiles de fungo por ciclo, então os 500 somam entre visitas.",
      en: "The dungeon holds 350 fungus tiles per cycle, so the 500 add up across visits.",
      es: "La mazmorra tiene 350 tiles de hongo por ciclo, así que los 500 se acumulan entre visitas.",
      pl: "Loch ma 350 pól grzyba na cykl, więc te 500 sumuje się przez wiele wizyt.",
    },
    caveat: {
      pt: "Só dá para remover um fungo a cada 5 segundos.",
      en: "Only one fungus every 5 seconds.",
      es: "Solo un hongo cada 5 segundos.",
      pl: "Tylko jeden grzyb co 5 sekund.",
    },
    sources: [wc("Their_Master's_Voice"), `${WIKI}/Slimer`],
  },

  // ══ WORLD CHANGE: Swamp Fever ══════════════════════════════════════════════
  {
    id: "swamp-fever-slug-drug",
    kind: "item",
    subject: "Slug Drug",
    availability: "available-today",
    leadsTo: "swamp-fever-doctor",
    trigger: { kind: "world-change", changeId: "swamp-fever", stateIds: ["under-control"] },
    detail: {
      pt: "Troque Medicine Pouches com Ottokar por Belongings of a Deceased, que podem conter o Slug Drug usado para domar um Slug e ganhar a montaria Tiger Slug.",
      en: "Trade Medicine Pouches to Ottokar for Belongings of a Deceased, which can contain the Slug Drug used to tame a Slug for the Tiger Slug mount.",
      es: "Cambia Medicine Pouches con Ottokar por Belongings of a Deceased, que pueden contener el Slug Drug usado para domar un Slug y ganar la montura Tiger Slug.",
      pl: "Wymień Medicine Pouches u Ottokara na Belongings of a Deceased. Mogą kryć Slug Drug, którym oswoisz Sluga na wierzchowca Tiger Slug.",
    },
    caveat: {
      pt: "O Slug Drug é um resultado muito raro da bolsa, e quebra em cerca de 30% dos usos.",
      en: "The Slug Drug is a very rare result from the bag, and breaks on roughly 30% of uses.",
      es: "El Slug Drug es un resultado muy raro de la bolsa y se rompe en cerca del 30% de los usos.",
      pl: "Slug Drug wypada z torby bardzo rzadko i pęka przy około 30% użyć.",
    },
    qualifier: {
      pt: "doma o Tiger Slug",
      en: "tames the Tiger Slug",
      es: "doma el Tiger Slug",
      pl: "oswaja Tiger Sluga",
    },
    sources: [wc("Swamp_Fever"), `${WIKI}/Belongings_of_a_deceased`, `${WIKI}/Slug_Drug`],
  },
  {
    id: "swamp-fever-doctor",
    kind: "achievement",
    subject: "Doctor! Doctor!",
    availability: "progressable-today",
    achievement: {
      name: "Doctor! Doctor!",
      grade: 1,
      points: 2,
      premium: false,
      requirement: {
        pt: "Entregue 100 Medicine Pouches a Ottokar",
        en: "Deliver 100 Medicine Pouches to Ottokar",
        es: "Entrega 100 Medicine Pouches a Ottokar",
        pl: "Dostarcz Ottokarowi 100 Medicine Pouches",
      },
    },
    trigger: { kind: "world-change", changeId: "swamp-fever", stateIds: ["under-control", "spreading"] },
    detail: {
      pt: "As bolsas vêm dos Swamp Trolls ao sul de Venore e em Port Hope, e somam entre os dias.",
      en: "The pouches come from the Swamp Trolls south of Venore and at Port Hope, and add up across days.",
      es: "Las bolsas vienen de los Swamp Trolls al sur de Venore y en Port Hope, y se acumulan entre días.",
      pl: "Torby wypadają ze Swamp Trolli na południe od Venore i w Port Hope, a liczba sumuje się przez dni.",
    },
    sources: [wc("Swamp_Fever"), `${WIKI}/Doctor!_Doctor!`],
  },
  {
    id: "swamp-fever-feverish-citizen",
    kind: "bestiary",
    subject: "Feverish Citizen",
    availability: "available-today",
    bestiary: bestiaryProfile("Easy", "Rare"),
    // The spreading stage only. Their spawn interval is set by how much medicine Ottokar has
    // been given, so in the contained stage they are throttled to an hour or more apart, and
    // sending a reader to Venore to farm them is sending them to wait.
    trigger: { kind: "world-change", changeId: "swamp-fever", stateIds: ["spreading"] },
    detail: {
      pt: "Surgem por Venore em raides enquanto faltar remédio, cada vez mais raros conforme as Medicine Pouches são entregues.",
      en: "They raid Venore while the medicine is short, growing rarer as Medicine Pouches are handed in.",
      es: "Aparecen por Venore en raids mientras falte medicina, cada vez más raros conforme se entregan Medicine Pouches.",
      pl: "Najeżdżają Venore, póki brakuje leków, i pojawiają się tym rzadziej, im więcej Medicine Pouches oddano.",
    },
    sources: [wc("Swamp_Fever"), `${WIKI}/Feverish_Citizen`],
  },
  {
    id: "swamp-fever-afflicted-cloth",
    kind: "outfit",
    subject: "Afflicted Outfits Quest",
    availability: "progressable-today",
    trigger: { kind: "world-change", changeId: "swamp-fever", stateIds: ["spreading"] },
    detail: {
      pt: "Os Feverish Citizens largam os panos usados nos Afflicted Outfits, e só aparecem enquanto a febre estiver se espalhando.",
      en: "Feverish Citizens drop the cloth pieces used for the Afflicted Outfits, and only turn up while the fever is spreading.",
      es: "Los Feverish Citizens sueltan las telas usadas en los Afflicted Outfits, y solo aparecen mientras la fiebre se extiende.",
      pl: "Feverish Citizens upuszczają tkaniny do Afflicted Outfits i pojawiają się tylko, gdy gorączka się rozprzestrzenia.",
    },
    sources: [wc("Swamp_Fever"), `${WIKI}/Afflicted_Outfits_Quest`],
  },

  // ══ WORLD CHANGE: Thornfire ════════════════════════════════════════════════
  {
    id: "thornfire-elf-overseer",
    kind: "bestiary",
    subject: "Elf Overseer",
    availability: "available-today",
    exclusive: true,
    bestiary: bestiaryProfile("Medium", "Very Rare"),
    trigger: { kind: "world-change", changeId: "thornfire", stateIds: ["guarded"] },
    detail: {
      pt: "Os três guardam as prisões sob Shadowthorn e só existem enquanto a vila não estiver queimando.",
      en: "The three of them guard the prisons below Shadowthorn and only exist while the village is not burning.",
      es: "Los tres custodian las prisiones bajo Shadowthorn y solo existen mientras la aldea no arde.",
      pl: "Trójka strzeże więzień pod Shadowthorn i istnieje tylko, gdy wioska nie płonie.",
    },
    sources: [wc("Thornfire"), `${WIKI}/Elf_Overseer`],
  },
  {
    id: "thornfire-release",
    kind: "progress",
    subject: "Shadowthorn",
    availability: "unlocks-future",
    trigger: { kind: "world-change", changeId: "thornfire", stateIds: ["guarded", "breaking-out"] },
    detail: {
      pt: "Mate os três Elf Overseers e todos os outros elfos de Shadowthorn para libertar os firestarters. Uma vez libertados, Shadowthorn queima depois do próximo Server Save.",
      en: "Kill the three Elf Overseers and all other elves in Shadowthorn to free the firestarters. Once they are freed, Shadowthorn will burn after the next server save.",
      es: "Mata a los tres Elf Overseers y a todos los demás elfos de Shadowthorn para liberar a los firestarters. Una vez libres, Shadowthorn arderá tras el próximo Server Save.",
      pl: "Zabij trzech Elf Overseers i wszystkie pozostałe elfy w Shadowthorn, by uwolnić podpalaczy. Gdy będą wolni, Shadowthorn spłonie po następnym server save.",
    },
    qualifier: {
      pt: "mate os Elf Overseers e todos os elfos",
      en: "kill the Elf Overseers and every elf",
      es: "mata a los Elf Overseers y a todos los elfos",
      pl: "zabij Elf Overseers i wszystkie elfy",
    },
    sources: [wc("Thornfire")],
  },
  {
    id: "thornfire-crystal-wolf-mount",
    kind: "mount",
    subject: "Crystal Wolf",
    availability: "available-today",
    exclusive: true,
    trigger: { kind: "world-change", changeId: "thornfire", stateIds: ["burning", "being-fought"] },
    detail: {
      pt: "Apagar fogos faz surgir raramente um Thornfire Wolf: leve-o até a água do bog para virar Crystal Wolf e dome com um Diapason.",
      en: "Putting out fires rarely spawns a Thornfire Wolf: lure it onto the bog water to turn it into a Crystal Wolf, then tame it with a Diapason.",
      es: "Apagar fuegos hace surgir raramente un Thornfire Wolf: llévalo al agua del bog para volverlo Crystal Wolf y dómalo con un Diapason.",
      pl: "Gaszenie ognia rzadko przywołuje Thornfire Wolfa: zwab go na bagienną wodę, by stał się Crystal Wolfem, i oswój Diapasonem.",
    },
    caveat: {
      pt: "A chance é de 0,1% a 1% por fogo apagado, e o Diapason pode quebrar.",
      en: "The chance is 0.1–1% per fire extinguished, and the Diapason can break.",
      es: "La probabilidad es del 0,1% al 1% por fuego apagado, y el Diapason puede romperse.",
      pl: "Szansa to 0,1–1% na ugaszony ogień, a Diapason może pęknąć.",
    },
    prerequisites: ["Prepared Buckets (a Bucket plus a Flask of Embalming Fluid)", "A Diapason"],
    qualifier: {
      pt: "com um Diapason, a partir de um Thornfire Wolf",
      en: "with a Diapason, from a Thornfire Wolf",
      es: "con un Diapason, a partir de un Thornfire Wolf",
      pl: "Diapasonem, z Thornfire Wolfa",
    },
    sources: [wc("Thornfire"), `${WIKI}/Crystal_Wolf_(Mount)`],
  },
  {
    id: "thornfire-wolf-bestiary",
    kind: "bestiary",
    subject: "Thornfire Wolf",
    availability: "available-today",
    exclusive: true,
    bestiary: bestiaryProfile("Medium", "Very Rare"),
    trigger: { kind: "world-change", changeId: "thornfire", stateIds: ["burning", "being-fought"] },
    detail: {
      pt: "Deixe o lobo quase morto, leve-o à água do bog e mate-o no instante em que o Crystal Wolf nascer. Assim as duas entradas contam.",
      en: "Bring the wolf to red health, lure it onto the bog water and finish it the instant the Crystal Wolf appears. That scores both entries.",
      es: "Deja al lobo casi muerto, llévalo al agua del bog y remátalo justo cuando aparezca el Crystal Wolf. Así cuentan ambas entradas.",
      pl: "Zbij wilkowi życie do czerwieni, zwab go na bagno i dobij dokładnie wtedy, gdy pojawi się Crystal Wolf. Liczą się oba wpisy.",
    },
    sources: [wc("Thornfire"), `${WIKI}/Thornfire_Wolf`],
  },
  {
    id: "thornfire-crystal-wolf-bestiary",
    kind: "bestiary",
    subject: "Crystal Wolf",
    availability: "available-today",
    exclusive: true,
    bestiary: bestiaryProfile("Medium", "Very Rare"),
    trigger: { kind: "world-change", changeId: "thornfire", stateIds: ["burning", "being-fought"] },
    detail: {
      pt: "Só existe em Shadowthorn, a partir de um Thornfire Wolf levado à água do bog.",
      en: "It exists only in Shadowthorn, made from a Thornfire Wolf lured onto the bog water.",
      es: "Solo existe en Shadowthorn, a partir de un Thornfire Wolf llevado al agua del bog.",
      pl: "Występuje tylko w Shadowthorn, powstając z Thornfire Wolfa zwabionego na bagno.",
    },
    sources: [wc("Thornfire"), `${WIKI}/Crystal_Wolf`],
  },
  {
    id: "thornfire-firefighter",
    kind: "achievement",
    subject: "Firefighter",
    availability: "progressable-today",
    achievement: {
      name: "Firefighter",
      grade: 1,
      points: 2,
      premium: false,
      requirement: {
        pt: "Apague 500 fogos em Shadowthorn",
        en: "Extinguish 500 fires in Shadowthorn",
        es: "Apaga 500 fuegos en Shadowthorn",
        pl: "Ugaś 500 ognisk w Shadowthorn",
      },
    },
    trigger: { kind: "world-change", changeId: "thornfire", stateIds: ["burning", "being-fought"] },
    detail: {
      pt: "Apague 500 fogos com Buckets of Bog Water; o incêndio reinicia 8h e 16h após o Server Save, dando novas chances no mesmo dia.",
      en: "Extinguish 500 fires with Buckets of Bog Water; the blaze resets 8 and 16 hours after server save, giving fresh chances the same day.",
      es: "Apaga 500 fuegos con Buckets of Bog Water; el incendio se reinicia 8 y 16 horas tras el Server Save, dando nuevas oportunidades el mismo día.",
      pl: "Ugaś 500 ognisk Bucketami of Bog Water; pożar resetuje się 8 i 16 godzin po server save, dając kolejne szanse tego samego dnia.",
    },
    caveat: {
      pt: "500 fogos é acumulativo entre dias, não uma sessão.",
      en: "500 fires is cumulative across days, not one session.",
      es: "500 fuegos es acumulativo entre días, no una sesión.",
      pl: "500 ognisk to suma z wielu dni, nie jedna sesja.",
    },
    prerequisites: ["Prepared Buckets (a Bucket plus a Flask of Embalming Fluid)"],
    qualifier: {
      pt: "500 fogos com Buckets of Bog Water",
      en: "500 fires with Buckets of Bog Water",
      es: "500 fuegos con Buckets of Bog Water",
      pl: "500 ognisk Bucketami of Bog Water",
    },
    sources: [wc("Thornfire"), `${WIKI}/Firefighter`],
  },

  // ══ WORLD CHANGE: Twisted Waters ═══════════════════════════════════════════
  {
    id: "twisted-waters-dirty",
    kind: "progress",
    subject: "Lake Equivocolao",
    availability: "unlocks-future",
    trigger: { kind: "world-change", changeId: "twisted-waters", stateIds: ["clean"] },
    detail: {
      pt: "Jogue corpos no lago para contaminá-lo. Depois de 1.000 corpos no servidor, a água fica suja no próximo Server Save e os Shimmer Swimmers aparecem.",
      en: "Throw corpses into the lake to contaminate it. Once 1,000 corpses have been thrown in server-wide, the lake will become dirty after the next server save, making Shimmer Swimmers available.",
      es: "Arroja cadáveres al lago para contaminarlo. Tras 1.000 cadáveres en el servidor, el agua se ensucia en el próximo Server Save y aparecen los Shimmer Swimmers.",
      pl: "Wrzucaj zwłoki do jeziora, by je zanieczyścić. Po 1000 zwłok na serwerze woda zabrudzi się po następnym server save i pojawią się Shimmer Swimmery.",
    },
    qualifier: {
      pt: "jogue corpos no lago",
      en: "dump corpses in the lake",
      es: "arroja cadáveres al lago",
      pl: "wrzucaj zwłoki do jeziora",
    },
    sources: [wc("Twisted_Waters")],
  },
  {
    id: "twisted-waters-shimmer-swimmer",
    kind: "item",
    subject: "Shimmer Swimmer",
    availability: "available-today",
    exclusive: true,
    trigger: { kind: "world-change", changeId: "twisted-waters", stateIds: ["dirty-swimmers"] },
    detail: {
      pt: "Pesque no Lake Equivocolao: é o único lugar de Tibia onde o peixe existe, e cada personagem pega um a cada 20 horas.",
      en: "Fish in Lake Equivocolao: it is the only place in Tibia the fish exists, and each character catches one every 20 hours.",
      es: "Pesca en el Lake Equivocolao: es el único lugar de Tibia donde existe el pez, y cada personaje saca uno cada 20 horas.",
      pl: "Łów w Lake Equivocolao: to jedyne miejsce w Tibii z tą rybą, a każda postać łowi jedną co 20 godzin.",
    },
    qualifier: {
      pt: "pesque no lago, 1 a cada 20h",
      en: "fish it in the lake, one every 20h",
      es: "pesca en el lago, 1 cada 20h",
      pl: "łów w jeziorze, 1 na 20h",
    },
    sources: [wc("Twisted_Waters"), `${WIKI}/Shimmer_Swimmer`],
  },
  {
    id: "twisted-waters-biodegradable",
    kind: "achievement",
    subject: "Biodegradable",
    availability: "progressable-today",
    achievement: {
      name: "Biodegradable",
      grade: 1,
      points: 1,
      premium: true,
      requirement: {
        pt: "Pesque 50 Shimmer Swimmers",
        en: "Fish 50 Shimmer Swimmers",
        es: "Pesca 50 Shimmer Swimmers",
        pl: "Złów 50 Shimmer Swimmerów",
      },
    },
    trigger: { kind: "world-change", changeId: "twisted-waters", stateIds: ["dirty-swimmers"] },
    detail: {
      pt: "São 50 Shimmer Swimmers no total, no ritmo de um a cada 20 horas por personagem.",
      en: "50 Shimmer Swimmers in total, at one every 20 hours per character.",
      es: "50 Shimmer Swimmers en total, a uno cada 20 horas por personaje.",
      pl: "Łącznie 50 Shimmer Swimmerów, po jednym na 20 godzin na postać.",
    },
    qualifier: {
      pt: "50 Shimmer Swimmers pescados",
      en: "50 Shimmer Swimmers fished",
      es: "50 Shimmer Swimmers pescados",
      pl: "50 złowionych Shimmer Swimmerów",
    },
    sources: [`${WIKI}/Biodegradable`],
  },

  // ══ WORLD CHANGE: Awash ════════════════════════════════════════════════════
  {
    id: "awash-coal",
    kind: "progress",
    subject: "Sunken Mines",
    availability: "unlocks-future",
    trigger: { kind: "world-change", changeId: "awash", stateIds: ["flooded"] },
    detail: {
      pt: "Use 202 unidades de Coal nas bombas de água perto de Dronk: as minas abrem no próximo Server Save.",
      en: "Use 202 pieces of Coal on the water pumps by Dronk: the mines open at the next server save.",
      es: "Usa 202 unidades de Coal en las bombas de agua junto a Dronk: las minas abren en el próximo Server Save.",
      pl: "Użyj 202 sztuk Coal na pompach przy Dronku: kopalnie otworzą się po następnym server save.",
    },
    qualifier: {
      pt: "202 unidades nas bombas de Dronk",
      en: "202 pieces on Dronk's pumps",
      es: "202 unidades en las bombas de Dronk",
      pl: "202 sztuki na pompy Dronka",
    },
    sources: [wc("Awash")],
  },
  {
    id: "awash-deepling-scout",
    kind: "bestiary",
    subject: "Deepling Scout",
    availability: "available-today",
    exclusive: true,
    bestiary: bestiaryProfile("Medium", "Common"),
    trigger: {
      kind: "world-change",
      changeId: "awash",
      stateIds: ["drained-quota-met", "drained-quota-open"],
    },
    detail: {
      pt: "As Sunken Mines sob Kazordoon só ficam acessíveis enquanto a água estiver drenada.",
      en: "The Sunken Mines below Kazordoon are only reachable while the water is drained.",
      es: "Las Sunken Mines bajo Kazordoon solo son accesibles mientras el agua esté drenada.",
      pl: "Sunken Mines pod Kazordoon są dostępne tylko przy osuszonej wodzie.",
    },
    sources: [wc("Awash"), `${WIKI}/Deepling_Scout`],
  },
  {
    id: "awash-groam",
    kind: "boss",
    subject: "Groam",
    availability: "available-today",
    exclusive: true,
    bosstiary: "Nemesis",
    trigger: {
      kind: "world-change",
      changeId: "awash",
      stateIds: ["drained-quota-met", "drained-quota-open"],
    },
    detail: {
      pt: "Pode aparecer na mina enquanto ela estiver drenada.",
      en: "Can appear in the mine while it is drained.",
      es: "Puede aparecer en la mina mientras esté drenada.",
      pl: "Może pojawić się w kopalni, gdy jest osuszona.",
    },
    caveat: {
      pt: "Ele aparece no lado leste das Sunken Mines, no máximo uma vez por Server Save.",
      en: "He turns up on the east side of the Sunken Mines, at most once per server save.",
      es: "Aparece en el lado este de las Sunken Mines, como mucho una vez por Server Save.",
      pl: "Pojawia się po wschodniej stronie Sunken Mines, najwyżej raz na server save.",
    },
    achievement: {
      name: "Eye of the Deep",
      grade: 1,
      points: 1,
      premium: false,
      requirement: {
        pt: "Derrote Groam",
        en: "Defeat Groam",
        es: "Derrota a Groam",
        pl: "Pokonaj Groama",
      },
    },
    sources: [wc("Awash"), `${WIKI}/Groam`, `${WIKI}/Eye_of_the_Deep`],
  },
  {
    id: "awash-steamship-route",
    kind: "service",
    subject: "Junkar",
    availability: "available-today",
    trigger: {
      kind: "world-change",
      changeId: "awash",
      stateIds: ["drained-quota-met", "drained-quota-open"],
    },
    detail: {
      pt: "Com a mina aberta, o barco de Junkar também liga Kazordoon a Thais e a Robson's Isle.",
      en: "With the mine open, Junkar's boat also links Kazordoon to Thais and Robson's Isle.",
      es: "Con la mina abierta, el barco de Junkar también conecta Kazordoon con Thais y Robson's Isle.",
      pl: "Przy otwartej kopalni łódź Junkara łączy też Kazordoon z Thais i Robson's Isle.",
    },
    sources: [wc("Awash")],
  },
  {
    id: "awash-invader-of-the-deep",
    kind: "achievement",
    subject: "Invader of the Deep",
    availability: "progressable-today",
    achievement: {
      name: "Invader of the Deep",
      grade: 1,
      points: 2,
      premium: false,
      requirement: {
        pt: "Mate 300 Deepling Scouts",
        en: "Kill 300 Deepling Scouts",
        es: "Mata 300 Deepling Scouts",
        pl: "Zabij 300 Deepling Scoutów",
      },
    },
    trigger: {
      kind: "world-change",
      changeId: "awash",
      stateIds: ["drained-quota-met", "drained-quota-open"],
    },
    detail: {
      pt: "As mortes somam entre os dias, mas só acontecem enquanto a mina estiver aberta.",
      en: "The kills add up across days, but can only be made while the mine is open.",
      es: "Las muertes se acumulan entre días, pero solo pueden hacerse mientras la mina esté abierta.",
      pl: "Zabójstwa sumują się przez dni, ale można je zdobyć tylko przy otwartej kopalni.",
    },
    sources: [wc("Awash"), `${WIKI}/Invader_of_the_Deep`],
  },
  {
    id: "awash-hold-quota",
    kind: "progress",
    subject: "Deepling Scout",
    availability: "unlocks-future",
    trigger: { kind: "world-change", changeId: "awash", stateIds: ["drained-quota-open"] },
    label: {
      pt: "Manter a mina aberta",
      en: "Keep the mine open",
      es: "Mantener la mina abierta",
      pl: "Utrzymać kopalnię otwartą",
    },
    detail: {
      pt: "Mate Deepling Scouts suficientes hoje para a mina continuar drenada depois do próximo Server Save. Caso contrário, o túnel inunda de novo.",
      en: "Kill enough Deepling Scouts today to keep the mine drained after the next server save. Otherwise, the tunnel will flood again.",
      es: "Mata suficientes Deepling Scouts hoy para que la mina siga drenada tras el próximo Server Save. Si no, el túnel vuelve a inundarse.",
      pl: "Zabij dziś wystarczająco Deepling Scoutów, by kopalnia została osuszona po następnym server save. Inaczej tunel znów się zaleje.",
    },
    sources: [wc("Awash")],
  },

  // ══ WORLD CHANGE: Steamship ════════════════════════════════════════════════
  {
    id: "steamship-coal",
    kind: "progress",
    subject: "Coal",
    availability: "unlocks-future",
    trigger: { kind: "world-change", changeId: "steamship", stateIds: ["not-running"] },
    label: {
      pt: "Reativar o Steamship",
      en: "Restart the Steamship",
      es: "Reactivar el Steamship",
      pl: "Uruchomić Steamship",
    },
    detail: {
      pt: "Entregue Coal a Junkar, sob o Ancient Temple de Thais. O servidor precisa de 200 unidades no total.",
      en: "Deliver Coal to Junkar beneath Thais' Ancient Temple. The server needs 200 pieces of Coal in total.",
      es: "Entrega Coal a Junkar, bajo el Ancient Temple de Thais. El servidor necesita 200 unidades en total.",
      pl: "Dostarcz Coal Junkarowi pod Ancient Temple w Thais. Serwer potrzebuje łącznie 200 sztuk.",
    },
    // Not "ask a Guide whether the target is met": the bulletin is *built* from Guide replies,
    // so telling its reader to go and ask one is the generator asking someone else to do its
    // own job. What is worth saying is the part a Guide cannot fix, which is that Junkar keeps
    // taking coal after the target is already met.
    caveat: {
      pt: "Junkar aceita carvão mesmo depois de já ter o bastante, e o barco só parte no próximo Server Save.",
      en: "Junkar accepts coal even once he has enough, and the boat only leaves at the next server save.",
      es: "Junkar acepta carbón incluso cuando ya tiene suficiente, y el barco solo sale en el próximo Server Save.",
      pl: "Junkar przyjmuje węgiel nawet gdy ma już dość, a łódź wypływa dopiero po następnym server save.",
    },
    advisory: {
      pt: "Firestarters, The Lost e Stonerefiners são boas fontes de Coal.",
      en: "Firestarters, The Lost and Stonerefiners are good sources of Coal.",
      es: "Firestarters, The Lost y Stonerefiners son buenas fuentes de Coal.",
      pl: "Firestarters, The Lost i Stonerefiners to dobre źródła Coal.",
    },
    sources: [wc("Steamship")],
  },
  {
    id: "steamship-starts",
    kind: "service",
    subject: "Thais–Kazordoon steamship",
    availability: "unlocks-future",
    trigger: { kind: "world-change", changeId: "steamship", stateIds: ["coal-delivered"] },
    detail: {
      pt: "O carvão já está entregue: a viagem de ida Thais → Kazordoon começa no próximo Server Save.",
      en: "The coal is already delivered: the one-way Thais → Kazordoon trip starts at the next server save.",
      es: "El carbón ya está entregado: el viaje de ida Thais → Kazordoon empieza en el próximo Server Save.",
      pl: "Węgiel już dostarczony: rejs Thais → Kazordoon w jedną stronę rusza po następnym server save.",
    },
    sources: [wc("Steamship")],
  },

  // ══ WORLD CHANGE: Horse Station ════════════════════════════════════════════
  {
    id: "horse-station-rental",
    kind: "service",
    subject: "Horse rental",
    availability: "available-today",
    trigger: { kind: "world-change", changeId: "horse-station", stateIds: ["normal"] },
    detail: {
      pt: "Os estábulos a leste de Thais e a oeste de Venore estão alugando normalmente, mas, com os cavalos presos, nenhum Wild Horse aparece para domar.",
      en: "The stables east of Thais and west of Venore are renting normally, but with the horses penned, no Wild Horse spawns to tame.",
      es: "Los establos al este de Thais y al oeste de Venore alquilan con normalidad, pero con los caballos encerrados no aparece ningún Wild Horse para domar.",
      pl: "Stajnie na wschód od Thais i na zachód od Venore wynajmują normalnie, ale przy koniach w zagrodzie żaden Wild Horse się nie pojawia.",
    },
    sources: [wc("Horse_Station")],
  },
  {
    id: "horse-station-war-horse",
    kind: "mount",
    subject: "War Horse",
    availability: "available-today",
    exclusive: true,
    trigger: { kind: "world-change", changeId: "horse-station", stateIds: ["escaped"] },
    detail: {
      pt: "Use Sugar Oat ou uma Music Box em um Wild Horse para domá-lo.",
      en: "Use Sugar Oat or a Music Box on a Wild Horse to tame it.",
      es: "Usa Sugar Oat o una Music Box en un Wild Horse para domarlo.",
      pl: "Użyj Sugar Oat lub Music Box na Wild Horse, by go oswoić.",
    },
    // The spawn interval and the 0-3 group size are true and are trivia: they change nothing a
    // reader decides at eight in the morning, and in the bulletin they pushed the taming
    // method, the mount and the achievement off the block. The catalog page still shows them.
    caveat: {
      pt: "Wild Horses surgem a cada três horas desde o Server Save, em grupos de 0 a 3; cavalos comuns não podem ser domados.",
      en: "Wild Horses appear every three hours from server save, in groups of 0 to 3; ordinary horses cannot be tamed.",
      es: "Los Wild Horses aparecen cada tres horas desde el Server Save, en grupos de 0 a 3; los caballos comunes no pueden domarse.",
      pl: "Wild Horse'y pojawiają się co trzy godziny od server save, w grupach 0 do 3; zwykłych koni nie da się oswoić.",
    },
    achievement: {
      name: "Lucky Horseshoe",
      grade: 1,
      points: 1,
      premium: false,
      requirement: {
        pt: "Dome um Wild Horse",
        en: "Tame a Wild Horse",
        es: "Doma un Wild Horse",
        pl: "Oswój Wild Horse'a",
      },
    },
    sources: [
      wc("Horse_Station"),
      `${WIKI}/War_Horse`,
      `${WIKI}/Sugar_Oat`,
      `${WIKI}/Lucky_Horseshoe`,
    ],
  },
  {
    id: "horse-station-wild-horse",
    kind: "bestiary",
    subject: "Wild Horse",
    availability: "available-today",
    exclusive: true,
    bestiary: bestiaryProfile("Trivial", "Very Rare"),
    trigger: { kind: "world-change", changeId: "horse-station", stateIds: ["escaped"] },
    detail: {
      pt: "Só surgem enquanto os cavalos estiverem soltos, perto da Thais Troll Cave.",
      en: "They only spawn while the horses are loose, near the Thais Troll Cave.",
      es: "Solo aparecen mientras los caballos estén sueltos, cerca de la Thais Troll Cave.",
      pl: "Pojawiają się tylko przy koniach na wolności, blisko Thais Troll Cave.",
    },
    sources: [`${WIKI}/Wild_Horse`],
  },
  {
    id: "horse-station-horse-brown",
    kind: "bestiary",
    subject: "Horse (Brown)",
    availability: "available-today",
    exclusive: true,
    bestiary: bestiaryProfile("Trivial", "Uncommon"),
    trigger: { kind: "world-change", changeId: "horse-station", stateIds: ["escaped"] },
    detail: {
      pt: "Os cavalos comuns só saem do cercado enquanto estiverem soltos pela Horse Station de Thais.",
      en: "The ordinary horses are only out of the pen while they are loose around the Thaian Horse Station.",
      es: "Los caballos comunes solo están fuera del corral mientras andan sueltos por el Horse Station de Thais.",
      pl: "Zwykłe konie są poza zagrodą tylko wtedy, gdy biegają wolno wokół Horse Station pod Thais.",
    },
    sources: [wc("Horse_Station"), `${WIKI}/Horse_(Brown)`],
  },
  {
    id: "horse-station-horse-grey",
    kind: "bestiary",
    subject: "Horse (Grey)",
    availability: "available-today",
    exclusive: true,
    bestiary: bestiaryProfile("Trivial", "Uncommon"),
    trigger: { kind: "world-change", changeId: "horse-station", stateIds: ["escaped"] },
    detail: {
      pt: "Uma das três variantes comuns que aparecem enquanto os cavalos estiverem soltos.",
      en: "One of the three ordinary variants that appear while the horses are loose.",
      es: "Una de las tres variantes comunes que aparecen mientras los caballos están sueltos.",
      pl: "Jeden z trzech zwykłych wariantów, które pojawiają się, gdy konie są na wolności.",
    },
    sources: [wc("Horse_Station"), `${WIKI}/Horse_(Grey)`],
  },
  {
    id: "horse-station-horse-taupe",
    kind: "bestiary",
    subject: "Horse (Taupe)",
    availability: "available-today",
    exclusive: true,
    bestiary: bestiaryProfile("Trivial", "Rare"),
    trigger: { kind: "world-change", changeId: "horse-station", stateIds: ["escaped"] },
    detail: {
      pt: "A variante escura, chamada Horse (Taupe) na TibiaWiki. Só aparece com os cavalos soltos.",
      en: "The dark variant, named Horse (Taupe) on TibiaWiki. It only appears while the horses are loose.",
      es: "La variante oscura, llamada Horse (Taupe) en TibiaWiki. Solo aparece con los caballos sueltos.",
      pl: "Ciemny wariant, na TibiaWiki nazwany Horse (Taupe). Pojawia się tylko przy koniach na wolności.",
    },
    sources: [wc("Horse_Station"), `${WIKI}/Horse_(Taupe)`],
  },
  {
    id: "horse-station-restore",
    kind: "progress",
    subject: "Horse Station",
    availability: "progressable-today",
    trigger: { kind: "world-change", changeId: "horse-station", stateIds: ["escaped"] },
    label: {
      pt: "Restaurar o aluguel de cavalos",
      en: "Restore horse rentals",
      es: "Restaurar el alquiler de caballos",
      pl: "Przywrócić wynajem koni",
    },
    detail: {
      pt: "Leve os cavalos soltos de volta para o cercado da Horse Station de Thais.",
      en: "Lure the escaped Horses back into the Thaian Horse Station.",
      es: "Lleva los caballos sueltos de vuelta al corral del Horse Station de Thais.",
      pl: "Zwab zbiegłe konie z powrotem do zagrody Horse Station pod Thais.",
    },
    caveat: {
      pt: "Com os cavalos de volta no cercado, os Wild Horses param de aparecer.",
      en: "With the horses back in the pen, Wild Horses stop spawning.",
      es: "Con los caballos de vuelta en el corral, los Wild Horses dejan de aparecer.",
      pl: "Gdy konie wrócą do zagrody, Wild Horse'y przestają się pojawiać.",
    },
    sources: [wc("Horse_Station")],
  },

  // ══ WORLD CHANGE: Overhunting ══════════════════════════════════════════════
  {
    id: "overhunting-white-deer",
    kind: "bestiary",
    subject: "White Deer",
    availability: "available-today",
    exclusive: true,
    bestiary: bestiaryProfile("Trivial", "Rare"),
    trigger: {
      kind: "world-change",
      changeId: "overhunting",
      stateIds: ["stable", "dwindling", "leaving"],
    },
    detail: {
      pt: "Vagam de Ab'Dendriel até Carlin e Ulderek's Rock. Os chifres e o couro são vendidos a Cruleo, perto do Ferngrims Gate.",
      en: "They roam from Ab'Dendriel out to Carlin and Ulderek's Rock. Their antlers and skin sell to Cruleo, near Ferngrims Gate.",
      es: "Vagan desde Ab'Dendriel hasta Carlin y Ulderek's Rock. Los cuernos y la piel se venden a Cruleo, cerca de Ferngrims Gate.",
      pl: "Wędrują od Ab'Dendriel po Carlin i Ulderek's Rock. Poroże i skóry sprzedasz Cruleo koło Ferngrims Gate.",
    },
    // The vendor is here rather than on a line of its own: a bestiary entry's line is composed
    // from its profile, so this reaches the catalog page without spending a line in a bulletin
    // block that already carries the mount and two achievements.
    sources: [wc("Overhunting"), `${WIKI}/White_Deer`],
  },
  {
    id: "overhunting-kingly-deer",
    kind: "mount",
    subject: "Kingly Deer",
    availability: "available-today",
    exclusive: true,
    trigger: {
      kind: "world-change",
      changeId: "overhunting",
      stateIds: ["stable", "dwindling", "leaving"],
    },
    detail: {
      pt: "Mate White Deer até aparecer um Enraged White Deer, então use um Golden Fir Cone ou uma Music Box para domá-lo.",
      en: "Kill White Deer until an Enraged White Deer appears, then use a Golden Fir Cone or Music Box to tame it.",
      es: "Mata White Deer hasta que aparezca un Enraged White Deer, y usa un Golden Fir Cone o una Music Box para domarlo.",
      pl: "Zabijaj White Deery, aż pojawi się Enraged White Deer, potem oswój go Golden Fir Cone lub Music Boxem.",
    },
    caveat: {
      pt: "O Golden Fir Cone quebra em 25–33% dos usos; costumam ser precisos de 2 a 4.",
      en: "The Golden Fir Cone breaks on 25–33% of uses; 2–4 are usually needed.",
      es: "El Golden Fir Cone se rompe en el 25–33% de los usos; suelen hacer falta de 2 a 4.",
      pl: "Golden Fir Cone pęka przy 25–33% użyć; zwykle potrzeba 2–4 sztuk.",
    },
    achievement: {
      name: "Friend of Elves",
      grade: 1,
      points: 1,
      premium: false,
      requirement: {
        pt: "Dome um Enraged White Deer",
        en: "Tame an Enraged White Deer",
        es: "Doma un Enraged White Deer",
        pl: "Oswój Enraged White Deer",
      },
    },
    sources: [
      wc("Overhunting"),
      `${WIKI}/Kingly_Deer`,
      `${WIKI}/Golden_Fir_Cone`,
      `${WIKI}/Friend_of_Elves`,
    ],
  },
  {
    id: "overhunting-deer-hunt",
    kind: "achievement",
    subject: "Deer Hunt",
    availability: "progressable-today",
    achievement: {
      name: "Deer Hunt",
      grade: 1,
      points: 1,
      premium: false,
      // 400 *Enraged or Desperate* deer, not 400 ordinary White Deer. Killing an ordinary one
      // is what makes another turn enraged or desperate, so the two numbers look alike and are
      // not: the achievement counts only the second kind.
      requirement: {
        pt: "Mate 400 Enraged ou Desperate White Deer no total",
        en: "Kill 400 Enraged or Desperate White Deer in total",
        es: "Mata 400 Enraged o Desperate White Deer en total",
        pl: "Zabij łącznie 400 Enraged lub Desperate White Deer",
      },
    },
    trigger: {
      kind: "world-change",
      changeId: "overhunting",
      stateIds: ["stable", "dwindling", "leaving"],
    },
    detail: {
      pt: "Enraged e Desperate White Deer nascem quando um White Deer comum é morto, e não têm entrada própria no Bestiary.",
      en: "Enraged and Desperate White Deer appear when an ordinary White Deer is killed, and have no Bestiary entry of their own.",
      es: "Los Enraged y Desperate White Deer aparecen al matar un White Deer común, y no tienen entrada propia en el Bestiary.",
      pl: "Enraged i Desperate White Deer pojawiają się po zabiciu zwykłego White Deera i nie mają własnego wpisu w Bestiary.",
    },
    sources: [wc("Overhunting"), `${WIKI}/Deer_Hunt`],
  },
  {
    id: "overhunting-starving-wolf",
    kind: "bestiary",
    subject: "Starving Wolf",
    availability: "available-today",
    exclusive: true,
    bestiary: bestiaryProfile("Easy", "Rare"),
    trigger: { kind: "world-change", changeId: "overhunting", stateIds: ["wolves"] },
    detail: {
      pt: "Rondam o leste, o oeste e o sudoeste das Femor Hills, e só existem neste estado da Overhunting.",
      en: "They roam east, west and south-west of the Femor Hills, and exist only in this Overhunting state.",
      es: "Rondan el este, el oeste y el suroeste de las Femor Hills, y solo existen en este estado de Overhunting.",
      pl: "Krążą na wschód, zachód i południowy zachód od Femor Hills i istnieją tylko w tym stanie Overhunting.",
    },
    sources: [wc("Overhunting"), `${WIKI}/Starving_Wolf`],
  },
  {
    id: "overhunting-trap-wolves",
    kind: "progress",
    subject: "Captured Wolf",
    availability: "unlocks-future",
    trigger: { kind: "world-change", changeId: "overhunting", stateIds: ["wolves"] },
    detail: {
      pt: "Atraia os lobos famintos para as Magic Wolf Traps espalhadas pelas Femor Hills e leve o Captured Wolf a Benevola: os veados voltam já no dia seguinte.",
      en: "Lure the starving wolves onto the Magic Wolf Traps around the Femor Hills and take the Captured Wolf to Benevola: the deer come back as soon as the next day.",
      es: "Atrae a los lobos hambrientos a las Magic Wolf Traps de las Femor Hills y lleva el Captured Wolf a Benevola: los venados vuelven al día siguiente.",
      pl: "Zwab wygłodniałe wilki na Magic Wolf Trapy wokół Femor Hills i zanieś Captured Wolfa do Benevoli: jelenie wrócą już następnego dnia.",
    },
    caveat: {
      pt: "Matar os lobos também conta, mas é dez vezes menos eficaz do que capturá-los.",
      en: "Killing the wolves also counts, but is ten times less effective than trapping them.",
      es: "Matar a los lobos también cuenta, pero es diez veces menos efectivo que atraparlos.",
      pl: "Zabijanie wilków też się liczy, ale jest dziesięć razy mniej skuteczne niż łapanie.",
    },
    qualifier: {
      pt: "Magic Wolf Traps em Femor Hills",
      en: "Magic Wolf Traps at the Femor Hills",
      es: "Magic Wolf Traps en las Femor Hills",
      pl: "Magic Wolf Trapy w Femor Hills",
    },
    sources: [wc("Overhunting"), `${WIKI}/Magic_Wolf_Trap`],
  },

  // ══ WORLD CHANGE: Demon Wars ═══════════════════════════════════════════════
  //
  // The Demons are the base spawn of the Demonwar Crypt and are there in every stage; the
  // Lords and the Princes are triggered spawns that each need their faction to be ahead. The
  // stalemate used to render as a state sentence with nothing under it, which read as "nothing
  // to do here" on a day with two 1,000-kill bestiary entries waiting.
  {
    id: "demon-war-askarak-demon",
    kind: "bestiary",
    subject: "Askarak Demon",
    availability: "available-today",
    bestiary: bestiaryProfile("Medium", "Common"),
    trigger: {
      kind: "world-change",
      changeId: "demon-war",
      stateIds: [
        "stalemate",
        "shaburak-advantage",
        "shaburak-dominant",
        "askarak-advantage",
        "askarak-dominant",
      ],
    },
    detail: {
      pt: "Ocupam o lado leste da Demonwar Crypt em qualquer estágio da guerra.",
      en: "They hold the eastern side of the Demonwar Crypt in every stage of the war.",
      es: "Ocupan el lado este de la Demonwar Crypt en cualquier etapa de la guerra.",
      pl: "Zajmują wschodnią część Demonwar Crypt na każdym etapie wojny.",
    },
    sources: [wc("Demon_Wars"), `${WIKI}/Askarak_Demon`],
  },
  {
    id: "demon-war-shaburak-demon",
    kind: "bestiary",
    subject: "Shaburak Demon",
    availability: "available-today",
    bestiary: bestiaryProfile("Medium", "Common"),
    trigger: {
      kind: "world-change",
      changeId: "demon-war",
      stateIds: [
        "stalemate",
        "shaburak-advantage",
        "shaburak-dominant",
        "askarak-advantage",
        "askarak-dominant",
      ],
    },
    detail: {
      pt: "Ocupam o lado oeste da Demonwar Crypt em qualquer estágio da guerra.",
      en: "They hold the western side of the Demonwar Crypt in every stage of the war.",
      es: "Ocupan el lado oeste de la Demonwar Crypt en cualquier etapa de la guerra.",
      pl: "Zajmują zachodnią część Demonwar Crypt na każdym etapie wojny.",
    },
    sources: [wc("Demon_Wars"), `${WIKI}/Shaburak_Demon`],
  },
  {
    id: "demon-war-break-stalemate",
    kind: "progress",
    subject: "Arak War",
    availability: "unlocks-future",
    trigger: { kind: "world-change", changeId: "demon-war", stateIds: ["stalemate"] },
    label: {
      pt: "Mudar o equilíbrio",
      en: "Shift the balance",
      es: "Cambiar el equilibrio",
      pl: "Przechylić szalę",
    },
    detail: {
      pt: "Uma vantagem de 100 mortes para qualquer das facções muda a guerra depois do próximo Server Save. Uma vantagem de 400 leva direto à fase dos Princes.",
      en: "A 100-kill advantage for either faction changes the war after the next server save. A 400-kill advantage advances it directly to the Princes stage.",
      es: "Una ventaja de 100 muertes para cualquiera de las facciones cambia la guerra tras el próximo Server Save. Una ventaja de 400 la lleva directo a la fase de los Princes.",
      pl: "Przewaga 100 zabójstw dowolnej frakcji zmienia wojnę po następnym server save. Przewaga 400 przenosi ją wprost do etapu Princes.",
    },
    sources: [wc("Demon_Wars")],
  },
  {
    id: "demon-war-shaburak-lord",
    kind: "bestiary",
    subject: "Shaburak Lord",
    availability: "available-today",
    exclusive: true,
    bestiary: bestiaryProfile("Medium", "Rare"),
    trigger: {
      kind: "world-change",
      changeId: "demon-war",
      stateIds: ["shaburak-advantage", "shaburak-dominant"],
    },
    detail: {
      pt: "Aparecem nos andares superiores da torre oeste enquanto os Shaburak estiverem por cima.",
      en: "They spawn on the upper floors of the western tower while the Shaburak have the upper hand.",
      es: "Aparecen en los pisos superiores de la torre oeste mientras los Shaburak dominen.",
      pl: "Pojawiają się na górnych piętrach zachodniej wieży, gdy Shaburakowie mają przewagę.",
    },
    sources: [wc("Demon_Wars"), `${WIKI}/Shaburak_Lord`],
  },
  {
    id: "demon-war-shaburak-prince",
    kind: "bestiary",
    subject: "Shaburak Prince",
    availability: "available-today",
    exclusive: true,
    bestiary: bestiaryProfile("Medium", "Rare"),
    trigger: { kind: "world-change", changeId: "demon-war", stateIds: ["shaburak-dominant"] },
    detail: {
      pt: "Os Princes só nascem quando a facção domina o complexo. Na fase de mera vantagem eles não existem.",
      en: "Princes only spawn once the faction dominates the complex. In the mere-advantage stage they do not exist.",
      es: "Los Princes solo aparecen cuando la facción domina el complejo. En la fase de simple ventaja no existen.",
      pl: "Princes pojawiają się dopiero, gdy frakcja dominuje kompleks. Na etapie samej przewagi ich nie ma.",
    },
    achievement: {
      name: "Shaburak Nemesis",
      grade: 1,
      points: 1,
      premium: true,
      requirement: {
        pt: "Mate 100 Shaburak Princes",
        en: "Kill 100 Shaburak Princes",
        es: "Mata 100 Shaburak Princes",
        pl: "Zabij 100 Shaburak Princes",
      },
    },
    caveat: {
      pt: "O achievement Shaburak Nemesis pede 100 Princes, acumulados ao longo de vários dias favoráveis.",
      en: "The Shaburak Nemesis achievement wants 100 Princes, accumulated over several favourable days.",
      es: "El achievement Shaburak Nemesis pide 100 Princes, acumulados a lo largo de varios días favorables.",
      pl: "Osiągnięcie Shaburak Nemesis wymaga 100 Princes, zbieranych przez wiele sprzyjających dni.",
    },
    sources: [wc("Demon_Wars"), `${WIKI}/Shaburak_Prince`, `${WIKI}/Shaburak_Nemesis`],
  },
  {
    id: "demon-war-askarak-lord",
    kind: "bestiary",
    subject: "Askarak Lord",
    availability: "available-today",
    exclusive: true,
    bestiary: bestiaryProfile("Medium", "Rare"),
    trigger: {
      kind: "world-change",
      changeId: "demon-war",
      stateIds: ["askarak-advantage", "askarak-dominant"],
    },
    detail: {
      pt: "Aparecem nos andares superiores da torre leste enquanto os Askarak estiverem por cima.",
      en: "They spawn on the upper floors of the eastern tower while the Askarak have the upper hand.",
      es: "Aparecen en los pisos superiores de la torre este mientras los Askarak dominen.",
      pl: "Pojawiają się na górnych piętrach wschodniej wieży, gdy Askarakowie mają przewagę.",
    },
    sources: [wc("Demon_Wars"), `${WIKI}/Askarak_Lord`],
  },
  {
    id: "demon-war-askarak-prince",
    kind: "bestiary",
    subject: "Askarak Prince",
    availability: "available-today",
    exclusive: true,
    bestiary: bestiaryProfile("Medium", "Rare"),
    trigger: { kind: "world-change", changeId: "demon-war", stateIds: ["askarak-dominant"] },
    detail: {
      pt: "Os Princes só nascem quando a facção domina o complexo. Na fase de mera vantagem eles não existem.",
      en: "Princes only spawn once the faction dominates the complex. In the mere-advantage stage they do not exist.",
      es: "Los Princes solo aparecen cuando la facción domina el complejo. En la fase de simple ventaja no existen.",
      pl: "Princes pojawiają się dopiero, gdy frakcja dominuje kompleks. Na etapie samej przewagi ich nie ma.",
    },
    achievement: {
      name: "Askarak Nemesis",
      grade: 1,
      points: 1,
      premium: true,
      requirement: {
        pt: "Mate 100 Askarak Princes",
        en: "Kill 100 Askarak Princes",
        es: "Mata 100 Askarak Princes",
        pl: "Zabij 100 Askarak Princes",
      },
    },
    caveat: {
      pt: "O achievement Askarak Nemesis pede 100 Princes, acumulados ao longo de vários dias favoráveis.",
      en: "The Askarak Nemesis achievement wants 100 Princes, accumulated over several favourable days.",
      es: "El achievement Askarak Nemesis pide 100 Princes, acumulados a lo largo de varios días favorables.",
      pl: "Osiągnięcie Askarak Nemesis wymaga 100 Princes, zbieranych przez wiele sprzyjających dni.",
    },
    sources: [wc("Demon_Wars"), `${WIKI}/Askarak_Prince`, `${WIKI}/Askarak_Nemesis`],
  },

  // ══ WORLD CHANGE: The Fire-Feathered Serpent ═══════════════════════════════
  {
    id: "sea-serpent-seacrest",
    kind: "bestiary",
    subject: "Seacrest Serpent",
    availability: "available-today",
    bestiary: bestiaryProfile("Hard", "Rare"),
    trigger: { kind: "world-change", changeId: "sea-serpent", stateIds: ["asleep", "dreaming"] },
    detail: {
      pt: "Povoam os Seacrest Grounds até a Serpent acordar. Quando isso acontece, são substituídos pelos Renegade Quara.",
      en: "They fill the Seacrest Grounds until the Serpent wakes. At which point Renegade Quara replace them.",
      es: "Pueblan los Seacrest Grounds hasta que la Serpent despierte. Entonces los Renegade Quara los reemplazan.",
      pl: "Zapełniają Seacrest Grounds, póki Serpent nie zbudzi się. Wtedy zastępują je Renegade Quara.",
    },
    sources: [wc("The_Fire-Feathered_Serpent"), `${WIKI}/Seacrest_Serpent`],
  },
  {
    // Three thresholds, not one repeated rule, and each stage is told the one that applies to
    // it. The cumulative count is what the game counts: 1,000 Seacrest Serpents put the Serpent
    // into its dreaming stage, and it is the 2,000th (not another 1,000 from zero) that wakes
    // it. Saying "every 1,000 advances a stage" was close enough to sound right and wrong about
    // the number a player is actually counting towards on the second leg.
    id: "sea-serpent-wake",
    kind: "progress",
    subject: "Fire-Feathered Serpent",
    availability: "progressable-today",
    trigger: { kind: "world-change", changeId: "sea-serpent", stateIds: ["asleep"] },
    label: {
      pt: "Fazer a Serpent sonhar",
      en: "Make the Serpent dream",
      es: "Hacer soñar a la Serpent",
      pl: "Wywołać sen Serpent",
    },
    detail: {
      pt: "1.000 Seacrest Serpents mortos no servidor levam a Serpent ao estágio de sonho. A mudança acontece na hora, sem esperar o Server Save.",
      en: "1,000 Seacrest Serpents killed server-wide take the Serpent into its dreaming stage. The change lands at once, without waiting for a server save.",
      es: "1.000 Seacrest Serpents muertos en el servidor llevan a la Serpent a su etapa de sueño. El cambio ocurre al instante, sin esperar al Server Save.",
      pl: "1000 zabitych Seacrest Serpentów na serwerze wprowadza Serpent w etap snu. Zmiana następuje od razu, bez czekania na server save.",
    },
    sources: [wc("The_Fire-Feathered_Serpent")],
  },
  {
    id: "sea-serpent-awaken",
    kind: "progress",
    subject: "Fire-Feathered Serpent",
    availability: "progressable-today",
    trigger: { kind: "world-change", changeId: "sea-serpent", stateIds: ["dreaming"] },
    label: {
      pt: "Acordar a Serpent",
      en: "Wake the Serpent",
      es: "Despertar a la Serpent",
      pl: "Obudzić Serpent",
    },
    detail: {
      pt: "Mais 1.000 Seacrest Serpents, 2.000 no total, acordam a Serpent e trazem os Renegade Quara. A mudança acontece na hora, sem esperar o Server Save.",
      en: "Another 1,000 Seacrest Serpents, 2,000 in all, wake the Serpent and bring the Renegade Quara. The change lands at once, without waiting for a server save.",
      es: "Otros 1.000 Seacrest Serpents, 2.000 en total, despiertan a la Serpent y traen a los Renegade Quara. El cambio ocurre al instante, sin esperar al Server Save.",
      pl: "Kolejne 1000 Seacrest Serpentów, łącznie 2000, budzi Serpent i sprowadza Renegade Quara. Zmiana następuje od razu, bez czekania na server save.",
    },
    sources: [wc("The_Fire-Feathered_Serpent")],
  },
  {
    id: "sea-serpent-return-to-sleep",
    kind: "progress",
    subject: "Fire-Feathered Serpent",
    availability: "progressable-today",
    trigger: { kind: "world-change", changeId: "sea-serpent", stateIds: ["awake"] },
    label: {
      pt: "Fazer a Serpent dormir",
      en: "Send the Serpent back to sleep",
      es: "Hacer dormir a la Serpent",
      pl: "Uśpić Serpent",
    },
    detail: {
      pt: "2.000 Renegade Quara mortos no servidor devolvem a Serpent ao sono e trazem de volta as criaturas de sempre. A mudança acontece na hora, sem esperar o Server Save.",
      en: "2,000 Renegade Quara killed server-wide send the Serpent back to sleep and bring the usual creatures back. The change lands at once, without waiting for a server save.",
      es: "2.000 Renegade Quara muertos en el servidor devuelven a la Serpent al sueño y traen de vuelta las criaturas habituales. El cambio ocurre al instante, sin esperar al Server Save.",
      pl: "2000 zabitych Renegade Quara na serwerze usypia Serpent i przywraca zwykłe stworzenia. Zmiana następuje od razu, bez czekania na server save.",
    },
    sources: [wc("The_Fire-Feathered_Serpent")],
  },
  {
    id: "sea-serpent-titanica",
    kind: "mount",
    subject: "Titanica",
    availability: "progressable-today",
    // The shrimp, not the crab, is what the Seacrest Grounds give you: Giant Shrimps drop from
    // the Quara Pinchers and Predators there (and from their Renegade forms once the Serpent
    // wakes). Crustacea Gigantica itself lives in the wet and sunken areas off Calassa and
    // Treasure Island, so this entry says where the taming item comes from and stops short of
    // claiming the creature is in the Seacrest Grounds too.
    trigger: {
      kind: "world-change",
      changeId: "sea-serpent",
      stateIds: ["asleep", "dreaming", "awake"],
    },
    detail: {
      pt: "Use um Giant Shrimp em uma Crustacea Gigantica. O Giant Shrimp cai dos Quara Pinchers e Predators dos Seacrest Grounds.",
      en: "Use a Giant Shrimp on a Crustacea Gigantica. The Giant Shrimp drops from the Quara Pinchers and Predators of the Seacrest Grounds.",
      es: "Usa un Giant Shrimp en una Crustacea Gigantica. El Giant Shrimp cae de los Quara Pinchers y Predators de los Seacrest Grounds.",
      pl: "Użyj Giant Shrimp na Crustacea Gigantica. Giant Shrimp wypada z Quara Pincherów i Predatorów z Seacrest Grounds.",
    },
    achievement: {
      name: "Fried Shrimp",
      grade: 1,
      points: 2,
      premium: true,
      requirement: {
        pt: "Dome uma Crustacea Gigantica",
        en: "Tame a Crustacea Gigantica",
        es: "Doma una Crustacea Gigantica",
        pl: "Oswój Crustacea Gigantica",
      },
    },
    sources: [`${WIKI}/Titanica`, `${WIKI}/Giant_Shrimp`, `${WIKI}/Seacrest_Grounds`],
  },
  {
    id: "sea-serpent-renegade-quara",
    kind: "hunting",
    subject: "Renegade Quara",
    availability: "available-today",
    exclusive: true,
    trigger: { kind: "world-change", changeId: "sea-serpent", stateIds: ["awake"] },
    detail: {
      pt: "Tomaram as regiões submersas de Oramond no lugar das Quaras comuns, dos Sea Serpents e dos Seacrest Serpents.",
      en: "They have taken the sunken regions of Oramond in place of the regular Quaras, Sea Serpents and Seacrest Serpents.",
      es: "Han tomado las regiones sumergidas de Oramond en lugar de las Quaras comunes, los Sea Serpents y los Seacrest Serpents.",
      pl: "Przejęły zatopione regiony Oramond w miejsce zwykłych Quar, Sea Serpentów i Seacrest Serpentów.",
    },
    caveat: {
      pt: "Este estado costuma durar pouco.",
      en: "This state rarely lasts long.",
      es: "Este estado suele durar poco.",
      pl: "Ten stan zwykle trwa krótko.",
    },
    sources: [wc("The_Fire-Feathered_Serpent")],
  },
  {
    id: "sea-serpent-mission",
    kind: "quest",
    subject: "The Fire-Feathered Sea Serpent",
    availability: "available-today",
    exclusive: true,
    trigger: { kind: "world-change", changeId: "sea-serpent", stateIds: ["awake"] },
    detail: {
      pt: "A missão do Twenty Miles Beneath the Sea Quest só fica disponível enquanto a Serpent estiver acordada. Vá aos Seacrest Grounds sem demora.",
      en: "This Twenty Miles Beneath the Sea Quest mission is only available while the Serpent is awake. Head to the Seacrest Grounds without delay.",
      es: "Esta misión del Twenty Miles Beneath the Sea Quest solo está disponible mientras la Serpent esté despierta. Ve a los Seacrest Grounds sin demora.",
      pl: "Ta misja Twenty Miles Beneath the Sea Quest jest dostępna tylko, gdy Serpent nie śpi. Ruszaj do Seacrest Grounds bez zwłoki.",
    },
    sources: [wc("The_Fire-Feathered_Serpent")],
  },
  {
    id: "sea-serpent-snake-charmer",
    kind: "achievement",
    subject: "Snake Charmer",
    availability: "progressable-today",
    achievement: {
      name: "Snake Charmer",
      grade: 1,
      points: 1,
      premium: true,
      requirement: {
        pt: "Complete a Twenty Miles Beneath the Sea Quest",
        en: "Complete the Twenty Miles Beneath the Sea Quest",
        es: "Completa la Twenty Miles Beneath the Sea Quest",
        pl: "Ukończ Twenty Miles Beneath the Sea Quest",
      },
    },
    // Awake only. The quest's last mission is the Fire-Feathered Sea Serpent one, and that
    // mission exists only while the Serpent is awake, so this is the one stage in which the
    // achievement can actually be finished.
    trigger: { kind: "world-change", changeId: "sea-serpent", stateIds: ["awake"] },
    detail: {
      pt: "A missão final da quest é a do Fire-Feathered Sea Serpent, disponível só enquanto a Serpent estiver acordada.",
      en: "The quest's final mission is the Fire-Feathered Sea Serpent one, available only while the Serpent is awake.",
      es: "La misión final de la quest es la del Fire-Feathered Sea Serpent, disponible solo mientras la Serpent esté despierta.",
      pl: "Ostatnia misja questa to ta z Fire-Feathered Sea Serpent, dostępna tylko gdy Serpent nie śpi.",
    },
    sources: [wc("The_Fire-Feathered_Serpent"), `${WIKI}/Snake_Charmer`],
  },

  // ══ WORLD CHANGE: Deeplings ════════════════════════════════════════════════
  {
    id: "deeplings-heart-of-the-sea",
    kind: "quest",
    subject: "Heart of the Sea",
    availability: "progressable-today",
    exclusive: true,
    trigger: { kind: "world-change", changeId: "deeplings", stateIds: ["hiding"] },
    detail: {
      pt: "Só nesta fase: minere Rough Red Gems, transforme-os em Hearts of the Sea no Strong Water Vortex e ofereça à estátua de Qjell. Cinco entregas liberam a sala de recompensa da fase 2.",
      en: "This stage only: mine Rough Red Gems, turn them into Hearts of the Sea at the Strong Water Vortex and offer them to the Qjell statue. Five offerings unlock the stage 2 reward room.",
      es: "Solo en esta fase: mina Rough Red Gems, conviértelos en Hearts of the Sea en el Strong Water Vortex y ofrécelos a la estatua de Qjell. Cinco entregas abren la sala de recompensa de la fase 2.",
      pl: "Tylko na tym etapie: wydobądź Rough Red Gems, zamień je w Hearts of the Sea przy Strong Water Vortex i złóż w ofierze posągowi Qjella. Pięć ofiar otwiera salę nagród etapu 2.",
    },
    qualifier: {
      pt: "ofereça Hearts of the Sea à estátua de Qjell",
      en: "offer Hearts of the Sea to the Qjell statue",
      es: "ofrece Hearts of the Sea a la estatua de Qjell",
      pl: "złóż Hearts of the Sea posągowi Qjella",
    },
    sources: [`${WIKI}/Liquid_Black_Quest/Spoiler`],
  },
  {
    id: "deeplings-coral-mine",
    kind: "quest",
    subject: "Coral Mine",
    availability: "unlocks-future",
    exclusive: true,
    trigger: { kind: "world-change", changeId: "deeplings", stateIds: ["floodgates-open"] },
    label: {
      pt: "Coral Mine",
      en: "Coral Mine",
      es: "Coral Mine",
      pl: "Coral Mine",
    },
    detail: {
      pt: "Minere suas próprias Crates Full of Coral e use-as para ajudar a construir a passagem. Minere pelo menos 10 crates para garantir acesso aos Deepling Guardians no próximo estágio.",
      en: "Mine your own Crates Full of Coral and use them to help build the passage. Mine at least 10 crates to earn access to the Deepling Guardians during the next stage.",
      es: "Mina tus propias Crates Full of Coral y úsalas para ayudar a construir el paso. Mina al menos 10 crates para ganar acceso a los Deepling Guardians en la próxima fase.",
      pl: "Wydobądź własne Crates Full of Coral i użyj ich, by pomóc zbudować przejście. Wydobądź co najmniej 10 skrzyń, by zyskać dostęp do Deepling Guardians w następnym etapie.",
    },
    caveat: {
      pt: "Terminada a passagem, o estágio 3 começa depois do próximo Server Save.",
      en: "Once the passage is completed, stage 3 begins after the next server save.",
      es: "Terminado el paso, la fase 3 empieza tras el próximo Server Save.",
      pl: "Po ukończeniu przejścia etap 3 zaczyna się po następnym server save.",
    },
    sources: [`${WIKI}/Liquid_Black_Quest/Spoiler`],
  },
  {
    id: "deeplings-next-guardians",
    kind: "boss",
    subject: "Tanjis, Obujos and Jaul",
    availability: "unlocks-future",
    bosstiary: "Bane",
    trigger: { kind: "world-change", changeId: "deeplings", stateIds: ["floodgates-open"] },
    label: {
      pt: "Próximo estágio",
      en: "Next stage",
      es: "Próxima fase",
      pl: "Następny etap",
    },
    detail: {
      pt: "Tanjis, Obujos e Jaul ficam disponíveis, com um Guardian acessível por dia.",
      en: "Tanjis, Obujos and Jaul become available, with one Guardian accessible each day.",
      es: "Tanjis, Obujos y Jaul quedan disponibles, con un Guardian accesible cada día.",
      pl: "Tanjis, Obujos i Jaul stają się dostępni, po jednym Guardianie na dzień.",
    },
    sources: [`${WIKI}/Liquid_Black_Quest/Spoiler`],
  },
  {
    id: "deeplings-next-manta-ray",
    kind: "mount",
    subject: "Manta Ray",
    availability: "unlocks-future",
    trigger: { kind: "world-change", changeId: "deeplings", stateIds: ["floodgates-open"] },
    detail: {
      pt: "A área dos Manta Rays fica acessível no próximo estágio.",
      en: "The Manta Ray area becomes accessible during the next stage.",
      es: "El área de las Manta Rays queda accesible en la próxima fase.",
      pl: "Obszar Manta Rayów staje się dostępny w następnym etapie.",
    },
    sources: [`${WIKI}/Liquid_Black_Quest/Spoiler`, `${WIKI}/Manta_Ray`],
  },
  {
    id: "deeplings-drowned-library",
    kind: "access",
    subject: "Drowned Library",
    availability: "available-today",
    exclusive: true,
    trigger: { kind: "world-change", changeId: "deeplings", stateIds: ["floodgates-open"] },
    detail: {
      pt: "Com 5 Hearts of the Sea entregues na última fase 1, a sala de recompensa da biblioteca dá Platinum Coins e, raramente, um True Heart of the Sea.",
      en: "With 5 Hearts of the Sea delivered in the last stage 1, the library's reward room gives Platinum Coins and, rarely, a True Heart of the Sea.",
      es: "Con 5 Hearts of the Sea entregados en la última fase 1, la sala de recompensa de la biblioteca da Platinum Coins y, raramente, un True Heart of the Sea.",
      pl: "Po dostarczeniu 5 Hearts of the Sea w ostatnim etapie 1 sala nagród biblioteki daje Platinum Coins i rzadko True Heart of the Sea.",
    },
    sources: [`${WIKI}/Liquid_Black_Quest/Spoiler`],
  },
  {
    id: "deeplings-boss",
    kind: "boss",
    subject: "Deepling Guardian",
    availability: "available-today",
    exclusive: true,
    bosstiary: "Bane",
    trigger: { kind: "world-change", changeId: "deeplings", stateIds: ["arcanum-breached"] },
    // "We haven't checked" rather than "it is unknown": the Guardian is re-rolled at every
    // server save and anyone standing in Fiehonja can see which one is up, so the app not
    // knowing is a gap in what has been looked at, not a fact nobody can have.
    detail: {
      pt: "Ainda não conferimos qual Deepling Guardian está disponível hoje. Pode ser Tanjis, Obujos ou Jaul, sorteado a cada Server Save. Só entra quem já minerou 10 Crates Full of Coral na fase 2.",
      en: "We haven't checked which Deepling Guardian is available today. It can be Tanjis, Obujos or Jaul, re-rolled at every server save. Only players who mined 10 Crates Full of Coral in stage 2 can enter.",
      es: "Todavía no comprobamos qué Deepling Guardian está disponible hoy. Puede ser Tanjis, Obujos o Jaul, sorteado en cada Server Save. Solo entra quien minó 10 Crates Full of Coral en la fase 2.",
      pl: "Nie sprawdziliśmy jeszcze, który Deepling Guardian jest dziś dostępny. Może to być Tanjis, Obujos albo Jaul, losowany przy każdym server save. Wejdzie tylko ten, kto wydobył 10 Crates Full of Coral w etapie 2.",
    },
    caveat: {
      pt: "Abrir o baú de um boss revoga o acesso aos outros dois na mesma rotação.",
      en: "Opening one boss's chest revokes access to the other two in the same rotation.",
      es: "Abrir el cofre de un boss revoca el acceso a los otros dos en la misma rotación.",
      pl: "Otwarcie skrzyni jednego bossa odbiera dostęp do dwóch pozostałych w tej rotacji.",
    },
    prerequisites: ["10 coral crates mined during Deepling stage 2"],
    sources: [`${WIKI}/Liquid_Black_Quest/Spoiler`],
  },
  {
    id: "deeplings-manta-ray-mount",
    kind: "mount",
    subject: "Manta Ray",
    availability: "available-today",
    exclusive: true,
    trigger: { kind: "world-change", changeId: "deeplings", stateIds: ["arcanum-breached"] },
    detail: {
      pt: "Use um Foxtail em uma Manta Ray, na terceira área de Fiehonja. O Foxtail cai de Deepling Guards, Deepling Tyrants e Black Vixens.",
      en: "Use a Foxtail on a Manta Ray in the third area of Fiehonja. The Foxtail drops from Deepling Guards, Deepling Tyrants and Black Vixens.",
      es: "Usa un Foxtail en una Manta Ray, en la tercera área de Fiehonja. El Foxtail cae de Deepling Guards, Deepling Tyrants y Black Vixens.",
      pl: "Użyj Foxtaila na Manta Rayu w trzecim obszarze Fiehonji. Foxtail wypada z Deepling Guardów, Deepling Tyrantów i Black Vixenów.",
    },
    caveat: {
      pt: "A Manta Ray pode comer o Foxtail em vez de aceitar a domesticação.",
      en: "The Manta Ray can eat the Foxtail instead of accepting the taming.",
      es: "La Manta Ray puede comerse el Foxtail en lugar de aceptar la domesticación.",
      pl: "Manta Ray może zjeść Foxtaila zamiast dać się oswoić.",
    },
    achievement: {
      name: "Beneath the Sea",
      grade: 1,
      points: 3,
      premium: true,
      requirement: {
        pt: "Dome uma Manta Ray",
        en: "Tame a Manta Ray",
        es: "Doma una Manta Ray",
        pl: "Oswój Manta Raya",
      },
    },
    prerequisites: ["A Foxtail"],
    sources: [`${WIKI}/Manta_Ray_(Mount)`, `${WIKI}/Foxtail`, `${WIKI}/Beneath_the_Sea`],
  },
  {
    id: "deeplings-manta-ray",
    kind: "bestiary",
    subject: "Manta Ray",
    availability: "available-today",
    exclusive: true,
    bestiary: bestiaryProfile("Medium", "Rare"),
    trigger: { kind: "world-change", changeId: "deeplings", stateIds: ["arcanum-breached"] },
    detail: {
      pt: "Só aparecem na terceira área de Fiehonja, aberta apenas nesta fase.",
      en: "They appear only in the third area of Fiehonja, which is open only in this stage.",
      es: "Solo aparecen en la tercera área de Fiehonja, abierta únicamente en esta fase.",
      pl: "Występują tylko w trzecim obszarze Fiehonji, otwartym wyłącznie na tym etapie.",
    },
    sources: [`${WIKI}/Manta_Ray`, `${WIKI}/Liquid_Black_Quest/Spoiler`],
  },

  // ══ WORLD CHANGE: Hive Born ════════════════════════════════════════════════
  {
    id: "hive-born-first-stage-tasks",
    kind: "progress",
    subject: "War Against the Hive Quest",
    availability: "unlocks-future",
    trigger: { kind: "world-change", changeId: "hive-born", stateIds: ["defended"] },
    detail: {
      pt: "Quatro tarefas valem 1 ponto cada; o servidor precisa de 200 pontos num mesmo dia para romper as defesas no Server Save.",
      en: "Four tasks are worth 1 point each; the server needs 200 points in a single day to breach the defences at server save.",
      es: "Cuatro tareas valen 1 punto cada una; el servidor necesita 200 puntos en un mismo día para romper las defensas en el Server Save.",
      pl: "Cztery zadania warte po 1 punkcie; serwer potrzebuje 200 punktów jednego dnia, by przełamać obronę przy server save.",
    },
    qualifier: {
      pt: "200 pontos hoje abrem a Hive",
      en: "200 points today breach the hive",
      es: "200 puntos hoy abren la Hive",
      pl: "200 punktów dziś przełamie Hive",
    },
    sources: [wc("Hive_Born")],
  },
  {
    id: "hive-born-gooey-mass",
    kind: "item",
    subject: "Gooey Mass",
    availability: "available-today",
    trigger: { kind: "world-change", changeId: "hive-born", stateIds: ["breached"] },
    detail: {
      pt: "Gaste 50 Favour Points com Orockle (reward, yes) para receber o feromônio que abre os Hive Gates por 7 dias e dá acesso às salas com Insectoid Cells.",
      en: "Spend 50 Favour Points with Orockle (reward, yes) for the pheromone that opens the Hive Gates for 7 days and reaches the rooms with Insectoid Cells.",
      es: "Gasta 50 Favour Points con Orockle (reward, yes) por la feromona que abre los Hive Gates durante 7 días y da acceso a las salas con Insectoid Cells.",
      pl: "Wydaj 50 Favour Points u Orockle'a (reward, yes) na feromon, który otwiera Hive Gates na 7 dni i daje dostęp do sal z Insectoid Cells.",
    },
    qualifier: {
      pt: "com 50 Favour Points gastos em Orockle",
      en: "with 50 Favour Points spent at Orockle",
      es: "con 50 Favour Points gastados en Orockle",
      pl: "za 50 Favour Points u Orockle'a",
    },
    sources: [wc("Hive_Born")],
  },
  {
    id: "hive-born-second-stage-tasks",
    kind: "progress",
    subject: "War Against the Hive Quest",
    availability: "unlocks-future",
    trigger: { kind: "world-change", changeId: "hive-born", stateIds: ["breached"] },
    detail: {
      pt: "Duas tarefas novas valem 2 pontos cada; outros 200 pontos abrem o lado oeste da Hive, e sem eles tudo volta ao estágio 1 em três dias.",
      en: "Two further tasks are worth 2 points each; another 200 points opens the western Hive, and without them everything reverts to stage 1 in three days.",
      es: "Dos tareas nuevas valen 2 puntos cada una; otros 200 puntos abren el lado oeste de la Hive, y sin ellos todo vuelve a la fase 1 en tres días.",
      pl: "Dwa kolejne zadania warte po 2 punkty; następne 200 punktów otwiera zachodnią część Hive, a bez nich wszystko wraca do etapu 1 w trzy dni.",
    },
    qualifier: {
      pt: "mais 200 pontos abrem o lado oeste",
      en: "another 200 points open the western side",
      es: "otros 200 puntos abren el lado oeste",
      pl: "kolejne 200 punktów otwiera zachód",
    },
    sources: [wc("Hive_Born")],
  },
  {
    id: "hive-born-bosses",
    kind: "boss",
    subject: "Bosstiary",
    availability: "available-today",
    exclusive: true,
    bosstiary: "Bane",
    trigger: { kind: "world-change", changeId: "hive-born", stateIds: ["fallen"] },
    detail: {
      pt: "Chopper, Fleshslicer, Maw, Mindmasher, Rotspit e Shadowstalker, os seis Bane do lado oeste da Hive interna. Largam Dung Balls que valem 10 War Exp cada.",
      en: "Chopper, Fleshslicer, Maw, Mindmasher, Rotspit and Shadowstalker, the six Bane bosses of the western inner Hive. They drop Dung Balls worth 10 War Exp each.",
      es: "Chopper, Fleshslicer, Maw, Mindmasher, Rotspit y Shadowstalker, los seis Bane del lado oeste de la Hive interna. Sueltan Dung Balls que valen 10 War Exp cada una.",
      pl: "Chopper, Fleshslicer, Maw, Mindmasher, Rotspit i Shadowstalker, sześciu bossów Bane z zachodniej części wewnętrznego Hive. Upuszczają Dung Balle warte po 10 War Exp.",
    },
    // No day count. Stage 3 does run for a fixed stretch, but the Guide reply the app parses
    // carries no day number (only a counter the parser discards), so any "N days left" the
    // bulletin printed would be inferred rather than known.
    caveat: {
      pt: "O estágio 3 dura um tempo fixo e depois a Hive volta ao estágio 1.",
      en: "Stage 3 runs for a fixed stretch, after which the hive falls back to stage 1.",
      es: "La fase 3 dura un tiempo fijo y después la Hive vuelve a la fase 1.",
      pl: "Etap 3 trwa ustalony czas, po czym Hive wraca do etapu 1.",
    },
    sources: [wc("Hive_Born"), `${WIKI}/Dung_Ball_(Quest)`],
  },
  {
    id: "hive-born-insectoid-outfits",
    kind: "outfit",
    subject: "Insectoid Outfit",
    availability: "available-today",
    exclusive: true,
    trigger: { kind: "world-change", changeId: "hive-born", stateIds: ["fallen"] },
    detail: {
      pt: "A sala da quest fica no lado oeste da Hive interna, acessível neste estágio com o feromônio de Orockle.",
      en: "The quest room in the western inner Hive is accessible during this stage with Orockle's pheromone.",
      es: "La sala de la quest en el lado oeste de la Hive interna es accesible en esta fase con la feromona de Orockle.",
      pl: "Sala questa w zachodniej części wewnętrznego Hive jest w tym etapie dostępna z feromonem Orockle'a.",
    },
    prerequisites: ["Orockle's pheromone (50 Favour Points)"],
    sources: [wc("Hive_Born"), `${WIKI}/Insectoid_Outfits_Quest`],
  },
  {
    id: "hive-born-four-leaf-clover",
    kind: "item",
    subject: "Four-Leaf Clover",
    availability: "available-today",
    leadsTo: "hive-born-lady-bug-mount",
    trigger: { kind: "world-change", changeId: "hive-born", stateIds: ["fallen"] },
    // Deliberately does not name a source for the Gooey Mass. There is more than one: the
    // Insectoid Cells behind the Hive Gates yield one a week, and Hive Overseer, Maw and The
    // Mean Masher drop them. Naming only the cells read as the only way in.
    detail: {
      pt: "Use uma Gooey Mass para ter chance de conseguir o item que doma a Ladybug.",
      en: "Use a Gooey Mass for a chance to obtain the Ladybug taming item.",
      es: "Usa una Gooey Mass para tener chance de obtener el objeto que doma a la Ladybug.",
      pl: "Użyj Gooey Mass, by mieć szansę zdobyć przedmiot do oswojenia Ladybuga.",
    },
    sources: [`${WIKI}/Four-Leaf_Clover`, `${WIKI}/Gooey_Mass`],
  },
  {
    id: "hive-born-lady-bug-mount",
    kind: "mount",
    subject: "Ladybug",
    availability: "available-today",
    exclusive: true,
    trigger: { kind: "world-change", changeId: "hive-born", stateIds: ["fallen"] },
    detail: {
      pt: "Use um Four-Leaf Clover em uma Ladybug para domá-la.",
      en: "Use a Four-Leaf Clover on a Ladybug to tame it.",
      es: "Usa un Four-Leaf Clover en una Ladybug para domarla.",
      pl: "Użyj Four-Leaf Clover na Ladybugu, by go oswoić.",
    },
    achievement: {
      name: "Lovely Dots",
      grade: 1,
      points: 3,
      premium: true,
      requirement: {
        pt: "Dome uma Ladybug",
        en: "Tame a Ladybug",
        es: "Doma una Ladybug",
        pl: "Oswój Ladybuga",
      },
    },
    // TibiaWiki files the mount under "Lady Bug" and the creature under "Ladybug". One name
    // reaches the reader, and it is the creature's, because that is the one they are looking at.
    sources: [`${WIKI}/Lady_Bug`, `${WIKI}/Four-Leaf_Clover`, `${WIKI}/Lovely_Dots`],
  },
  {
    id: "hive-born-hive-fighter",
    kind: "achievement",
    subject: "Hive Fighter",
    availability: "progressable-today",
    achievement: {
      name: "Hive Fighter",
      grade: 1,
      points: 1,
      premium: true,
      requirement: {
        pt: "Acumule 300 War Exp na War Against the Hive Quest",
        en: "Earn 300 War Exp in the War Against the Hive Quest",
        es: "Acumula 300 War Exp en la War Against the Hive Quest",
        pl: "Zdobądź 300 War Exp w War Against the Hive Quest",
      },
    },
    trigger: { kind: "world-change", changeId: "hive-born", stateIds: ["fallen"] },
    detail: {
      pt: "Este é o estágio rápido: as Dung Balls dos seis bosses valem 10 War Exp cada.",
      en: "This is the fast stage: the six bosses' Dung Balls are worth 10 War Exp each.",
      es: "Esta es la fase rápida: las Dung Balls de los seis bosses valen 10 War Exp cada una.",
      pl: "To szybki etap: Dung Balle od sześciu bossów są warte po 10 War Exp.",
    },
    sources: [`${WIKI}/Hive_Fighter`, `${WIKI}/Dung_Ball_(Quest)`],
  },
  {
    id: "hive-born-hive-war-veteran",
    kind: "achievement",
    subject: "Hive War Veteran",
    availability: "progressable-today",
    achievement: {
      name: "Hive War Veteran",
      grade: 1,
      points: 1,
      premium: true,
      requirement: {
        pt: "Acumule 500 War Exp na War Against the Hive Quest",
        en: "Earn 500 War Exp in the War Against the Hive Quest",
        es: "Acumula 500 War Exp en la War Against the Hive Quest",
        pl: "Zdobądź 500 War Exp w War Against the Hive Quest",
      },
    },
    trigger: { kind: "world-change", changeId: "hive-born", stateIds: ["fallen"] },
    detail: {
      pt: "O War Exp soma entre os ciclos, e cada peça do chitin outfit pede mais um patamar.",
      en: "War Exp adds up across cycles, and each piece of the chitin outfit asks for one more tier.",
      es: "El War Exp se acumula entre ciclos, y cada pieza del chitin outfit pide un nivel más.",
      pl: "War Exp sumuje się przez cykle, a każdy element chitin outfitu wymaga kolejnego progu.",
    },
    sources: [`${WIKI}/Hive_War_Veteran`],
  },
  {
    id: "hive-born-ladybug",
    kind: "bestiary",
    subject: "Ladybug",
    availability: "available-today",
    exclusive: true,
    bestiary: bestiaryProfile("Easy", "Rare"),
    trigger: { kind: "world-change", changeId: "hive-born", stateIds: ["fallen"] },
    detail: {
      pt: "Aparecem no térreo da Hive e não existem em nenhum outro lugar nem em nenhum outro estágio.",
      en: "They turn up on the Hive's ground floor and exist nowhere else, in no other stage.",
      es: "Aparecen en la planta baja de la Hive y no existen en ningún otro lugar ni fase.",
      pl: "Pojawiają się na parterze Hive i nie występują nigdzie indziej ani na innym etapie.",
    },
    sources: [wc("Hive_Born"), `${WIKI}/Ladybug`],
  },
  {
    id: "hive-born-inner-hive-bestiary",
    kind: "bestiary",
    subject: "Bestiary",
    availability: "available-today",
    bestiary: bestiaryProfile("Medium", "Rare"),
    // The western tower's underground area, which TibiaWiki marks "only open in third stage".
    // Waspoid, Crawler, Spitter and Insectoid Worker are in there too and are deliberately left
    // out: they also spawn at the Hive Outpost, so they are not a reason this stage is worth a
    // trip. Hive Overseer is in the same rooms and is Hard rather than Medium, so it is its own
    // entry; the numbers here are derived, and a group states one cost for all of its members.
    creatures: ["Kollos", "Spidris", "Spidris Elite"],
    trigger: { kind: "world-change", changeId: "hive-born", stateIds: ["fallen"] },
    detail: {
      pt: "Ficam no subterrâneo da torre oeste da Hive interna, aberto só neste estágio.",
      en: "They are in the western tower's underground area, which opens only in this stage.",
      es: "Están en el subterráneo de la torre oeste de la Hive interna, abierto solo en esta fase.",
      pl: "Są w podziemiach zachodniej wieży wewnętrznego Hive, otwartych tylko na tym etapie.",
    },
    sources: [`${WIKI}/The_Hive`, `${WIKI}/Spidris_Elite`, `${WIKI}/Kollos`],
  },
  {
    id: "hive-born-hive-overseer",
    kind: "bestiary",
    subject: "Hive Overseer",
    availability: "available-today",
    bestiary: bestiaryProfile("Hard", "Rare"),
    trigger: { kind: "world-change", changeId: "hive-born", stateIds: ["fallen"] },
    detail: {
      pt: "O maior alvo das torres da Hive, e também uma fonte de Gooey Mass.",
      en: "The biggest target in the Hive's towers, and a source of Gooey Mass as well.",
      es: "El objetivo más grande de las torres de la Hive, y también una fuente de Gooey Mass.",
      pl: "Największy cel w wieżach Hive, a przy okazji źródło Gooey Mass.",
    },
    sources: [`${WIKI}/Hive_Overseer`, `${WIKI}/Gooey_Mass`],
  },

  // ══ MINI WORLD CHANGE: Fury Gates ══════════════════════════════════════════
  {
    id: "fury-gates-dungeon",
    kind: "hunting",
    subject: "Fury Dungeon",
    availability: "available-today",
    exclusive: true,
    trigger: { kind: "mini-world-change", changeId: "fury-gates" },
    detail: {
      pt: "Massive Fire Elementals, Dragon Lords, Infernalists, Furies e Hellhounds atrás do portão; Furyosa pode surgir em raid.",
      en: "Massive Fire Elementals, Dragon Lords, Infernalists, Furies and Hellhounds behind the gate; Furyosa can turn up in a raid.",
      es: "Massive Fire Elementals, Dragon Lords, Infernalists, Furies y Hellhounds tras la puerta; Furyosa puede aparecer en una raid.",
      pl: "Za bramą Massive Fire Elementals, Dragon Lordy, Infernaliści, Furie i Hellhoundy; Furyosa może pojawić się w rajdzie.",
    },
    sources: [mwc("Fury_Gates"), `${WIKI}/Fury_Dungeon`],
  },
  {
    id: "fury-gates-dragonling",
    kind: "mount",
    subject: "Dragonling",
    availability: "available-today",
    trigger: { kind: "mini-world-change", changeId: "fury-gates" },
    detail: {
      pt: "Use uma Decorative Ribbon ou Music Box em um Dragonling da Fury Dungeon.",
      en: "Use a Decorative Ribbon or Music Box on a Dragonling in the Fury Dungeon.",
      es: "Usa una Decorative Ribbon o Music Box en un Dragonling de la Fury Dungeon.",
      pl: "Użyj Decorative Ribbon lub Music Box na Dragonlingu w Fury Dungeon.",
    },
    qualifier: {
      pt: "com Decorative Ribbon ou Music Box",
      en: "with a Decorative Ribbon or Music Box",
      es: "con Decorative Ribbon o Music Box",
      pl: "z Decorative Ribbon lub Music Box",
    },
    sources: [`${WIKI}/Dragonling_(Mount)`, `${WIKI}/Dragonling`],
  },

  // ══ MINI WORLD CHANGE: Hive Outpost ════════════════════════════════════════
  {
    id: "hive-outpost-hunt",
    kind: "hunting",
    subject: "Hive Outpost",
    availability: "available-today",
    exclusive: true,
    trigger: { kind: "mini-world-change", changeId: "hive-outpost" },
    detail: {
      pt: "Os Hive Born de Quirefang montaram um posto no oeste de Vandura, alcançável só enquanto a mudança durar.",
      en: "Quirefang's Hive Born have set up an outpost on western Vandura, reachable only while the change lasts.",
      es: "Los Hive Born de Quirefang montaron un puesto en el oeste de Vandura, alcanzable solo mientras dure el cambio.",
      pl: "Hive Born z Quirefang rozbili placówkę na zachodzie Vandury, dostępną tylko póki trwa zmiana.",
    },
    sources: [mwc("Hive_Outpost")],
  },

  // ══ MINI WORLD CHANGE: Warpath ═════════════════════════════════════════════
  {
    id: "warpath-bibby",
    kind: "boss",
    subject: "Bibby Bloodbath",
    availability: "available-today",
    exclusive: true,
    bosstiary: "Archfoe",
    trigger: { kind: "mini-world-change", changeId: "warpath" },
    detail: {
      pt: "Limpe todos os orcs de dentro do acampamento para que ela apareça; dá o achievement Bibby's Bloodbath.",
      en: "Clear every orc inside the camp to make her spawn; she grants the Bibby's Bloodbath achievement.",
      es: "Limpia todos los orcos del campamento para que aparezca; da el achievement Bibby's Bloodbath.",
      pl: "Wyczyść wszystkie orki w obozie, by się pojawiła; daje osiągnięcie Bibby's Bloodbath.",
    },
    achievement: {
      name: "Bibby's Bloodbath",
      grade: 1,
      points: 1,
      premium: false,
      requirement: {
        pt: "Mate Bibby Bloodbath",
        en: "Kill Bibby Bloodbath",
        es: "Mata a Bibby Bloodbath",
        pl: "Zabij Bibby Bloodbath",
      },
    },
    caveat: {
      pt: "Só pode ser morta a cada 24 horas, e subir a escada antes disso reinicia a contagem.",
      en: "She can only be killed every 24 hours, and going up the stairs sooner resets the timer.",
      es: "Solo puede matarse cada 24 horas, y subir la escalera antes reinicia el contador.",
      pl: "Można ją zabić raz na 24 godziny, a wcześniejsze wejście po schodach resetuje licznik.",
    },
    qualifier: {
      pt: "limpe os orcs do acampamento",
      en: "clear the orcs from the camp",
      es: "limpia los orcos del campamento",
      pl: "wyczyść orki z obozu",
    },
    sources: [mwc("Warpath"), `${WIKI}/Bibby's_Bloodbath`],
  },

  // ══ MINI WORLD CHANGE: Devovorga's Essence ═════════════════════════════════
  {
    id: "devovorga-incarnations",
    kind: "boss",
    subject: "Devovorga's incarnations",
    availability: "available-today",
    bosstiary: "Nemesis",
    trigger: { kind: "mini-world-change", changeId: "devovorgas-essence" },
    detail: {
      pt: "Troque Tentacle Pieces com o Dread Guardian em Vengoth: Anmothra 2, Irahsae 5, Teneshpar 8, Chikhaton 12, Phrodomo 16, cada um com seu achievement Slayer of.",
      en: "Trade Tentacle Pieces with the Dread Guardian at Vengoth: Anmothra 2, Irahsae 5, Teneshpar 8, Chikhaton 12, Phrodomo 16, each with its own Slayer of achievement.",
      es: "Cambia Tentacle Pieces con el Dread Guardian en Vengoth: Anmothra 2, Irahsae 5, Teneshpar 8, Chikhaton 12, Phrodomo 16, cada uno con su achievement Slayer of.",
      pl: "Wymień Tentacle Pieces u Dread Guardiana w Vengoth: Anmothra 2, Irahsae 5, Teneshpar 8, Chikhaton 12, Phrodomo 16. Każdy ma własne osiągnięcie Slayer of.",
    },
    caveat: {
      pt: "Aqui só entra uma pessoa por vez, então não dá para enfrentá-los em equipe.",
      en: "Only one person can enter at a time here, so they cannot be fought as a team.",
      es: "Aquí solo entra una persona a la vez, así que no pueden enfrentarse en equipo.",
      pl: "Wchodzi się tu pojedynczo, więc nie da się walczyć drużynowo.",
    },
    advisory: {
      pt: "Para pontos de Bosstiary, a recomendação é ficar nos três mais fracos, Anmothra, Irahsae e Teneshpar somam 75 peças.",
      en: "For Bosstiary points the usual advice is to stick to the three weakest, Anmothra, Irahsae and Teneshpar come to 75 pieces.",
      es: "Para puntos de Bosstiary, la recomendación es quedarse con los tres más débiles, Anmothra, Irahsae y Teneshpar suman 75 piezas.",
      pl: "Dla punktów Bosstiary zwykle radzi się trzymać trzech najsłabszych, Anmothra, Irahsae i Teneshpar to razem 75 kawałków.",
    },
    prerequisites: ["Tentacle Pieces"],
    qualifier: {
      pt: "em troca de Tentacle Pieces",
      en: "in exchange for Tentacle Pieces",
      es: "a cambio de Tentacle Pieces",
      pl: "w zamian za Tentacle Pieces",
    },
    sources: [mwc("Devovorga's_Essence")],
  },

  // ══ MINI WORLD CHANGE: Chakoya Iceberg ═════════════════════════════════════
  {
    id: "chakoya-iceberg-fireproof-horn",
    kind: "item",
    subject: "Fireproof Horn",
    availability: "available-today",
    trigger: { kind: "mini-world-change", changeId: "chakoya-iceberg" },
    detail: {
      pt: "O iceberg está cheio de Chakoyas, boa fonte de Fireproof Horns. Com uma Tinder Box viram o Melting Horn que doma o Ursagrodon.",
      en: "The iceberg is packed with Chakoyas, a good source of Fireproof Horns. With a Tinder Box they become the Melting Horn that tames the Ursagrodon.",
      es: "El iceberg está lleno de Chakoyas, buena fuente de Fireproof Horns. Con una Tinder Box se vuelven el Melting Horn que doma al Ursagrodon.",
      pl: "Góra lodowa pełna Chakoyów to dobre źródło Fireproof Hornów. Z Tinder Boxem stają się Melting Hornem do oswojenia Ursagrodona.",
    },
    qualifier: {
      pt: "vira Melting Horn para o Ursagrodon",
      en: "becomes the Melting Horn for the Ursagrodon",
      es: "se vuelve Melting Horn para el Ursagrodon",
      pl: "staje się Melting Hornem na Ursagrodona",
    },
    sources: [mwc("Chakoya_Iceberg"), `${WIKI}/Fireproof_Horn`],
  },
  {
    id: "chakoya-iceberg-cartography",
    kind: "quest",
    subject: "Cartography 101",
    availability: "available-today",
    exclusive: true,
    trigger: { kind: "mini-world-change", changeId: "chakoya-iceberg" },
    detail: {
      pt: "O ponto do iceberg só pode ser alcançado durante esta mudança: entre no iglu, desça os dois buracos e use o Adventurer's Map na sala grande.",
      en: "The iceberg location can only be reached during this change: enter the igloo, go down both holes and use the Adventurer's Map in the large room.",
      es: "El punto del iceberg solo se alcanza durante este cambio: entra al iglú, baja por los dos agujeros y usa el Adventurer's Map en la sala grande.",
      pl: "Punkt na górze lodowej osiągniesz tylko podczas tej zmiany: wejdź do igloo, zejdź dwiema dziurami i użyj Adventurer's Map w dużej sali.",
    },
    sources: [`${WIKI}/Cartography_101_Quest/Spoiler`],
  },

  // ══ MINI WORLD CHANGE: Spirit Grounds ══════════════════════════════════════
  {
    id: "spirit-grounds-hunt",
    kind: "hunting",
    subject: "Spirit Grounds",
    availability: "available-today",
    exclusive: true,
    trigger: { kind: "mini-world-change", changeId: "spirit-grounds" },
    detail: {
      pt: "Terreno de caça de undead aberto por um dia.",
      en: "An undead hunting ground open for the day.",
      es: "Terreno de caza de no-muertos abierto por un día.",
      pl: "Teren łowiecki nieumarłych otwarty na jeden dzień.",
    },
    caveat: {
      pt: "Contas Free não entram, nem pelo portal dos Ghostlands.",
      en: "Free accounts cannot enter, not even through the Ghostlands portal.",
      es: "Las cuentas Free no pueden entrar, ni por el portal de los Ghostlands.",
      pl: "Konta Free nie wejdą, nawet portalem w Ghostlands.",
    },
    sources: [mwc("Spirit_Grounds"), `${WIKI}/Spirit_Grounds`],
  },
  // One entry per hunting ground, gated on the second axis so nothing is offered until
  // somebody has looked through the gate. The creature names come from the same arrays the
  // catalog and the picker use.
  {
    id: "spirit-grounds-ghosts",
    kind: "bestiary",
    subject: "Bestiary",
    availability: "available-today",
    bestiary: bestiaryProfile("Easy", "Common"),
    creatures: SPIRIT_GROUND_SETS[0].creatures,
    trigger: { kind: "mini-world-change", changeId: "spirit-grounds", contentIds: ["ghosts"] },
    detail: {
      pt: "O conjunto mais leve dos três Spirit Grounds, todo ele Easy no Bestiary.",
      en: "The lightest of the three Spirit Grounds, every entry in it Easy in the Bestiary.",
      es: "El conjunto más ligero de los tres Spirit Grounds, todo él Easy en el Bestiary.",
      pl: "Najlżejszy z trzech Spirit Grounds, w całości Easy w Bestiary.",
    },
    sources: [`${WIKI}/Spirit_Grounds`],
  },
  {
    id: "spirit-grounds-nightstalkers",
    kind: "bestiary",
    subject: "Bestiary",
    availability: "available-today",
    bestiary: bestiaryProfile("Medium", "Common"),
    creatures: SPIRIT_GROUND_SETS[1].creatures,
    trigger: {
      kind: "mini-world-change",
      changeId: "spirit-grounds",
      contentIds: ["nightstalkers"],
    },
    detail: {
      pt: "O conjunto intermediário dos três Spirit Grounds, quatro entradas Medium juntas.",
      en: "The middle of the three Spirit Grounds, four Medium entries in one place.",
      es: "El conjunto intermedio de los tres Spirit Grounds, cuatro entradas Medium juntas.",
      pl: "Środkowy z trzech Spirit Grounds, cztery wpisy Medium w jednym miejscu.",
    },
    sources: [`${WIKI}/Spirit_Grounds`],
  },
  {
    id: "spirit-grounds-nightmares",
    kind: "bestiary",
    subject: "Bestiary",
    availability: "available-today",
    bestiary: bestiaryProfile("Medium", "Common"),
    // Phantasm is Hard where the other three are Medium, so it cannot share this line: the
    // numbers are derived from the profile and a group states one cost for all of its members.
    creatures: SPIRIT_GROUND_SETS[2].creatures.filter((name) => name !== "Phantasm"),
    trigger: { kind: "mini-world-change", changeId: "spirit-grounds", contentIds: ["nightmares"] },
    detail: {
      pt: "O conjunto mais pesado dos três Spirit Grounds.",
      en: "The heaviest of the three Spirit Grounds.",
      es: "El conjunto más pesado de los tres Spirit Grounds.",
      pl: "Najcięższy z trzech Spirit Grounds.",
    },
    sources: [`${WIKI}/Spirit_Grounds`],
  },
  {
    id: "spirit-grounds-phantasm",
    kind: "bestiary",
    subject: "Phantasm",
    availability: "available-today",
    bestiary: bestiaryProfile("Hard", "Common"),
    trigger: { kind: "mini-world-change", changeId: "spirit-grounds", contentIds: ["nightmares"] },
    detail: {
      pt: "Divide o Spirit Ground mais pesado com os Nightmares, e é a única entrada Hard dos três conjuntos.",
      en: "It shares the heaviest Spirit Ground with the Nightmares, and is the only Hard entry across the three sets.",
      es: "Comparte el Spirit Ground más pesado con los Nightmares, y es la única entrada Hard de los tres conjuntos.",
      pl: "Dzieli najcięższy Spirit Ground z Nightmare'ami i jest jedynym wpisem Hard w trzech zestawach.",
    },
    sources: [`${WIKI}/Spirit_Grounds`, `${WIKI}/Phantasm`],
  },

  // ══ MINI WORLD CHANGE: Nightmare Isles ═════════════════════════════════════
  {
    id: "nightmare-isles-hunt",
    kind: "hunting",
    subject: "Nightmare Isles",
    availability: "available-today",
    exclusive: true,
    trigger: { kind: "mini-world-change", changeId: "nightmare-isles" },
    detail: {
      pt: "Plataformas ligadas por escadas-teleporte, com Silencers, Retching Horrors, Choking Fears e Terrorsleeps.",
      en: "Platforms linked by teleporting stairs, with Silencers, Retching Horrors, Choking Fears and Terrorsleeps.",
      es: "Plataformas unidas por escaleras-teletransporte, con Silencers, Retching Horrors, Choking Fears y Terrorsleeps.",
      pl: "Platformy połączone teleportującymi schodami, z Silencerami, Retching Horrorami, Choking Fearami i Terrorsleepami.",
    },
    caveat: {
      pt: "Uma plataforma pode ter mais de dez criaturas, que atacam todas de uma vez.",
      en: "A single platform can hold more than ten creatures, and they all swarm at once.",
      es: "Una sola plataforma puede tener más de diez criaturas, y atacan todas a la vez.",
      pl: "Na jednej platformie może być ponad dziesięć stworzeń, które atakują naraz.",
    },
    advisory: {
      // The "this is only a recommendation" clause is what the 💡 marker is for; spelling it
      // out in the sentence as well said the same thing twice on one line.
      pt: "O guia de caça da TibiaWiki sugere nível 250 para todas as vocações.",
      en: "TibiaWiki's hunting guide suggests level 250 for every vocation.",
      es: "La guía de caza de TibiaWiki sugiere nivel 250 para todas las vocaciones.",
      pl: "Poradnik łowiecki TibiaWiki sugeruje poziom 250 dla każdej profesji.",
    },
    sources: [mwc("Nightmare_Isles"), `${WIKI}/Nightmare_Isles`],
  },
  {
    id: "nightmare-isles-teddy",
    kind: "quest",
    subject: "Nightmare Teddy Quest",
    availability: "available-today",
    exclusive: true,
    trigger: { kind: "mini-world-change", changeId: "nightmare-isles" },
    detail: {
      // The state sentence above this line already says the portal is open. Repeating it here
      // spent the line on a fact the reader had just read.
      pt: "O Nightmare Teddy é guardado nas ilhas.",
      en: "The Nightmare Teddy is guarded on the isles.",
      es: "El Nightmare Teddy está guardado en las islas.",
      pl: "Nightmare Teddy jest strzeżony na wyspach.",
    },
    sources: [mwc("Nightmare_Isles"), `${WIKI}/Nightmare_Teddy_Quest`],
  },

  // ══ MINI WORLD CHANGE: Fire from the Earth ═════════════════════════════════
  {
    id: "fire-from-the-earth-hunt",
    kind: "hunting",
    subject: "Hellgore volcano",
    availability: "available-today",
    exclusive: true,
    trigger: { kind: "mini-world-change", changeId: "fire-from-the-earth" },
    detail: {
      pt: "No lugar dos Stone Golems, Fire Elementals e Fire Devils de sempre surgem Demons, Diabolic Imps, Dragons, Dragon Lords e Hellfire Fighters.",
      en: "In place of the usual Stone Golems, Fire Elementals and Fire Devils come Demons, Diabolic Imps, Dragons, Dragon Lords and Hellfire Fighters.",
      es: "En lugar de los habituales Stone Golems, Fire Elementals y Fire Devils aparecen Demons, Diabolic Imps, Dragons, Dragon Lords y Hellfire Fighters.",
      pl: "Zamiast zwykłych Stone Golemów, Fire Elementali i Fire Devilów pojawiają się Demony, Diabolic Impy, Dragony, Dragon Lordy i Hellfire Fighterzy.",
    },
    sources: [mwc("Fire_from_the_Earth")],
  },
  {
    id: "fire-from-the-earth-dragonling",
    kind: "mount",
    subject: "Dragonling",
    availability: "available-today",
    trigger: { kind: "mini-world-change", changeId: "fire-from-the-earth" },
    detail: {
      pt: "A erupção traz Dragonlings para o vulcão. Use uma Decorative Ribbon ou Music Box em um deles.",
      en: "The eruption brings Dragonlings to the volcano. Use a Decorative Ribbon or Music Box on one.",
      es: "La erupción trae Dragonlings al volcán. Usa una Decorative Ribbon o Music Box en uno.",
      pl: "Erupcja sprowadza Dragonlingi na wulkan. Użyj na jednym Decorative Ribbon lub Music Box.",
    },
    qualifier: {
      pt: "com Decorative Ribbon ou Music Box",
      en: "with a Decorative Ribbon or Music Box",
      es: "con Decorative Ribbon o Music Box",
      pl: "z Decorative Ribbon lub Music Box",
    },
    sources: [mwc("Fire_from_the_Earth"), `${WIKI}/Dragonling_(Mount)`],
  },
  {
    id: "fire-from-the-earth-achievement",
    kind: "achievement",
    subject: "Fire from the Earth",
    availability: "available-today",
    achievement: {
      name: "Fire from the Earth",
      grade: 1,
      points: 2,
      premium: true,
      requirement: {
        pt: "Mate 50 criaturas de fogo no vulcão Hellgore",
        en: "Kill 50 fiery creatures on the Hellgore volcano",
        es: "Mata 50 criaturas de fuego en el volcán Hellgore",
        pl: "Zabij 50 ognistych stworzeń na wulkanie Hellgore",
      },
    },
    trigger: { kind: "mini-world-change", changeId: "fire-from-the-earth" },
    detail: {
      pt: "Mate 50 criaturas de fogo, de qualquer tipo, dentro ou em cima do vulcão Hellgore.",
      en: "Kill 50 fiery creatures of any kind, in or on the Hellgore volcano.",
      es: "Mata 50 criaturas de fuego de cualquier tipo, dentro o encima del volcán Hellgore.",
      pl: "Zabij 50 ognistych stworzeń dowolnego rodzaju, w wulkanie Hellgore lub na nim.",
    },
    sources: [`${WIKI}/Fire_from_the_Earth`],
  },

  // ══ MINI WORLD CHANGE: Nomads ══════════════════════════════════════════════
  {
    id: "nomads-blue",
    kind: "bestiary",
    subject: "Nomad (Blue)",
    availability: "available-today",
    exclusive: true,
    bestiary: bestiaryProfile("Easy", "Uncommon"),
    trigger: { kind: "mini-world-change", changeId: "nomads" },
    detail: {
      pt: "Existem só nesta mudança, em três dos quatro acampamentos possíveis de Kha'labal.",
      en: "They exist only during this change, at three of Kha'labal's four possible camps.",
      es: "Solo existen durante este cambio, en tres de los cuatro campamentos posibles de Kha'labal.",
      pl: "Istnieją tylko podczas tej zmiany, w trzech z czterech możliwych obozów w Kha'labal.",
    },
    sources: [mwc("Nomads"), `${WIKI}/Nomad_(Blue)`],
  },
  {
    id: "nomads-female",
    kind: "bestiary",
    subject: "Nomad (Female)",
    availability: "available-today",
    exclusive: true,
    bestiary: bestiaryProfile("Easy", "Uncommon"),
    trigger: { kind: "mini-world-change", changeId: "nomads" },
    detail: {
      pt: "Só aparecem no acampamento ao sul do Ancient Ruins Tomb, e só enquanto os nômades estiverem no deserto.",
      en: "They only appear at the camp south of the Ancient Ruins Tomb, and only while the nomads are in the desert.",
      es: "Solo aparecen en el campamento al sur del Ancient Ruins Tomb, y solo mientras los nómadas estén en el desierto.",
      pl: "Pojawiają się tylko w obozie na południe od Ancient Ruins Tomb i tylko gdy nomadzi są na pustyni.",
    },
    sources: [mwc("Nomads"), `${WIKI}/Nomad_(Female)`],
  },
  {
    id: "nomads-chest",
    kind: "achievement",
    subject: "Chest Robber",
    availability: "progressable-today",
    achievement: {
      name: "Chest Robber",
      grade: 1,
      points: 1,
      premium: true,
      requirement: {
        pt: "Saqueie o baú de 3 acampamentos nômades diferentes",
        en: "Loot the chest of 3 different Nomad camps",
        es: "Saquea el cofre de 3 campamentos nómadas distintos",
        pl: "Złup skrzynię z 3 różnych obozów nomadów",
      },
    },
    trigger: { kind: "mini-world-change", changeId: "nomads" },
    detail: {
      pt: "Três dos quatro acampamentos têm baú (10 Hams, 50 Fishes ou uma Fur Bag com gemas); o achievement pede os três, em dias diferentes.",
      en: "Three of the four camps hold a chest (10 Hams, 50 Fishes or a Fur Bag of gems); the achievement wants all three, on different days.",
      es: "Tres de los cuatro campamentos tienen cofre (10 Hams, 50 Fishes o una Fur Bag con gemas); el achievement pide los tres, en días distintos.",
      pl: "Trzy z czterech obozów mają skrzynię (10 Hams, 50 Fishes albo Fur Bag z klejnotami); osiągnięcie wymaga wszystkich trzech, w różne dni.",
    },
    caveat: {
      pt: "O acampamento ao sul do Tarpit Tomb não tem baú nenhum.",
      en: "The camp south of the Tarpit Tomb has no chest at all.",
      es: "El campamento al sur del Tarpit Tomb no tiene ningún cofre.",
      pl: "Obóz na południe od Tarpit Tomb nie ma żadnej skrzyni.",
    },
    qualifier: {
      pt: "saqueie o baú do acampamento de hoje",
      en: "loot today's camp chest",
      es: "saquea el cofre del campamento de hoy",
      pl: "złup skrzynię dzisiejszego obozu",
    },
    sources: [mwc("Nomads"), `${WIKI}/Chest_Robber`],
  },

  // ══ MINI WORLD CHANGE: Bored ═══════════════════════════════════════════════
  {
    id: "bored-torn-treasures",
    kind: "achievement",
    subject: "Torn Treasures",
    availability: "available-today",
    achievement: {
      name: "Torn Treasures",
      grade: 1,
      points: 1,
      premium: false,
      requirement: {
        pt: "Entregue Blood Herbs a Wyda até receber um Torn Teddy",
        en: "Hand Blood Herbs to Wyda until she gives a Torn Teddy",
        es: "Entrega Blood Herbs a Wyda hasta recibir un Torn Teddy",
        pl: "Oddawaj Wydzie Blood Herby, aż da Torn Teddy'ego",
      },
    },
    trigger: { kind: "mini-world-change", changeId: "bored" },
    detail: {
      pt: "Entregue Blood Herbs a Wyda até ela dar um Torn Teddy; normalmente ela devolve Witchesbrooms antes disso.",
      en: "Hand Blood Herbs to Wyda until she gives up a Torn Teddy; she usually hands back Witchesbrooms first.",
      es: "Entrega Blood Herbs a Wyda hasta que dé un Torn Teddy; normalmente devuelve Witchesbrooms antes.",
      pl: "Oddawaj Wydzie Blood Herby, aż da Torn Teddy'ego; wcześniej zwykle zwraca Witchesbroomy.",
    },
    qualifier: {
      pt: "Blood Herbs para Wyda até sair o Torn Teddy",
      en: "Blood Herbs to Wyda until the Torn Teddy",
      es: "Blood Herbs a Wyda hasta el Torn Teddy",
      pl: "Blood Herby Wydzie aż do Torn Teddy",
    },
    sources: [mwc("Bored"), `${WIKI}/Torn_Treasures`],
  },
  {
    id: "bored-someones-bored",
    kind: "achievement",
    subject: "Someone's Bored",
    availability: "available-today",
    achievement: {
      name: "Someone's Bored",
      grade: 1,
      points: 1,
      premium: false,
      requirement: {
        pt: "Mate uma Giant Spider falsa",
        en: "Kill a fake Giant Spider",
        es: "Mata una Giant Spider falsa",
        pl: "Zabij fałszywego Giant Spidera",
      },
    },
    trigger: { kind: "mini-world-change", changeId: "bored" },
    detail: {
      pt: "Mate uma das Giant Spiders falsas que aparecem em volta da casa de Wyda.",
      en: "Kill one of the fake Giant Spiders that appear around Wyda's house.",
      es: "Mata una de las Giant Spiders falsas que aparecen alrededor de la casa de Wyda.",
      pl: "Zabij jednego z fałszywych Giant Spiderów krążących wokół domu Wydy.",
    },
    qualifier: {
      pt: "mate uma Giant Spider falsa",
      en: "kill a fake Giant Spider",
      es: "mata una Giant Spider falsa",
      pl: "zabij fałszywego Giant Spidera",
    },
    sources: [mwc("Bored"), `${WIKI}/Someone%27s_Bored`],
  },

  // ══ MINI WORLD CHANGE: Noodles is Gone ═════════════════════════════════════
  {
    id: "noodles-dog-sitter",
    kind: "achievement",
    subject: "Dog Sitter",
    availability: "available-today",
    achievement: {
      name: "Dog Sitter",
      grade: 1,
      points: 1,
      premium: false,
      requirement: {
        pt: "Encontre Noodles",
        en: "Find Noodles",
        es: "Encuentra a Noodles",
        pl: "Znajdź Noodlesa",
      },
    },
    trigger: { kind: "mini-world-change", changeId: "noodles-is-gone" },
    detail: {
      pt: "Peça o Dog Collar a King Tibianus, use-o em Noodles pela península de Thais e volte para pedir a recompensa: 1000 de experiência e, raramente, uma Fan Doll of Queen Eloise.",
      en: "Ask King Tibianus for the Dog Collar, use it on Noodles somewhere on the Thaian peninsula and go back for the reward: 1,000 experience and, rarely, a Fan Doll of Queen Eloise.",
      es: "Pide el Dog Collar a King Tibianus, úsalo en Noodles por la península de Thais y vuelve por la recompensa: 1000 de experiencia y, raramente, una Fan Doll of Queen Eloise.",
      pl: "Poproś King Tibianusa o Dog Collar, użyj go na Noodlesie gdzieś na półwyspie Thais i wróć po nagrodę: 1000 doświadczenia i rzadko Fan Doll of Queen Eloise.",
    },
    caveat: {
      pt: "Só é repetível a cada duas semanas, e quanto mais cedo depois do Server Save, mais fácil é achá-lo.",
      en: "Repeatable only every two weeks, and the sooner after server save you look, the easier he is to find.",
      es: "Solo repetible cada dos semanas, y cuanto antes lo busques tras el Server Save, más fácil es hallarlo.",
      pl: "Powtarzalne co dwa tygodnie, a im wcześniej po server save szukasz, tym łatwiej go znaleźć.",
    },
    qualifier: {
      pt: "Dog Collar do King Tibianus, depois ache Noodles",
      en: "Dog Collar from King Tibianus, then find Noodles",
      es: "Dog Collar de King Tibianus, luego halla a Noodles",
      pl: "Dog Collar od King Tibianusa, potem znajdź Noodlesa",
    },
    sources: [mwc("Noodles_is_Gone"), `${WIKI}/Dog_Sitter`],
  },

  // ══ MINI WORLD CHANGE: Kingsday ════════════════════════════════════════════
  {
    id: "kingsday-loyal-subject",
    kind: "achievement",
    subject: "Loyal Subject",
    availability: "available-today",
    achievement: {
      name: "Loyal Subject",
      grade: 1,
      points: 1,
      premium: false,
      requirement: {
        pt: "Diga \"hello king\" a King Tibianus",
        en: "Say \"hello king\" to King Tibianus",
        es: "Dile \"hello king\" a King Tibianus",
        pl: "Powiedz \"hello king\" do King Tibianusa",
      },
    },
    trigger: { kind: "mini-world-change", changeId: "kingsday" },
    detail: {
      pt: 'Diga "Hello King" a King Tibianus em Thais; só conta durante o Kingsday.',
      en: 'Say "Hello King" to King Tibianus in Thais; it only counts during Kingsday.',
      es: 'Dile "Hello King" a King Tibianus en Thais; solo cuenta durante el Kingsday.',
      pl: 'Powiedz "Hello King" do King Tibianusa w Thais; liczy się tylko w Kingsday.',
    },
    caveat: {
      pt: "Xingar o rei te manda para a Thaian Jail até a próxima raid, sem poder deslogar.",
      en: "Cursing at the king lands you in the Thaian Jail until the next raid, with no way to log out.",
      es: "Insultar al rey te manda a la Thaian Jail hasta la próxima raid, sin poder desconectarte.",
      pl: "Przeklinanie króla wsadza cię do Thaian Jail aż do następnego rajdu, bez możliwości wylogowania.",
    },
    qualifier: {
      pt: 'diga "Hello King" a King Tibianus',
      en: 'say "Hello King" to King Tibianus',
      es: 'dile "Hello King" a King Tibianus',
      pl: 'powiedz "Hello King" King Tibianusowi',
    },
    sources: [mwc("Kingsday"), `${WIKI}/Loyal_Subject`],
  },
  {
    id: "kingsday-arena-raids",
    kind: "hunting",
    subject: "Knights' Guild arena",
    availability: "available-today",
    exclusive: true,
    trigger: { kind: "mini-world-change", changeId: "kingsday" },
    detail: {
      pt: "Raids de hora em hora, em duas ondas, com minotauros, dragões, lagartos, trolls, orcs, goblins, elementais ou dworcs, e Party Lampions para saquear.",
      en: "Hourly raids in two waves (minotaurs, dragons, lizards, trolls, orcs, goblins, elementals or dworcs), with Party Lampions to loot.",
      es: "Raids cada hora en dos oleadas (minotauros, dragones, lagartos, trolls, orcos, goblins, elementales o dworcs), con Party Lampions para saquear.",
      pl: "Rajdy co godzinę w dwóch falach (minotaury, smoki, jaszczury, trolle, orki, gobliny, żywiołaki lub dworcowie), z Party Lampionami do zebrania.",
    },
    caveat: {
      pt: "As criaturas somem 30 minutos depois de aparecerem se ninguém as matar.",
      en: "Raid creatures despawn 30 minutes after spawning if nobody kills them.",
      es: "Las criaturas desaparecen 30 minutos tras aparecer si nadie las mata.",
      pl: "Stworzenia z rajdu znikają 30 minut po pojawieniu się, jeśli nikt ich nie zabije.",
    },
    sources: [mwc("Kingsday")],
  },

  // ══ MINI WORLD CHANGE: Thawing ═════════════════════════════════════════════
  {
    id: "thawing-ice-harvester",
    kind: "achievement",
    subject: "Ice Harvester",
    availability: "progressable-today",
    achievement: {
      name: "Ice Harvester",
      grade: 1,
      points: 1,
      premium: true,
      requirement: {
        pt: "Colha 10 Ice Flower Seeds",
        en: "Harvest 10 Ice Flower Seeds",
        es: "Cosecha 10 Ice Flower Seeds",
        pl: "Zbierz 10 Ice Flower Seeds",
      },
    },
    trigger: { kind: "mini-world-change", changeId: "thawing" },
    detail: {
      pt: "São 15 Ice Flowers pelo degelo ao norte de Svargrond, cada uma com cerca de 20% de chance de dar semente; precisa de 10 sementes.",
      en: "15 Ice Flowers dot the thaw north of Svargrond, each with about a 20% chance of a seed; 10 seeds are needed.",
      es: "Hay 15 Ice Flowers en el deshielo al norte de Svargrond, cada una con un 20% de dar semilla; hacen falta 10 semillas.",
      pl: "Na roztopach na północ od Svargrond rośnie 15 Ice Flowers, każda z ~20% szansą na nasiono; potrzeba 10 nasion.",
    },
    caveat: {
      pt: "Cada flor leva 4 horas para voltar a crescer depois de colhida.",
      en: "Each flower takes 4 hours to regrow once harvested.",
      es: "Cada flor tarda 4 horas en volver a crecer tras cosecharla.",
      pl: "Każdy kwiat odrasta 4 godziny po zerwaniu.",
    },
    qualifier: {
      pt: "10 Ice Flower Seeds",
      en: "10 Ice Flower Seeds",
      es: "10 Ice Flower Seeds",
      pl: "10 Ice Flower Seeds",
    },
    sources: [mwc("Thawing"), `${WIKI}/Ice_Harvester`],
  },

  // ══ MINI WORLD CHANGE: Spider Nest ═════════════════════════════════════════
  {
    id: "spider-nest-mamma-longlegs",
    kind: "boss",
    subject: "Mamma Longlegs",
    availability: "available-today",
    exclusive: true,
    trigger: { kind: "mini-world-change", changeId: "spider-nest" },
    detail: {
      pt: "O ninho a sudoeste de Venore só abre nesta mudança; matá-la três vezes dá o achievement Nestling.",
      en: "The nest south-west of Venore only opens during this change; killing her three times grants the Nestling achievement.",
      es: "El nido al suroeste de Venore solo abre en este cambio; matarla tres veces da el achievement Nestling.",
      pl: "Gniazdo na południowy zachód od Venore otwiera się tylko przy tej zmianie; trzy zabicia dają osiągnięcie Nestling.",
    },
    achievement: {
      name: "Nestling",
      grade: 1,
      points: 1,
      premium: false,
      requirement: {
        pt: "Mate Mamma Longlegs 3 vezes",
        en: "Kill Mamma Longlegs 3 times",
        es: "Mata a Mamma Longlegs 3 veces",
        pl: "Zabij Mamma Longlegs 3 razy",
      },
    },
    caveat: {
      pt: "Depois da terceira morte você nunca mais consegue entrar na área.",
      en: "After the third kill you can never enter the area again.",
      es: "Tras la tercera muerte no podrás volver a entrar a la zona.",
      pl: "Po trzecim zabiciu nigdy więcej nie wejdziesz na ten teren.",
    },
    qualifier: {
      pt: "3 mortes",
      en: "3 kills",
      es: "3 kills",
      pl: "3 kills",
    },
    sources: [mwc("Spider_Nest"), `${WIKI}/Nestling`],
  },

  // ══ MINI WORLD CHANGE: Poacher Caves ═══════════════════════════════════════
  {
    id: "poacher-caves-game",
    kind: "hunting",
    subject: "Poacher Caves",
    availability: "available-today",
    trigger: { kind: "mini-world-change", changeId: "poacher-caves", variantIds: ["game"] },
    detail: {
      pt: "Com os animais dominando, as cavernas são Wolves, War Wolves, Bears e Boars, que largam Bear Paws e Wolf Paws, com Wyverns no último andar.",
      en: "With the animals on top, the caves hold Wolves, War Wolves, Bears and Boars, which drop Bear Paws and Wolf Paws, with Wyverns on the bottom floor.",
      es: "Con los animales dominando, las cuevas tienen Wolves, War Wolves, Bears y Boars, que sueltan Bear Paws y Wolf Paws, con Wyverns en el último piso.",
      pl: "Gdy zwierzęta dominują, w jaskiniach są Wolves, War Wolves, Bears i Boars, które upuszczają Bear Paws i Wolf Paws, a na najniższym piętrze Wyverny.",
    },
    sources: [mwc("Poacher_Caves"), `${WIKI}/Poacher_Caves/Game`],
  },
  {
    id: "poacher-caves-poachers",
    kind: "hunting",
    subject: "Poacher Caves",
    availability: "available-today",
    trigger: { kind: "mini-world-change", changeId: "poacher-caves", variantIds: ["poachers"] },
    detail: {
      pt: "Com os caçadores furtivos dominando, as cavernas se enchem de Poachers e Hunters, que largam Wolf, Lion e Deer Trophies.",
      en: "With the poachers on top, the caves fill with Poachers and Hunters, who drop Wolf, Lion and Deer Trophies.",
      es: "Con los cazadores furtivos dominando, las cuevas se llenan de Poachers y Hunters, que sueltan Wolf, Lion y Deer Trophies.",
      pl: "Gdy kłusownicy dominują, jaskinie zapełniają Poachers i Hunters, którzy upuszczają Wolf, Lion i Deer Trophy.",
    },
    sources: [mwc("Poacher_Caves"), `${WIKI}/Poacher_Caves/Poachers`],
  },
  {
    id: "poacher-caves-ghost-wolf",
    kind: "bestiary",
    subject: "Ghost Wolf",
    availability: "available-today",
    exclusive: true,
    bestiary: bestiaryProfile("Easy", "Rare"),
    trigger: { kind: "mini-world-change", changeId: "poacher-caves", variantIds: ["ghost-wolves"] },
    detail: {
      pt: "As Poacher Caves na fase dos espíritos são o único lugar de Tibia onde o Ghost Wolf existe.",
      en: "The Poacher Caves in their ghost phase are the only place in Tibia the Ghost Wolf exists.",
      es: "Las Poacher Caves en su fase de espíritus son el único lugar de Tibia donde existe el Ghost Wolf.",
      pl: "Poacher Caves w fazie duchów to jedyne miejsce w Tibii, gdzie występuje Ghost Wolf.",
    },
    sources: [`${WIKI}/Ghost_Wolf`, `${WIKI}/Poacher_Caves/Gloomy`],
  },
  {
    id: "poacher-caves-gloom-wolf",
    kind: "bestiary",
    subject: "Gloom Wolf",
    availability: "available-today",
    bestiary: bestiaryProfile("Easy", "Uncommon"),
    trigger: { kind: "mini-world-change", changeId: "poacher-caves", variantIds: ["ghost-wolves"] },
    detail: {
      pt: "Dividem as cavernas com os Ghost Wolves; fora daqui só nas Tainted Caves.",
      en: "They share the caves with the Ghost Wolves; the only other place is the Tainted Caves.",
      es: "Comparten las cuevas con los Ghost Wolves; fuera de aquí solo en las Tainted Caves.",
      pl: "Dzielą jaskinie z Ghost Wolfami; poza tym tylko w Tainted Caves.",
    },
    sources: [`${WIKI}/Gloom_Wolf`, `${WIKI}/Poacher_Caves/Gloomy`],
  },

  // ══ MINI WORLD CHANGE: Jungle Camp ═════════════════════════════════════════
  {
    id: "jungle-camp-arthom",
    kind: "boss",
    subject: "Arthom the Hunter",
    availability: "available-today",
    exclusive: true,
    // No `bosstiary`: his TibiaWiki page carries no bosstiaryclass, unlike Oodok Witchmaster's.
    trigger: { kind: "mini-world-change", changeId: "jungle-camp", variantIds: ["hunters"] },
    detail: {
      pt: "Chefe do Hunter Camp em Tiquanda. Só pode aparecer nos dias em que os caçadores dominam as terras sagradas.",
      en: "Boss of the Hunter Camp in Tiquanda. He can only turn up on days the hunters hold the holy grounds.",
      es: "Jefe del Hunter Camp en Tiquanda. Solo puede aparecer los días en que los cazadores dominan las tierras sagradas.",
      pl: "Boss Hunter Camp w Tiquandzie. Pojawia się tylko w dni, gdy myśliwi trzymają święte ziemie.",
    },
    sources: [mwc("Jungle_Camp"), `${WIKI}/Arthom_the_Hunter`],
  },
  {
    id: "jungle-camp-oodok",
    kind: "boss",
    subject: "Oodok Witchmaster",
    availability: "available-today",
    exclusive: true,
    bosstiary: "Nemesis",
    trigger: { kind: "mini-world-change", changeId: "jungle-camp", variantIds: ["dworcs"] },
    detail: {
      pt: "Chefe do Dworc Camp em Tiquanda. Só pode aparecer nos dias em que os dworcs dominam as terras sagradas.",
      en: "Boss of the Dworc Camp in Tiquanda. He can only turn up on days the dworcs hold the holy grounds.",
      es: "Jefe del Dworc Camp en Tiquanda. Solo puede aparecer los días en que los dworcs dominan las tierras sagradas.",
      pl: "Boss Dworc Camp w Tiquandzie. Pojawia się tylko w dni, gdy dworcowie trzymają święte ziemie.",
    },
    sources: [mwc("Jungle_Camp"), `${WIKI}/Oodok_Witchmaster`],
  },

  // ══ MINI WORLD CHANGE: Grimvale ════════════════════════════════════════════
  {
    id: "grimvale-werebadger",
    kind: "bestiary",
    subject: "Werebadger",
    availability: "available-today",
    bestiary: bestiaryProfile("Medium", "Common"),
    trigger: { kind: "mini-world-change", changeId: "grimvale" },
    detail: {
      pt: "Sob a lua cheia os Bandits de Grimvale viram Werebadgers e Wereboars por toda a ilha.",
      en: "Under the full moon Grimvale's Bandits turn into Werebadgers and Wereboars all over the island.",
      es: "Bajo la luna llena los Bandits de Grimvale se vuelven Werebadgers y Wereboars por toda la isla.",
      pl: "Podczas pełni Bandici z Grimvale zmieniają się w Werebadgery i Wereboary na całej wyspie.",
    },
    sources: [mwc("Grimvale"), `${WIKI}/Grimvale`],
  },
  {
    id: "grimvale-quest",
    kind: "quest",
    subject: "Grimvale Quest",
    availability: "progressable-today",
    exclusive: true,
    trigger: { kind: "mini-world-change", changeId: "grimvale" },
    detail: {
      pt: "A lua cheia cobre do dia 12 ao 15 de cada mês e é a única janela para avançar a quest; Feroxa aparece no dia 13.",
      en: "The full moon runs from the 12th to the 15th of each month and is the only window to advance the quest; Feroxa appears on the 13th.",
      es: "La luna llena va del 12 al 15 de cada mes y es la única ventana para avanzar la quest; Feroxa aparece el día 13.",
      pl: "Pełnia trwa od 12. do 15. każdego miesiąca i to jedyne okno na postęp questa; Feroxa pojawia się 13.",
    },
    caveat: {
      pt: "Enfrentar Feroxa exige, a cada vez, 3 Purple Nightshade Blossoms para Maeryn e 50 were-creatures mortos.",
      en: "Facing Feroxa needs, every time, 3 Purple Nightshade Blossoms for Maeryn and 50 were-creatures killed.",
      es: "Enfrentar a Feroxa exige, cada vez, 3 Purple Nightshade Blossoms para Maeryn y 50 were-creatures muertos.",
      pl: "Walka z Feroxą wymaga za każdym razem 3 Purple Nightshade Blossoms dla Maeryn i 50 zabitych were-creatures.",
    },
    qualifier: {
      pt: "do dia 12 ao 15 de cada mês",
      en: "from the 12th to the 15th each month",
      es: "del 12 al 15 de cada mes",
      pl: "od 12. do 15. każdego miesiąca",
    },
    sources: [mwc("Grimvale"), `${WIKI}/Grimvale_Quest`],
  },

  // ══ MINI WORLD CHANGE: Stampede ════════════════════════════════════════════
  {
    id: "stampede-terrified-elephant",
    kind: "bestiary",
    subject: "Terrified Elephant",
    availability: "available-today",
    exclusive: true,
    bestiary: bestiaryProfile("Easy", "Uncommon"),
    trigger: { kind: "mini-world-change", changeId: "stampede" },
    detail: {
      pt: "Até 16 deles ocupam a clareira ao sul de Banuta, e largam Elephant Tusks mais do que os elefantes comuns.",
      en: "Up to 16 of them fill the clearing south of Banuta, and drop Elephant Tusks more often than ordinary elephants.",
      es: "Hasta 16 ocupan el claro al sur de Banuta, y sueltan Elephant Tusks más que los elefantes comunes.",
      pl: "Nawet 16 z nich wypełnia polanę na południe od Banuty i częściej niż zwykłe słonie upuszczają Elephant Tusks.",
    },
    achievement: {
      name: "Trail of the Ape God",
      grade: 1,
      points: 1,
      premium: true,
      requirement: {
        pt: "Mate 5 Terrified Elephants",
        en: "Kill 5 Terrified Elephants",
        es: "Mata 5 Terrified Elephants",
        pl: "Zabij 5 Terrified Elephants",
      },
    },
    caveat: {
      pt: "Cinco mortes já dão o achievement Trail of the Ape God.",
      en: "Five kills already grant the Trail of the Ape God achievement.",
      es: "Cinco muertes ya dan el achievement Trail of the Ape God.",
      pl: "Pięć zabójstw już daje osiągnięcie Trail of the Ape God.",
    },
    sources: [mwc("Stampede"), `${WIKI}/Trail_of_the_Ape_God`],
  },

  // ══ MINI WORLD CHANGE: Bank Robbery ════════════════════════════════════════
  {
    id: "bank-robbery-honest-finder",
    kind: "achievement",
    subject: "Honest Finder",
    availability: "available-today",
    achievement: {
      name: "Honest Finder",
      grade: 1,
      points: 1,
      premium: false,
      requirement: {
        pt: "Devolva uma Bag with Stolen Gold a um banco",
        en: "Return a Bag with Stolen Gold to a bank",
        es: "Devuelve una Bag with Stolen Gold a un banco",
        pl: "Oddaj Bag with Stolen Gold do banku",
      },
    },
    trigger: { kind: "mini-world-change", changeId: "bank-robbery" },
    detail: {
      pt: "Descubra qual das quatro cidades foi roubada, derrote o ladrão e devolva a Bag with Stolen Gold ao banqueiro por 10 Platinum Coins.",
      en: "Work out which of the four cities was robbed, beat the thief and return the Bag with Stolen Gold to the banker for 10 Platinum Coins.",
      es: "Averigua cuál de las cuatro ciudades fue robada, vence al ladrón y devuelve la Bag with Stolen Gold al banquero por 10 Platinum Coins.",
      pl: "Ustal, które z czterech miast okradziono, pokonaj złodzieja i zwróć bankierowi Bag with Stolen Gold za 10 Platinum Coins.",
    },
    caveat: {
      pt: "A bolsa precisa ser devolvida antes do próximo Server Save, e o banco da cidade fica fechado até lá.",
      en: "The bag must be handed in before the next server save, and the city's bank stays shut until it is.",
      es: "La bolsa debe entregarse antes del próximo Server Save, y el banco de la ciudad sigue cerrado hasta entonces.",
      pl: "Torbę trzeba oddać przed następnym server save, a bank w mieście jest do tego czasu zamknięty.",
    },
    qualifier: {
      pt: "devolva a Bag with Stolen Gold ao banqueiro",
      en: "return the Bag with Stolen Gold to the banker",
      es: "devuelve la Bag with Stolen Gold al banquero",
      pl: "oddaj Bag with Stolen Gold bankierowi",
    },
    sources: [mwc("Bank_Robbery"), `${WIKI}/Honest_Finder`],
  },
  {
    id: "bank-robbery-goldhunter",
    kind: "achievement",
    subject: "Goldhunter",
    availability: "progressable-today",
    achievement: {
      name: "Goldhunter",
      grade: 1,
      points: 2,
      premium: false,
      requirement: {
        pt: "Devolva 5 Bags with Stolen Gold ao todo",
        en: "Return 5 Bags with Stolen Gold in total",
        es: "Devuelve 5 Bags with Stolen Gold en total",
        pl: "Oddaj łącznie 5 Bags with Stolen Gold",
      },
    },
    trigger: { kind: "mini-world-change", changeId: "bank-robbery" },
    detail: {
      pt: "São 5 bolsas devolvidas ao todo, normalmente uma por roubo. Hoje adianta um passo.",
      en: "Five bags returned in total, normally one per robbery. Today moves it on by one.",
      es: "Cinco bolsas devueltas en total, normalmente una por robo. Hoy avanza un paso.",
      pl: "Łącznie pięć zwróconych toreb, zwykle jedna na napad. Dziś posuwa to o krok.",
    },
    qualifier: {
      pt: "5 bolsas devolvidas ao todo",
      en: "five bags returned in all",
      es: "5 bolsas devueltas en total",
      pl: "łącznie pięć zwróconych toreb",
    },
    sources: [`${WIKI}/Goldhunter`],
  },

  // ══ MINI WORLD CHANGE: River Runs Deep ═════════════════════════════════════
  {
    id: "river-runs-deep-desert-fisher",
    kind: "achievement",
    subject: "Desert Fisher",
    availability: "available-today",
    exclusive: true,
    achievement: {
      name: "Desert Fisher",
      grade: 1,
      points: 1,
      premium: true,
      requirement: {
        pt: "Pesque um Sandfish no rio de Zao",
        en: "Fish a Sandfish in the Zao river",
        es: "Pesca un Sandfish en el río de Zao",
        pl: "Złów Sandfisha w rzece Zao",
      },
    },
    trigger: { kind: "mini-world-change", changeId: "river-runs-deep" },
    detail: {
      pt: "Pesque um Sandfish no rio do Zao Steppe, que só corre enquanto esta mudança durar.",
      en: "Fish a Sandfish out of the Zao Steppe river, which only runs while this change lasts.",
      es: "Pesca un Sandfish en el río de Zao Steppe, que solo corre mientras dure este cambio.",
      pl: "Złów Sandfisha w rzece Zao Steppe, która płynie tylko podczas tej zmiany.",
    },
    caveat: {
      pt: "Pode demorar: vale usar hotkey na Fishing Rod e comer um Northern Fishburger.",
      en: "It can take a while: hotkey the Fishing Rod and eat a Northern Fishburger.",
      es: "Puede tardar: usa hotkey en la Fishing Rod y come un Northern Fishburger.",
      pl: "Może zająć chwilę: ustaw hotkey na Fishing Rod i zjedz Northern Fishburgera.",
    },
    qualifier: {
      pt: "pesque um Sandfish no rio de Zao",
      en: "fish a Sandfish in the Zao river",
      es: "pesca un Sandfish en el río de Zao",
      pl: "złów Sandfisha w rzece Zao",
    },
    sources: [mwc("River_Runs_Deep"), `${WIKI}/Desert_Fisher`],
  },

  // ══ MINI WORLD CHANGE: Lumberjack ══════════════════════════════════════════
  {
    id: "lumberjack-whistle-blower",
    kind: "achievement",
    subject: "Whistle-Blower",
    availability: "available-today",
    achievement: {
      name: "Whistle-Blower",
      grade: 1,
      points: 1,
      premium: false,
      requirement: {
        pt: "Conte a Queen Eloise sobre Chip",
        en: "Tell Queen Eloise about Chip",
        es: "Cuéntale a Queen Eloise sobre Chip",
        pl: "Powiedz Queen Eloise o Chipie",
      },
    },
    trigger: { kind: "mini-world-change", changeId: "lumberjack" },
    detail: {
      pt: "Fale com Chip nos campos ao norte de Carlin primeiro. Sem isso, Queen Eloise só responde \"How would you know?\".",
      en: "Talk to Chip in the fields north of Carlin first. Without that, Queen Eloise just answers \"How would you know?\".",
      es: "Habla primero con Chip en los campos al norte de Carlin. Sin eso, Queen Eloise solo responde \"How would you know?\".",
      pl: "Najpierw pogadaj z Chipem na polach na północ od Carlin. Bez tego Queen Eloise odpowie tylko \"How would you know?\".",
    },
    caveat: {
      pt: "Chip também compra Wood por 50 gp enquanto estiver derrubando as árvores.",
      en: "Chip also buys Wood at 50 gp while he is felling the trees.",
      es: "Chip también compra Wood por 50 gp mientras tala los árboles.",
      pl: "Chip kupuje też Wood po 50 gp, póki ścina drzewa.",
    },
    qualifier: {
      pt: "fale com Chip antes da Queen Eloise",
      en: "talk to Chip before Queen Eloise",
      es: "habla con Chip antes que Queen Eloise",
      pl: "pogadaj z Chipem przed Queen Eloise",
    },
    sources: [mwc("Lumberjack"), `${WIKI}/Whistle-Blower`],
  },

  // ══ MINI WORLD CHANGE: Down the Drain ══════════════════════════════════════
  {
    id: "down-the-drain-achievement",
    kind: "achievement",
    subject: "Down the Drain",
    availability: "available-today",
    exclusive: true,
    achievement: {
      name: "Down the Drain",
      grade: 1,
      points: 2,
      premium: false,
      requirement: {
        pt: "Mate 50 Water Elementals na ilha alagada",
        en: "Kill 50 Water Elementals on the flooded island",
        es: "Mata 50 Water Elementals en la isla inundada",
        pl: "Zabij 50 Water Elementali na zalanej wyspie",
      },
    },
    trigger: { kind: "mini-world-change", changeId: "down-the-drain" },
    detail: {
      pt: "A cheia abre uma ilhota com 11 Water Elementals ao sul do Outlaw Camp; são 50 mortes lá dentro.",
      en: "The flood opens a small island with 11 Water Elementals south of the Outlaw Camp; 50 kills inside are needed.",
      es: "La crecida abre una islita con 11 Water Elementals al sur del Outlaw Camp; hacen falta 50 muertes allí.",
      pl: "Powódź otwiera wysepkę z 11 Water Elementalami na południe od Outlaw Camp; potrzeba tam 50 zabójstw.",
    },
    qualifier: {
      pt: "50 Water Elementals na ilha alagada",
      en: "50 Water Elementals on the flooded island",
      es: "50 Water Elementals en la isla inundada",
      pl: "50 Water Elementali na zalanej wyspie",
    },
    sources: [mwc("Down_the_Drain"), `${WIKI}/Down_the_Drain`],
  },

  // ══ MINI WORLD CHANGE: Beaver Breakout ═════════════════════════════════════
  {
    id: "beaver-breakout-mount",
    kind: "mount",
    subject: "Giant Beaver",
    availability: "available-today",
    exclusive: true,
    trigger: { kind: "mini-world-change", changeId: "beaver-breakout" },
    detail: {
      pt: "Use uma Colourful Water Lily em um Giant Beaver solto em Silvertides; eles refletem qualquer ataque, então não dá para machucá-los.",
      en: "Use a Colourful Water Lily on a loose Giant Beaver at Silvertides; they reflect every attack, so they cannot be hurt.",
      es: "Usa una Colourful Water Lily en un Giant Beaver suelto en Silvertides; reflejan todo ataque, así que no pueden ser heridos.",
      pl: "Użyj Colourful Water Lily na wolnym Giant Beaverze w Silvertides; odbijają każdy atak, więc nie da się ich zranić.",
    },
    achievement: {
      name: "Beaver Away",
      grade: 1,
      points: 1,
      premium: true,
      requirement: {
        pt: "Dome um Giant Beaver",
        en: "Tame a Giant Beaver",
        es: "Doma un Giant Beaver",
        pl: "Oswój Giant Beavera",
      },
    },
    prerequisites: [
      "Star-Crossed Lovers mission of the Within the Tides Quest",
      "A Colourful Water Lily",
    ],
    qualifier: {
      pt: "com uma Colourful Water Lily",
      en: "with a Colourful Water Lily",
      es: "con una Colourful Water Lily",
      pl: "z Colourful Water Lily",
    },
    sources: [`${WIKI}/Beaver_Away`, `${WIKI}/Giant_Beaver_(Mount)`],
  },

  // ══ MINI WORLD CHANGE: Shipwrecked ═════════════════════════════════════════
  {
    id: "shipwrecked-pirate-corsair",
    kind: "bestiary",
    subject: "Pirate Corsair",
    availability: "available-today",
    bestiary: bestiaryProfile("Medium", "Common"),
    trigger: { kind: "mini-world-change", changeId: "shipwrecked" },
    detail: {
      pt: "O naufrágio enche a Krailos Steppe de piratas enquanto durar.",
      en: "The wreck fills the Krailos Steppe with pirates for as long as it lasts.",
      es: "El naufragio llena la Krailos Steppe de piratas mientras dure.",
      pl: "Wrak zapełnia Krailos Steppe piratami, póki trwa.",
    },
    advisory: {
      pt: "A comunidade considera este o melhor respawn de Pirate Corsair do jogo.",
      en: "The community rates this the best Pirate Corsair respawn in the game.",
      es: "La comunidad lo considera el mejor respawn de Pirate Corsair del juego.",
      pl: "Społeczność uważa to za najlepszy respawn Pirate Corsair w grze.",
    },
    sources: [`${WIKI}/Pirate_Corsair`],
  },

  // ══ MINI WORLD CHANGE: Chyllfroest ═════════════════════════════════════════
  {
    id: "chyllfroest-ursagrodon",
    kind: "mount",
    subject: "Ursagrodon",
    availability: "available-today",
    exclusive: true,
    trigger: { kind: "mini-world-change", changeId: "chyllfroest" },
    detail: {
      pt: "Use um Melting Horn três vezes seguidas em um Half-Frozen Ursagrodon; a ilha só é alcançável enquanto a ponte de gelo existir.",
      en: "Use a Melting Horn three times in a row on a Half-Frozen Ursagrodon; the island is only reachable while the ice bridge stands.",
      es: "Usa un Melting Horn tres veces seguidas en un Half-Frozen Ursagrodon; la isla solo es accesible mientras exista el puente de hielo.",
      pl: "Użyj Melting Horna trzy razy pod rząd na Half-Frozen Ursagrodonie; wyspa jest dostępna tylko, póki stoi lodowy most.",
    },
    achievement: {
      name: "Icy Glare",
      grade: 1,
      points: 1,
      premium: true,
      requirement: {
        pt: "Dome um Half-Frozen Ursagrodon",
        en: "Tame a Half-Frozen Ursagrodon",
        es: "Doma un Half-Frozen Ursagrodon",
        pl: "Oswój Half-Frozen Ursagrodona",
      },
    },
    caveat: {
      pt: "O Melting Horn quebra com muita facilidade, leve vários Fireproof Horns e uma Tinder Box.",
      en: "The Melting Horn breaks very easily, bring several Fireproof Horns and a Tinder Box.",
      es: "El Melting Horn se rompe con mucha facilidad, lleva varios Fireproof Horns y una Tinder Box.",
      pl: "Melting Horn pęka bardzo łatwo, weź kilka Fireproof Hornów i Tinder Box.",
    },
    prerequisites: ["A Melting Horn"],
    qualifier: {
      pt: "com um Melting Horn",
      en: "with a Melting Horn",
      es: "con un Melting Horn",
      pl: "z Melting Hornem",
    },
    sources: [mwc("Chyllfroest"), `${WIKI}/Ursagrodon`, `${WIKI}/Icy_Glare`],
  },
  {
    id: "chyllfroest-yeti",
    kind: "bestiary",
    subject: "Yeti",
    availability: "available-today",
    bestiary: bestiaryProfile("Medium", "Very Rare"),
    trigger: { kind: "mini-world-change", changeId: "chyllfroest" },
    detail: {
      pt: "O Yeti aparece de vez em quando na ilha, e cinco mortes fecham a entrada inteira do Bestiary.",
      en: "The occasional Yeti turns up on the island, and five kills close out the whole Bestiary entry.",
      es: "De vez en cuando aparece un Yeti en la isla, y cinco muertes cierran toda la entrada del Bestiary.",
      pl: "Na wyspie czasem pojawia się Yeti, a pięć zabójstw zamyka cały wpis w Bestiary.",
    },
    caveat: {
      pt: "Também há Yetis em Folda, fora desta mudança.",
      en: "Yetis also live in Folda, outside this change.",
      es: "También hay Yetis en Folda, fuera de este cambio.",
      pl: "Yeti żyją też w Foldzie, poza tą zmianą.",
    },
    sources: [mwc("Chyllfroest"), `${WIKI}/Yeti`],
  },

  // ══ MINI WORLD CHANGE: Forsaken Mine (always active, rotating) ═════════════
  {
    id: "forsaken-rorcs",
    kind: "hunting",
    subject: "Forsaken Mine",
    availability: "available-today",
    trigger: { kind: "mini-world-change", changeId: "forsaken", variantIds: ["rorcs"] },
    detail: {
      pt: "A mina rodou para os Rorcs hoje; fora daqui eles só existem nas Rorc Plains.",
      en: "The mine rotated to Rorcs today; outside it they only live on the Rorc Plains.",
      es: "La mina rotó a Rorcs hoy; fuera de aquí solo viven en las Rorc Plains.",
      pl: "Kopalnia przeszła dziś na Rorki; poza nią żyją tylko na Rorc Plains.",
    },
    sources: [`${WIKI}/Forsaken_Mine`],
  },
  {
    id: "forsaken-leaf-golems",
    kind: "hunting",
    subject: "Forsaken Mine",
    availability: "available-today",
    trigger: { kind: "mini-world-change", changeId: "forsaken", variantIds: ["leaf-golems"] },
    detail: {
      pt: "A mina rodou para Forest Furies, Leaf Golems e Wilting Leaf Golems hoje.",
      en: "The mine rotated to Forest Furies, Leaf Golems and Wilting Leaf Golems today.",
      es: "La mina rotó a Forest Furies, Leaf Golems y Wilting Leaf Golems hoy.",
      pl: "Kopalnia przeszła dziś na Forest Furies, Leaf Golemy i Wilting Leaf Golemy.",
    },
    sources: [`${WIKI}/Forsaken_Mine`],
  },
  {
    id: "forsaken-cyclopes",
    kind: "hunting",
    subject: "Forsaken Mine",
    availability: "available-today",
    trigger: { kind: "mini-world-change", changeId: "forsaken", variantIds: ["cyclopes"] },
    detail: {
      pt: "A mina rodou para Cyclopes, Cyclops Drones e Cyclops Smiths hoje.",
      en: "The mine rotated to Cyclopes, Cyclops Drones and Cyclops Smiths today.",
      es: "La mina rotó a Cyclopes, Cyclops Drones y Cyclops Smiths hoy.",
      pl: "Kopalnia przeszła dziś na Cyklopy, Cyclops Drone'y i Cyclops Smithów.",
    },
    sources: [`${WIKI}/Forsaken_Mine`],
  },
  {
    id: "forsaken-lost-dwarves",
    kind: "hunting",
    subject: "Forsaken Mine",
    availability: "available-today",
    trigger: { kind: "mini-world-change", changeId: "forsaken", variantIds: ["lost-dwarves"] },
    detail: {
      pt: "A mina rodou para Drillworms e Lost Dwarves hoje, de longe a rotação mais perigosa das quatro.",
      en: "The mine rotated to Drillworms and Lost Dwarves today, by far the hardest of the four rotations.",
      es: "La mina rotó a Drillworms y Lost Dwarves hoy, con diferencia la rotación más dura de las cuatro.",
      pl: "Kopalnia przeszła dziś na Drillwormy i Lost Dwarves, zdecydowanie najtrudniejsza z czterech rotacji.",
    },
    sources: [`${WIKI}/Forsaken_Mine`],
  },

  // ══ MERCHANT: Yasir (the Oriental Trader Mini World Change) ════════════════
  {
    id: "yasir-si-ariki",
    kind: "achievement",
    subject: "Si, Ariki!",
    availability: "available-today",
    achievement: {
      name: "Si, Ariki!",
      grade: 1,
      points: 1,
      premium: false,
      requirement: {
        pt: "Negocie com Yasir pela primeira vez",
        en: "Trade with Yasir for the first time",
        es: "Comercia con Yasir por primera vez",
        pl: "Handluj z Yasirem po raz pierwszy",
      },
    },
    trigger: { kind: "merchant", merchantId: "yasir" },
    detail: {
      pt: 'Diga "ariki" ou "trade" a Yasir para negociar pela primeira vez.',
      en: 'Say "ariki" or "trade" to Yasir to trade with him for the first time.',
      es: 'Dile "ariki" o "trade" a Yasir para comerciar por primera vez.',
      pl: 'Powiedz Yasirowi "ariki" albo "trade", by pierwszy raz z nim handlować.',
    },
    qualifier: {
      pt: 'diga "ariki" ou "trade" a Yasir',
      en: 'say "ariki" or "trade" to Yasir',
      es: 'dile "ariki" o "trade" a Yasir',
      pl: 'powiedz Yasirowi "ariki" lub "trade"',
    },
    sources: [mwc("Oriental_Trader"), `${WIKI}/Si,_Ariki!`],
  },
  {
    id: "yasir-creature-products",
    kind: "service",
    subject: "Yasir",
    availability: "available-today",
    trigger: { kind: "merchant", merchantId: "yasir" },
    detail: {
      pt: "Ele compra quase todos os Creature Products enquanto o navio estiver ancorado, só em Carlin, Ankrahmun ou Liberty Bay.",
      en: "He buys almost every Creature Product while the ship is anchored, only at Carlin, Ankrahmun or Liberty Bay.",
      es: "Compra casi todos los Creature Products mientras el barco esté anclado, solo en Carlin, Ankrahmun o Liberty Bay.",
      pl: "Kupuje niemal wszystkie Creature Products, póki statek stoi na kotwicy, tylko w Carlin, Ankrahmun lub Liberty Bay.",
    },
    sources: [mwc("Oriental_Trader")],
  },
];

export const OPPORTUNITIES_BY_ID = new Map(
  OPPORTUNITIES.map((definition) => [definition.id, definition]),
);

export type { LocalizedText };
