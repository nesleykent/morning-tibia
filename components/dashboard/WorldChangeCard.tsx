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
import type { WorldChangeDefinition, WorldChangeValue } from "@/types/worldChange";

interface WorldChangeCardProps {
  definition: WorldChangeDefinition;
  value: WorldChangeValue;
  onChange: (patch: Partial<WorldChangeValue>) => void;
}

export function WorldChangeCard({ definition, value, onChange }: WorldChangeCardProps) {
  const current = definition.states.find((state) => state.id === value.stateId);

  return (
    <Card className="transition-colors hover:border-gold/40">
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
                {definition.alternativeSource && (
                  <p className="mt-1 text-muted-foreground">{definition.alternativeSource}</p>
                )}
              </TooltipContent>
            </Tooltip>
          </div>
          <Badge variant={current ? "active" : "unknown"} className="shrink-0">
            {current ? current.label : "Not asked"}
          </Badge>
        </div>

        {/* The keyword is the whole point of the workflow: it's what you say to the Guide. */}
        <p className="text-[11px] text-muted-foreground">
          Ask a Guide: <span className="font-medium text-foreground">{definition.guideKeyword}</span>
        </p>

        {/* Pasting a Guide reply fills this in; the picker is for a player who read the
            reply but didn't copy it, and it's limited to this change's documented states. */}
        <Select
          value={value.stateId ?? undefined}
          onValueChange={(stateId) => onChange({ stateId })}
        >
          <SelectTrigger aria-label={`${definition.name} state`}>
            <SelectValue placeholder="Not asked yet…" />
          </SelectTrigger>
          <SelectContent>
            {definition.states.map((state) => (
              <SelectItem key={state.id} value={state.id}>
                {state.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
