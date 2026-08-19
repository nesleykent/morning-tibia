import type { ActiveEvent, UpcomingEvent } from "@/types/event";
import type { MarketPriceId } from "@/types/market";
import type { BriefingLanguage } from "./translations";
import {
  calendarDayDiff,
  formatDuration,
  formatShortDateInZone,
  formatShortDateUTC,
  formatTimeInZone,
} from "./dateFormat";

const UPCOMING_COUNTDOWN_THRESHOLD_DAYS = 30;
const DROME_FINAL_HOURS_MS = 6 * 60 * 60 * 1000;

type Lang<T> = Record<BriefingLanguage, T>;

function pick<T>(map: Lang<T>, language: BriefingLanguage): T {
  return map[language];
}

/** "hoje"/"amanhã"/"em N dias" — the relative-day chunk shared by active & upcoming lines. */
function relativeDayWord(days: number, language: BriefingLanguage): string {
  if (days <= 0) return pick({ pt: "hoje", en: "today", es: "hoy", pl: "dziś" }, language);
  if (days === 1) return pick({ pt: "amanhã", en: "tomorrow", es: "mañana", pl: "jutro" }, language);
  return pick(
    {
      pt: `em ${days} dias`,
      en: `in ${days} days`,
      es: `en ${days} días`,
      pl: `za ${days} dni`,
    },
    language,
  );
}

function daysRemainingPhrase(days: number, language: BriefingLanguage): string {
  const one = pick(
    { pt: "falta 1 dia", en: "1 day left", es: "queda 1 día", pl: "został 1 dzień" },
    language,
  );
  const many = pick(
    {
      pt: `faltam ${days} dias`,
      en: `${days} days left`,
      es: `quedan ${days} días`,
      pl: `zostało ${days} dni`,
    },
    language,
  );
  return days === 1 ? one : many;
}

function estimatedForPrefix(language: BriefingLanguage): string {
  return pick(
    { pt: "previsto para", en: "estimated for", es: "previsto para", pl: "przewidywane na" },
    language,
  );
}

function activeUntilPrefix(language: BriefingLanguage): string {
  return pick(
    { pt: "ativa até", en: "active until", es: "activa hasta", pl: "aktywne do" },
    language,
  );
}

function phaseLabel(index: number, language: BriefingLanguage): string {
  if (index === 0) return pick({ pt: "início", en: "1st window", es: "inicio", pl: "początek" }, language);
  if (index === 1) {
    return pick(
      { pt: "segunda fase", en: "2nd window", es: "segunda fase", pl: "druga faza" },
      language,
    );
  }
  return pick(
    {
      pt: `fase ${index + 1}`,
      en: `window ${index + 1}`,
      es: `fase ${index + 1}`,
      pl: `faza ${index + 1}`,
    },
    language,
  );
}

/**
 * Content for one active event line (after the emoji + title), e.g. "ativa até 31/08,
 * faltam 13 dias." or "último dia, termina hoje." Tiered by daysRemaining, matching the
 * same "today/tomorrow/N days" pattern used for the Drome deadline.
 */
export function formatActiveEventLine(event: ActiveEvent, language: BriefingLanguage): string {
  if (event.daysRemaining <= 0) {
    return pick(
      {
        pt: "último dia, termina hoje.",
        en: "last day, ends today.",
        es: "último día, termina hoy.",
        pl: "ostatni dzień, kończy się dziś.",
      },
      language,
    );
  }
  if (event.daysRemaining === 1) {
    return pick(
      {
        pt: "termina amanhã.",
        en: "ends tomorrow.",
        es: "termina mañana.",
        pl: "kończy się jutro.",
      },
      language,
    );
  }
  const shortDate = formatShortDateUTC(new Date(event.endAt));
  return `${activeUntilPrefix(language)} ${shortDate}, ${daysRemainingPhrase(event.daysRemaining, language)}.`;
}

/**
 * Content for one upcoming event line, e.g. "01/09, em 14 dias" or "previsto para
 * 01/09, em 14 dias" (estimated/"might" source events) or just "12/12" once it's more
 * than 30 days out (a countdown stops being useful that far ahead). Appends a phase
 * label when the same title recurs (e.g. a two-window seasonal event).
 */
export function formatUpcomingEventLine(event: UpcomingEvent, language: BriefingLanguage): string {
  const shortDate = formatShortDateUTC(new Date(event.startAt));
  const withinThreshold = event.daysUntil <= UPCOMING_COUNTDOWN_THRESHOLD_DAYS;
  const countdown = withinThreshold ? `, ${relativeDayWord(event.daysUntil, language)}` : "";
  const base =
    event.certainty === "estimated"
      ? `${estimatedForPrefix(language)} ${shortDate}${countdown}`
      : `${shortDate}${countdown}`;
  const phase = event.occurrenceCount > 1 ? ` (${phaseLabel(event.occurrenceIndex, language)})` : "";
  return `${base}${phase}`;
}

function rotationLabel(rotationNumber: string, language: BriefingLanguage): string {
  return pick(
    {
      pt: `Rotação ${rotationNumber}`,
      en: `Rotation ${rotationNumber}`,
      es: `Rotación ${rotationNumber}`,
      pl: `Rotacja ${rotationNumber}`,
    },
    language,
  );
}

/**
 * The full Tibia Drome deadline sentence — the primary concept is "how long until this
 * rotation ends", not "when does the next one start", with four phrasing tiers (multi-day
 * / tomorrow / today / final hours) matching how urgently a player needs to act.
 */
export function formatDromeLine(
  rotationNumber: string,
  endsAtIso: string,
  language: BriefingLanguage,
  now: Date,
  viewerTimeZone: string,
): string {
  const endsAt = new Date(endsAtIso);
  const msRemaining = Math.max(0, endsAt.getTime() - now.getTime());
  const time = formatTimeInZone(endsAt, viewerTimeZone);
  const label = rotationLabel(rotationNumber, language);

  if (msRemaining <= DROME_FINAL_HOURS_MS) {
    const duration = formatDuration(msRemaining / 60000);
    return pick(
      {
        pt: `Últimas horas da ${label}. Termina hoje às ${time}, faltam ${duration}.`,
        en: `Final hours of ${label}. Ends today at ${time}, ${duration} left.`,
        es: `Últimas horas de la ${label}. Termina hoy a las ${time}, quedan ${duration}.`,
        pl: `Ostatnie godziny ${label}. Kończy się dziś o ${time}, zostało ${duration}.`,
      },
      language,
    );
  }

  const dayDiff = calendarDayDiff(now, endsAt, viewerTimeZone);

  if (dayDiff <= 0) {
    return pick(
      {
        pt: `Último dia da ${label}. Termina hoje às ${time}.`,
        en: `Last day of ${label}. Ends today at ${time}.`,
        es: `Último día de la ${label}. Termina hoy a las ${time}.`,
        pl: `Ostatni dzień ${label}. Kończy się dziś o ${time}.`,
      },
      language,
    );
  }
  if (dayDiff === 1) {
    return pick(
      {
        pt: `Último dia da ${label}. Termina amanhã às ${time}.`,
        en: `Last day of ${label}. Ends tomorrow at ${time}.`,
        es: `Último día de la ${label}. Termina mañana a las ${time}.`,
        pl: `Ostatni dzień ${label}. Kończy się jutro o ${time}.`,
      },
      language,
    );
  }

  const shortDate = formatShortDateInZone(endsAt, viewerTimeZone);
  return pick(
    {
      pt: `${label} ativa. Último dia em ${dayDiff} dias, termina em ${shortDate} às ${time}.`,
      en: `${label} active. Last day in ${dayDiff} days, ends on ${shortDate} at ${time}.`,
      es: `${label} activa. Último día en ${dayDiff} días, termina el ${shortDate} a las ${time}.`,
      pl: `${label} aktywna. Ostatni dzień za ${dayDiff} dni, kończy się ${shortDate} o ${time}.`,
    },
    language,
  );
}

const MARKET_SELL_WORD: Lang<string> = { pt: "VENDENDO", en: "SELLING", es: "VENDIENDO", pl: "SPRZEDAŻ" };
const MARKET_BUY_WORD: Lang<string> = { pt: "COMPRANDO", en: "BUYING", es: "COMPRANDO", pl: "KUPNO" };

const MARKET_ITEM_NAME: Record<MarketPriceId, string> = {
  tibiaCoinSell: "TIBIA COIN",
  tibiaCoinBuy: "TIBIA COIN",
  goldTokenSell: "GOLD TOKEN",
  silverTokenSell: "SILVER TOKEN",
};

/** In-game item names stay as-is across languages (proper nouns); only SELL/BUY is localized. */
export function formatMarketPriceLabel(id: MarketPriceId, language: BriefingLanguage): string {
  const word = id === "tibiaCoinBuy" ? MARKET_BUY_WORD[language] : MARKET_SELL_WORD[language];
  return `${MARKET_ITEM_NAME[id]} ${word}`;
}

/** Localized "how long ago" label for a market price's last observed change — minutes,
 * hours, or days, matching lib/utils/timeAgo.ts's English-only thresholds but per language. */
export function formatPriceAge(timestampMs: number, now: number, language: BriefingLanguage): string {
  const diffMinutes = Math.max(0, Math.round((now - timestampMs) / 60000));
  if (diffMinutes < 1) {
    return pick({ pt: "agora mesmo", en: "just now", es: "justo ahora", pl: "przed chwilą" }, language);
  }
  if (diffMinutes < 60) {
    return pick(
      { pt: `há ${diffMinutes}min`, en: `${diffMinutes}m ago`, es: `hace ${diffMinutes}min`, pl: `${diffMinutes}min temu` },
      language,
    );
  }
  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) {
    return pick({ pt: `há ${hours}h`, en: `${hours}h ago`, es: `hace ${hours}h`, pl: `${hours}h temu` }, language);
  }
  const days = Math.round(hours / 24);
  return pick(
    { pt: `há ${days}d`, en: `${days}d ago`, es: `hace ${days}d`, pl: `${days}d temu` },
    language,
  );
}

export function notAvailableText(language: BriefingLanguage): string {
  return pick(
    { pt: "não disponível", en: "not available", es: "no disponible", pl: "niedostępne" },
    language,
  );
}
