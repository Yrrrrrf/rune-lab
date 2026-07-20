import type { SettingsSchema } from "rune-lab/core";
import { defineSettings } from "rune-lab/core";

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
      options: [
        { value: "en", label: "English" },
        { value: "es", label: "Spanish" },
        { value: "fr", label: "French" },
        { value: "de", label: "German" },
        { value: "it", label: "Italian" },
        { value: "pt", label: "Portuguese" },
        { value: "ru", label: "Russian" },
        { value: "hi", label: "Hindi" },
        { value: "ar", label: "Arabic" },
        { value: "zh", label: "Chinese" },
        { value: "ja", label: "Japanese" },
        { value: "ko", label: "Korean" },
        { value: "vi", label: "Vietnamese" },
      ],
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
      options: [
        { value: "USD", label: "USD ($)" },
        { value: "EUR", label: "EUR (€)" },
        { value: "GBP", label: "GBP (£)" },
        { value: "MXN", label: "MXN ($)" },
        { value: "CAD", label: "CAD (C$)" },
        { value: "BRL", label: "BRL (R$)" },
        { value: "INR", label: "INR (₹)" },
        { value: "CNY", label: "CNY (¥)" },
        { value: "JPY", label: "JPY (¥)" },
        { value: "KRW", label: "KRW (₩)" },
        { value: "AED", label: "AED (د.إ)" },
      ],
    },
  ],
});
