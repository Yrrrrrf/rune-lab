export interface LocaleAdapter {
  getLocale(): string;
  setLocale(locale: string): void | Promise<void>;
  onChange(callback: (locale: string) => void): () => void;
}
