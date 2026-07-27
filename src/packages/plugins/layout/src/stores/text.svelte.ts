import { BROWSER } from "esm-env";
import type { SlotContext, TextMeasurer } from "rune-lab/core";
import { untrack } from "svelte";
import { PretextTextMeasurer } from "../text/adapter.ts";
import { resolveFontShorthand } from "../text/fonts.ts";

export class TextStoreFacade {
  #ready = $state(false);
  #epoch = $state(0);
  #font = $state("14px sans-serif");
  #engine: PretextTextMeasurer | TextMeasurer | null = null;

  get ready(): boolean {
    return this.#ready;
  }

  get epoch(): number {
    return this.#epoch;
  }

  get font(): string {
    return this.#font;
  }

  get engine(): PretextTextMeasurer {
    if (!this.#ready || !this.#engine) {
      throw new Error(
        "[Layout Text] pretext engine is not available on server-side. Guard usage with the ready flag.",
      );
    }
    return this.#engine as PretextTextMeasurer;
  }

  clearCache(): void {
    if (
      this.#engine &&
      typeof (this.#engine as { clearCache?: () => void }).clearCache ===
        "function"
    ) {
      (this.#engine as { clearCache: () => void }).clearCache();
    }
    this.#epoch++;
  }

  constructor(ctx: SlotContext<unknown>) {
    if (!BROWSER && !ctx.textMeasurer) return;

    const themeStore = ctx.stores.get("theme") as
      | { current: string }
      | undefined;

    this.#engine = (ctx.textMeasurer as PretextTextMeasurer) ??
      new PretextTextMeasurer();
    this.#ready = true;

    // Font load invalidation (Bug D.1 fix)
    if (BROWSER && typeof document !== "undefined" && document.fonts) {
      const handleFontLoad = () => {
        this.clearCache();
      };
      document.fonts.addEventListener("loadingdone", handleFontLoad);
      document.fonts.ready.then(handleFontLoad).catch(() => {});
    }

    // React to theme changes
    if (themeStore) {
      let lastTheme: string | null = null;
      $effect.root(() => {
        $effect(() => {
          const themeName = themeStore.current;
          if (themeName && themeName !== lastTheme) {
            lastTheme = themeName;
            untrack(() => {
              this.#font = resolveFontShorthand(themeName);
              this.clearCache();
            });
          }
        });
      });
    }
  }
}

export function createTextStore(ctx: SlotContext<unknown>): TextStoreFacade {
  return new TextStoreFacade(ctx);
}
