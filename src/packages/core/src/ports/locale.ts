export interface LocaleAdapter {
  readonly locales: readonly string[];
  getLocale(): string;
  setLocale(locale: string): void | Promise<void>;
  onChange(callback: (locale: string) => void): () => void;
}
