"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trendSymbol } from "@/lib/formatter/briefingModel";
import { formatTimeAgo } from "@/lib/utils/timeAgo";
import type { MarketPrice, MarketPriceId } from "@/types/market";

interface MarketPriceCardProps {
  prices: Record<string, MarketPrice>;
  onChange: (id: MarketPriceId, value: number | null) => void;
}

const ORDER: MarketPriceId[] = ["tibiaCoinSell", "tibiaCoinBuy", "goldTokenSell", "silverTokenSell"];

export function MarketPriceCard({ prices, onChange }: MarketPriceCardProps) {
  // Read once at mount rather than every render (Date.now() is impure) — this is just a
  // cosmetic "how fresh is this price" label, not something that needs to tick live.
  const [now] = useState(() => Date.now());

  return (
    <Card>
      <CardHeader>
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
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {ORDER.map((id) => {
          const price = prices[id];
          if (!price) return null;
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
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
