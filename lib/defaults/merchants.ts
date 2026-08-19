import type { Merchant } from "@/types/merchant";
import { getRashidLocation } from "@/lib/rashid/rashidRotation";

/**
 * Yasir's location is the "Oriental Trader" Mini World Change: when active, he's docked
 * at exactly one of these 3 cities — no others (confirmed against TibiaWiki's Yasir
 * article). Unlike Rashid's fixed weekday rotation, there's no way to compute which one
 * without reading the World Board, so this stays a closed pick list rather than free text.
 */
export const YASIR_CITIES = ["Carlin", "Liberty Bay", "Ankrahmun"] as const;

export function createDefaultMerchants(referenceDate: Date): Record<string, Merchant> {
  return {
    yasir: {
      id: "yasir",
      name: "Yasir",
      location: "",
      isComputed: false,
      updatedAt: null,
      activityState: "not-verified",
    },
    rashid: {
      id: "rashid",
      name: "Rashid",
      location: getRashidLocation(referenceDate),
      isComputed: true,
      updatedAt: null,
      // Rashid's location is always fully and deterministically known — see
      // lib/rashid/rashidRotation.ts — so he's never "not-verified"/"pending"/"inactive".
      activityState: "location-known",
    },
  };
}
