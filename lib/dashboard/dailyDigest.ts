import type {
  MiniWorldChangeDefinition,
  MiniWorldChangeValue,
} from "@/types/miniWorldChange";
import type { WorldChangeDefinition, WorldChangeValue } from "@/types/worldChange";
import { MINI_WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/miniWorldChanges";
import { WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/worldChanges";

/**
 * Turns the raw state maps into the handful of groups the morning actually has: what's
 * running, what still needs you, what was ruled out, what nobody has looked at.
 *
 * This exists so the page can be laid out by *meaning* rather than by catalog order. The
 * old grid rendered 26 visually identical cards and left the player to work out which three
 * mattered; these groups let the interface answer that directly.
 */

export interface MiniWorldChangeEntry {
  definition: MiniWorldChangeDefinition;
  value: MiniWorldChangeValue;
  /** Running, but the variant that decides where/who is still open — the player can fix this. */
  needsVariant: boolean;
}

export interface WorldChangeEntry {
  definition: WorldChangeDefinition;
  value: WorldChangeValue;
  /** The documented state the Guide reported, when one has been recorded. */
  stateLabel: string | null;
  /** True when this state is the uneventful end of the cycle. */
  quiet: boolean;
}

export interface DailyDigest {
  mini: {
    /** Confirmed running. The headline group. */
    running: MiniWorldChangeEntry[];
    /** Running but missing the detail only the player can supply. */
    needsVariant: MiniWorldChangeEntry[];
    /** A complete board reading ruled these out. */
    notRunning: MiniWorldChangeEntry[];
    /** Announced changes nobody has checked yet. */
    unchecked: MiniWorldChangeEntry[];
    /**
     * Changes no source can report. These are never "unchecked" in the same sense — no
     * paste will ever settle them — so they get their own group with their own wording.
     */
    silent: MiniWorldChangeEntry[];
    /**
     * Every silent change, resolved or not. The action list wants only the unresolved ones;
     * the reference view wants all of them, so the player can revise an answer later.
     */
    allSilent: MiniWorldChangeEntry[];
    /** Whether any Mini World Change evidence exists at all this session. */
    checked: boolean;
  };
  world: {
    /** Asked, and the answer is worth knowing about. */
    noteworthy: WorldChangeEntry[];
    /** Asked, and the answer was "nothing is happening". */
    quiet: WorldChangeEntry[];
    /** Not asked yet. */
    unasked: WorldChangeEntry[];
    checked: boolean;
  };
  /** Total number of things the player could resolve right now. Drives the "needs you" section. */
  attentionCount: number;
}

export function buildDailyDigest(
  miniValues: Record<string, MiniWorldChangeValue>,
  worldValues: Record<string, WorldChangeValue>,
): DailyDigest {
  const running: MiniWorldChangeEntry[] = [];
  const needsVariant: MiniWorldChangeEntry[] = [];
  const notRunning: MiniWorldChangeEntry[] = [];
  const unchecked: MiniWorldChangeEntry[] = [];
  const silent: MiniWorldChangeEntry[] = [];
  const allSilent: MiniWorldChangeEntry[] = [];
  let miniChecked = false;

  for (const definition of MINI_WORLD_CHANGE_DEFINITIONS) {
    const value = miniValues[definition.id];
    if (!value) continue;

    const wantsVariant =
      value.status === "active" && definition.variants.length > 0 && value.variantId === null;
    const entry: MiniWorldChangeEntry = { definition, value, needsVariant: wantsVariant };

    // An always-active change (Forsaken) is running by definition, so it never counts as
    // evidence that the player checked anything.
    if (value.status !== "unchecked" && definition.detection !== "always-active") {
      miniChecked = true;
    }

    if (definition.detection === "silent") {
      allSilent.push(entry);
      // Only an unanswered one is outstanding work.
      if (value.status === "unchecked") {
        silent.push(entry);
        continue;
      }
    }

    if (value.status === "active") {
      (wantsVariant ? needsVariant : running).push(entry);
    } else if (value.status === "inactive") {
      notRunning.push(entry);
    } else {
      unchecked.push(entry);
    }
  }

  const noteworthy: WorldChangeEntry[] = [];
  const quiet: WorldChangeEntry[] = [];
  const unasked: WorldChangeEntry[] = [];
  let worldChecked = false;

  for (const definition of WORLD_CHANGE_DEFINITIONS) {
    const value = worldValues[definition.id];
    if (!value) continue;

    const state = definition.states.find((s) => s.id === value.stateId);
    const entry: WorldChangeEntry = {
      definition,
      value,
      stateLabel: state?.label ?? null,
      quiet: Boolean(state?.quiet),
    };

    if (!state) {
      unasked.push(entry);
      continue;
    }
    worldChecked = true;
    (state.quiet ? quiet : noteworthy).push(entry);
  }

  const byName = (a: { definition: { name: string } }, b: { definition: { name: string } }) =>
    a.definition.name.localeCompare(b.definition.name);

  running.sort(byName);
  needsVariant.sort(byName);
  notRunning.sort(byName);
  unchecked.sort(byName);
  silent.sort(byName);
  allSilent.sort(byName);
  noteworthy.sort(byName);
  quiet.sort(byName);
  unasked.sort(byName);

  return {
    mini: { running, needsVariant, notRunning, unchecked, silent, allSilent, checked: miniChecked },
    world: { noteworthy, quiet, unasked, checked: worldChecked },
    attentionCount: needsVariant.length + silent.length,
  };
}
