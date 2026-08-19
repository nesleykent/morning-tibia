import type { MarketPrice, MarketPriceId } from "@/types/market";

const LABELS: Record<MarketPriceId, string> = {
  tibiaCoinSell: "Tibia Coins (Sell)",
  tibiaCoinBuy: "Tibia Coins (Buy)",
  goldTokenSell: "Gold Token (Sell)",
  silverTokenSell: "Silver Token (Sell)",
};

export function createDefaultMarketPrices(): Record<string, MarketPrice> {
  const prices: Record<string, MarketPrice> = {};
  for (const id of Object.keys(LABELS) as MarketPriceId[]) {
    prices[id] = {
      id,
      label: LABELS[id],
      value: null,
      trend: "unchanged",
      isLive: false,
      sourceTimestamp: null,
      updatedAt: null,
      history: [],
    };
  }
  return prices;
}
