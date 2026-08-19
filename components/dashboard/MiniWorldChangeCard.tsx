"use client";

import { MessageSquareText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StatusSelector } from "./StatusSelector";
import { StageSelector } from "./StageSelector";
import type { MiniWorldChangeDefinition, MiniWorldChangeValue } from "@/types/miniWorldChange";
import { stateBadgeLabel, stateBadgeVariant, stateForDetailValue } from "@/lib/utils/miniWorldChangeDisplay";

interface MiniWorldChangeCardProps {
  definition: MiniWorldChangeDefinition;
  value: MiniWorldChangeValue;
  onChange: (patch: Partial<MiniWorldChangeValue>) => void;
}

export function MiniWorldChangeCard({ definition, value, onChange }: MiniWorldChangeCardProps) {
  const listId = `${definition.id}-suggestions`;

  return (
    <Card className="transition-colors hover:border-gold/40">
      <CardContent className="flex flex-col gap-2.5 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 text-sm font-medium leading-tight">
            <span aria-hidden="true">{definition.emoji}</span>
            <span>{definition.label}</span>
          </div>
          <Badge variant={stateBadgeVariant(value.state)} className="shrink-0">
            {stateBadgeLabel(value.state, definition.controlType, value.detail)}
          </Badge>
        </div>

        {definition.coverage === "full" && value.state === "unknown" && (
          <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <MessageSquareText className="mt-0.5 h-3 w-3 shrink-0" />
            Paste a World Board log above to detect this automatically.
          </p>
        )}

        {definition.coverage === "partial" && definition.controlType === "toggle" && (
          <StatusSelector value={value.state} onChange={(state) => onChange({ state })} />
        )}

        {definition.coverage === "partial" && definition.controlType === "stage" && (
          <StageSelector value={value.state} onChange={(state) => onChange({ state })} />
        )}

        {definition.coverage === "partial" &&
          (definition.controlType === "location" ||
            definition.controlType === "creature" ||
            definition.controlType === "boss") && (
          <>
            <Input
              value={value.detail}
              placeholder={
                definition.controlType === "location"
                  ? "Location…"
                  : definition.controlType === "creature"
                    ? "Creature name…"
                    : "Boss name…"
              }
              list={definition.suggestions ? listId : undefined}
              onChange={(event) => {
                const detail = event.target.value;
                onChange({ detail, state: stateForDetailValue(definition.controlType, detail) });
              }}
            />
            {definition.suggestions && (
              <datalist id={listId}>
                {definition.suggestions.map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
