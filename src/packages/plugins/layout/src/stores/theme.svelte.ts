import { BROWSER } from "esm-env";
import type { ConfigStore, SlotContext } from "rune-lab/core";
import { createConfigStore } from "rune-lab/ui";

export interface Theme {
	name: string;
}

export const SYSTEM: Theme = { name: "system" };

const readableSheet = (s: CSSStyleSheet): boolean =>
	s.href === null || new URL(s.href, location.href).origin === location.origin;

function extractThemesFromRule(rule: CSSRule, discovered: Set<string>): void {
	if ("selectorText" in rule && typeof rule.selectorText === "string") {
		const matches = rule.selectorText.matchAll(
			/\[data-theme=["']?([\w-]+)["']?\]/g,
		);
		for (const m of matches) {
			if (m[1]) discovered.add(m[1]);
		}
	}
	if ("cssRules" in rule && rule.cssRules) {
		for (const subRule of Array.from(rule.cssRules as CSSRuleList)) {
			extractThemesFromRule(subRule, discovered);
		}
	}
}

export function discoverThemesFromCSS(): Theme[] {
	const discovered = new Set<string>();

	if (BROWSER && typeof document !== "undefined") {
		for (const sheet of Array.from(document.styleSheets)) {
			if (readableSheet(sheet) && sheet.cssRules) {
				for (const rule of Array.from(sheet.cssRules)) {
					extractThemesFromRule(rule, discovered);
				}
			}
		}
	}

	return Array.from(discovered).map((name) => ({ name }));
}

export function createThemeStore(
	ctx: SlotContext<unknown>,
): ConfigStore<Theme, "name"> {
	const saved = ctx.persistence.get("theme");
	const initialTheme = typeof saved === "string" && saved ? saved : "system";

	const initialItems: Theme[] = [SYSTEM];
	if (initialTheme !== "system") {
		initialItems.push({ name: initialTheme });
	}

	const store = createConfigStore<Theme, "name">({
		items: initialItems,
		storageKey: "theme",
		displayName: "Theme",
		idKey: "name",
		icon: "🎨",
		driver: ctx.persistence,
	});

	const applyTheme = (name: string): void => {
		if (!BROWSER) return;
		if (name === SYSTEM.name) {
			delete document.documentElement.dataset.theme;
		} else {
			document.documentElement.dataset.theme = name;
		}
	};

	store.onChange((name) => applyTheme(String(name)));
	applyTheme(String(store.current));

	if (BROWSER) {
		queueMicrotask(() => {
			const discovered = discoverThemesFromCSS();
			if (discovered.length > 0) {
				store.addItems(discovered);
			}
		});
	}

	return store;
}
