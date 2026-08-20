import { describe, expect, it } from "vitest";
import { parseGameText } from "./parseGameText";

describe("2026-08-19 live Tibia regression", () => {
  it("parses the six observed Mini World Changes and the two previously broken Guide replies", () => {
    const log = `
19:21:22 A fiery fury gate has opened near one of the major cities somewhere in Tibia.
19:21:22 Poachers have slaughtered nearly all wild animals north of the Green Claw Swamp. But vengeful spirits show up there now!
19:21:22 A sandstorm travels through Darama, leading to isles full of deadly creatures inside a nightmare. Avoid the river near Drefia!
19:21:22 Nomads travel the eternal sands of Ankrahmun's desert. There must be a camp somewhere.
19:21:22 The volcano on Goroma sends its fiery message into the sky. A lot of creatures are flooding the lands together with its lava.
19:21:22 Adventurers have told of a Spirit Gate in the Ghostlands. Fight the restless undead!

19:20:56 Guide Luke: The Askarak are in advantage right now.
19:20:58 Guide Luke: The horse services near Thais and Venore are working normally.
19:21:01 Guide Luke: The strange tower with the servants on Edron is covered in slime.
`;

    const result = parseGameText(log);
    const mini = new Map(
      result.miniWorldChangeSignals.map((signal) => [signal.changeId, signal]),
    );
    const world = new Map(
      result.worldChangeSignals.map((signal) => [signal.changeId, signal]),
    );

    expect(mini.get("fury-gate")?.state).toBe("active");
    expect(mini.get("poacher-caves")?.state).toBe("stage3");

    expect(mini.get("nightmare-isles")?.state).toBe("location");
    expect(mini.get("nightmare-isles")?.detail).toBe("River near Drefia");

    expect(mini.get("darama-nomads")?.state).toBe("active");
    expect(mini.get("goroma-volcano")?.state).toBe("active");

    expect(mini.get("spirit-gate")?.state).toBe("location");
    expect(mini.get("spirit-gate")?.detail).toBe("Ghostlands");

    expect(world.get("demon-war")?.state).toBe("stage1");
    expect(world.get("demon-war")?.detail).toBe("Askarak advantage");

    expect(world.get("masters-voice")?.state).toBe("active");
    expect(world.get("horse-station")?.state).toBe("inactive");

    // Recognized World Board messages are the current board reading,
    // independently of whether client timestamps are enabled.
    expect(result.isCompleteSnapshot).toBe(true);

    // Every absent MWC becomes inactive instead of remaining Unknown.
    expect(mini.get("hive-outpost")?.state).toBe("inactive");
    expect(mini.get("big-iceberg")?.state).toBe("inactive");
    expect(mini.get("bibbys-bloodbath")?.state).toBe("inactive");
    expect(mini.get("noodles")?.state).toBe("inactive");
    expect(mini.get("thais-kingsday")?.state).toBe("inactive");

    // Oriental Trader is absent from the complete board snapshot.
    expect(result.inactiveMerchantIds).toEqual(["yasir"]);
  });
});
