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

describe("mergeOverridesWithDefaults — Bibby/Noodles closed-location migration", () => {
  it("keeps a saved location that's still in the closed list", () => {
    const saved = {
      miniWorldChanges: {
        "bibbys-bloodbath": { id: "bibbys-bloodbath", state: "location", detail: "Carlin", updatedAt: "t" },
      },
    };
    const merged = mergeOverridesWithDefaults(saved, WORLD, DATE);
    expect(merged.miniWorldChanges["bibbys-bloodbath"]).toMatchObject({ state: "location", detail: "Carlin" });
  });

  it("drops a saved location no longer in the closed list back to 'active, pending'", () => {
    const saved = {
      miniWorldChanges: {
        "bibbys-bloodbath": {
          id: "bibbys-bloodbath",
          state: "location",
          detail: "Some free-typed place from before the closed list existed",
          updatedAt: "t",
        },
      },
    };
    const merged = mergeOverridesWithDefaults(saved, WORLD, DATE);
    expect(merged.miniWorldChanges["bibbys-bloodbath"]).toMatchObject({ state: "active", detail: "" });
  });

  it("leaves an unrelated Mini World Change (no closed list) untouched", () => {
    const saved = {
      miniWorldChanges: {
        "fury-gate": { id: "fury-gate", state: "active", detail: "", updatedAt: "t" },
      },
    };
    const merged = mergeOverridesWithDefaults(saved, WORLD, DATE);
    expect(merged.miniWorldChanges["fury-gate"]).toMatchObject({ state: "active" });
  });
});
