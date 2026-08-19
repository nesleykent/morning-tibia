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

const AUTO_DEFINITIONS = MINI_WORLD_CHANGE_DEFINITIONS.filter((def) => def.coverage === "full");
const PARTIAL_DEFINITIONS = MINI_WORLD_CHANGE_DEFINITIONS.filter((def) => def.coverage === "partial");

export function MiniWorldChangeGrid({
  values,
  onChange,
  includeAll,
  onIncludeAllChange,
}: MiniWorldChangeGridProps) {
  return (
    <section aria-labelledby="mini-world-changes-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="mini-world-changes-heading" className="text-sm font-semibold text-foreground">
            Mini World Changes
          </h2>
          <p className="text-[11px] text-muted-foreground">
            From the World Board (Adventurer&apos;s Guild) — paste its log above.
          </p>
        </div>
        <label className="flex items-center gap-2">
          <Switch checked={includeAll} onCheckedChange={onIncludeAllChange} />
          <Label className="cursor-pointer">Include inactive items in briefing</Label>
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Auto — via World Board
          </h3>
          <Badge variant="gold" className="text-[10px]">
            paste a log above
          </Badge>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {AUTO_DEFINITIONS.map((definition) => {
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

      {PARTIAL_DEFINITIONS.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Needs your input
          </h3>
          <p className="text-[11px] text-muted-foreground">
            The board confirms these are active but doesn&apos;t say the exact stage or spot —
            paste the log to detect that it&apos;s active, then fill in the rest.
          </p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {PARTIAL_DEFINITIONS.map((definition) => {
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
      )}
    </section>
  );
}
