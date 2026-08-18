export type MerchantId = "yasir" | "rashid";

export interface Merchant {
  id: MerchantId;
  name: string;
  location: string;
  /** True when the location was computed from a known rotation rather than typed by the user. */
  isComputed: boolean;
  updatedAt: string | null;
}
