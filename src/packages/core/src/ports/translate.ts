/**
 * Optional translation port — same shape as `LocaleAdapter`/`TextMeasurer`.
 * Absent by default; `i18n` supplies a real implementation when registered.
 */
export type Translator = (key: string, fallback: string) => string;
