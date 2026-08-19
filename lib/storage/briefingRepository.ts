import type { BriefingOverrides } from "@/types/briefing";
import type { BriefingLanguage } from "@/lib/formatter/translations";
import { storageKeys } from "./storageKeys";

export type BriefingFormat = "rich" | "plain";

const VALID_LANGUAGES: BriefingLanguage[] = ["pt", "en", "es", "pl"];
export const UPCOMING_EVENTS_WINDOW_OPTIONS = [5, 7, 14] as const;
const DEFAULT_UPCOMING_EVENTS_WINDOW_DAYS = 7;

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
