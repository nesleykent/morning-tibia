"use client";

import { MINI_WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/miniWorldChanges";
import { MiniWorldChangeCard } from "./MiniWorldChangeCard";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { MiniWorldChangeValue } from "@/types/miniWorldChange";

interface MiniWorldChangeGridProps {
  values: Record<string, MiniWorldChangeValue>;
  onChange: (id: string, patch: Partial<MiniWorldChangeValue>) => void;
  includeAll: boolean;
  onIncludeAllChange: (value: boolean) => void;
}

const GUIDE_NPC_DEFINITIONS = MINI_WORLD_CHANGE_DEFINITIONS.filter(
  (def) => def.source === "guide-npc",
);
const MANUAL_DEFINITIONS = MINI_WORLD_CHANGE_DEFINITIONS.filter((def) => def.source === "manual");

export function MiniWorldChangeGrid({
  values,
  onChange,
  includeAll,
  onIncludeAllChange,
}: MiniWorldChangeGridProps) {
  return (
    <section aria-labelledby="mini-world-changes-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="mini-world-changes-heading" className="text-sm font-semibold text-foreground">
          Mini World Changes
        </h2>
        <label className="flex items-center gap-2">
          <Switch checked={includeAll} onCheckedChange={onIncludeAllChange} />
          <Label className="cursor-pointer">Include inactive items in briefing</Label>
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Auto — via Guide NPC
          </h3>
          <Badge variant="gold" className="text-[10px]">
            paste a chat log above
          </Badge>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {GUIDE_NPC_DEFINITIONS.map((definition) => {
            const value = values[definition.id];
            if (!value) return null;
            return (
              <MiniWorldChangeCard
                key={definition.id}
                definition={definition}
                value={value}
                onChange={(patch) => onChange(definition.id, patch)}
              />
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Manual
        </h3>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {MANUAL_DEFINITIONS.map((definition) => {
            const value = values[definition.id];
            if (!value) return null;
            return (
              <MiniWorldChangeCard
                key={definition.id}
                definition={definition}
                value={value}
                onChange={(patch) => onChange(definition.id, patch)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
