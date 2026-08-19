export type MerchantId = "yasir" | "rashid";

/**
 * Only meaningful for a merchant whose presence is evidence-based (Yasir, via the
 * "Oriental Trader" Mini World Change on the World Board) rather than deterministically
 * computed (Rashid, whose weekday rotation is always fully known — see
 * lib/rashid/rashidRotation.ts — so he's always "location-known").
 *
 * - "not-verified": no board evidence has been recorded yet this session/day.
 * - "inactive": a complete board reading was recognized and didn't mention this merchant.
 * - "pending-location": the board confirms the merchant is active, but not which city.
 * - "location-known": the exact city is known (picked by the user, or from the board).
 */
export type MerchantActivityState = "not-verified" | "inactive" | "pending-location" | "location-known";

export interface Merchant {
  id: MerchantId;
  name: string;
  location: string;
  /** True when the location was computed from a known rotation rather than typed by the user. */
  isComputed: boolean;
  updatedAt: string | null;
  activityState: MerchantActivityState;
}
