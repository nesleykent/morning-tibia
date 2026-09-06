"use client";

import { MINI_WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/miniWorldChanges";
import { MiniWorldChangeCard } from "./MiniWorldChangeCard";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { MiniWorldChangeValue } from "@/types/miniWorldChange";
import { miniWorldChangeSortWeight } from "@/lib/utils/miniWorldChangeDisplay";

interface MiniWorldChangeGridProps {
  values: Record<string, MiniWorldChangeValue>;
  onChange: (id: string, patch: Partial<MiniWorldChangeValue>) => void;
  includeAll: boolean;
  onIncludeAllChange: (value: boolean) => void;
}

/**
 * One grid, ordered by what actually needs attention: changes that are running but still
 * need the player to say where/who first, then the rest of the running ones, then
 * unchecked, then confirmed not running.
 *
 * The old "Auto — via World Board" / "Needs your input" split was an artefact of the
 * implementation rather than the game: whether a change needs input depends on what the
 * board happened to say *today* (it names the Spirit Grounds region but never the Fury
 * Gate city), not on a fixed property of the change. Sorting by live state says the same
 * thing truthfully and without two half-empty sections.
 */
export function MiniWorldChangeGrid({
  values,
  onChange,
  includeAll,
  onIncludeAllChange,
}: MiniWorldChangeGridProps) {
  const ordered = [...MINI_WORLD_CHANGE_DEFINITIONS].sort((a, b) => {
    const aValue = values[a.id];
    const bValue = values[b.id];
    if (!aValue || !bValue) return 0;
    const diff = miniWorldChangeSortWeight(a, aValue) - miniWorldChangeSortWeight(b, bValue);
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });

  const running = ordered.filter((def) => values[def.id]?.status === "active").length;
  const needing = ordered.filter(
    (def) =>
      values[def.id]?.status === "active" &&
      def.variants.length > 0 &&
      values[def.id]?.variantId === null,
  ).length;

  return (
    <section aria-labelledby="mini-world-changes-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="mini-world-changes-heading" className="text-sm font-semibold text-foreground">
            Mini World Changes
          </h2>
          <p className="text-[11px] text-muted-foreground">
            From the World Board at the Adventurer&apos;s Guild, or the Towncryer in Thais — paste
            either above. {running} running
            {needing > 0 ? `, ${needing} still need a detail from you` : ""}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {needing > 0 && (
            <Badge variant="gold" className="text-[10px]">
              {needing} to pin down
            </Badge>
          )}
          <label className="flex items-center gap-2">
            <Switch checked={includeAll} onCheckedChange={onIncludeAllChange} />
            <Label className="cursor-pointer">Include everything in briefing</Label>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {ordered.map((definition) => {
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
    </section>
  );
}
