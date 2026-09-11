import type { MarketPriceId } from "@/types/market";

export type BriefingLanguage = "pt" | "en" | "es" | "pl";

export const BRIEFING_LANGUAGES: { value: BriefingLanguage; label: string }[] = [
  { value: "pt", label: "Português" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "pl", label: "Polski" },
];

/**
 * Every word the bulletin says in its own voice.
 *
 * Two rules hold this file together. **Labels are sentence case**, because the bulletin is
 * forwarded to other people and a column of shouted headings reads as machine output — and
 * because upper-casing a Tibia name silently changes it. **Official terms stay in English**:
 * a Brazilian player says "boss boostado", "Charm Points" and "World Change", so translating
 * those is not localization, it is making the text harder to read for the people using it.
 */
export interface BriefingTranslation {
  /** "Bom dia, Ustebra!" — the bulletin greets the world it is about. */
  greeting: (world: string) => string;
  sectionMerchants: string;
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
  /** "Compra"/"Venda" — which side of the market a price is. Capitalised: each one
   * opens its own line under the item rather than sitting mid-sentence. */
  marketOffer: (id: MarketPriceId) => string;
  /** "Em 2 dias" / "Hoje" — how far off a scheduled event is, opening its own line. */
  inDays: (days: number) => string;
  /** Attribution for the market numbers, with their age when one is known. */
  marketSource: (source: string, age: string | null) => string;
  /** A Mini World Change confirmed running, when no narrative sentence is authored. */
  running: string;
  /** A Mini World Change a complete World Board reading proved is not running. */
  notRunning: string;
  /**
   * Nothing of this kind has been checked yet. Deliberately not an instruction: the bulletin
   * is pasted into a guild channel, and telling *those* readers to go and paste a World Board
   * is addressing the wrong person.
   */
  notCheckedToday: string;
  /** Checked via a World Board paste, and none came back active. */
  miniWorldChangesNoneActive: string;
  /**
   * The World Change keywords nobody asked a Guide about. Its own small line so UNKNOWN reads
   * as unknown rather than as "nothing is happening there".
   */
  worldChangesUnchecked: (labels: string[]) => string;
}

const TRANSLATIONS: Record<BriefingLanguage, BriefingTranslation> = {
  pt: {
    greeting: (world) => `Bom dia, ${world}!`,
    sectionMerchants: "COMERCIANTES",
    sectionMarket: "MARKET",
    sectionMiniWorldChanges: "MINI WORLD CHANGES",
    sectionWorldChanges: "WORLD CHANGES",
    sectionNextEvents: "PRÓXIMOS EVENTOS",
    boostedCreature: "Criatura Boostada",
    boostedBoss: "Boss Boostado",
    boostedRegion: "Região Boostada",
    merchantYasir: "Yasir",
    merchantRashid: "Rashid",
    warzoneToday: "Warzones",
    tibiaDrome: "Tibia Drome",
    marketOffer: (id) => (id === "tibiaCoinBuy" ? "Compra" : "Venda"),
    inDays: (days) =>
      days <= 0 ? "Hoje" : days === 1 ? "Amanhã" : `Em ${days} dias`,
    marketSource: (source, age) => (age ? `Preços de ${source}, ${age}.` : `Preços de ${source}.`),
    running: "Está ativa.",
    notRunning: "Não está acontecendo.",
    notCheckedToday: "Não conferido hoje.",
    miniWorldChangesNoneActive: "Nenhuma ativa no momento.",
    worldChangesUnchecked: (labels) => `Ainda sem resposta do Guide: ${labels.join(", ")}.`,
  },
  en: {
    greeting: (world) => `Good morning, ${world}!`,
    sectionMerchants: "MERCHANTS",
    sectionMarket: "MARKET",
    sectionMiniWorldChanges: "MINI WORLD CHANGES",
    sectionWorldChanges: "WORLD CHANGES",
    sectionNextEvents: "NEXT EVENTS",
    boostedCreature: "Boosted Creature",
    boostedBoss: "Boosted Boss",
    boostedRegion: "Boosted Region",
    merchantYasir: "Yasir",
    merchantRashid: "Rashid",
    warzoneToday: "Warzones",
    tibiaDrome: "Tibia Drome",
    marketOffer: (id) => (id === "tibiaCoinBuy" ? "Buy" : "Sell"),
    inDays: (days) => (days <= 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`),
    marketSource: (source, age) => (age ? `Prices from ${source}, ${age}.` : `Prices from ${source}.`),
    running: "Running.",
    notRunning: "Not running.",
    notCheckedToday: "Not checked today.",
    miniWorldChangesNoneActive: "None running right now.",
    worldChangesUnchecked: (labels) => `Still unasked: ${labels.join(", ")}.`,
  },
  es: {
    greeting: (world) => `¡Buenos días, ${world}!`,
    sectionMerchants: "COMERCIANTES",
    sectionMarket: "MARKET",
    sectionMiniWorldChanges: "MINI WORLD CHANGES",
    sectionWorldChanges: "WORLD CHANGES",
    sectionNextEvents: "PRÓXIMOS EVENTOS",
    boostedCreature: "Criatura Boosteada",
    boostedBoss: "Boss Boosteado",
    boostedRegion: "Región Boosteada",
    merchantYasir: "Yasir",
    merchantRashid: "Rashid",
    warzoneToday: "Warzones",
    tibiaDrome: "Tibia Drome",
    marketOffer: (id) => (id === "tibiaCoinBuy" ? "Compra" : "Venta"),
    inDays: (days) => (days <= 0 ? "Hoy" : days === 1 ? "Mañana" : `En ${days} días`),
    marketSource: (source, age) => (age ? `Precios de ${source}, ${age}.` : `Precios de ${source}.`),
    running: "Está activa.",
    notRunning: "No está ocurriendo.",
    notCheckedToday: "Sin comprobar hoy.",
    miniWorldChangesNoneActive: "Ninguna activa ahora mismo.",
    worldChangesUnchecked: (labels) => `Aún sin preguntar al Guide: ${labels.join(", ")}.`,
  },
  pl: {
    greeting: (world) => `Dzień dobry, ${world}!`,
    sectionMerchants: "KUPCY",
    sectionMarket: "MARKET",
    sectionMiniWorldChanges: "MINI WORLD CHANGES",
    sectionWorldChanges: "WORLD CHANGES",
    sectionNextEvents: "NADCHODZĄCE WYDARZENIA",
    boostedCreature: "Boostowane Stworzenie",
    boostedBoss: "Boostowany Boss",
    boostedRegion: "Boostowany Region",
    merchantYasir: "Yasir",
    merchantRashid: "Rashid",
    warzoneToday: "Warzones",
    tibiaDrome: "Tibia Drome",
    marketOffer: (id) => (id === "tibiaCoinBuy" ? "Kupno" : "Sprzedaż"),
    inDays: (days) => (days <= 0 ? "Dziś" : days === 1 ? "Jutro" : `Za ${days} dni`),
    marketSource: (source, age) => (age ? `Ceny z ${source}, ${age}.` : `Ceny z ${source}.`),
    running: "Aktywna.",
    notRunning: "Nieaktywna.",
    notCheckedToday: "Dziś niesprawdzone.",
    miniWorldChangesNoneActive: "Żadna nie jest teraz aktywna.",
    worldChangesUnchecked: (labels) => `Wciąż bez odpowiedzi Guide'a: ${labels.join(", ")}.`,
  },
};

export function getTranslation(language: BriefingLanguage): BriefingTranslation {
  return TRANSLATIONS[language];
}
