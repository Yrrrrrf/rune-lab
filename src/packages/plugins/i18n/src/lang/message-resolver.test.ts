import { describe, expect, it, vi } from "vite-plus/test";

import { createMessageResolver } from "./message-resolver.ts";

describe("MessageResolver", () => {
	const mockMessages = {
		usd: () => "US Dollar",
		eur: () => "Euro",
		mxn: () => "Mexican Peso",
		jpy: () => "Japanese Yen",
	};

	describe("createMessageResolver", () => {
		it("should resolve a key via keyExtractor", () => {
			const resolver = createMessageResolver<{ code: string }>(mockMessages, {
				keyExtractor: (opt) => opt.code,
				keyTransformer: (key) => key.toLowerCase(),
			});

			expect(resolver({ code: "USD" })).toBe("US Dollar");
			expect(resolver({ code: "EUR" })).toBe("Euro");
		});

		it("should use untransformed key when no transformer provided", () => {
			const resolver = createMessageResolver<{ code: string }>(mockMessages, {
				keyExtractor: (opt) => opt.code,
			});

			// Without transformer, keys must match exactly
			expect(resolver({ code: "usd" })).toBe("US Dollar");
		});

		it("should fall back to the raw key for missing translations", () => {
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

			const resolver = createMessageResolver<{ code: string }>(mockMessages, {
				keyExtractor: (opt) => opt.code,
				keyTransformer: (key) => key.toLowerCase(),
			});

			const result = resolver({ code: "UNKNOWN" });
			expect(result).toBe("UNKNOWN"); // falls back to original key
			expect(warnSpy).toHaveBeenCalledWith(
				expect.stringContaining("Missing translation"),
			);

			warnSpy.mockRestore();
		});
	});
});
