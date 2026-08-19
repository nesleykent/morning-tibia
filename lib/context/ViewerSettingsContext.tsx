"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { briefingRepository } from "@/lib/storage/briefingRepository";
import { DEFAULT_VIEWER_TIME_ZONE } from "@/lib/utils/timezoneList";

interface ViewerSettingsValue {
  viewerTimeZone: string;
  setViewerTimeZone: (timeZone: string) => void;
}

const ViewerSettingsContext = createContext<ViewerSettingsValue | null>(null);

/**
 * A single shared source of truth for the viewer's timezone choice, since it's read from
 * two places that don't share a React tree position: the layout-level top status bar
 * (above the page) and the dashboard's briefing generator (inside the page). Both read
 * and write through this context instead of each keeping — and risking desyncing — their
 * own copy of the same localStorage value.
 *
 * Defaults to Curitiba (America/Sao_Paulo) rather than the browser's auto-detected zone —
 * there's no "auto" mode; the viewer always has one explicit zone in effect.
 */
export function ViewerSettingsProvider({ children }: { children: React.ReactNode }) {
  const [viewerTimeZone, setState] = useState(DEFAULT_VIEWER_TIME_ZONE);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time localStorage hydration on mount, same as useBriefingState's own hydration effect
    setState(briefingRepository.getViewerTimeZone() ?? DEFAULT_VIEWER_TIME_ZONE);
  }, []);

  const setViewerTimeZone = useCallback((timeZone: string) => {
    setState(timeZone);
    briefingRepository.setViewerTimeZone(timeZone);
  }, []);

  const value: ViewerSettingsValue = { viewerTimeZone, setViewerTimeZone };

  return <ViewerSettingsContext.Provider value={value}>{children}</ViewerSettingsContext.Provider>;
}

export function useViewerSettings(): ViewerSettingsValue {
  const ctx = useContext(ViewerSettingsContext);
  if (!ctx) throw new Error("useViewerSettings must be used within a ViewerSettingsProvider");
  return ctx;
}
