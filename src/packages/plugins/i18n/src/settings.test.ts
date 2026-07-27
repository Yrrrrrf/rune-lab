import { describe, expect, it } from "vite-plus/test";
import { CURRENCIES } from "./money/stores/currency.svelte.ts";
import { i18nSettings } from "./settings.ts";

describe("i18nSettings options thunks", () => {
  it("language field options thunk returns options array", () => {
    const languageField = i18nSettings.fields.find(
      (f) => f.id === "rune-lab.i18n.language",
    );
    const options = languageField?.options?.();
    expect(Array.isArray(options)).toBe(true);
  });

  it("currency field options match CURRENCIES exactly", () => {
    const currencyField = i18nSettings.fields.find(
      (f) => f.id === "rune-lab.i18n.currency",
    );
    const optionValues = currencyField?.options?.().map((o) => o.value);
    expect(optionValues).toEqual(CURRENCIES.map((c) => c.code));
  });
});
