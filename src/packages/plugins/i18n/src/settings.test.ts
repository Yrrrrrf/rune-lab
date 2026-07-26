import { describe, expect, it } from "vite-plus/test";
import { LANGUAGES } from "./lang/store.svelte.ts";
import { CURRENCIES } from "./money/stores/currency.svelte.ts";
import { i18nSettings } from "./settings.ts";

describe("i18nSettings (C20): options track the domain presenters, not hand-copied lists", () => {
  it("language field options match LANGUAGES exactly", () => {
    const languageField = i18nSettings.fields.find(
      (f) => f.id === "rune-lab.i18n.language",
    );
    const optionValues = languageField?.options?.map((o) => o.value);
    expect(optionValues).toEqual(LANGUAGES.map((l) => l.code));
  });

  it("currency field options match CURRENCIES exactly", () => {
    const currencyField = i18nSettings.fields.find(
      (f) => f.id === "rune-lab.i18n.currency",
    );
    const optionValues = currencyField?.options?.map((o) => o.value);
    expect(optionValues).toEqual(CURRENCIES.map((c) => c.code));
  });
});
