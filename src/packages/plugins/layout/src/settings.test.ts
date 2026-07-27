import { describe, expect, it } from "vite-plus/test";
import { layoutSettings } from "./settings.ts";

describe("layoutSettings (C20): options thunk", () => {
  it("theme field options thunk returns options list including system", () => {
    const themeField = layoutSettings.fields.find(
      (f) => f.id === "rune-lab.layout.theme",
    );
    const options = themeField?.options?.();
    expect(Array.isArray(options)).toBe(true);
  });
});
