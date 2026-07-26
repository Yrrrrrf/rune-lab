import { describe, expect, it } from "vite-plus/test";
import { layoutSettings } from "./settings.ts";
import { THEMES } from "./stores/theme.svelte.ts";

describe("layoutSettings (C20): options track the theme presenter, not a hand-copied list", () => {
  it("theme field options match THEMES exactly", () => {
    const themeField = layoutSettings.fields.find(
      (f) => f.id === "rune-lab.layout.theme",
    );
    const optionValues = themeField?.options?.map((o) => o.value);
    expect(optionValues).toEqual(THEMES.map((t) => t.name));
  });
});
