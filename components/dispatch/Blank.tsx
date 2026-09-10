"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils/cn";
import type { Segment } from "@/lib/dispatch/composeDispatch";

type BlankSegment = Extract<Segment, { kind: "blank" }>;

/**
 * Marks every unfilled blank in the document, so "fill in the rest" can find the first one
 * without the dispatch and the paste field having to share state about which gaps are open.
 */
export const UNFILLED_BLANK_SELECTOR = "[data-blank-unfilled='true']";

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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          // Still re-openable once filled: a wrong guess must be correctable without
          // hunting for a reset.
          aria-label={filled ? `${segment.ask}: ${segment.value}` : `Choose ${segment.ask}`}
          data-blank-unfilled={filled ? "false" : "true"}
          data-blank-target={segment.target}
          className={cn(
            "font-medium",
            filled ? "filled text-[hsl(var(--ink))]" : "blank",
          )}
          data-state={open ? "open" : "closed"}
        >
          {filled ? segment.value : `${segment.ask}?`}
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
  const selected = segment.selected ?? [];

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
      <div
        className={cn("grid gap-0.5", segment.spatial ? "grid-cols-2" : "grid-cols-1")}
        role={segment.multi ? "group" : undefined}
      >
        {segment.options.map((option) => {
          const isChosen = segment.multi
            ? selected.includes(option.id)
            : segment.value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              // Multi-select answers are cumulative, so the menu stays open between picks —
              // closing after each one would make choosing three regions three round trips.
              aria-pressed={segment.multi ? isChosen : undefined}
              onClick={() => {
                onPick(segment.target, option.id);
                if (!segment.multi) close();
              }}
              className={cn(
                "flex items-center gap-1.5 rounded px-2 py-2 text-left text-[13.5px] leading-snug transition-colors",
                "hover:bg-[hsl(var(--gold)/0.22)]",
                isChosen
                  ? "bg-[hsl(var(--gold)/0.28)] font-medium"
                  : "text-[hsl(var(--ink-soft))]",
              )}
            >
              {segment.multi && (
                <Check
                  className={cn("h-3 w-3 shrink-0", isChosen ? "opacity-100" : "opacity-0")}
                  aria-hidden="true"
                />
              )}
              {option.label}
            </button>
          );
        })}
      </div>
      {segment.multi && (
        <button
          type="button"
          onClick={close}
          className="mt-1 w-full rounded px-2 py-1.5 text-[12.5px] font-medium text-[hsl(var(--ink-soft))] transition-colors hover:bg-[hsl(var(--gold)/0.14)] hover:text-[hsl(var(--ink))]"
        >
          Done
        </button>
      )}
    </PopoverContent>
  );
}
