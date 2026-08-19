import { describe, expect, it } from "vitest";
import { generateBriefingMessage, generatePlainTextBriefing } from "./generateBriefing";
import { createDefaultOverrides } from "@/lib/defaults";
import type { BriefingInput } from "./briefingModel";

function makeInput(
  overridesPatch: Partial<ReturnType<typeof createDefaultOverrides>> = {},
  language: BriefingInput["language"] = "pt",
): BriefingInput {
  const referenceDate = new Date(2026, 7, 17); // 17 Aug 2026
  const overrides = { ...createDefaultOverrides("Ustebra", referenceDate), ...overridesPatch };

  overrides.miniWorldChanges["fury-gate"] = {
    id: "fury-gate",
    state: "active",
    detail: "",
    updatedAt: null,
  };
  overrides.worldChanges["hive-born"] = {
    id: "hive-born",
    state: "stage3",
    detail: "",
    updatedAt: null,
  };
  overrides.merchants.yasir = {
    id: "yasir",
    name: "Yasir",
    location: "Carlin",
    isComputed: false,
    updatedAt: null,
    activityState: "location-known",
  };
  overrides.merchants.rashid = {
    id: "rashid",
    name: "Rashid",
    location: "Svargrond",
    isComputed: true,
    updatedAt: null,
    activityState: "location-known",
  };
  overrides.boostedRegions = ["Venore"];

  return {
    world: "Ustebra",
    referenceDate,
    overrides,
    boostedCreature: { kind: "creature", name: "Gore Horn", imageUrl: null },
    boostedBoss: { kind: "boss", name: "Ratmiral", imageUrl: null },
    warzoneSchedule: null,
    activeEvents: [],
    upcomingEvents: [],
    drome: null,
    language,
    viewerTimeZone: "America/Sao_Paulo",
    upcomingEventsWindowDays: 14,
  };
}

describe("generateBriefingMessage", () => {
  it("matches the reference structure and content", () => {
    const message = generateBriefingMessage(makeInput());

    expect(message).toContain("📌17/08/2026");
    expect(message).toContain("🌞 Bom dia, Ustebra!");
    expect(message).toContain("👾 CRIATURA BOOSTADA: Gore Horn");
    expect(message).toContain("👹 BOSS BOOSTADO: Ratmiral");
    expect(message).toContain("🗺️ Região boostada: Venore");
    expect(message).toContain("💰 YASIR: Carlin");
    expect(message).toContain("👳🏼‍♂️ RASHID: Svargrond");
    expect(message).toContain("🔥 FURY GATE: Um portão de fúria se abriu perto de uma das grandes cidades.");
    expect(message).toContain("*🌍 WORLD CHANGES*");
    expect(message).toContain("👾 HIVE BORN");
    expect(message).toContain("Todas as estruturas da Hive estão abertas.");
    expect(message).toContain("*📅 PRÓXIMOS EVENTOS*");
  });

  it("renders a rich narrative for World Changes, with detail-driven variants and a fixed extra fact", () => {
    const input = makeInput();
    input.overrides.worldChanges["demon-war"] = {
      id: "demon-war",
      state: "stage2",
      detail: "Shaburak dominant",
      updatedAt: null,
    };
    input.overrides.worldChanges["sea-serpent"] = {
      id: "sea-serpent",
      state: "stage2",
      detail: "",
      updatedAt: null,
    };
    const message = generateBriefingMessage(input);
    expect(message).toContain("Os Shaburak convocaram seus líderes e dominam o complexo.");
    expect(message).toContain("A Serpent está desperta.");
    expect(message).toContain("⚔️ Renegade Quara dominam as regiões submersas de Oramond");
  });

  it("falls back to the compact form for a World Change state with no authored narrative", () => {
    const input = makeInput();
    input.overrides.worldChanges["hive-born"] = {
      id: "hive-born",
      state: "unknown",
      detail: "",
      updatedAt: null,
    };
    const message = generateBriefingMessage(input);
    expect(message).not.toContain("HIVE BORN");
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
    expect(message).not.toContain("GRIMVALE"); // still 'unknown', never shown
    expect(message).not.toContain("SPIDER'S NEST"); // 'inactive', hidden by default

    input.overrides.includeAllChanges = true;
    const fullMessage = generateBriefingMessage(input);
    expect(fullMessage).not.toContain("GRIMVALE"); // 'unknown' stays hidden even with includeAll
    expect(fullMessage).toContain("🕷️ SPIDER'S NEST: ❌");
  });

  it("shows a graceful empty state when there are no upcoming events", () => {
    const message = generateBriefingMessage(makeInput());
    expect(message).toContain("Nenhum evento programado no momento.");
  });

  it("renders warzone times converted to the viewer's own timezone, semicolon-separated", () => {
    const input = makeInput();
    input.warzoneSchedule = {
      world: "Ustebra",
      timezone: "Europe/Berlin", // CEST (UTC+2) in August
      tracksWarzoneService: true,
      mark: "healthy",
      executions: [
        { executionId: 1, scheduleTime: "12:00", warzoneSequence: "1-2-3" },
        { executionId: 2, scheduleTime: "20:00", warzoneSequence: "1-3-2" },
      ],
    };
    // viewerTimeZone is America/Sao_Paulo (UTC-3, no DST) — 5h behind Berlin in August.
    const message = generateBriefingMessage(input);
    expect(message).toContain("⚔️ WARZONES: 07:00 (1-2-3); 15:00 (1-3-2)");
  });

  it("renders market prices with a trend symbol and age only when a value is set", () => {
    const input = makeInput();
    const sourceTimestamp = input.referenceDate.getTime() - 2 * 60 * 60 * 1000; // 2h before "now"
    input.overrides.marketPrices.tibiaCoinSell = {
      id: "tibiaCoinSell",
      label: "Tibia Coins (Sell)",
      value: 41000,
      trend: "up",
      isLive: true,
      sourceTimestamp,
      updatedAt: "t",
      history: [
        { value: 40000, timestamp: sourceTimestamp - 86400000 },
        { value: 41000, timestamp: sourceTimestamp },
      ],
    };
    const message = generateBriefingMessage(input);
    expect(message).toContain("🪙 TIBIA COIN OFERTA DE VENDA: 41.000 gp ⬆️ (há 2h)");
    expect(message).not.toContain("GOLD TOKEN");
  });
});

describe("not-yet-verified vs. genuinely-zero-active empty states", () => {
  function cleanInput(): BriefingInput {
    const input = makeInput();
    // makeInput() always seeds fury-gate/hive-born as a baseline — undo that here so these
    // tests can exercise the true "nothing checked yet" starting point.
    input.overrides.miniWorldChanges["fury-gate"] = {
      id: "fury-gate",
      state: "unknown",
      detail: "",
      updatedAt: null,
    };
    input.overrides.worldChanges["hive-born"] = {
      id: "hive-born",
      state: "unknown",
      detail: "",
      updatedAt: null,
    };
    return input;
  }

  it("shows a distinct 'not yet verified' message when nothing has been checked at all", () => {
    const message = generateBriefingMessage(cleanInput());
    expect(message).toContain("Nenhuma Mini World Change foi verificada ainda hoje");
    expect(message).toContain("Nenhuma World Change foi consultada ainda hoje");
  });

  it("shows a distinct 'checked, none active' message once at least one entry was verified inactive", () => {
    const input = cleanInput();
    input.overrides.miniWorldChanges["fury-gate"] = {
      id: "fury-gate",
      state: "inactive",
      detail: "",
      updatedAt: null,
    };
    input.overrides.worldChanges["hive-born"] = {
      id: "hive-born",
      state: "inactive",
      detail: "",
      updatedAt: null,
    };
    const message = generateBriefingMessage(input);
    expect(message).toContain("World Board conferido — nenhuma Mini World Change ativa no momento.");
    expect(message).toContain("Nenhuma World Change ativa identificada hoje.");
  });
});

describe("language support", () => {
  it("renders section headers, greeting, and stage wording in English", () => {
    const message = generateBriefingMessage(makeInput({}, "en"));
    expect(message).toContain("🌞 Good morning, Ustebra!");
    expect(message).toContain("*🌎 TODAY'S ACTIVE EVENTS & STATUS*");
    expect(message).toContain("👾 BOOSTED CREATURE: Gore Horn");
    expect(message).toContain("Every Hive structure is open.");
    expect(message).toContain("*📅 NEXT EVENTS*");
  });

  it("renders Spanish and Polish greetings distinctly", () => {
    expect(generateBriefingMessage(makeInput({}, "es"))).toContain("🌞 ¡Buenos días, Ustebra!");
    expect(generateBriefingMessage(makeInput({}, "pl"))).toContain("🌞 Dzień dobry, Ustebra!");
  });

  it("keeps merchant names (Yasir/Rashid) untranslated across languages", () => {
    for (const language of ["pt", "en", "es", "pl"] as const) {
      const message = generateBriefingMessage(makeInput({}, language));
      expect(message).toContain("YASIR:");
      expect(message).toContain("RASHID:");
    }
  });
});

describe("generatePlainTextBriefing", () => {
  it("contains no markdown bold markers or decorative emoji", () => {
    const plain = generatePlainTextBriefing(makeInput());
    expect(plain).not.toContain("*");
    // Decorative section/field emoji should be gone; the ✅/❌ status glyphs stay
    // (they're functional content, not decoration).
    for (const decorative of ["📌", "🌞", "👾", "👹", "🗺️", "💰", "👳🏼‍♂️", "🎎", "🌍", "📅", "🪙"]) {
      expect(plain).not.toContain(decorative);
    }
    expect(plain).toContain("CRIATURA BOOSTADA: Gore Horn");
    expect(plain).toContain("FURY GATE: Um portão de fúria se abriu perto de uma das grandes cidades.");
    expect(plain).toContain("HIVE BORN");
    expect(plain).toContain("Todas as estruturas da Hive estão abertas.");
  });
});
