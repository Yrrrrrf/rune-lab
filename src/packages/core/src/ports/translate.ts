/**
 * Optional translation port — same shape as `LocaleAdapter`/`TextMeasurer`.
 * Absent by default; `i18n` supplies a real implementation when registered.
 */
export interface Translator {
  (key: string, fallback: string): string;
}
