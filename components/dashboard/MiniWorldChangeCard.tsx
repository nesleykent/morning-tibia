"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  // A closed-list location (Bibby's Bloodbath, Noodles) can only ever settle on one of a
  // known, finite set of spots — free text would let the user record a place the board
  // could never actually report, so it gets a strict picker instead of an open Input.
  const isClosedLocationList = definition.controlType === "location" && Boolean(definition.suggestions);

  return (
    <Card className="transition-colors hover:border-gold/40">
      <CardContent className="flex flex-col gap-2 p-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-sm font-medium leading-tight">
            <span aria-hidden="true">{definition.emoji}</span>
            <span>{definition.label}</span>
          </div>
          <Badge variant={stateBadgeVariant(value.state)} className="shrink-0">
            {stateBadgeLabel(value.state, definition.controlType, value.detail)}
          </Badge>
        </div>

        {definition.coverage === "full" &&
          value.state !== "unknown" &&
          value.detail &&
          definition.controlType !== "location" &&
          definition.controlType !== "creature" &&
          definition.controlType !== "boss" && (
            <p className="text-[11px] text-muted-foreground">{value.detail}</p>
          )}

        {definition.coverage === "partial" && definition.controlType === "toggle" && (
          <StatusSelector value={value.state} onChange={(state) => onChange({ state })} />
        )}

        {definition.coverage === "partial" && definition.controlType === "stage" && (
          <StageSelector value={value.state} onChange={(state) => onChange({ state })} />
        )}

        {definition.coverage === "partial" && isClosedLocationList && (
          <Select
            value={value.detail || undefined}
            onValueChange={(detail) => onChange({ detail, state: "location" })}
          >
            <SelectTrigger aria-label={`${definition.label} location`}>
              <SelectValue placeholder="Active — pending location…" />
            </SelectTrigger>
            <SelectContent>
              {definition.suggestions!.map((suggestion) => (
                <SelectItem key={suggestion} value={suggestion}>
                  {suggestion}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {definition.coverage === "partial" &&
          !isClosedLocationList &&
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
