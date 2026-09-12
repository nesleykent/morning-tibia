import type { Opportunity, OpportunityAvailability } from "@/types/opportunity";
import type { MiniWorldChangeValue } from "@/types/miniWorldChange";
import type { WorldChangeValue } from "@/types/worldChange";
import type { Merchant, MerchantId } from "@/types/merchant";
import { OPPORTUNITIES } from "@/lib/defaults/opportunities";
import { MINI_WORLD_CHANGES_BY_ID } from "@/lib/defaults/miniWorldChanges";
import { WORLD_CHANGES_BY_ID } from "@/lib/defaults/worldChanges";

export interface OpportunityInput {
  miniWorldChanges: Record<string, MiniWorldChangeValue>;
  worldChanges: Record<string, WorldChangeValue>;
  merchants: Record<string, Merchant>;
}

/** What can be had now first, then what today advances, then what today only sets up. */
const AVAILABILITY_RANK: Record<OpportunityAvailability, number> = {
  "available-today": 0,
  "progressable-today": 1,
  "unlocks-future": 2,
};

/**
 * Turns today's *established* world state into the opportunities that state creates.
 *
 * Two rules do all the work.
 *
 * **Established, not possible.** An opportunity appears only when its condition is actually
 * known to hold. Unchecked is not a maybe and "not running" is not a maybe — both produce
 * nothing. On a fresh session with nothing pasted this returns an empty list, which is
 * correct rather than a gap.
 *
 * **The state, not the change.** A trigger names the exact states or variants it applies to,
 * so the same change contributes completely different opportunities on different days, and
 * contributes none in states where the thing genuinely cannot be had. This is what stops the
 * briefing recommending White Deer on a day the Guide has just said there are no White Deer.
 *
 * A variant-scoped trigger deliberately fails when the variant is unknown: the World Board
 * confirms Jungle Camp is running without saying who is winning, and "one of two bosses might
 * be there" is not something to put in front of someone planning a morning.
 */
export function deriveOpportunities(input: OpportunityInput): Opportunity[] {
  const opportunities: Opportunity[] = [];

  for (const definition of OPPORTUNITIES) {
    const trigger = definition.trigger;

    if (trigger.kind === "mini-world-change") {
      const value = input.miniWorldChanges[trigger.changeId];
      const def = MINI_WORLD_CHANGES_BY_ID.get(trigger.changeId);
      if (!value || !def) continue;

      // Only "active" qualifies. "unchecked" means nobody looked; "inactive" means a complete
      // board reading ruled it out.
      if (value.status !== "active") continue;
      if (trigger.variantIds && (value.variantId === null || !trigger.variantIds.includes(value.variantId))) {
        continue;
      }
      // The second axis, gated exactly like the first: nobody has looked behind the Spirit
      // Gate, so nothing that depends on which ground is back there may be offered.
      const contentId = value.contentId ?? null;
      if (trigger.contentIds && (contentId === null || !trigger.contentIds.includes(contentId))) {
        continue;
      }

      const variantLabel = def.variants.find((v) => v.id === value.variantId)?.label ?? null;
      opportunities.push({
        definition,
        emoji: def.emoji,
        conditionName: def.name,
        conditionState: variantLabel,
      });
      continue;
    }

    if (trigger.kind === "world-change") {
      const value = input.worldChanges[trigger.changeId];
      const def = WORLD_CHANGES_BY_ID.get(trigger.changeId);
      if (!value || !def || !value.stateId) continue;
      if (!trigger.stateIds.includes(value.stateId)) continue;

      opportunities.push({
        definition,
        emoji: def.emoji,
        // The catalog name, the same one the Mini World Change branch above uses and the same
        // one the bulletin and the reference view print. It used to be `shortLabel`, to agree
        // with a bulletin that was itself printing short labels; both now say "Their Master's
        // Voice", which is what a reader who goes looking for it will find.
        conditionName: def.name,
        conditionState: def.states.find((s) => s.id === value.stateId)?.label ?? null,
      });
      continue;
    }

    const merchant = input.merchants[trigger.merchantId as MerchantId];
    if (!merchant) continue;
    // "pending-location" already establishes that he is trading somewhere today, which is all
    // these need; "not-verified" and "inactive" do not.
    if (merchant.activityState !== "pending-location" && merchant.activityState !== "location-known") {
      continue;
    }
    opportunities.push({
      definition,
      emoji: "💰",
      conditionName: merchant.name,
      conditionState: merchant.location || null,
    });
  }

  return orderChains(
    opportunities.sort((a, b) => {
    const byAvailability =
      AVAILABILITY_RANK[a.definition.availability] - AVAILABILITY_RANK[b.definition.availability];
    if (byAvailability !== 0) return byAvailability;
    // Things that exist only under today's condition outrank things merely convenient today.
    const byExclusive = Number(Boolean(b.definition.exclusive)) - Number(Boolean(a.definition.exclusive));
    if (byExclusive !== 0) return byExclusive;
    // Fewest prerequisites first: what the reader could act on without preparation.
    const byPrereq =
      (a.definition.prerequisites?.length ?? 0) - (b.definition.prerequisites?.length ?? 0);
    if (byPrereq !== 0) return byPrereq;
    // Alphabetical last, and deliberately nothing cleverer.
    //
    // Ranking the remaining ties by Charm Points looks obviously better and is not a valid
    // ordering: charm only exists on bestiary entries, so "compare by charm when both sides
    // have it, otherwise by name" is intransitive — Iron Servant (30) beats Deepling Scout
    // (25) on charm, Deepling Scout beats Groam on name, and Groam beats Iron Servant on name.
    // Array.prototype.sort given a cycle returns whatever the engine likes, which showed up as
    // a change surfacing its second-best opportunity for no visible reason. A worth measure
    // would have to be defined for every kind, and a boss has no charm value to define it
    // with, so the tie is broken by name and the choice stays predictable.
    return a.definition.subject.localeCompare(b.definition.subject);
    }),
  );
}

/**
 * Moves a step to sit directly in front of the thing it is a step towards.
 *
 * Applied after the ordering rules rather than inside them, because it is not a ranking: the
 * two entries could rank anywhere relative to each other and the reader still has to meet the
 * item before the line that says to use it. Running it afterwards also keeps the comparator a
 * clean total order, which is the property the ordering test exists to protect.
 *
 * A feeder whose target is not on today's list stays where the comparator put it, and a cycle
 * cannot form, because each entry is placed at most once.
 */
function orderChains(ordered: Opportunity[]): Opportunity[] {
  const feeders = new Map<string, Opportunity[]>();
  for (const opportunity of ordered) {
    const target = opportunity.definition.leadsTo;
    if (!target) continue;
    if (!ordered.some((candidate) => candidate.definition.id === target)) continue;
    feeders.set(target, [...(feeders.get(target) ?? []), opportunity]);
  }
  if (feeders.size === 0) return ordered;

  const moved = new Set(
    [...feeders.values()].flat().map((opportunity) => opportunity.definition.id),
  );
  const result: Opportunity[] = [];
  for (const opportunity of ordered) {
    if (moved.has(opportunity.definition.id)) continue;
    result.push(...(feeders.get(opportunity.definition.id) ?? []), opportunity);
  }
  return result;
}
