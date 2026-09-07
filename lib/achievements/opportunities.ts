import type { AchievementOpportunity } from "@/types/achievement";
import type { MiniWorldChangeValue } from "@/types/miniWorldChange";
import type { WorldChangeValue } from "@/types/worldChange";
import type { Merchant, MerchantId } from "@/types/merchant";
import { ACHIEVEMENT_OPPORTUNITIES } from "@/lib/defaults/achievements";
import { MINI_WORLD_CHANGES_BY_ID } from "@/lib/defaults/miniWorldChanges";
import { WORLD_CHANGES_BY_ID } from "@/lib/defaults/worldChanges";

export interface OpportunityInput {
  miniWorldChanges: Record<string, MiniWorldChangeValue>;
  worldChanges: Record<string, WorldChangeValue>;
  merchants: Record<string, Merchant>;
}

/**
 * Turns today's *established* world state into the achievement opportunities it creates.
 *
 * The single rule that matters: an opportunity appears only when the enabling condition is
 * actually known to hold. Unchecked is not a maybe, and "not running" is not a maybe — both
 * produce nothing. This is what stops the feature from degenerating into a list of
 * achievements the player might theoretically be able to do, which would be worse than
 * useless: it would be advice built on state the app never verified.
 *
 * A consequence worth stating: on a fresh session with nothing pasted, this returns an
 * empty list. That is correct, not a gap.
 */
export function deriveAchievementOpportunities(
  input: OpportunityInput,
): AchievementOpportunity[] {
  const opportunities: AchievementOpportunity[] = [];

  for (const definition of ACHIEVEMENT_OPPORTUNITIES) {
    const trigger = definition.trigger;

    if (trigger.kind === "mini-world-change") {
      const value = input.miniWorldChanges[trigger.changeId];
      const def = MINI_WORLD_CHANGES_BY_ID.get(trigger.changeId);
      if (!value || !def) continue;

      // Only "active" qualifies. "unchecked" means we never looked; "inactive" means a
      // complete board reading ruled it out.
      if (value.status !== "active") continue;

      // Some links depend on a particular variant (which faction, which phase). If the
      // variant is required but still unknown, the condition is not established.
      if (trigger.variantId && value.variantId !== trigger.variantId) continue;

      const variantLabel = def.variants.find((v) => v.id === value.variantId)?.label;
      opportunities.push({
        definition,
        emoji: def.emoji,
        conditionName: def.name,
        evidence: variantLabel ? `${def.name}: ${variantLabel}` : `${def.name} is running`,
      });
      continue;
    }

    if (trigger.kind === "world-change") {
      const value = input.worldChanges[trigger.changeId];
      const def = WORLD_CHANGES_BY_ID.get(trigger.changeId);
      if (!value || !def || !value.stateId) continue;
      if (!trigger.stateIds.includes(value.stateId)) continue;

      const stateLabel = def.states.find((s) => s.id === value.stateId)?.label ?? value.stateId;
      opportunities.push({
        definition,
        emoji: def.emoji,
        conditionName: def.name,
        evidence: `${def.name}: ${stateLabel}`,
      });
      continue;
    }

    const merchant = input.merchants[trigger.merchantId as MerchantId];
    if (!merchant) continue;
    // "pending-location" already establishes that he is trading somewhere today, which is
    // all this achievement needs; "not-verified" and "inactive" do not.
    if (merchant.activityState !== "pending-location" && merchant.activityState !== "location-known") {
      continue;
    }
    opportunities.push({
      definition,
      emoji: "💰",
      conditionName: merchant.name,
      evidence: merchant.location
        ? `${merchant.name} is trading in ${merchant.location}`
        : `${merchant.name} is trading today`,
    });
  }

  // Required opportunities first — those are the ones that genuinely vanish with the
  // condition. Within a group, fewer prerequisites first: the ones you could act on now.
  return opportunities.sort((a, b) => {
    const byStrength =
      Number(a.definition.strength === "useful") - Number(b.definition.strength === "useful");
    if (byStrength !== 0) return byStrength;
    const byPrereq =
      (a.definition.prerequisites?.length ?? 0) - (b.definition.prerequisites?.length ?? 0);
    if (byPrereq !== 0) return byPrereq;
    return a.definition.achievement.localeCompare(b.definition.achievement);
  });
}
