"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { briefingRepository } from "@/lib/storage/briefingRepository";

interface ViewerSettingsValue {
  /** null means "auto — use the browser-detected zone". */
  viewerTimeZoneOverride: string | null;
  autoViewerTimeZone: string;
  /** The zone actually in effect — override if set, else the auto-detected one. */
  viewerTimeZone: string;
  setViewerTimeZoneOverride: (timeZone: string | null) => void;
}

const ViewerSettingsContext = createContext<ViewerSettingsValue | null>(null);

/**
 * A single shared source of truth for the viewer's timezone choice, since it's read from
 * two places that don't share a React tree position: the layout-level top status bar
 * (above the page) and the dashboard's briefing generator (inside the page). Both read
 * and write through this context instead of each keeping — and risking desyncing — their
 * own copy of the same localStorage value.
 */
export function ViewerSettingsProvider({ children }: { children: React.ReactNode }) {
  const [autoViewerTimeZone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [viewerTimeZoneOverride, setOverrideState] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time localStorage hydration on mount, same as useBriefingState's own hydration effect
    setOverrideState(briefingRepository.getViewerTimeZoneOverride());
  }, []);

  const setViewerTimeZoneOverride = useCallback((timeZone: string | null) => {
    setOverrideState(timeZone);
    briefingRepository.setViewerTimeZoneOverride(timeZone);
  }, []);

  const value: ViewerSettingsValue = {
    viewerTimeZoneOverride,
    autoViewerTimeZone,
    viewerTimeZone: viewerTimeZoneOverride ?? autoViewerTimeZone,
    setViewerTimeZoneOverride,
  };

  return <ViewerSettingsContext.Provider value={value}>{children}</ViewerSettingsContext.Provider>;
}

export function useViewerSettings(): ViewerSettingsValue {
  const ctx = useContext(ViewerSettingsContext);
  if (!ctx) throw new Error("useViewerSettings must be used within a ViewerSettingsProvider");
  return ctx;
}
