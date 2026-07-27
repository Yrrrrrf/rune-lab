/**
 * Shortcut display formatting (C24).
 *
 * The palette and the settings view used to render the same shortcut two
 * different ways — `⌘ K` in one, `meta + k` in the other — because each had
 * its own inline formatting. This module is the single answer, and every
 * divergence below was resolved deliberately rather than by porting whichever
 * file was opened first:
 *
 * | Behaviour    | old palette              | old settings      | resolved to  |
 * | ------------ | ------------------------ | ----------------- | ------------ |
 * | key combos   | `split(",")[0]` — 1 only | all               | all          |
 * | key symbols  | `⌘ ⌃ ⇧ ⌥`                | raw `meta` `ctrl` | symbols      |
 * | scope label  | `Global`, strips `panel:`| `"${scope} Scope"`| this mapping |
 */

/**
 * Modifier glyphs. Both spellings of the command key matter: registrations are
 * written `cmd+k`, but the settings key-recorder reads `e.metaKey` and emits
 * `meta+k`. Rendering only one of them was why the two views disagreed.
 */
const KEY_SYMBOLS: Record<string, string> = {
	cmd: "⌘",
	meta: "⌘",
	command: "⌘",
	super: "⌘",
	ctrl: "⌃",
	control: "⌃",
	shift: "⇧",
	alt: "⌥",
	option: "⌥",
	enter: "↵",
	return: "↵",
	backspace: "⌫",
	delete: "⌦",
	tab: "⇥",
	escape: "esc",
	esc: "esc",
	up: "↑",
	down: "↓",
	left: "←",
	right: "→",
	space: "␣",
};

/** Render one key part — `cmd` → `⌘`, `k` → `K`. */
export function formatKeyPart(part: string): string {
	const key = part.trim().toLowerCase();
	return KEY_SYMBOLS[key] ?? (key.length === 1 ? key.toUpperCase() : key);
}

/**
 * Split a `keys` string into its alternative combos, each already split into
 * parts. `"cmd+/,ctrl+/"` → `[["⌘","/"], ["⌃","/"]]`.
 *
 * All alternatives are returned. The palette used to show only the first,
 * which hid the non-mac binding entirely.
 */
export function formatCombos(keys: string): string[][] {
	return keys
		.split(",")
		.map((combo) => combo.trim())
		.filter(Boolean)
		.map((combo) => combo.split("+").map(formatKeyPart));
}

/** Human-readable name for a shortcut scope. */
export function scopeLabel(scope: string): string {
	if (scope === "global") return "Global";
	if (scope === "layout") return "Layout";
	return scope.replace("panel:", "");
}

/**
 * Search predicate. Matches label, category, keys **and scope** — scope was
 * searchable in the settings view but not the palette.
 */
export function matchesQuery(
	entry: { label?: string; category?: string; keys: string; scope?: string },
	query: string,
): boolean {
	return (
		(entry.label ?? "").toLowerCase().includes(query) ||
		(entry.category ?? "").toLowerCase().includes(query) ||
		entry.keys.toLowerCase().includes(query) ||
		(entry.scope ?? "").toLowerCase().includes(query)
	);
}
