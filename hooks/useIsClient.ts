"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * True once hydrated on the client. Used to gate rendering of anything that depends on
 * localStorage or "today's date" so the server-rendered HTML and the first client paint
 * always match (avoids hydration mismatches), then swaps in the real content.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
