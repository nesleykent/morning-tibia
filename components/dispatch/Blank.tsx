"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils/cn";
import type { Segment } from "@/lib/dispatch/composeDispatch";

type BlankSegment = Extract<Segment, { kind: "blank" }>;

/**
 * A missing fact, rendered inside the sentence that needs it.
 *
 * This replaces the whole apparatus of status badges, "needs your input" panels and rows of
 * select controls. A reader does not have to be told what an unresolved variant is — a
 * highlighted gap mid-sentence explains itself, and clicking it asks exactly one question.
 *
 * Location answers get a two-column grid rather than a dropdown list. "Which of ten cities?"
 * is a spatial question, and a tall scrolling menu is the worst possible shape for it; a grid
 * lets the eye find a known place by position instead of reading ten labels in sequence.
 */
export function Blank({
  segment,
  onPick,
}: {
  segment: BlankSegment;
  onPick: (target: string, optionId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const filled = segment.value !== null;

  if (filled) {
    // Still re-openable: a wrong guess must be correctable without hunting for a reset.
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" className="filled font-medium text-[hsl(var(--ink))]">
            {segment.value}
          </button>
        </PopoverTrigger>
        <Options segment={segment} onPick={onPick} close={() => setOpen(false)} />
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Choose ${segment.ask}`}
          className="blank font-medium"
          data-state={open ? "open" : "closed"}
        >
          {segment.ask}?
        </button>
      </PopoverTrigger>
      <Options segment={segment} onPick={onPick} close={() => setOpen(false)} />
    </Popover>
  );
}

function Options({
  segment,
  onPick,
  close,
}: {
  segment: BlankSegment;
  onPick: (target: string, optionId: string) => void;
  close: () => void;
}) {
  return (
    <PopoverContent
      align="start"
      className={cn(
        "border-[hsl(var(--page-edge))] bg-[hsl(var(--popover))] p-1.5 text-[hsl(var(--ink))] shadow-xl",
        segment.spatial ? "w-[19rem]" : "w-[15rem]",
      )}
    >
      <p className="px-2 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[hsl(var(--ink-faint))]">
        {segment.ask}
      </p>
      <div className={cn("grid gap-0.5", segment.spatial ? "grid-cols-2" : "grid-cols-1")}>
        {segment.options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => {
              onPick(segment.target, option.id);
              close();
            }}
            className={cn(
              "rounded px-2 py-2 text-left text-[13.5px] leading-snug transition-colors",
              "hover:bg-[hsl(var(--gold)/0.22)]",
              segment.value === option.id
                ? "bg-[hsl(var(--gold)/0.28)] font-medium"
                : "text-[hsl(var(--ink-soft))]",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </PopoverContent>
  );
}
