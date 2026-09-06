"use client";

import { WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/worldChanges";
import { WorldChangeCard } from "./WorldChangeCard";
import type { WorldChangeValue } from "@/types/worldChange";

interface WorldChangeGridProps {
  values: Record<string, WorldChangeValue>;
  onChange: (id: string, patch: Partial<WorldChangeValue>) => void;
}

/**
 * All 14 World Changes in one grid. There is no "auto vs manual" split any more: every one
 * of the 14 has an official Guide NPC keyword, so every one of them is checked exactly the
 * same way. The card shows the keyword to say, and the unasked ones sort to the end.
 */
export function WorldChangeGrid({ values, onChange }: WorldChangeGridProps) {
  const ordered = [...WORLD_CHANGE_DEFINITIONS].sort((a, b) => {
    const aAsked = values[a.id]?.stateId ? 0 : 1;
    const bAsked = values[b.id]?.stateId ? 0 : 1;
    return aAsked !== bAsked ? aAsked - bAsked : a.name.localeCompare(b.name);
  });

  const asked = ordered.filter((def) => values[def.id]?.stateId).length;

  return (
    <section aria-labelledby="world-changes-heading" className="flex flex-col gap-4">
      <div>
        <h2 id="world-changes-heading" className="text-sm font-semibold text-foreground">
          World Changes
        </h2>
        <p className="text-[11px] text-muted-foreground">
          Greet any Guide NPC, say <em>world change</em>, then a keyword. A different mechanic from
          the Mini World Changes above — these are shaped by what players do. {asked} of{" "}
          {WORLD_CHANGE_DEFINITIONS.length} asked.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {ordered.map((definition) => {
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
    </section>
  );
}
