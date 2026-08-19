"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trendSymbol } from "@/lib/formatter/briefingModel";
import { formatTimeAgo } from "@/lib/utils/timeAgo";
import { averageOverDays } from "@/lib/utils/priceTrend";
import type { MarketPrice, MarketPriceId } from "@/types/market";

interface MarketPriceCardProps {
  prices: Record<string, MarketPrice>;
  onChange: (id: MarketPriceId, value: number | null) => void;
}

const ORDER: MarketPriceId[] = ["tibiaCoinSell", "tibiaCoinBuy", "goldTokenSell", "silverTokenSell"];
const AVERAGE_WINDOW_OPTIONS = [3, 7, 14] as const;

export function MarketPriceCard({ prices, onChange }: MarketPriceCardProps) {
  // Read once at mount rather than every render (Date.now() is impure) — this is just a
  // cosmetic "how fresh is this price" label, not something that needs to tick live.
  const [now] = useState(() => Date.now());
  const [averageWindowDays, setAverageWindowDays] = useState<number>(7);

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
          <Select value={String(averageWindowDays)} onValueChange={(value) => setAverageWindowDays(Number(value))}>
            <SelectTrigger className="w-28 shrink-0" aria-label="Average over how many days">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVERAGE_WINDOW_OPTIONS.map((days) => (
                <SelectItem key={days} value={String(days)}>
                  Avg {days}d
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
          const average = averageOverDays(price.history, averageWindowDays, now);
          const cutoff = now - averageWindowDays * 86400000;
          const entryCount = price.history.filter((entry) => entry.timestamp >= cutoff).length;
          return (
            <div key={id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor={`price-${id}`}>{price.label}</Label>
                <div className="flex items-center gap-1.5">
                  {price.isLive && price.sourceTimestamp && (
                    <span className="text-[10px] text-muted-foreground">
                      {formatTimeAgo(price.sourceTimestamp, now)}
                    </span>
                  )}
                  {price.isLive && (
                    <Badge variant="gold" className="text-[10px]">
                      live
                    </Badge>
                  )}
                  <span aria-hidden="true">{trendSymbol(price.trend)}</span>
                </div>
              </div>
              <Input
                id={`price-${id}`}
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="gp"
                value={price.value ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  onChange(id, raw === "" ? null : Number(raw));
                }}
              />
              {average !== null && (
                <p className="text-[11px] text-muted-foreground">
                  Avg ({averageWindowDays}d, {entryCount} {entryCount === 1 ? "entry" : "entries"}):{" "}
                  {Math.round(average).toLocaleString()} gp
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
