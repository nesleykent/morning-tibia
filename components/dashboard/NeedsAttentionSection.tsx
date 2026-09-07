"use client";

import { Section } from "@/components/ui/section";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import type { MiniWorldChangeValue } from "@/types/miniWorldChange";
import type { DailyDigest } from "@/lib/dashboard/dailyDigest";

interface NeedsAttentionSectionProps {
  digest: DailyDigest;
  onMiniChange: (id: string, patch: Partial<MiniWorldChangeValue>) => void;
}

/**
 * The short list of things the player — and only the player — can resolve right now.
 *
 * Two genuinely different kinds of work end up here, and they are worded differently
 * because they *are* different: a change that is confirmed running but whose detail no
 * source ever gives (which city is the fury gate at?), and a silent change that no source
 * can report at all (did the beavers get out?). The first needs a choice, the second needs
 * a trip.
 *
 * When there is nothing to do, this section does not render. An empty "nothing needs your
 * attention" panel would be exactly the kind of dashboard furniture the page is trying to
 * stop being.
 */
export function NeedsAttentionSection({ digest, onMiniChange }: NeedsAttentionSectionProps) {
  const { needsVariant, silent } = digest.mini;
  if (needsVariant.length === 0 && silent.length === 0) return null;

  return (
    <Section
      eyebrow="Needs you"
      title={
        needsVariant.length + silent.length === 1
          ? "One thing only you can settle"
          : `${needsVariant.length + silent.length} things only you can settle`
      }
    >
      <div className="flex flex-col divide-y divide-border/50 rounded-lg bg-muted/25">
        {needsVariant.map(({ definition, value }) => (
          <div
            key={definition.id}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="text-[13.5px] font-medium text-foreground">
                <span aria-hidden="true" className="mr-1.5">
                  {definition.emoji}
                </span>
                {definition.name}
              </p>
              <p className="text-[12px] leading-snug text-muted-foreground">
                Running — but {sourceWording(definition.variantKind)} isn&apos;t in the message.
              </p>
            </div>
            <Select
              value={value.variantId ?? undefined}
              onValueChange={(variantId) => onMiniChange(definition.id, { variantId })}
            >
              <SelectTrigger aria-label={`${definition.name} detail`} className="w-auto min-w-[13rem] shrink-0">
                <SelectValue placeholder={promptFor(definition.variantKind)} />
              </SelectTrigger>
              <SelectContent align="end">
                {definition.variants.map((variant) => (
                  <SelectItem key={variant.id} value={variant.id}>
                    {variant.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        {silent.map(({ definition, value }) => (
          <div
            key={definition.id}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-medium text-foreground">
                <span aria-hidden="true" className="mr-1.5">
                  {definition.emoji}
                </span>
                {definition.name}
                <span className="ml-2 align-middle text-[10px] font-semibold uppercase tracking-[0.1em] text-gold">
                  Silent
                </span>
              </p>
              <p className="max-w-[62ch] text-[12px] leading-snug text-muted-foreground">
                {definition.howToCheck}
              </p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <Choice
                active={value.status === "active"}
                onClick={() => onMiniChange(definition.id, { status: "active" })}
              >
                It&apos;s running
              </Choice>
              <Choice
                active={value.status === "inactive"}
                onClick={() => onMiniChange(definition.id, { status: "inactive", variantId: null })}
              >
                Not today
              </Choice>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Choice({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-[38px] rounded-md px-3 py-1.5 text-[12px] transition-colors sm:min-h-0",
        active
          ? "bg-gold text-gold-foreground"
          : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function sourceWording(kind: string | null): string {
  if (kind === "faction") return "which side is winning";
  if (kind === "phase") return "which phase";
  return "where";
}

function promptFor(kind: string | null): string {
  if (kind === "faction") return "Who's winning?";
  if (kind === "phase") return "Which phase?";
  return "Where is it?";
}
