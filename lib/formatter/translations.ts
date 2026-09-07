export type BriefingLanguage = "pt" | "en" | "es" | "pl";

export const BRIEFING_LANGUAGES: { value: BriefingLanguage; label: string }[] = [
  { value: "pt", label: "Português" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "pl", label: "Polski" },
];

export interface BriefingTranslation {
  greeting: (world: string) => string;
  sectionStatus: string;
  sectionMarket: string;
  sectionMiniWorldChanges: string;
  sectionWorldChanges: string;
  sectionNextEvents: string;
  boostedCreature: string;
  boostedBoss: string;
  boostedRegion: string;
  merchantYasir: string;
  merchantRashid: string;
  warzoneToday: string;
  tibiaDrome: string;
  /** A Mini World Change confirmed running, when no narrative sentence is authored. */
  running: string;
  /** A Mini World Change a complete World Board reading proved is not running. */
  notRunning: string;
  /** Nothing has been checked this session — every entry is still "unknown". */
  miniWorldChangesNotVerified: string;
  /** At least one entry was checked (via a World Board paste), and none came back active. */
  miniWorldChangesNoneActive: string;
  /** Nothing has been checked via a Guide NPC this session — every entry is still "unknown". */
  worldChangesNotVerified: string;
  /** Heading for the achievement chances today's confirmed conditions create. */
  sectionOpportunities: string;
  /** Connector for "<Achievement> — thanks to <condition>". Keeps the briefing localized
   * without translating ~26 achievement task descriptions into four languages. */
  opportunityBecause: (condition: string) => string;
  noWorldChanges: string;
  noActiveEvents: string;
  noUpcomingEvents: string;
}

const TRANSLATIONS: Record<BriefingLanguage, BriefingTranslation> = {
  pt: {
    greeting: (world) => `Bom dia, ${world}!`,
    sectionStatus: "EVENTOS ATIVOS E STATUS DO DIA",
    sectionMarket: "COMERCIANTES E CÂMBIO DO DIA",
    sectionMiniWorldChanges: "MINI WORLD CHANGES",
    sectionWorldChanges: "WORLD CHANGES",
    sectionNextEvents: "PRÓXIMOS EVENTOS",
    boostedCreature: "CRIATURA BOOSTADA",
    boostedBoss: "BOSS BOOSTADO",
    boostedRegion: "Região boostada",
    merchantYasir: "YASIR",
    merchantRashid: "RASHID",
    warzoneToday: "WARZONES",
    tibiaDrome: "TIBIA DROME",
    running: "Ativa.",
    notRunning: "Não está acontecendo.",
    miniWorldChangesNotVerified: "Nenhuma Mini World Change foi verificada ainda hoje — cole o texto do World Board para conferir.",
    miniWorldChangesNoneActive: "World Board conferido — nenhuma Mini World Change ativa no momento.",
    worldChangesNotVerified: "Nenhuma World Change foi consultada ainda hoje — pergunte a um Guide NPC para conferir.",
    sectionOpportunities: "Oportunidades de hoje",
    opportunityBecause: (condition) => `graças a ${condition}`,
    noWorldChanges: "Nenhuma World Change ativa identificada hoje.",
    noActiveEvents: "Nenhum evento ativo no momento.",
    noUpcomingEvents: "Nenhum evento programado no momento.",
  },
  en: {
    greeting: (world) => `Good morning, ${world}!`,
    sectionStatus: "TODAY'S ACTIVE EVENTS & STATUS",
    sectionMarket: "MERCHANTS & DAILY EXCHANGE",
    sectionMiniWorldChanges: "MINI WORLD CHANGES",
    sectionWorldChanges: "WORLD CHANGES",
    sectionNextEvents: "NEXT EVENTS",
    boostedCreature: "BOOSTED CREATURE",
    boostedBoss: "BOOSTED BOSS",
    boostedRegion: "Boosted region",
    merchantYasir: "YASIR",
    merchantRashid: "RASHID",
    warzoneToday: "WARZONES",
    tibiaDrome: "TIBIA DROME",
    running: "Running.",
    notRunning: "Not running.",
    miniWorldChangesNotVerified: "No Mini World Changes have been checked yet today — paste the World Board text to check them.",
    miniWorldChangesNoneActive: "World Board checked — no Mini World Changes are active right now.",
    worldChangesNotVerified: "No World Changes have been checked yet today — ask a Guide NPC to check them.",
    sectionOpportunities: "Today's opportunities",
    opportunityBecause: (condition) => `thanks to ${condition}`,
    noWorldChanges: "No active World Changes identified today.",
    noActiveEvents: "No active events right now.",
    noUpcomingEvents: "No events scheduled right now.",
  },
  es: {
    greeting: (world) => `¡Buenos días, ${world}!`,
    sectionStatus: "EVENTOS ACTIVOS Y ESTADO DEL DÍA",
    sectionMarket: "COMERCIANTES Y CAMBIO DEL DÍA",
    sectionMiniWorldChanges: "MINI WORLD CHANGES",
    sectionWorldChanges: "WORLD CHANGES",
    sectionNextEvents: "PRÓXIMOS EVENTOS",
    boostedCreature: "CRIATURA POTENCIADA",
    boostedBoss: "JEFE POTENCIADO",
    boostedRegion: "Región potenciada",
    merchantYasir: "YASIR",
    merchantRashid: "RASHID",
    warzoneToday: "WARZONES",
    tibiaDrome: "TIBIA DROME",
    running: "Activa.",
    notRunning: "No está ocurriendo.",
    miniWorldChangesNotVerified: "Aún no se verificó ninguna Mini World Change hoy — pega el texto del World Board para comprobarlas.",
    miniWorldChangesNoneActive: "World Board revisado — ninguna Mini World Change está activa en este momento.",
    worldChangesNotVerified: "Aún no se consultó ninguna World Change hoy — pregúntale a un Guide NPC para comprobarlas.",
    sectionOpportunities: "Oportunidades de hoy",
    opportunityBecause: (condition) => `gracias a ${condition}`,
    noWorldChanges: "No se identificaron World Changes activas hoy.",
    noActiveEvents: "No hay eventos activos ahora mismo.",
    noUpcomingEvents: "No hay eventos programados por ahora.",
  },
  pl: {
    greeting: (world) => `Dzień dobry, ${world}!`,
    sectionStatus: "AKTYWNE WYDARZENIA I STATUS DNIA",
    sectionMarket: "KUPCY I KURS DNIA",
    sectionMiniWorldChanges: "MINI WORLD CHANGES",
    sectionWorldChanges: "WORLD CHANGES",
    sectionNextEvents: "NADCHODZĄCE WYDARZENIA",
    boostedCreature: "WZMOCNIONE STWORZENIE",
    boostedBoss: "WZMOCNIONY BOSS",
    boostedRegion: "Wzmocniony region",
    merchantYasir: "YASIR",
    merchantRashid: "RASHID",
    warzoneToday: "WARZONES",
    tibiaDrome: "TIBIA DROME",
    running: "Aktywna.",
    notRunning: "Nieaktywna.",
    miniWorldChangesNotVerified: "Żadna Mini World Change nie została dziś jeszcze sprawdzona — wklej tekst z World Board, aby to zrobić.",
    miniWorldChangesNoneActive: "Sprawdzono World Board — obecnie żadna Mini World Change nie jest aktywna.",
    worldChangesNotVerified: "Żadna World Change nie została dziś jeszcze sprawdzona — zapytaj Guide NPC, aby to zrobić.",
    sectionOpportunities: "Dzisiejsze okazje",
    opportunityBecause: (condition) => `dzięki ${condition}`,
    noWorldChanges: "Dziś nie zidentyfikowano żadnych aktywnych World Changes.",
    noActiveEvents: "Obecnie brak aktywnych wydarzeń.",
    noUpcomingEvents: "Obecnie brak zaplanowanych wydarzeń.",
  },
};

export function getTranslation(language: BriefingLanguage): BriefingTranslation {
  return TRANSLATIONS[language];
}
