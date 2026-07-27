import type { Translator } from "rune-lab/core";
import { m } from "./messages.ts";

// t() keys are dotted ("layout.nav.home"); paraglide message ids can't
// contain dots, so the compiler itself sanitizes them to underscores. Mirror
// that transform here rather than requiring call sites to know about it.
function toMessageId(key: string): string {
	return key.replace(/\./g, "_");
}

export function createTranslator(): Translator {
	return (key, fallback) => {
		const fn = m[toMessageId(key)];
		return typeof fn === "function" ? fn() : fallback;
	};
}
