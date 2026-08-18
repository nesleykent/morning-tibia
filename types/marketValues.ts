/** One item's live market snapshot from api.tibiamarket.top. */
export interface MarketValueSnapshot {
  itemId: number;
  buyOffer: number | null;
  sellOffer: number | null;
  /** When this snapshot was captured, ms since epoch. */
  time: number;
}
