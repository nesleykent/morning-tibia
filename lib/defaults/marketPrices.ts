import type { MarketPrice, MarketPriceId } from "@/types/market";

const LABELS: Record<MarketPriceId, string> = {
  tibiaCoinSell: "Tibia Coin — sell",
  tibiaCoinBuy: "Tibia Coin — buy",
  goldTokenSell: "Gold Token — sell",
  silverTokenSell: "Silver Token — sell",
};

export function createDefaultMarketPrices(): Record<string, MarketPrice> {
  const prices: Record<string, MarketPrice> = {};
  for (const id of Object.keys(LABELS) as MarketPriceId[]) {
    prices[id] = {
      id,
      label: LABELS[id],
      value: null,
      previousValue: null,
      trend: "unchanged",
      isLive: false,
      sourceTimestamp: null,
      updatedAt: null,
    };
  }
  return prices;
}
