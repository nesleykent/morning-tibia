import { describe, expect, it } from "vitest";
import { generateBriefingMessage, generatePlainTextBriefing } from "./generateBriefing";
import { createDefaultOverrides } from "@/lib/defaults";
import type { BriefingInput } from "./briefingModel";

function makeInput(overridesPatch: Partial<ReturnType<typeof createDefaultOverrides>> = {}): BriefingInput {
  const referenceDate = new Date(2026, 7, 17); // 17 Aug 2026
  const overrides = { ...createDefaultOverrides("Ustebra", referenceDate), ...overridesPatch };

  overrides.miniWorldChanges["fury-gate"] = {
    id: "fury-gate",
    state: "active",
    detail: "",
    updatedAt: null,
  };
  overrides.miniWorldChanges["hive"] = {
    id: "hive",
    state: "stage3",
    detail: "",
    updatedAt: null,
  };
  overrides.merchants.yasir = { id: "yasir", name: "Yasir", location: "Carlin", isComputed: false, updatedAt: null };
  overrides.merchants.rashid = { id: "rashid", name: "Rashid", location: "Svargrond", isComputed: true, updatedAt: null };
  overrides.boostedRegion = "Venore";

  return {
    world: "Ustebra",
    referenceDate,
    overrides,
    boostedCreature: { kind: "creature", name: "Gore Horn", imageUrl: null },
    boostedBoss: { kind: "boss", name: "Ratmiral", imageUrl: null },
    warzoneSchedule: null,
  };
}

describe("generateBriefingMessage", () => {
  it("matches the reference structure and content", () => {
    const message = generateBriefingMessage(makeInput());

    expect(message).toContain("📌17/08/2026");
    expect(message).toContain("🌞Bom dia Ustebra!");
    expect(message).toContain("👾*CRIATURA BOOSTADA:* Gore Horn");
    expect(message).toContain("👹*BOSS BOOSTADO:* Ratmiral");
    expect(message).toContain("🗺️*Região boostada:* Venore");
    expect(message).toContain("💰*YASIR:* Carlin");
    expect(message).toContain("👳🏼‍♂️*RASHID:* Svargrond");
    expect(message).toContain("🔥*FURY GATE:* ✅");
    expect(message).toContain("👾*HIVE:* ✅ - 3º Estágio");
    expect(message).toContain("📅 *NEXT EVENTOS:*");
  });

  it("omits unknown mini world changes always, and inactive ones unless includeAll is set", () => {
    const input = makeInput();
    input.overrides.miniWorldChanges["spiders-nest"] = {
      id: "spiders-nest",
      state: "inactive",
      detail: "",
      updatedAt: null,
    };

    const message = generateBriefingMessage(input);
    expect(message).not.toContain("ROSHAMUUL"); // still 'unknown', never shown
    expect(message).not.toContain("SPIDER'S NEST"); // 'inactive', hidden by default

    input.overrides.includeAllMiniWorldChanges = true;
    const fullMessage = generateBriefingMessage(input);
    expect(fullMessage).not.toContain("ROSHAMUUL"); // 'unknown' stays hidden even with includeAll
    expect(fullMessage).toContain("🕷️*SPIDER'S NEST:* ❌");
  });

  it("shows a graceful empty state when there are no upcoming events", () => {
    const message = generateBriefingMessage(makeInput());
    expect(message).toContain("Nenhum evento programado no momento.");
  });

  it("renders market prices with a trend symbol only when a value is set", () => {
    const input = makeInput();
    input.overrides.marketPrices.tibiaCoinSell = {
      id: "tibiaCoinSell",
      label: "Tibia Coin — sell",
      value: 41000,
      previousValue: 40000,
      trend: "up",
      isLive: true,
      updatedAt: "t",
    };
    const message = generateBriefingMessage(input);
    expect(message).toContain("🪙*Tibia Coin — sell:* 41.000 gp 🔺");
    expect(message).not.toContain("Gold Token");
  });
});

describe("generatePlainTextBriefing", () => {
  it("contains no markdown bold markers or decorative emoji", () => {
    const plain = generatePlainTextBriefing(makeInput());
    expect(plain).not.toContain("*");
    // Decorative section/field emoji should be gone; the ✅/❌ status glyphs stay
    // (they're functional content, not decoration).
    for (const decorative of ["📌", "🌞", "👾", "👹", "🗺️", "💰", "👳🏼‍♂️", "🎎", "📅", "🪙"]) {
      expect(plain).not.toContain(decorative);
    }
    expect(plain).toContain("CRIATURA BOOSTADA: Gore Horn");
    expect(plain).toContain("FURY GATE: ✅");
  });
});
