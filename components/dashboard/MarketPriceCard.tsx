"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trendSymbol } from "@/lib/formatter/briefingModel";
import type { MarketPrice, MarketPriceId } from "@/types/market";

interface MarketPriceCardProps {
  prices: Record<string, MarketPrice>;
  onChange: (id: MarketPriceId, value: number | null) => void;
}

const ORDER: MarketPriceId[] = ["tibiaCoinSell", "tibiaCoinBuy", "goldTokenSell", "silverTokenSell"];

export function MarketPriceCard({ prices, onChange }: MarketPriceCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span aria-hidden="true">🪙</span> Market prices
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {ORDER.map((id) => {
          const price = prices[id];
          if (!price) return null;
          return (
            <div key={id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor={`price-${id}`}>{price.label}</Label>
                <div className="flex items-center gap-1">
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
