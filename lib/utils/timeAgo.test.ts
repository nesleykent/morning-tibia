import { describe, expect, it } from "vitest";
import { formatTimeAgo } from "./timeAgo";

describe("formatTimeAgo", () => {
  const now = 1_000_000_000;

  it("shows 'just now' for anything under a minute", () => {
    expect(formatTimeAgo(now - 30_000, now)).toBe("just now");
  });

  it("shows minutes for under an hour", () => {
    expect(formatTimeAgo(now - 5 * 60_000, now)).toBe("5m ago");
  });

  it("shows hours for under a day", () => {
    expect(formatTimeAgo(now - 3 * 60 * 60_000, now)).toBe("3h ago");
  });

  it("shows days beyond that", () => {
    expect(formatTimeAgo(now - 2 * 24 * 60 * 60_000, now)).toBe("2d ago");
  });

  it("never goes negative for a timestamp slightly in the future (clock skew)", () => {
    expect(formatTimeAgo(now + 5_000, now)).toBe("just now");
  });
});
