import { describe, expect, it } from "vitest";
import { parseBoardLog } from "./parseBoardLog";
import { MINI_WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/miniWorldChanges";

const COMPLETE_SAMPLE_LOG = `
You see the world board.
This board will notify you of currently active mini world changes all over Tibia.
A fiery fury gate has opened near one of the major cities somewhere in Tibia.
A hive infestation has been sighted south-west of Liberty Bay! An unnerving humming and buzzing is filling the air.
A big iceberg has been washed up at the coast north of Port Hope. It seems to be inhabited by strange white furballs.
Adventurers have told of a Spirit Gate in Vengoth. Fight the restless undead!
Oriental ships sighted! A trader for exotic creature products may currently be
  visiting Carlin, Ankrahmun or Liberty Bay.
Hail to the King! It's Kingsday in Thais, join the celebration!
Bibby Bloodbath and her crew are roaming the lands, destroying everything in their path.
Some unrelated line that shouldn't match anything at all.
`;

const LIVE_BOARD_WITHOUT_TIMESTAMPS = `
A fiery fury gate has opened near one of the major cities somewhere in Tibia.
Poachers have slaughtered nearly all wild animals north of the Green Claw Swamp. But vengeful spirits show up there now!
A sandstorm travels through Darama, leading to isles full of deadly creatures inside a nightmare. Avoid the river near Drefia!
Nomads travel the eternal sands of Ankrahmun's desert. There must be a camp somewhere.
The volcano on Goroma sends its fiery message into the sky. A lot of creatures are flooding the lands together with its lava.
Adventurers have told of a Spirit Gate in the Ghostlands. Fight the restless undead!
`;

describe("parseBoardLog", () => {
  it("extracts a direct toggle signal", () => {
    const result = parseBoardLog(COMPLETE_SAMPLE_LOG);
    expect(
      result.signals.find((s) => s.changeId === "fury-gate")?.state,
    ).toBe("active");
  });

  it("extracts Hive Outpost", () => {
    const result = parseBoardLog(COMPLETE_SAMPLE_LOG);
    expect(
      result.signals.find((s) => s.changeId === "hive-outpost")?.state,
    ).toBe("active");
  });

  it("extracts location detail", () => {
    const result = parseBoardLog(COMPLETE_SAMPLE_LOG);
    const spiritGate = result.signals.find(
      (s) => s.changeId === "spirit-gate",
    );

    expect(spiritGate?.state).toBe("location");
    expect(spiritGate?.detail).toBe("Vengoth");
  });

  it("extracts Chakoya Iceberg as active", () => {
    const result = parseBoardLog(COMPLETE_SAMPLE_LOG);
    expect(
      result.signals.find((s) => s.changeId === "big-iceberg")?.state,
    ).toBe("active");
  });

  it("keeps Bibby active with location pending", () => {
    const result = parseBoardLog(COMPLETE_SAMPLE_LOG);
    const bibby = result.signals.find(
      (s) => s.changeId === "bibbys-bloodbath",
    );

    expect(bibby?.state).toBe("active");
    expect(bibby?.detail).toBe("");
  });

  it("parses a wrapped Oriental Trader message", () => {
    const result = parseBoardLog(COMPLETE_SAMPLE_LOG);

    expect(result.merchantHints).toHaveLength(1);
    expect(result.merchantHints[0]).toMatchObject({
      merchantId: "yasir",
      candidates: ["Carlin", "Ankrahmun", "Liberty Bay"],
    });
  });

  it("returns no snapshot for text with no board evidence", () => {
    const result = parseBoardLog(
      "Nothing to see here, just chatting with a friend.",
    );

    expect(result.signals).toHaveLength(0);
    expect(result.merchantHints).toHaveLength(0);
    expect(result.isCompleteSnapshot).toBe(false);
    expect(result.inactiveMerchantIds).toEqual([]);
  });

  describe("complete snapshot semantics", () => {
    it("accepts the official board preamble", () => {
      const result = parseBoardLog(COMPLETE_SAMPLE_LOG);
      expect(result.isCompleteSnapshot).toBe(true);
    });

    it("treats any recognized board entry as the current board reading", () => {
      const result = parseBoardLog(
        "A fiery fury gate has opened near one of the major cities somewhere in Tibia.",
      );

      expect(result.isCompleteSnapshot).toBe(true);

      expect(
        result.signals.find((s) => s.changeId === "fury-gate")?.state,
      ).toBe("active");

      expect(
        result.signals.find((s) => s.changeId === "hive-outpost")?.state,
      ).toBe("inactive");

      expect(
        result.signals.find((s) => s.changeId === "noodles")?.state,
      ).toBe("inactive");

      expect(
        result.signals.find((s) => s.changeId === "bibbys-bloodbath")?.state,
      ).toBe("inactive");

      expect(result.inactiveMerchantIds).toEqual(["yasir"]);
    });

    it("works with client timestamps disabled", () => {
      const result = parseBoardLog(LIVE_BOARD_WITHOUT_TIMESTAMPS);

      expect(result.isCompleteSnapshot).toBe(true);

      expect(
        result.signals.find((s) => s.changeId === "fury-gate")?.state,
      ).toBe("active");

      expect(
        result.signals.find((s) => s.changeId === "poacher-caves")?.state,
      ).toBe("stage3");

      expect(
        result.signals.find((s) => s.changeId === "nightmare-isles")?.detail,
      ).toBe("River near Drefia");

      expect(
        result.signals.find((s) => s.changeId === "darama-nomads")?.state,
      ).toBe("active");

      expect(
        result.signals.find((s) => s.changeId === "goroma-volcano")?.state,
      ).toBe("active");

      expect(
        result.signals.find((s) => s.changeId === "spirit-gate")?.detail,
      ).toBe("Ghostlands");

      expect(
        result.signals.find((s) => s.changeId === "hive-outpost")?.state,
      ).toBe("inactive");

      expect(
        result.signals.find((s) => s.changeId === "noodles")?.state,
      ).toBe("inactive");

      expect(result.inactiveMerchantIds).toEqual(["yasir"]);
    });

    it("works with client timestamps enabled", () => {
      const timestamped = LIVE_BOARD_WITHOUT_TIMESTAMPS
        .trim()
        .split("\n")
        .map((line) => `19:21:22 ${line}`)
        .join("\n");

      const result = parseBoardLog(timestamped);

      expect(result.isCompleteSnapshot).toBe(true);

      expect(
        result.signals.find((s) => s.changeId === "fury-gate")?.state,
      ).toBe("active");

      expect(
        result.signals.find((s) => s.changeId === "noodles")?.state,
      ).toBe("inactive");

      expect(result.inactiveMerchantIds).toEqual(["yasir"]);
    });

    it("synthesizes exactly one state for every Mini World Change", () => {
      const result = parseBoardLog(COMPLETE_SAMPLE_LOG);

      expect(result.signals).toHaveLength(
        MINI_WORLD_CHANGE_DEFINITIONS.length,
      );

      for (const def of MINI_WORLD_CHANGE_DEFINITIONS) {
        expect(
          result.signals.filter((s) => s.changeId === def.id),
        ).toHaveLength(1);
      }
    });

    it("marks every unmentioned Mini World Change inactive", () => {
      const result = parseBoardLog(COMPLETE_SAMPLE_LOG);

      expect(
        result.signals.find((s) => s.changeId === "goroma-volcano")?.state,
      ).toBe("inactive");

      expect(
        result.signals.find((s) => s.changeId === "noodles")?.state,
      ).toBe("inactive");
    });

    it("keeps Yasir active when Oriental Trader is present", () => {
      const result = parseBoardLog(COMPLETE_SAMPLE_LOG);

      expect(result.merchantHints.some(
        (hint) => hint.merchantId === "yasir",
      )).toBe(true);

      expect(result.inactiveMerchantIds).toEqual([]);
    });

    it("marks Yasir inactive when Oriental Trader is absent", () => {
      const result = parseBoardLog(
        "Hail to the King! It's Kingsday in Thais, join the celebration!",
      );

      expect(result.isCompleteSnapshot).toBe(true);
      expect(result.merchantHints).toHaveLength(0);
      expect(result.inactiveMerchantIds).toEqual(["yasir"]);
    });

    it("recognizes Oriental Trader alone as a complete board reading", () => {
      const result = parseBoardLog(
        "Oriental ships sighted! A trader for exotic creature products may currently be visiting Carlin, Ankrahmun or Liberty Bay.",
      );

      expect(result.isCompleteSnapshot).toBe(true);
      expect(result.merchantHints).toHaveLength(1);
      expect(result.inactiveMerchantIds).toEqual([]);

      expect(
        result.signals.every((signal) => signal.state === "inactive"),
      ).toBe(true);
    });
  });
});
