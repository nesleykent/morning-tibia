"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
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
  "Wintera",
];

interface WorldSelectorProps {
  value: string;
  worlds: World[];
  isLoading: boolean;
  onChange: (world: string) => void;
}

export function WorldSelector({ value, worlds, isLoading, onChange }: WorldSelectorProps) {
  const [open, setOpen] = useState(false);
  const names = worlds.length > 0 ? worlds.map((w) => w.name) : FALLBACK_WORLDS;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between sm:w-56"
        >
          <span className="flex items-center gap-2 truncate">
            <Globe2 className="h-4 w-4 shrink-0 text-gold" />
            {value || "Select a world…"}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder={isLoading ? "Loading worlds…" : "Search world…"} />
          <CommandList>
            <CommandEmpty>No world found.</CommandEmpty>
            <CommandGroup>
              {names.map((name) => (
                <CommandItem
                  key={name}
                  value={name}
                  onSelect={() => {
                    onChange(name);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("h-3.5 w-3.5", value === name ? "opacity-100" : "opacity-0")} />
                  {name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
