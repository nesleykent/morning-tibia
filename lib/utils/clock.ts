/**
 * One ticking clock for the whole app.
 *
 * Several places count down to the same instant — the top bar's server-save countdown, the
 * dispatch's own "resets at server save" line, the day-rollover watch. When each kept its
 * own `new Date()` they drifted: the top bar ticked while the dispatch footer stayed frozen
 * at whatever the page-load time was, so the same screen showed two different answers to
 * the same question.
 *
 * This is a module-level ticker rather than a React context on purpose. A context holding a
 * value that changes every second re-renders its entire subtree once a second — which, with
 * a 26-row catalog underneath, is a lot of work to move one digit. `useSyncExternalStore`
 * lets only the components that actually display a clock subscribe, so the rest of the page
 * is untouched between seconds.
 */
import { useSyncExternalStore } from "react";

const TICK_MS = 1000;

const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
/** Rounded to the second so the snapshot is stable between renders within the same tick. */
let snapshot = Math.floor(Date.now() / TICK_MS) * TICK_MS;

function tick(): void {
  const next = Math.floor(Date.now() / TICK_MS) * TICK_MS;
  if (next === snapshot) return;
  snapshot = next;
  for (const listener of listeners) listener();
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  if (timer === null) {
    // Resync immediately: the module may have been idle (all consumers unmounted) long
    // enough for `snapshot` to be badly stale.
    tick();
    timer = setInterval(tick, TICK_MS);
  }
  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function getSnapshot(): number {
  return snapshot;
}

/** Constant during SSR so the server HTML and the first client paint agree; the real
 * value arrives on the subscription that follows hydration. */
function getServerSnapshot(): number {
  return 0;
}

/**
 * Current time in ms, updated once a second, shared by every caller. Returns 0 during
 * server rendering and the first client paint — callers that render a clock should already
 * be gated on `useIsClient`, and can treat 0 as "not known yet".
 */
export function useNowMs(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
