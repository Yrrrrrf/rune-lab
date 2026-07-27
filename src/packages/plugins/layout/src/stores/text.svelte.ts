import type { Disposable, SlotContext, TextMeasurer } from "rune-lab/core";
import { untrack } from "svelte";
import { PretextTextMeasurer } from "../text/adapter.ts";
import { resolveFontShorthand } from "../text/fonts.ts";

function canMeasureText(): boolean {
	return (
		typeof OffscreenCanvas !== "undefined" ||
		(typeof document !== "undefined" && typeof Intl?.Segmenter !== "undefined")
	);
}

export class TextStoreFacade implements Disposable {
	#ready = $state(false);
	#epoch = $state(0);
	#font = $state("14px sans-serif");
	#engine: PretextTextMeasurer | TextMeasurer | null = null;
	#cleanupRoot?: () => void;
	#fontsAbort?: AbortController;

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

	dispose(): void {
		this.#cleanupRoot?.();
		this.#fontsAbort?.abort();
	}

	constructor(ctx: SlotContext<unknown>) {
		if (!canMeasureText() && !ctx.textMeasurer) return;

		const themeStore = ctx.stores.get("theme") as
			| { current: string }
			| undefined;

		this.#engine =
			(ctx.textMeasurer as PretextTextMeasurer) ?? new PretextTextMeasurer();
		this.#ready = true;

		// Font load invalidation (Bug D.1 fix)
		if (typeof document !== "undefined" && document.fonts) {
			this.#fontsAbort = new AbortController();
			const handleFontLoad = () => {
				this.clearCache();
			};
			document.fonts.addEventListener("loadingdone", handleFontLoad, {
				signal: this.#fontsAbort.signal,
			});
			document.fonts.ready.then(handleFontLoad).catch(() => {});
		}

		// React to theme changes
		if (themeStore) {
			this.#cleanupRoot = $effect.root(() => {
				$effect(() => {
					const themeName = themeStore.current;
					if (!themeName) return;
					untrack(() => {
						const nextFont = resolveFontShorthand(themeName);
						if (nextFont === this.#font) return; // colours only — nothing to re-measure
						this.#font = nextFont;
						this.clearCache();
					});
				});
			});
		}
	}
}

export function createTextStore(ctx: SlotContext<unknown>): TextStoreFacade {
	return new TextStoreFacade(ctx);
}
