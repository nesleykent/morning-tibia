import { describe, expect, it } from "vitest";
import {
  mapBoostedBoss,
  mapBoostedCreature,
  mapWorldDetail,
  mapWorldSummary,
} from "./tibiaDataMapping";

describe("mapWorldSummary", () => {
  it("maps a raw TibiaData world entry", () => {
    const world = mapWorldSummary({
      name: "Antica",
      status: "online",
      players_online: 902,
      location: "Europe",
      pvp_type: "Open PvP",
      premium_only: false,
      transfer_type: "regular",
      battleye_protected: true,
    });
    expect(world).toEqual({
      name: "Antica",
      location: "Europe",
      pvpType: "Open PvP",
      transferType: "regular",
      battlEyeProtected: true,
      premiumOnly: false,
      isOnline: true,
      playersOnline: 902,
    });
  });

  it("treats any non-'online' status as offline", () => {
    const world = mapWorldSummary({
      name: "Premia",
      status: "maintenance",
      players_online: 0,
      location: "Europe",
      pvp_type: "Open PvP",
      premium_only: false,
      transfer_type: "blocked",
      battleye_protected: true,
    });
    expect(world.isOnline).toBe(false);
  });
});

describe("mapWorldDetail", () => {
  it("adds record/creation fields on top of the summary mapping", () => {
    const detail = mapWorldDetail({
      name: "Antica",
      status: "online",
      players_online: 902,
      location: "Europe",
      pvp_type: "Open PvP",
      premium_only: false,
      transfer_type: "regular",
      battleye_protected: true,
      record_players: 1152,
      record_date: "2026-05-01T14:19:31Z",
      creation_date: "1997-01",
    });
    expect(detail.recordPlayers).toBe(1152);
    expect(detail.creationDate).toBe("1997-01");
    expect(detail.name).toBe("Antica");
  });
});

describe("mapBoostedBoss / mapBoostedCreature", () => {
  it("maps the boosted boss when present", () => {
    const boss = mapBoostedBoss({
      boostable_bosses: {
        boosted: { name: "Rupture", image_url: "https://static.tibia.com/x.gif", featured: true },
      },
    });
    expect(boss).toEqual({ kind: "boss", name: "Rupture", imageUrl: "https://static.tibia.com/x.gif" });
  });

  it("returns null when nothing is boosted", () => {
    expect(mapBoostedBoss({ boostable_bosses: { boosted: null } })).toBeNull();
    expect(mapBoostedCreature({ creatures: { boosted: null } })).toBeNull();
  });

  it("maps the boosted creature when present", () => {
    const creature = mapBoostedCreature({
      creatures: {
        boosted: {
          name: "Burning Book",
          race: "burningcursedbook",
          image_url: "https://static.tibia.com/y.gif",
          featured: true,
        },
      },
    });
    expect(creature).toEqual({
      kind: "creature",
      name: "Burning Book",
      imageUrl: "https://static.tibia.com/y.gif",
    });
  });
});
