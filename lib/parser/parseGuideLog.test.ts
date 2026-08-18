import { describe, expect, it } from "vitest";
import { parseGuideLog } from "./parseGuideLog";

describe("parseGuideLog", () => {
  it("extracts a stage signal from a Guide reply", () => {
    const log = `
Player: hive
Guide Ferob: The hive is well defended and prepared for war. 12 actions have been taken against the Hive Born. 200 actions are necessary to advance further into the hive.
`;
    const result = parseGuideLog(log);
    const hive = result.signals.find((s) => s.changeId === "hive-born");
    expect(hive?.state).toBe("stage1");
  });

  it("carries extra nuance in detail when the catalog has it", () => {
    const log = `Guide: The Shaburak have summoned their leaders and dominate the complex.`;
    const result = parseGuideLog(log);
    const demonWar = result.signals.find((s) => s.changeId === "demon-war");
    expect(demonWar?.state).toBe("stage2");
    expect(demonWar?.detail).toMatch(/Shaburak/);
  });

  it("keeps only the latest reply per world change when asked more than once", () => {
    const log = `
Guide: Horestis near Ankrahmun is slumbering in his tomb.
... some time later ...
Guide: The great Pharaoh Horestis near Ankrahmun has risen from his slumber to crush all intruders.
`;
    const result = parseGuideLog(log);
    const horestis = result.signals.filter((s) => s.changeId === "horestis");
    expect(horestis).toHaveLength(1);
    expect(horestis[0]?.state).toBe("stage1");
  });

  it("returns nothing for a log with no known Guide replies", () => {
    const result = parseGuideLog("Guide: Hello there, adventurer!");
    expect(result.signals).toHaveLength(0);
  });
});
