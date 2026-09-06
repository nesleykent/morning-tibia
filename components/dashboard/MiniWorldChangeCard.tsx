"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { MiniWorldChangeDefinition, MiniWorldChangeValue } from "@/types/miniWorldChange";
import {
  pendingVariantLabel,
  statusBadgeLabel,
  statusBadgeVariant,
} from "@/lib/utils/miniWorldChangeDisplay";

interface MiniWorldChangeCardProps {
  definition: MiniWorldChangeDefinition;
  value: MiniWorldChangeValue;
  onChange: (patch: Partial<MiniWorldChangeValue>) => void;
}

const VARIANT_PROMPT: Record<string, string> = {
  location: "Where is it?",
  faction: "Who's winning?",
  phase: "Which phase?",
};

export function MiniWorldChangeCard({ definition, value, onChange }: MiniWorldChangeCardProps) {
  // Whether it's running at all is something only the game can tell the player — the World
  // Board or the Towncryer — so there is no manual on/off here. What the player CAN
  // contribute is the variant, once a source has confirmed it's running but couldn't say
  // which form it took (which city the fury gate is at, which side holds the jungle camp).
  const hasVariants = definition.variants.length > 0;
  const canPickVariant = hasVariants && value.status === "active";
  const needsVariant = canPickVariant && value.variantId === null;

  return (
    <Card
      className={`transition-colors hover:border-gold/40 ${needsVariant ? "border-gold/50" : ""}`}
    >
      <CardContent className="flex flex-col gap-2 p-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 text-sm font-medium leading-tight">
            <span aria-hidden="true">{definition.emoji}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help">{definition.name}</span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{definition.description}</p>
                <p className="mt-1 text-muted-foreground">{definition.location}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Badge variant={statusBadgeVariant(definition, value)} className="shrink-0">
            {statusBadgeLabel(definition, value)}
          </Badge>
        </div>

        {canPickVariant && (
          <Select
            value={value.variantId ?? undefined}
            onValueChange={(variantId) => onChange({ variantId })}
          >
            <SelectTrigger
              aria-label={`${definition.name} — ${pendingVariantLabel(definition.variantKind)}`}
            >
              <SelectValue
                placeholder={VARIANT_PROMPT[definition.variantKind ?? ""] ?? "Pick one…"}
              />
            </SelectTrigger>
            <SelectContent>
              {definition.variants.map((variant) => (
                <SelectItem key={variant.id} value={variant.id}>
                  {variant.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {value.status === "active" && definition.reference && (
          <p className="text-[11px] leading-snug text-muted-foreground">
            Known spots: {definition.reference.slice(0, 4).join(" · ")}…
          </p>
        )}
      </CardContent>
    </Card>
  );
}
