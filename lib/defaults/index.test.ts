import { describe, expect, it } from "vitest";
import { mergeOverridesWithDefaults } from "./index";

const WORLD = "Ustebra";
const DATE = new Date(2026, 7, 19);

describe("mergeOverridesWithDefaults — merchant activityState migration", () => {
  it("backfills a missing activityState on an older save", () => {
    const saved = {
      merchants: {
        yasir: { id: "yasir", name: "Yasir", location: "Carlin", isComputed: false, updatedAt: "t" },
      },
    };
    const merged = mergeOverridesWithDefaults(saved, WORLD, DATE);
    expect(merged.merchants.yasir?.location).toBe("Carlin");
    expect(merged.merchants.yasir?.activityState).toBe("not-verified");
  });

  it("keeps a valid saved activityState as-is", () => {
    const saved = {
      merchants: {
        yasir: {
          id: "yasir",
          name: "Yasir",
          location: "Ankrahmun",
          isComputed: false,
          updatedAt: "t",
          activityState: "location-known",
        },
      },
    };
    const merged = mergeOverridesWithDefaults(saved, WORLD, DATE);
    expect(merged.merchants.yasir?.activityState).toBe("location-known");
  });

  it("discards an invalid activityState back to the default", () => {
    const saved = {
      merchants: {
        yasir: {
          id: "yasir",
          name: "Yasir",
          location: "",
          isComputed: false,
          updatedAt: null,
          activityState: "some-old-value",
        },
      },
    };
    const merged = mergeOverridesWithDefaults(saved, WORLD, DATE);
    expect(merged.merchants.yasir?.activityState).toBe("not-verified");
  });

  it("keeps Rashid deterministically location-known regardless of the save", () => {
    const merged = mergeOverridesWithDefaults({}, WORLD, DATE);
    expect(merged.merchants.rashid?.activityState).toBe("location-known");
  });
});

describe("mergeOverridesWithDefaults — legacy Mini World Change saves", () => {
  it("maps a renamed id onto its canonical one", () => {
    // "bibbys-bloodbath" was the app's own name for what TibiaWiki calls Warpath.
    const saved = {
      miniWorldChanges: {
        "bibbys-bloodbath": { id: "bibbys-bloodbath", state: "active", detail: "", updatedAt: "t" },
      },
    };
    const merged = mergeOverridesWithDefaults(saved, WORLD, DATE);
    expect(merged.miniWorldChanges["warpath"]).toMatchObject({ status: "active", variantId: null });
  });

  it("keeps a legacy location that matches a real variant label", () => {
    const saved = {
      miniWorldChanges: {
        "spirit-gate": { id: "spirit-gate", state: "location", detail: "Vengoth", updatedAt: "t" },
      },
    };
    const merged = mergeOverridesWithDefaults(saved, WORLD, DATE);
    expect(merged.miniWorldChanges["spirit-grounds"]).toMatchObject({
      status: "active",
      variantId: "vengoth",
    });
  });

  it("drops a free-typed legacy location rather than forcing it onto a variant", () => {
    const saved = {
      miniWorldChanges: {
        noodles: {
          id: "noodles",
          state: "location",
          detail: "Some free-typed place from before the closed list existed",
          updatedAt: "t",
        },
      },
    };
    const merged = mergeOverridesWithDefaults(saved, WORLD, DATE);
    expect(merged.miniWorldChanges["noodles-is-gone"]).toMatchObject({
      status: "active",
      variantId: null,
    });
  });

  it("turns the old 'unknown' state into 'unchecked', never 'inactive'", () => {
    const saved = {
      miniWorldChanges: {
        "fury-gate": { id: "fury-gate", state: "unknown", detail: "", updatedAt: "t" },
      },
    };
    const merged = mergeOverridesWithDefaults(saved, WORLD, DATE);
    expect(merged.miniWorldChanges["fury-gates"]?.status).toBe("unchecked");
  });

  it("preserves a confirmed-inactive save", () => {
    const saved = {
      miniWorldChanges: {
        "fury-gate": { id: "fury-gate", state: "inactive", detail: "", updatedAt: "t" },
      },
    };
    const merged = mergeOverridesWithDefaults(saved, WORLD, DATE);
    expect(merged.miniWorldChanges["fury-gates"]?.status).toBe("inactive");
  });

  it("maps an old stage state to 'active' without inventing a variant", () => {
    // stage1..3 meant different things per change and can't be mapped back reliably.
    const saved = {
      miniWorldChanges: {
        "poacher-caves": { id: "poacher-caves", state: "stage2", detail: "", updatedAt: "t" },
      },
    };
    const merged = mergeOverridesWithDefaults(saved, WORLD, DATE);
    expect(merged.miniWorldChanges["poacher-caves"]).toMatchObject({
      status: "active",
      variantId: null,
    });
  });
});

describe("mergeOverridesWithDefaults — legacy World Change saves", () => {
  it("resets an old stage-based save to 'not asked' instead of guessing a state", () => {
    const saved = {
      worldChanges: {
        horestis: { id: "horestis", state: "stage2", detail: "", updatedAt: "t" },
      },
    };
    const merged = mergeOverridesWithDefaults(saved, WORLD, DATE);
    expect(merged.worldChanges["horestis"]?.stateId).toBeNull();
  });

  it("keeps a save already using a documented state id", () => {
    const saved = {
      worldChanges: {
        horestis: { id: "horestis", stateId: "risen", updatedAt: "t" },
      },
    };
    const merged = mergeOverridesWithDefaults(saved, WORLD, DATE);
    expect(merged.worldChanges["horestis"]?.stateId).toBe("risen");
  });

  it("rejects a state id that isn't documented for that change", () => {
    const saved = {
      worldChanges: {
        horestis: { id: "horestis", stateId: "burning", updatedAt: "t" },
      },
    };
    const merged = mergeOverridesWithDefaults(saved, WORLD, DATE);
    expect(merged.worldChanges["horestis"]?.stateId).toBeNull();
  });
});

describe("mergeOverridesWithDefaults — market price trend migration", () => {
  it("drops an older save's stale stored trend field (now always derived on the fly)", () => {
    const saved = {
      marketPrices: {
        tibiaCoinSell: {
          id: "tibiaCoinSell",
          label: "stale label",
          value: 41000,
          trend: "down",
          isLive: false,
          sourceTimestamp: null,
          updatedAt: "t",
          history: [{ value: 41000, timestamp: 1000 }],
        },
      },
    };
    const merged = mergeOverridesWithDefaults(saved, WORLD, DATE);
    expect(merged.marketPrices.tibiaCoinSell).not.toHaveProperty("trend");
    expect(merged.marketPrices.tibiaCoinSell?.value).toBe(41000);
    expect(merged.marketPrices.tibiaCoinSell?.label).toBe("Tibia Coin Sell Offer"); // current default, not the stale save
  });
});
