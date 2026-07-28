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
	#localeOff?: () => void;

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

	#setEngineLocale(locale: string): void {
		if (
			this.#engine &&
			typeof (this.#engine as { setLocale?: (l: string) => void }).setLocale ===
				"function"
		) {
			(this.#engine as { setLocale: (l: string) => void }).setLocale(locale);
		}
	}

	dispose(): void {
		this.#cleanupRoot?.();
		this.#fontsAbort?.abort();
		this.#localeOff?.();
	}

	constructor(ctx: SlotContext<unknown>) {
		if (!canMeasureText() && !ctx.textMeasurer) return;

		const themeStore = ctx.stores.get("theme") as
			| { current: string }
			| undefined;

		this.#engine =
			(ctx.textMeasurer as PretextTextMeasurer) ?? new PretextTextMeasurer();
		this.#ready = true;

		// Locale (Bug D.3 fix). Paraglide's setLocale() reloads the document by
		// default on a real change (see paraglide-adapter.ts / paraglide docs),
		// so a fresh construction with the current locale is what actually fixes
		// CJK segmentation for the default flow — this store is rebuilt from
		// scratch on that reload. onChange is wired defensively for adapters
		// that update in-session without a reload; it is a no-op today because
		// the bundled paraglide adapter's onChange is a stub.
		if (ctx.locale) {
			this.#setEngineLocale(ctx.locale.getLocale());
			this.#localeOff = ctx.locale.onChange((loc) => {
				this.#setEngineLocale(loc);
				this.#epoch++;
			});
		}

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
