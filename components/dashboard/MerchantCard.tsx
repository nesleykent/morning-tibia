"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getRashidRotationCities } from "@/lib/rashid/rashidRotation";
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
          <Input
            id="yasir-location"
            value={yasir?.location ?? ""}
            placeholder="e.g. Carlin"
            onChange={(e) => onChange("yasir", { location: e.target.value })}
          />
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
          <Input
            id="rashid-location"
            list="rashid-cities"
            value={rashid?.location ?? ""}
            placeholder="e.g. Svargrond"
            onChange={(e) => onChange("rashid", { location: e.target.value })}
          />
          <datalist id="rashid-cities">
            {RASHID_CITIES.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
          <p className="text-[11px] text-muted-foreground">
            Defaults to the known weekday rotation — always editable if today&apos;s is different.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
