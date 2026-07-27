import { describe, expect, it } from "vite-plus/test";
import {
	formatCombos,
	formatKeyPart,
	matchesQuery,
	scopeLabel,
} from "./format.ts";

describe("formatKeyPart", () => {
	it("renders both spellings of the command key as one symbol", () => {
		// Registrations are written `cmd+k`; the key-recorder emits `meta+k`.
		// Rendering only one of them is why the two old views disagreed.
		expect(formatKeyPart("cmd")).toBe("⌘");
		expect(formatKeyPart("meta")).toBe("⌘");
	});

	it("renders the remaining modifiers as symbols", () => {
		expect(formatKeyPart("ctrl")).toBe("⌃");
		expect(formatKeyPart("shift")).toBe("⇧");
		expect(formatKeyPart("alt")).toBe("⌥");
		expect(formatKeyPart("option")).toBe("⌥");
	});

	it("uppercases single characters and passes through unknown words", () => {
		expect(formatKeyPart("k")).toBe("K");
		expect(formatKeyPart("/")).toBe("/");
		expect(formatKeyPart("f11")).toBe("f11");
	});

	it("is case- and whitespace-insensitive", () => {
		expect(formatKeyPart(" CMD ")).toBe("⌘");
	});
});

describe("formatCombos", () => {
	it("returns every alternative combo, not just the first", () => {
		// The old palette did `keys.split(",")[0]`, hiding the non-mac binding.
		expect(formatCombos("cmd+/,ctrl+/")).toEqual([
			["⌘", "/"],
			["⌃", "/"],
		]);
	});

	it("handles a single combo", () => {
		expect(formatCombos("cmd+shift+k")).toEqual([["⌘", "⇧", "K"]]);
	});

	it("ignores stray whitespace and empty segments", () => {
		expect(formatCombos("cmd+k , ")).toEqual([["⌘", "K"]]);
	});
});

describe("scopeLabel", () => {
	it("titles the well-known scopes and strips the panel prefix", () => {
		expect(scopeLabel("global")).toBe("Global");
		expect(scopeLabel("layout")).toBe("Layout");
		expect(scopeLabel("panel:observer")).toBe("observer");
	});
});

describe("matchesQuery", () => {
	const entry = {
		label: "Open Commands",
		category: "General",
		keys: "cmd+shift+k",
		scope: "global",
	};

	it("matches on label, category and keys", () => {
		expect(matchesQuery(entry, "commands")).toBe(true);
		expect(matchesQuery(entry, "general")).toBe(true);
		expect(matchesQuery(entry, "shift")).toBe(true);
	});

	it("matches on scope — searchable in the old settings view but not the palette", () => {
		expect(matchesQuery(entry, "global")).toBe(true);
	});

	it("returns false when nothing matches", () => {
		expect(matchesQuery(entry, "zzz")).toBe(false);
	});

	it("tolerates entries with no optional fields", () => {
		expect(matchesQuery({ keys: "cmd+k" }, "cmd")).toBe(true);
		expect(matchesQuery({ keys: "cmd+k" }, "nope")).toBe(false);
	});
});
