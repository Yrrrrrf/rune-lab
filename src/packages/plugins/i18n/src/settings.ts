import type { SettingsSchema } from "rune-lab/core";
import { defineSettings, toOptions } from "rune-lab/core";
import { languagePresenter } from "./lang/presenter.ts";
import { currencyPresenter } from "./money/presenter.ts";

export const i18nSettings: SettingsSchema = defineSettings({
  id: "i18n",
  label: "Localization",
  icon: "translate",
  fields: [
    {
      id: "rune-lab.i18n.language",
      label: "Language",
      type: "select",
      target: {
        type: "store",
        storeId: "language",
        property: "current",
      },
      options: () => toOptions(languagePresenter),
    },
    {
      id: "rune-lab.i18n.currency",
      label: "Currency",
      type: "select",
      target: {
        type: "store",
        storeId: "currency",
        property: "current",
      },
      options: () => toOptions(currencyPresenter),
    },
  ],
});
