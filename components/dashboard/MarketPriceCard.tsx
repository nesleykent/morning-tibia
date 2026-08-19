"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trendSymbol } from "@/lib/formatter/briefingModel";
import { formatTimeAgo } from "@/lib/utils/timeAgo";
import { ENTRIES_BY_BASIS, averageOfLastEntries, computeTrendForBasis } from "@/lib/utils/priceTrend";
import type { MarketPrice, MarketPriceId, MarketTrendBasis } from "@/types/market";

interface MarketPriceCardProps {
  prices: Record<string, MarketPrice>;
  basis: MarketTrendBasis;
  onBasisChange: (basis: MarketTrendBasis) => void;
}

const ORDER: MarketPriceId[] = ["tibiaCoinSell", "tibiaCoinBuy", "goldTokenSell", "silverTokenSell"];
const BASIS_OPTIONS: { value: MarketTrendBasis; label: string }[] = [
  { value: "last", label: "Last entry" },
  { value: "avg3", label: "Avg 3 entries" },
  { value: "avg7", label: "Avg 7 entries" },
  { value: "avg14", label: "Avg 14 entries" },
];

/**
 * Fully read-only, same as Rashid's location card — there's no way for a person to know
 * the current market price better than the live feed itself, so unlike Mini World
 * Changes/World Changes (which genuinely need manual input the game doesn't expose), a
 * manual override here could only ever be wrong. The only thing the viewer controls is
 * which window the shown value and trend arrow are computed over.
 */
export function MarketPriceCard({ prices, basis, onBasisChange }: MarketPriceCardProps) {
  // Read once at mount rather than every render (Date.now() is impure) — this is just a
  // cosmetic "how fresh is this price" label, not something that needs to tick live.
  const [now] = useState(() => Date.now());
  const entryCount = ENTRIES_BY_BASIS[basis];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>
              <span aria-hidden="true">🪙</span> Market prices
            </CardTitle>
            <CardDescription>
              Live from{" "}
              <a
                href="https://tibiamarket.top"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-dotted underline-offset-2 hover:text-foreground"
              >
                tibiamarket.top
              </a>
            </CardDescription>
          </div>
          <Select value={basis} onValueChange={(value) => onBasisChange(value as MarketTrendBasis)}>
            <SelectTrigger className="w-32 shrink-0" aria-label="Price and trend based on">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BASIS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {ORDER.map((id) => {
          const price = prices[id];
          if (!price) return null;
          const trend = computeTrendForBasis(price.history, entryCount);
          const displayValue = averageOfLastEntries(price.history, entryCount);
          return (
            <div key={id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label>{price.label}</Label>
                <div className="flex items-center gap-1.5">
                  {price.isLive && price.sourceTimestamp && (
                    <span className="text-[10px] text-muted-foreground">
                      as of {formatTimeAgo(price.sourceTimestamp, now)}
                    </span>
                  )}
                  {price.isLive && (
                    <Badge variant="gold" className="text-[10px]">
                      auto
                    </Badge>
                  )}
                  <span aria-hidden="true">{trendSymbol(trend)}</span>
                </div>
              </div>
              <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm font-medium">
                {displayValue !== null ? `${Math.round(displayValue).toLocaleString()} gp` : "—"}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
