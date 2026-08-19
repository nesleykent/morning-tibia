import type { MarketPrice, MarketPriceId } from "@/types/market";

// Literal market-order terminology, matching api.tibiamarket.top's own sellOffer/buyOffer
// fields exactly — a "sell offer" is gold offered in exchange for the item (what you pay
// to buy it), a "buy offer" is gold offered to acquire the item (what you receive selling
// it). No "player perspective" renaming — see hooks/useBriefingState.ts's live-merge effect.
const LABELS: Record<MarketPriceId, string> = {
  tibiaCoinSell: "Tibia Coin Sell Offer",
  tibiaCoinBuy: "Tibia Coin Buy Offer",
  goldTokenSell: "Gold Token Sell Offer",
  silverTokenSell: "Silver Token Sell Offer",
};

export function createDefaultMarketPrices(): Record<string, MarketPrice> {
  const prices: Record<string, MarketPrice> = {};
  for (const id of Object.keys(LABELS) as MarketPriceId[]) {
    prices[id] = {
      id,
      label: LABELS[id],
      value: null,
      isLive: false,
      sourceTimestamp: null,
      updatedAt: null,
      history: [],
    };
  }
  return prices;
}
