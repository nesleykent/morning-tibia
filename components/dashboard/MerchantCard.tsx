"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { YASIR_CITIES } from "@/lib/defaults/merchants";
import type { Merchant, MerchantId } from "@/types/merchant";

interface MerchantCardProps {
  merchants: Record<string, Merchant>;
  onChange: (id: MerchantId, patch: Partial<Merchant>) => void;
}

const YASIR_ACTIVITY_LABEL: Record<Merchant["activityState"], string> = {
  "not-verified": "Not verified",
  inactive: "Inactive",
  "pending-location": "Active — pending city",
  "location-known": "Active",
};

const YASIR_ACTIVITY_BADGE_VARIANT: Record<Merchant["activityState"], "unknown" | "inactive" | "active"> = {
  "not-verified": "unknown",
  inactive: "inactive",
  "pending-location": "active",
  "location-known": "active",
};

export function MerchantCard({ merchants, onChange }: MerchantCardProps) {
  const yasir = merchants.yasir;
  const rashid = merchants.rashid;
  const yasirLocationEnabled =
    yasir?.activityState === "pending-location" ||
    yasir?.activityState === "location-known";

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span aria-hidden="true">💸</span> Merchants
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="yasir-location">💰 Yasir</Label>
            {yasir && (
              <Badge variant={YASIR_ACTIVITY_BADGE_VARIANT[yasir.activityState]} className="text-[10px]">
                {YASIR_ACTIVITY_LABEL[yasir.activityState]}
              </Badge>
            )}
          </div>
          <Select
            value={yasir?.location || undefined}
            disabled={!yasirLocationEnabled}
            onValueChange={(value) =>
              onChange("yasir", {
                location: value,
                activityState: "location-known",
              })
            }
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
            Only ever one of these 3 cities, and only while the Oriental Trader is active on
            the World Board — paste the board log above or pick directly once you know which.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label>👳🏼‍♂️ Rashid</Label>
            <Badge variant="gold" className="text-[10px]">
              computed
            </Badge>
          </div>
          <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm font-medium">
            {rashid?.location || "—"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Read-only — resolved from Tibia&apos;s own documented weekday rotation, precise
            down to the 10:00 CET/CEST server save. There&apos;s no known exception to correct.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
