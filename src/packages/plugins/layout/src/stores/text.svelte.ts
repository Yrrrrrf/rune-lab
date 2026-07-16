import type { SlotContext } from "@rune-lab/core";
import { BROWSER } from "esm-env";
import { PretextTextMeasurer } from "../text/adapter.ts";
import { resolveFontShorthand } from "../text/fonts.ts";

export class TextStoreFacade {
  #ready = $state(false);
  #epoch = $state(0);
  #engine: PretextTextMeasurer | null = null;

  get ready(): boolean {
    return this.#ready;
  }

  get epoch(): number {
    return this.#epoch;
  }

  get engine(): PretextTextMeasurer {
    if (!this.#ready || !this.#engine) {
      throw new Error(
        "[Layout Text] pretext engine is not available on server-side. Guard usage with the ready flag.",
      );
    }
    return this.#engine;
  }

  constructor(ctx: SlotContext<unknown>) {
    if (!BROWSER) return;

    const themeStore = ctx.stores.get("theme") as { current: string };

    this.#engine = new PretextTextMeasurer();
    this.#ready = true;

    // React to theme changes
    $effect.root(() => {
      $effect(() => {
        const themeName = themeStore.current;
        if (themeName) {
          // Resolve computed font styles for the theme to invalidate caches
          resolveFontShorthand(themeName);
          this.#engine!.clearCache();
          this.#epoch++;
        }
      });
    });
  }
}

export function createTextStore(ctx: SlotContext<unknown>): TextStoreFacade {
  return new TextStoreFacade(ctx);
}
