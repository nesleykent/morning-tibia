import { describe, expect, it } from "vitest";
import {
  formatActiveEventLine,
  formatDromeLine,
  formatMarketPriceLabel,
  formatUpcomingEventLine,
  formatYasirLabel,
  notAvailableText,
} from "./phrases";
import type { ActiveEvent, UpcomingEvent } from "@/types/event";

const NOW = new Date("2026-08-18T12:00:00Z");
const TZ = "America/Sao_Paulo"; // stable UTC-3, no DST

function activeEvent(overrides: Partial<ActiveEvent> = {}): ActiveEvent {
  return {
    id: "a1",
    title: "Hot Cuisine Quest",
    url: null,
    endAt: new Date(NOW.getTime() + 13 * 86400000).toISOString(),
    daysRemaining: 13,
    ...overrides,
  };
}

function upcomingEvent(overrides: Partial<UpcomingEvent> = {}): UpcomingEvent {
  return {
    id: "u1",
    title: "Rise of Devovorga",
    url: null,
    startAt: new Date(NOW.getTime() + 14 * 86400000).toISOString(),
    daysUntil: 14,
    certainty: "confirmed",
    occurrenceIndex: 0,
    occurrenceCount: 1,
    ...overrides,
  };
}

describe("formatActiveEventLine", () => {
  it("uses the multi-day tier with Brazilian short date and correct pluralization", () => {
    expect(formatActiveEventLine(activeEvent({ daysRemaining: 13 }), "pt")).toBe(
      "ativa até 31/08, faltam 13 dias.",
    );
    expect(formatActiveEventLine(activeEvent({ daysRemaining: 1 }), "pt")).toBe("termina amanhã.");
    expect(formatActiveEventLine(activeEvent({ daysRemaining: 0 }), "pt")).toBe(
      "último dia, termina hoje.",
    );
  });

  it("uses singular phrasing for exactly one day remaining in the multi-day sense", () => {
    // daysRemaining=2 still uses the multi-day tier (only 0/1 get special tiers)
    const line = formatActiveEventLine(activeEvent({ daysRemaining: 2 }), "pt");
    expect(line).toContain("faltam 2 dias");
  });

  it("renders in English", () => {
    expect(formatActiveEventLine(activeEvent({ daysRemaining: 13 }), "en")).toBe(
      "active until 31/08, 13 days left.",
    );
  });
});

describe("formatUpcomingEventLine", () => {
  it("shows date + relative countdown within the 30-day threshold", () => {
    expect(formatUpcomingEventLine(upcomingEvent({ daysUntil: 14 }), "pt")).toBe("01/09, em 14 dias");
  });

  it("omits the countdown beyond the 30-day threshold", () => {
    const event = upcomingEvent({
      daysUntil: 116,
      startAt: new Date(NOW.getTime() + 116 * 86400000).toISOString(),
    });
    expect(formatUpcomingEventLine(event, "pt")).toBe("12/12");
  });

  it("prefixes estimated ('might') events distinctly from confirmed ones", () => {
    const event = upcomingEvent({ daysUntil: 14, certainty: "estimated" });
    expect(formatUpcomingEventLine(event, "pt")).toBe("previsto para 01/09, em 14 dias");
  });

  it("labels repeated titles with a phase marker", () => {
    const first = upcomingEvent({ occurrenceIndex: 0, occurrenceCount: 2 });
    const second = upcomingEvent({ occurrenceIndex: 1, occurrenceCount: 2 });
    expect(formatUpcomingEventLine(first, "pt")).toContain("(início)");
    expect(formatUpcomingEventLine(second, "pt")).toContain("(segunda fase)");
  });
});

describe("formatDromeLine", () => {
  it("uses the multi-day tier with a computed clock time in the viewer's zone", () => {
    // 3d17h remaining from NOW (18th 12:00 UTC = 18th 09:00 BRT) -> ends 22nd 05:00 UTC = 22nd 02:00 BRT (day 22 vs day 18 = 4 calendar days)
    const endsAt = new Date(NOW.getTime() + 3 * 86400000 + 17 * 3600000).toISOString();
    const line = formatDromeLine("#133", endsAt, "pt", NOW, TZ);
    expect(line).toBe("Rotação #133 ativa. Último dia em 4 dias, termina em 22/08 às 02:00.");
  });

  it("uses the 'tomorrow' tier a day out", () => {
    const endsAt = new Date(NOW.getTime() + 20 * 3600000).toISOString(); // ~20h away, next BRT calendar day
    const line = formatDromeLine("#133", endsAt, "pt", NOW, TZ);
    expect(line).toMatch(/^Último dia da Rotação #133\. Termina amanhã às \d{2}:\d{2}\.$/);
  });

  it("uses the final-hours tier under the 6h threshold", () => {
    const endsAt = new Date(NOW.getTime() + 3 * 3600000 + 24 * 60000).toISOString();
    const line = formatDromeLine("#133", endsAt, "pt", NOW, TZ);
    expect(line).toMatch(/^Últimas horas da Rotação #133\. Termina hoje às \d{2}:\d{2}, faltam 3h 24min\.$/);
  });
});

describe("formatMarketPriceLabel", () => {
  it("keeps item names untranslated and localizes only the literal sell/buy offer wording", () => {
    expect(formatMarketPriceLabel("tibiaCoinSell", "pt")).toBe("TIBIA COIN OFERTA DE VENDA");
    expect(formatMarketPriceLabel("tibiaCoinBuy", "pt")).toBe("TIBIA COIN OFERTA DE COMPRA");
    expect(formatMarketPriceLabel("goldTokenSell", "en")).toBe("GOLD TOKEN SELL OFFER");
    expect(formatMarketPriceLabel("silverTokenSell", "es")).toBe("SILVER TOKEN OFERTA DE VENTA");
  });
});

describe("formatYasirLabel", () => {
  it("gives each activityState a distinct, never-overlapping phrase", () => {
    const known = formatYasirLabel("location-known", "Carlin", "en");
    const pending = formatYasirLabel("pending-location", "", "en");
    const inactive = formatYasirLabel("inactive", "", "en");
    const notVerified = formatYasirLabel("not-verified", "", "en");
    expect(known).toBe("Carlin");
    expect(new Set([known, pending, inactive, notVerified]).size).toBe(4);
    // Specifically: "confirmed not around" must never read the same as "haven't checked".
    expect(inactive).not.toBe(notVerified);
  });
});

describe("notAvailableText", () => {
  it("differs per language", () => {
    expect(notAvailableText("pt")).toBe("não disponível");
    expect(notAvailableText("en")).toBe("not available");
  });
});
