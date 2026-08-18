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
  sectionNextEvents: string;
  boostedCreature: string;
  boostedBoss: string;
  boostedRegion: string;
  warzoneToday: string;
  tibiaDrome: string;
  stageOrdinal: (n: 1 | 2 | 3) => string;
  noAchievements: string;
  noUpcomingEvents: string;
}

const TRANSLATIONS: Record<BriefingLanguage, BriefingTranslation> = {
  pt: {
    greeting: (world) => `🌞Bom dia ${world}!`,
    sectionStatus: "EVENTOS ATIVOS E STATUS DO DIA",
    sectionMarket: "COMERCIANTES E CÂMBIO DO DIA",
    sectionAchievements: "ACHIEVEMENTS E BOSSES",
    sectionNextEvents: "NEXT EVENTOS",
    boostedCreature: "CRIATURA BOOSTADA",
    boostedBoss: "BOSS BOOSTADO",
    boostedRegion: "Região boostada",
    warzoneToday: "Warzone hoje",
    tibiaDrome: "Tibia Drome",
    stageOrdinal: (n) => `${n}º Estágio`,
    noAchievements: "Nenhuma mudança registrada hoje.",
    noUpcomingEvents: "Nenhum evento programado no momento.",
  },
  en: {
    greeting: (world) => `🌞Good morning ${world}!`,
    sectionStatus: "TODAY'S ACTIVE EVENTS & STATUS",
    sectionMarket: "MERCHANTS & DAILY EXCHANGE",
    sectionAchievements: "ACHIEVEMENTS & BOSSES",
    sectionNextEvents: "NEXT EVENTS",
    boostedCreature: "BOOSTED CREATURE",
    boostedBoss: "BOOSTED BOSS",
    boostedRegion: "Boosted region",
    warzoneToday: "Warzone today",
    tibiaDrome: "Tibia Drome",
    stageOrdinal: (n) => `Stage ${n}`,
    noAchievements: "No changes recorded today.",
    noUpcomingEvents: "No events scheduled right now.",
  },
  es: {
    greeting: (world) => `🌞¡Buenos días ${world}!`,
    sectionStatus: "EVENTOS ACTIVOS Y ESTADO DEL DÍA",
    sectionMarket: "COMERCIANTES Y CAMBIO DEL DÍA",
    sectionAchievements: "LOGROS Y JEFES",
    sectionNextEvents: "PRÓXIMOS EVENTOS",
    boostedCreature: "CRIATURA POTENCIADA",
    boostedBoss: "JEFE POTENCIADO",
    boostedRegion: "Región potenciada",
    warzoneToday: "Warzone de hoy",
    tibiaDrome: "Tibia Drome",
    stageOrdinal: (n) => `Etapa ${n}`,
    noAchievements: "No se registraron cambios hoy.",
    noUpcomingEvents: "No hay eventos programados por ahora.",
  },
  pl: {
    greeting: (world) => `🌞Dzień dobry ${world}!`,
    sectionStatus: "AKTYWNE WYDARZENIA I STATUS DNIA",
    sectionMarket: "KUPCY I KURS DNIA",
    sectionAchievements: "OSIĄGNIĘCIA I BOSSOWIE",
    sectionNextEvents: "NADCHODZĄCE WYDARZENIA",
    boostedCreature: "WZMOCNIONE STWORZENIE",
    boostedBoss: "WZMOCNIONY BOSS",
    boostedRegion: "Wzmocniony region",
    warzoneToday: "Warzone dzisiaj",
    tibiaDrome: "Tibia Drome",
    stageOrdinal: (n) => `Etap ${n}`,
    noAchievements: "Dziś nie odnotowano żadnych zmian.",
    noUpcomingEvents: "Obecnie brak zaplanowanych wydarzeń.",
  },
};

export function getTranslation(language: BriefingLanguage): BriefingTranslation {
  return TRANSLATIONS[language];
}
