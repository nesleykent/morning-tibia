"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRashidRotationCities } from "@/lib/rashid/rashidRotation";
import { YASIR_CITIES } from "@/lib/defaults/merchants";
import type { Merchant, MerchantId } from "@/types/merchant";

interface MerchantCardProps {
  merchants: Record<string, Merchant>;
  onChange: (id: MerchantId, patch: Partial<Merchant>) => void;
}

const RASHID_CITIES = getRashidRotationCities();

export function MerchantCard({ merchants, onChange }: MerchantCardProps) {
  const yasir = merchants.yasir;
  const rashid = merchants.rashid;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span aria-hidden="true">💸</span> Merchants
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="yasir-location">💰 Yasir</Label>
          <Select
            value={yasir?.location || undefined}
            onValueChange={(value) => onChange("yasir", { location: value })}
          >
            <SelectTrigger id="yasir-location">
              <SelectValue placeholder="Select city…" />
            </SelectTrigger>
            <SelectContent>
              {YASIR_CITIES.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            Only ever one of these 3 cities — paste the board log above or pick directly.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="rashid-location">👳🏼‍♂️ Rashid</Label>
            {rashid?.isComputed && (
              <Badge variant="gold" className="text-[10px]">
                computed
              </Badge>
            )}
          </div>
          <Select
            value={rashid?.location || undefined}
            onValueChange={(value) => onChange("rashid", { location: value })}
          >
            <SelectTrigger id="rashid-location">
              <SelectValue placeholder="Select city…" />
            </SelectTrigger>
            <SelectContent>
              {RASHID_CITIES.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            Defaults to the known weekday rotation — always correctable if today&apos;s is different.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
