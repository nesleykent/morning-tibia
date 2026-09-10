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
  sectionMerchants: string;
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
  /** "compra"/"venda" — which side of the market a price is. */
  marketOffer: (id: MarketPriceId) => string;
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
    sectionMerchants: "COMERCIANTES",
    sectionMiniWorldChanges: "MINI WORLD CHANGES",
    sectionWorldChanges: "WORLD CHANGES",
    sectionNextEvents: "PRÓXIMOS EVENTOS",
    boostedCreature: "Criatura",
    boostedBoss: "Boss",
    boostedRegion: "Região",
    merchantYasir: "Yasir",
    merchantRashid: "Rashid",
    warzoneToday: "Warzones",
    tibiaDrome: "Drome",
    marketOffer: (id) => (id === "tibiaCoinBuy" ? "compra" : "venda"),
    marketSource: (source, age) => (age ? `Preços de ${source}, ${age}.` : `Preços de ${source}.`),
    running: "Está ativa.",
    notRunning: "Não está acontecendo.",
    notCheckedToday: "Não conferido hoje.",
    miniWorldChangesNoneActive: "Nenhuma ativa no momento.",
    worldChangesUnchecked: (labels) => `Ainda sem resposta do Guide: ${labels.join(", ")}.`,
  },
  en: {
    sectionMerchants: "MERCHANTS",
    sectionMiniWorldChanges: "MINI WORLD CHANGES",
    sectionWorldChanges: "WORLD CHANGES",
    sectionNextEvents: "NEXT EVENTS",
    boostedCreature: "Creature",
    boostedBoss: "Boss",
    boostedRegion: "Region",
    merchantYasir: "Yasir",
    merchantRashid: "Rashid",
    warzoneToday: "Warzones",
    tibiaDrome: "Drome",
    marketOffer: (id) => (id === "tibiaCoinBuy" ? "buy" : "sell"),
    marketSource: (source, age) => (age ? `Prices from ${source}, ${age}.` : `Prices from ${source}.`),
    running: "Running.",
    notRunning: "Not running.",
    notCheckedToday: "Not checked today.",
    miniWorldChangesNoneActive: "None running right now.",
    worldChangesUnchecked: (labels) => `Still unasked: ${labels.join(", ")}.`,
  },
  es: {
    sectionMerchants: "COMERCIANTES",
    sectionMiniWorldChanges: "MINI WORLD CHANGES",
    sectionWorldChanges: "WORLD CHANGES",
    sectionNextEvents: "PRÓXIMOS EVENTOS",
    boostedCreature: "Criatura",
    boostedBoss: "Boss",
    boostedRegion: "Región",
    merchantYasir: "Yasir",
    merchantRashid: "Rashid",
    warzoneToday: "Warzones",
    tibiaDrome: "Drome",
    marketOffer: (id) => (id === "tibiaCoinBuy" ? "compra" : "venta"),
    marketSource: (source, age) => (age ? `Precios de ${source}, ${age}.` : `Precios de ${source}.`),
    running: "Está activa.",
    notRunning: "No está ocurriendo.",
    notCheckedToday: "Sin comprobar hoy.",
    miniWorldChangesNoneActive: "Ninguna activa ahora mismo.",
    worldChangesUnchecked: (labels) => `Aún sin preguntar al Guide: ${labels.join(", ")}.`,
  },
  pl: {
    sectionMerchants: "KUPCY",
    sectionMiniWorldChanges: "MINI WORLD CHANGES",
    sectionWorldChanges: "WORLD CHANGES",
    sectionNextEvents: "NADCHODZĄCE WYDARZENIA",
    boostedCreature: "Stworzenie",
    boostedBoss: "Boss",
    boostedRegion: "Region",
    merchantYasir: "Yasir",
    merchantRashid: "Rashid",
    warzoneToday: "Warzones",
    tibiaDrome: "Drome",
    marketOffer: (id) => (id === "tibiaCoinBuy" ? "kupno" : "sprzedaż"),
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
