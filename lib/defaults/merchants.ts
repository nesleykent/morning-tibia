import type { Merchant } from "@/types/merchant";
import { getRashidLocation } from "@/lib/rashid/rashidRotation";

export function createDefaultMerchants(referenceDate: Date): Record<string, Merchant> {
  return {
    yasir: {
      id: "yasir",
      name: "Yasir",
      location: "",
      isComputed: false,
      updatedAt: null,
    },
    rashid: {
      id: "rashid",
      name: "Rashid",
      location: getRashidLocation(referenceDate),
      isComputed: true,
      updatedAt: null,
    },
  };
}
