import { BROWSER } from "esm-env";
import { PretextTextMeasurer } from "../text/adapter.ts";
import { resolveFontShorthand } from "../text/fonts.ts";

export class TextStoreFacade {
  #ready = $state(false);
  #epoch = $state(0);
  #engine: any = null;

  get ready() {
    return this.#ready;
  }

  get epoch() {
    return this.#epoch;
  }

  get engine() {
    if (!this.#ready || !this.#engine) {
      throw new Error(
        "[Layout Text] pretext engine is not available on server-side. Guard usage with the ready flag.",
      );
    }
    return this.#engine;
  }

  constructor(ctx: any) {
    if (!BROWSER) return;

    const themeStore = ctx.stores.get("theme");
    const languageStore = ctx.stores.get("language");

    this.#engine = new PretextTextMeasurer();
    this.#ready = true;

    // React to language (locale) changes
    $effect.root(() => {
      $effect(() => {
        const lang = languageStore.current;
        if (lang) {
          this.#engine.setLocale(lang);
          this.#engine.clearCache();
          this.#epoch++;
        }
      });

      // React to theme changes
      $effect(() => {
        const themeName = themeStore.current;
        if (themeName) {
          // Resolve computed font styles for the theme to invalidate caches
          resolveFontShorthand(themeName);
          this.#engine.clearCache();
          this.#epoch++;
        }
      });
    });
  }
}

export function createTextStore(ctx: any): TextStoreFacade {
  return new TextStoreFacade(ctx);
}
