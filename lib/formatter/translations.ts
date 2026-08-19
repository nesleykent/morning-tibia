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
  sectionAchievements: string;
  sectionWorldChanges: string;
  sectionNextEvents: string;
  boostedCreature: string;
  boostedBoss: string;
  boostedRegion: string;
  merchantYasir: string;
  merchantRashid: string;
  warzoneToday: string;
  tibiaDrome: string;
  stageOrdinal: (n: 1 | 2 | 3) => string;
  noAchievements: string;
  noWorldChanges: string;
  noActiveEvents: string;
  noUpcomingEvents: string;
}

const TRANSLATIONS: Record<BriefingLanguage, BriefingTranslation> = {
  pt: {
    greeting: (world) => `Bom dia, ${world}!`,
    sectionStatus: "EVENTOS ATIVOS E STATUS DO DIA",
    sectionMarket: "COMERCIANTES E CÂMBIO DO DIA",
    sectionAchievements: "ACHIEVEMENTS E BOSSES",
    sectionWorldChanges: "WORLD CHANGES",
    sectionNextEvents: "PRÓXIMOS EVENTOS",
    boostedCreature: "CRIATURA BOOSTADA",
    boostedBoss: "BOSS BOOSTADO",
    boostedRegion: "Região boostada",
    merchantYasir: "YASIR",
    merchantRashid: "RASHID",
    warzoneToday: "WARZONES",
    tibiaDrome: "TIBIA DROME",
    stageOrdinal: (n) => `${n}º Estágio`,
    noAchievements: "Nenhuma mudança ativa identificada hoje.",
    noWorldChanges: "Nenhuma World Change ativa identificada hoje.",
    noActiveEvents: "Nenhum evento ativo no momento.",
    noUpcomingEvents: "Nenhum evento programado no momento.",
  },
  en: {
    greeting: (world) => `Good morning, ${world}!`,
    sectionStatus: "TODAY'S ACTIVE EVENTS & STATUS",
    sectionMarket: "MERCHANTS & DAILY EXCHANGE",
    sectionAchievements: "ACHIEVEMENTS & BOSSES",
    sectionWorldChanges: "WORLD CHANGES",
    sectionNextEvents: "NEXT EVENTS",
    boostedCreature: "BOOSTED CREATURE",
    boostedBoss: "BOOSTED BOSS",
    boostedRegion: "Boosted region",
    merchantYasir: "YASIR",
    merchantRashid: "RASHID",
    warzoneToday: "WARZONES",
    tibiaDrome: "TIBIA DROME",
    stageOrdinal: (n) => `Stage ${n}`,
    noAchievements: "No active changes identified today.",
    noWorldChanges: "No active World Changes identified today.",
    noActiveEvents: "No active events right now.",
    noUpcomingEvents: "No events scheduled right now.",
  },
  es: {
    greeting: (world) => `¡Buenos días, ${world}!`,
    sectionStatus: "EVENTOS ACTIVOS Y ESTADO DEL DÍA",
    sectionMarket: "COMERCIANTES Y CAMBIO DEL DÍA",
    sectionAchievements: "LOGROS Y JEFES",
    sectionWorldChanges: "WORLD CHANGES",
    sectionNextEvents: "PRÓXIMOS EVENTOS",
    boostedCreature: "CRIATURA POTENCIADA",
    boostedBoss: "JEFE POTENCIADO",
    boostedRegion: "Región potenciada",
    merchantYasir: "YASIR",
    merchantRashid: "RASHID",
    warzoneToday: "WARZONES",
    tibiaDrome: "TIBIA DROME",
    stageOrdinal: (n) => `Etapa ${n}`,
    noAchievements: "No se identificaron cambios activos hoy.",
    noWorldChanges: "No se identificaron World Changes activas hoy.",
    noActiveEvents: "No hay eventos activos ahora mismo.",
    noUpcomingEvents: "No hay eventos programados por ahora.",
  },
  pl: {
    greeting: (world) => `Dzień dobry, ${world}!`,
    sectionStatus: "AKTYWNE WYDARZENIA I STATUS DNIA",
    sectionMarket: "KUPCY I KURS DNIA",
    sectionAchievements: "OSIĄGNIĘCIA I BOSSOWIE",
    sectionWorldChanges: "WORLD CHANGES",
    sectionNextEvents: "NADCHODZĄCE WYDARZENIA",
    boostedCreature: "WZMOCNIONE STWORZENIE",
    boostedBoss: "WZMOCNIONY BOSS",
    boostedRegion: "Wzmocniony region",
    merchantYasir: "YASIR",
    merchantRashid: "RASHID",
    warzoneToday: "WARZONES",
    tibiaDrome: "TIBIA DROME",
    stageOrdinal: (n) => `Etap ${n}`,
    noAchievements: "Dziś nie zidentyfikowano żadnych aktywnych zmian.",
    noWorldChanges: "Dziś nie zidentyfikowano żadnych aktywnych World Changes.",
    noActiveEvents: "Obecnie brak aktywnych wydarzeń.",
    noUpcomingEvents: "Obecnie brak zaplanowanych wydarzeń.",
  },
};

export function getTranslation(language: BriefingLanguage): BriefingTranslation {
  return TRANSLATIONS[language];
}
