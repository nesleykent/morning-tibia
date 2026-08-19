import type { BriefingOverrides } from "@/types/briefing";
import type { MarketTrendBasis } from "@/types/market";
import type { BriefingLanguage } from "@/lib/formatter/translations";
import { storageKeys } from "./storageKeys";

export type BriefingFormat = "rich" | "plain";

const VALID_LANGUAGES: BriefingLanguage[] = ["pt", "en", "es", "pl"];
export const UPCOMING_EVENTS_WINDOW_OPTIONS = [5, 7, 14] as const;
const DEFAULT_UPCOMING_EVENTS_WINDOW_DAYS = 7;
const VALID_MARKET_TREND_BASES: MarketTrendBasis[] = ["last", "avg3", "avg7", "avg14"];
const DEFAULT_MARKET_TREND_BASIS: MarketTrendBasis = "last";

/**
 * Everything the dashboard needs to persist. Kept as an interface so a future
 * database-backed implementation (e.g. behind a REST API) can swap in without
 * touching any component or hook that depends on it.
 */
export interface BriefingRepository {
  getLastWorld(): string | null;
  setLastWorld(world: string): void;
  getPreferredFormat(): BriefingFormat;
  setPreferredFormat(format: BriefingFormat): void;
  getBriefingLanguage(): BriefingLanguage;
  setBriefingLanguage(language: BriefingLanguage): void;
  /** How many days ahead the briefing text's upcoming-events section reaches (5/7/14). */
  getUpcomingEventsWindowDays(): number;
  setUpcomingEventsWindowDays(days: number): void;
  /** null means nothing saved yet — callers fall back to DEFAULT_VIEWER_TIME_ZONE
   * (Curitiba). There's no "auto, browser-detected" mode. */
  getViewerTimeZone(): string | null;
  setViewerTimeZone(timeZone: string): void;
  /** Window (entry count, not days) the market cards' displayed price/trend and the
   * briefing's market lines are computed over — see lib/utils/priceTrend.ts. */
  getMarketTrendBasis(): MarketTrendBasis;
  setMarketTrendBasis(basis: MarketTrendBasis): void;
  getOverrides(world: string, dateKey: string): BriefingOverrides | null;
  setOverrides(overrides: BriefingOverrides): void;
  clearOverrides(world: string, dateKey: string): void;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeRead(key: string): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable (private browsing, quota exceeded) — never block the app.
  }
}

function safeRemove(key: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export class LocalStorageBriefingRepository implements BriefingRepository {
  getLastWorld(): string | null {
    return safeRead(storageKeys.lastWorld);
  }

  setLastWorld(world: string): void {
    safeWrite(storageKeys.lastWorld, world);
  }

  getPreferredFormat(): BriefingFormat {
    const raw = safeRead(storageKeys.preferredFormat);
    return raw === "plain" ? "plain" : "rich";
  }

  setPreferredFormat(format: BriefingFormat): void {
    safeWrite(storageKeys.preferredFormat, format);
  }

  getBriefingLanguage(): BriefingLanguage {
    const raw = safeRead(storageKeys.briefingLanguage);
    return VALID_LANGUAGES.includes(raw as BriefingLanguage) ? (raw as BriefingLanguage) : "pt";
  }

  setBriefingLanguage(language: BriefingLanguage): void {
    safeWrite(storageKeys.briefingLanguage, language);
  }

  getUpcomingEventsWindowDays(): number {
    const raw = safeRead(storageKeys.upcomingEventsWindowDays);
    const parsed = raw === null ? NaN : Number(raw);
    return (UPCOMING_EVENTS_WINDOW_OPTIONS as readonly number[]).includes(parsed)
      ? parsed
      : DEFAULT_UPCOMING_EVENTS_WINDOW_DAYS;
  }

  setUpcomingEventsWindowDays(days: number): void {
    safeWrite(storageKeys.upcomingEventsWindowDays, String(days));
  }

  getViewerTimeZone(): string | null {
    const raw = safeRead(storageKeys.viewerTimeZoneOverride);
    // An older save may hold the literal sentinel "auto" from before the auto-detected
    // mode was removed — treat it the same as nothing saved, not as a real IANA zone.
    return raw === null || raw === "auto" ? null : raw;
  }

  setViewerTimeZone(timeZone: string): void {
    safeWrite(storageKeys.viewerTimeZoneOverride, timeZone);
  }

  getMarketTrendBasis(): MarketTrendBasis {
    const raw = safeRead(storageKeys.marketTrendBasis);
    return VALID_MARKET_TREND_BASES.includes(raw as MarketTrendBasis)
      ? (raw as MarketTrendBasis)
      : DEFAULT_MARKET_TREND_BASIS;
  }

  setMarketTrendBasis(basis: MarketTrendBasis): void {
    safeWrite(storageKeys.marketTrendBasis, basis);
  }

  getOverrides(world: string, dateKey: string): BriefingOverrides | null {
    const raw = safeRead(storageKeys.overrides(world, dateKey));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as BriefingOverrides;
    } catch {
      return null;
    }
  }

  setOverrides(overrides: BriefingOverrides): void {
    safeWrite(storageKeys.overrides(overrides.world, overrides.date), JSON.stringify(overrides));
  }

  clearOverrides(world: string, dateKey: string): void {
    safeRemove(storageKeys.overrides(world, dateKey));
  }
}

export const briefingRepository = new LocalStorageBriefingRepository();
