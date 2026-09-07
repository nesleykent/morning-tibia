"use client";

import { useState } from "react";
import { Section } from "@/components/ui/section";
import { cn } from "@/lib/utils/cn";
import type { AchievementOpportunity } from "@/types/achievement";

interface OpportunitiesSectionProps {
  opportunities: AchievementOpportunity[];
}

/**
 * What today's confirmed conditions make possible.
 *
 * Every row here traces back to a state the app actually established — a change confirmed
 * running, a Guide reply recorded. Nothing derived from an unchecked condition reaches this
 * list (see lib/achievements/opportunities.ts), which is why the section simply disappears
 * on a fresh session rather than advertising an empty feature.
 *
 * Presentation is deliberately flat: one line per achievement, the reason in muted text
 * beside it. These are time-sensitive facts, not quest rewards, so they get no cards, no
 * progress bars and no urgency styling beyond being here at all.
 */
export function OpportunitiesSection({ opportunities }: OpportunitiesSectionProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  if (opportunities.length === 0) return null;

  return (
    <Section
      eyebrow="Today's opportunities"
      title={
        opportunities.length === 1
          ? "One achievement today's world state opens up"
          : `${opportunities.length} achievements today's world state opens up`
      }
      description="Each one is gated by something confirmed active right now — when the condition ends, so does the chance."
    >
      <ul className="flex flex-col divide-y divide-border/50">
        {opportunities.map((opportunity) => {
          const { definition } = opportunity;
          const open = expanded === definition.id;
          return (
            <li key={definition.id}>
              <button
                type="button"
                onClick={() => setExpanded(open ? null : definition.id)}
                className="flex min-h-[42px] w-full flex-wrap items-baseline gap-x-3 gap-y-0.5 py-2 text-left sm:min-h-0"
                aria-expanded={open}
              >
                <span aria-hidden="true" className="text-[13px]">
                  {opportunity.emoji}
                </span>
                <span className="text-[13.5px] font-medium text-foreground">
                  {definition.achievement}
                </span>
                {definition.premium && (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    Premium
                  </span>
                )}
                <span className="ml-auto text-[12px] text-muted-foreground">
                  {opportunity.evidence}
                </span>
              </button>
              {open && (
                <div className="pb-3 pl-6 pr-2 text-[12.5px] leading-relaxed">
                  <p className="text-foreground">{definition.task}</p>
                  <p className="mt-1 text-muted-foreground">{definition.whyToday}</p>
                  {definition.prerequisites && definition.prerequisites.length > 0 && (
                    <p className="mt-1 text-muted-foreground">
                      <span className="text-foreground/80">Needs first:</span>{" "}
                      {definition.prerequisites.join(" · ")}
                    </p>
                  )}
                  {definition.caveat && (
                    <p className="mt-1 text-muted-foreground">
                      <span className="text-foreground/80">Note:</span> {definition.caveat}
                    </p>
                  )}
                  <a
                    href={definition.source}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-block text-[11.5px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
                  >
                    TibiaWiki
                  </a>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

/**
 * A one-line count for the top of the page. Rendered only when there is something to count,
 * so it never becomes a permanent zero.
 */
export function OpportunityPill({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  if (count === 0) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full bg-gold/12 px-2.5 py-1 text-[11.5px] font-medium text-gold",
        "transition-colors hover:bg-gold/20",
      )}
    >
      {count} {count === 1 ? "opportunity" : "opportunities"} today
    </button>
  );
}
