import { describe, expect, it } from "vitest";
import { eventEmoji } from "@/lib/formatter/eventEmoji";
import { eventPreviewFor } from "@/lib/defaults/eventPreviews";

describe("official event presentation compatibility", () => {
  it("preserves previews and icons when the official title differs from the wiki", () => {
    expect(eventPreviewFor("Full Moon")).toEqual(eventPreviewFor("Grimvale"));
    expect(eventPreviewFor("Full Moon")).not.toBeNull();
    expect(eventPreviewFor("Colours of Magic")).toEqual(eventPreviewFor("The Colours of Magic"));
    expect(eventEmoji("Colours of Magic")).toBe("🎨");
    expect(eventEmoji("XP/Skill Event")).toBe("⬆️");
    expect(eventEmoji("Hot Cuisine Month")).toBe("🍳");
  });
});
