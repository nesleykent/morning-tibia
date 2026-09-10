"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Globe2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils/cn";
import type { World } from "@/types/world";

/** Shown while the live world list is loading/unavailable, so world selection never blocks. */
const FALLBACK_WORLDS = [
  "Antica",
  "Astera",
  "Belobra",
  "Bona",
  "Calmera",
  "Celebra",
  "Gladera",
  "Havera",
  "Jadebra",
  "Luminera",
  "Ombra",
  "Secura",
  "Solidera",
  "Ustebra",
  "Wintera",
];

interface WorldSelectorProps {
  value: string;
  worlds: World[];
  isLoading: boolean;
  onChange: (world: string) => void;
}

/**
 * Which world this morning is about.
 *
 * Every state it can be in — closed, hovered, focused, open, searching, selected, empty —
 * is drawn from the one light system, and none of them rely on anything WebKit renders
 * differently from Blink:
 *
 *  • The trigger is a real `<button>` styled from scratch, not a native control given a
 *    background — Safari paints its own chrome over half-styled form elements.
 *  • The popup is opaque and unfiltered; a `backdrop-filter` under a sticky ancestor is the
 *    known WebKit bug that used to make this menu unclickable.
 *  • The panel is measured off the trigger with Radix's own width variable rather than a
 *    hard-coded `w-64` that disagreed with the trigger's `sm:w-56`.
 *  • Only the list scrolls, and it owns its own rounding-free overflow, so nothing is
 *    clipped by a rounded, transformed ancestor.
 */
export function WorldSelector({ value, worlds, isLoading, onChange }: WorldSelectorProps) {
  const [open, setOpen] = useState(false);
  const names = worlds.length > 0 ? worlds.map((w) => w.name) : FALLBACK_WORLDS;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          // No `role="combobox"` here. The real combobox is cmdk's search input inside the
          // panel, which owns the listbox and the active-option relationship; duplicating the
          // role on the opener announced two comboboxes and gave the outer one nothing to
          // control. Radix supplies aria-haspopup, aria-expanded and aria-controls itself.
          aria-label={value ? `World: ${value}. Change world` : "Select a world"}
          className={cn(
            "group flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-line bg-surface px-2.5 text-[13px] shadow-card transition-colors sm:w-[196px]",
            "hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
            open && "border-line-strong bg-surface-2",
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <Globe2 className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
            <span className="truncate font-medium text-ink">{value || "Select a world…"}</span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden="true" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-[var(--radix-popover-trigger-width)] min-w-[15rem] p-0"
      >
        <Command>
          <CommandInput
            placeholder={isLoading ? "Loading worlds…" : "Search worlds…"}
            aria-label="Search worlds"
          />
          <CommandList>
            <CommandEmpty>No world by that name.</CommandEmpty>
            <CommandGroup>
              {names.map((name) => {
                const selected = value === name;
                return (
                  <CommandItem
                    key={name}
                    value={name}
                    onSelect={() => {
                      onChange(name);
                      setOpen(false);
                    }}
                    className={cn("justify-between", selected && "font-medium text-ink")}
                  >
                    <span className="truncate">{name}</span>
                    <Check
                      aria-hidden="true"
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 text-gold",
                        selected ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
