import type { ActiveEvent, UpcomingEvent } from "@/types/event";
import type { MarketPriceId } from "@/types/market";
import { toTibiaDayKey } from "@/lib/utils/date";
import type { BriefingLanguage } from "./translations";
import {
  calendarDayDiff,
  formatDuration,
  formatLongDateUTC,
  formatRelativeWeekday,
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

/** Represent an instant by the calendar date of the Tibia day it belongs to. */
function dateOnTibiaDay(instant: Date): Date {
  const [year, month, day] = toTibiaDayKey(instant).split("-").map(Number);
  return new Date(Date.UTC(year!, month! - 1, day!, 12));
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
        pt: "último dia, termina hoje",
        en: "last day, ends today",
        es: "último día, termina hoy",
        pl: "ostatni dzień, kończy się dziś",
      },
      language,
    );
  }
  if (event.daysRemaining === 1) {
    return pick(
      {
        pt: "termina amanhã",
        en: "ends tomorrow",
        es: "termina mañana",
        pl: "kończy się jutro",
      },
      language,
    );
  }
  const shortDate = formatShortDateUTC(dateOnTibiaDay(new Date(event.endAt)));
  return `${activeUntilPrefix(language)} ${shortDate} (${daysRemainingPhrase(event.daysRemaining, language)})`;
}

/**
 * Content for one upcoming event line, e.g. "01/09, em 14 dias" or "previsto para
 * 01/09, em 14 dias" (estimated/"might" source events) or just "12/12" once it's more
 * than 30 days out (a countdown stops being useful that far ahead). Appends a phase
 * label when the same title recurs (e.g. a two-window seasonal event).
 */
/**
 * The date an upcoming event starts, written the way an invitation writes it.
 *
 * The countdown is *not* here: the bulletin gives it its own line under the date, so a reader
 * scanning the events section sees "12 de Setembro" and "Em 2 dias" as two separate facts
 * rather than one run-on. See `formatUpcomingEventCountdown`.
 */
export function formatUpcomingEventDate(event: UpcomingEvent, language: BriefingLanguage): string {
  const date = formatLongDateUTC(dateOnTibiaDay(new Date(event.startAt)), language);
  const notes: string[] = [];
  if (event.certainty === "estimated") {
    notes.push(pick({ pt: "previsto", en: "estimated", es: "previsto", pl: "przewidywane" }, language));
  }
  if (event.occurrenceCount > 1) notes.push(phaseLabel(event.occurrenceIndex, language));
  return notes.length > 0 ? `${date} (${notes.join(", ")})` : date;
}

/**
 * "Appears on 13 September." — a date that lives inside an event's own window.
 *
 * Several events have something that happens on a fixed day of the month rather than on the
 * day the event opens: Feroxa always spawns on the 13th, whatever day Grimvale starts. That
 * day is the single most useful thing the preview can say, and it is worked out here from the
 * occurrence's start date rather than written into the catalog, so nobody has to edit a
 * sentence every month.
 *
 * The day is read as "the next time that day comes round from the start", which is how an
 * event window works: a 13th named against a window that opens on the 12th is this month's,
 * and one named against a window that opens on the 28th is next month's.
 */
export function formatEventInternalDate(
  startAt: string,
  dayOfMonth: number,
  language: BriefingLanguage,
): string {
  const start = new Date(startAt);
  const year = start.getUTCFullYear();
  const month = start.getUTCMonth() + (dayOfMonth < start.getUTCDate() ? 1 : 0);
  const date = new Date(Date.UTC(year, month, dayOfMonth));
  const spoken = formatLongDateUTC(date, language);
  return pick(
    {
      pt: `Aparece em ${spoken}.`,
      en: `Appears on ${spoken}.`,
      es: `Aparece el ${spoken}.`,
      pl: `Pojawia się ${spoken}.`,
    },
    language,
  );
}

export function formatUpcomingEventLine(event: UpcomingEvent, language: BriefingLanguage): string {
  const shortDate = formatShortDateUTC(dateOnTibiaDay(new Date(event.startAt)));
  const withinThreshold = event.daysUntil <= UPCOMING_COUNTDOWN_THRESHOLD_DAYS;
  const countdown = withinThreshold ? `, ${relativeDayWord(event.daysUntil, language)}` : "";
  const base =
    event.certainty === "estimated"
      ? `${estimatedForPrefix(language)} ${shortDate}${countdown}`
      : `${shortDate}${countdown}`;
  const phase = event.occurrenceCount > 1 ? ` (${phaseLabel(event.occurrenceIndex, language)})` : "";
  return `${base}${phase}`;
}

/** Sentence-initial use of a value that is otherwise lower case ("rotação 42"). */
function capitalize(text: string): string {
  return text.length === 0 ? text : text[0]!.toUpperCase() + text.slice(1);
}

/**
 * Lower case, because the label is a *value*: it reads "Drome: rotação 42 até 14/09" beside
 * "Criatura: Badger", and mid-sentence as "Últimas horas da rotação 42". The two places where
 * it opens a sentence capitalize it explicitly.
 */
function rotationLabel(rotationNumber: string, language: BriefingLanguage): string {
  const number = `#${rotationNumber.replace(/^#+/, "")}`;
  return pick(
    {
      pt: `rotação ${number}`,
      en: `rotation ${number}`,
      es: `rotación ${number}`,
      pl: `rotacja ${number}`,
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
      pt: `${capitalize(label)} ativa. Último dia em ${dayDiff} dias, termina em ${shortDate} às ${time}.`,
      en: `${capitalize(label)} active. Last day in ${dayDiff} days, ends on ${shortDate} at ${time}.`,
      es: `${capitalize(label)} activa. Último día en ${dayDiff} días, termina el ${shortDate} a las ${time}.`,
      pl: `${capitalize(label)} aktywna. Ostatni dzień za ${dayDiff} dni, kończy się ${shortDate} o ${time}.`,
    },
    language,
  );
}


/**
 * Compact Drome text for the daily briefing.
 *
 * The clock time is omitted because the rotation boundary is the Tibia
 * server save. The briefing keeps the end date and remaining calendar days.
 */
/**
 * The Drome deadline, split into the claim and the countdown.
 *
 * Two fields rather than one string because the bulletin sets the countdown in italics beside
 * the date, and markup is the renderer's business — a model that baked in `_(faltam 5 dias)_`
 * would put WhatsApp syntax into the plain-text output.
 *
 * Inside the coming week the date is said rather than written: "até terça que vem" is how a
 * person reports a deadline five days out, and "até 16/09" is how a spreadsheet does.
 */
export function formatDromeBriefingParts(
  rotationNumber: string,
  endsAtIso: string,
  language: BriefingLanguage,
  now: Date,
  viewerTimeZone: string,
): { label: string; countdown: string | null } {
  const endsAt = new Date(endsAtIso);
  const dayDiff = Math.max(0, calendarDayDiff(now, endsAt, viewerTimeZone));
  const label = rotationLabel(rotationNumber, language);
  const weekday = formatRelativeWeekday(endsAt, dayDiff, viewerTimeZone, language);
  const when = weekday ?? formatShortDateInZone(endsAt, viewerTimeZone);

  const until = pick(
    { pt: `${label} até ${when}`, en: `${label} until ${when}`, es: `${label} hasta ${when}`, pl: `${label} do ${when}` },
    language,
  );

  if (dayDiff <= 0) {
    return { label: until, countdown: pick({ pt: "hoje", en: "today", es: "hoy", pl: "dzisiaj" }, language) };
  }
  if (dayDiff === 1) {
    return {
      label: until,
      countdown: pick(
        { pt: "falta 1 dia", en: "1 day left", es: "queda 1 día", pl: "został 1 dzień" },
        language,
      ),
    };
  }
  return {
    label: until,
    countdown: pick(
      {
        pt: `faltam ${dayDiff} dias`,
        en: `${dayDiff} days left`,
        es: `quedan ${dayDiff} días`,
        pl: `zostało ${dayDiff} dni`,
      },
      language,
    ),
  };
}

export function formatDromeBriefingLine(
  rotationNumber: string,
  endsAtIso: string,
  language: BriefingLanguage,
  now: Date,
  viewerTimeZone: string,
): string {
  const endsAt = new Date(endsAtIso);
  const shortDate = formatShortDateInZone(
    endsAt,
    viewerTimeZone,
  );

  const dayDiff = Math.max(
    0,
    calendarDayDiff(
      now,
      endsAt,
      viewerTimeZone,
    ),
  );

  const label = rotationLabel(
    rotationNumber,
    language,
  );

  if (dayDiff <= 0) {
    return pick(
      {
        pt: `${label} até ${shortDate} (hoje)`,
        en: `${label} until ${shortDate} (today)`,
        es: `${label} hasta ${shortDate} (hoy)`,
        pl: `${label} do ${shortDate} (dzisiaj)`,
      },
      language,
    );
  }

  if (dayDiff === 1) {
    return pick(
      {
        pt: `${label} até ${shortDate} (falta 1 dia)`,
        en: `${label} until ${shortDate} (1 day left)`,
        es: `${label} hasta ${shortDate} (queda 1 día)`,
        pl: `${label} do ${shortDate} (został 1 dzień)`,
      },
      language,
    );
  }

  return pick(
    {
      pt: `${label} até ${shortDate} (faltam ${dayDiff} dias)`,
      en: `${label} until ${shortDate} (${dayDiff} days left)`,
      es: `${label} hasta ${shortDate} (quedan ${dayDiff} días)`,
      pl: `${label} do ${shortDate} (zostało ${dayDiff} dni)`,
    },
    language,
  );
}

// Literal market-order terminology (matches lib/defaults/marketPrices.ts's UI labels and
// the underlying sellOffer/buyOffer API fields) — not a "player perspective" gloss.
const MARKET_SELL_WORD: Lang<string> = {
  pt: "OFERTA DE VENDA",
  en: "SELL OFFER",
  es: "OFERTA DE VENTA",
  pl: "OFERTA SPRZEDAŻY",
};
const MARKET_BUY_WORD: Lang<string> = {
  pt: "OFERTA DE COMPRA",
  en: "BUY OFFER",
  es: "OFERTA DE COMPRA",
  pl: "OFERTA KUPNA",
};

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

/** Yasir's briefing line needs to distinguish "we haven't checked" from "we checked and
 * he's confirmed not around" — a generic notAvailableText() would read the same for both. */
export function formatYasirLabel(
  activityState: "not-verified" | "inactive" | "pending-location" | "location-known",
  location: string,
  language: BriefingLanguage,
): string {
  if (activityState === "location-known" && location.trim().length > 0) return location.trim();
  if (activityState === "pending-location") {
    return pick(
      { pt: "ativo, localização pendente", en: "active, location pending", es: "activo, ubicación pendiente", pl: "aktywny, lokalizacja nieznana" },
      language,
    );
  }
  if (activityState === "inactive") {
    // A plain statement of the confirmed fact, in the briefing's own language. This used to be
    // the pun "No Sir!" in all four languages, which reads as a joke rather than as the
    // settled answer it is — and left a Portuguese briefing with an English line in it.
    return pick(
      {
        pt: "não está comerciando hoje",
        en: "not trading today",
        es: "no está comerciando hoy",
        pl: "dziś nie handluje",
      },
      language,
    );
  }
  return pick(
    { pt: "ainda não verificado", en: "not yet checked", es: "aún no verificado", pl: "jeszcze nie sprawdzono" },
    language,
  );
}
