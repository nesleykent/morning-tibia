"use client";

import { WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/worldChanges";
import { WorldChangeCard } from "./WorldChangeCard";
import { Badge } from "@/components/ui/badge";
import type { WorldChangeValue } from "@/types/worldChange";

interface WorldChangeGridProps {
  values: Record<string, WorldChangeValue>;
  onChange: (id: string, patch: Partial<WorldChangeValue>) => void;
}

const GUIDE_NPC_DEFINITIONS = WORLD_CHANGE_DEFINITIONS.filter((def) => def.source === "guide-npc");
const MANUAL_DEFINITIONS = WORLD_CHANGE_DEFINITIONS.filter((def) => def.source === "manual");

export function WorldChangeGrid({ values, onChange }: WorldChangeGridProps) {
  return (
    <section aria-labelledby="world-changes-heading" className="flex flex-col gap-4">
      <div>
        <h2 id="world-changes-heading" className="text-sm font-semibold text-foreground">
          World Changes
        </h2>
        <p className="text-[11px] text-muted-foreground">
          Checked in-game by asking a Guide NPC — a different mechanic from the Mini World
          Changes above.
        </p>
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
              <WorldChangeCard
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
              <WorldChangeCard
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
