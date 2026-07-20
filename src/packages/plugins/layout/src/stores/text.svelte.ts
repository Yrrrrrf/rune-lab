import { BROWSER } from "esm-env";
import type { SlotContext, TextMeasurer } from "rune-lab/core";
import { untrack } from "svelte";
import { PretextTextMeasurer } from "../text/adapter.ts";
import { resolveFontShorthand } from "../text/fonts.ts";

export class TextStoreFacade {
  #ready = $state(false);
  #epoch = $state(0);
  #font = $state("14px sans-serif");
  #engine: TextMeasurer | null = null;

  get ready(): boolean {
    return this.#ready;
  }

  get epoch(): number {
    return this.#epoch;
  }

  get font(): string {
    return this.#font;
  }

  get engine(): TextMeasurer {
    if (!this.#ready || !this.#engine) {
      throw new Error(
        "[Layout Text] pretext engine is not available on server-side. Guard usage with the ready flag.",
      );
    }
    return this.#engine;
  }

  constructor(ctx: SlotContext<unknown>) {
    if (!BROWSER && !ctx.textMeasurer) return;

    const themeStore = ctx.stores.get("theme") as { current: string };

    this.#engine = ctx.textMeasurer ?? new PretextTextMeasurer();
    this.#ready = true;

    // React to theme changes
    if (themeStore) {
      let lastTheme: string | null = null;
      $effect.root(() => {
        $effect(() => {
          const themeName = themeStore.current;
          if (themeName && themeName !== lastTheme) {
            lastTheme = themeName;
            untrack(() => {
              // Resolve computed font styles for the theme to invalidate caches
              this.#font = resolveFontShorthand(themeName);
              this.#engine!.clearCache();
              this.#epoch++;
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
