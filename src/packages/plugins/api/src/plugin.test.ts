import { it, expect, vi, beforeAll, afterAll } from "vite-plus/test";
import {
	createKernel,
	createInMemoryDriver,
	settingsSections,
} from "rune-lab/core";
import { mount, unmount, flushSync, tick } from "svelte";
import { api } from "./plugin.ts";
import { API_PLUGIN_ID } from "./context.ts";
import type { ApiClient } from "./client.ts";
import ApiHarness from "./components/ApiHarness.test.svelte";

import { transferableAbortController } from "node:util";
beforeAll(() => {
	const controller = transferableAbortController();
	vi.stubGlobal("AbortController", controller.constructor);
	vi.stubGlobal("AbortSignal", controller.signal.constructor);
});
afterAll(() => vi.unstubAllGlobals());

const environments = [
	{ id: "dev", label: "Development", baseUrl: "https://dev.example/api" },
	{ id: "prod", label: "Production", baseUrl: "https://prod.example/api" },
];
it("registers the real kernel slot, settings, and disposal without other plugins", async () => {
	const kernel = createKernel([api], {
		persistence: createInMemoryDriver(),
		pluginConfig: { [API_PLUGIN_ID]: { api: { environments } } },
	});
	const store = kernel.stores.get(`rl:${API_PLUGIN_ID}:api`) as ApiClient;
	expect(store.current).toBe("dev");
	expect(kernel.getContributions(settingsSections)).toHaveLength(1);
	expect(kernel.listSlots()[0].slotName).toBe("api");
	await kernel.dispose();
	await expect(store.get("/data")).rejects.toHaveProperty("name", "AbortError");
});
it("mounts through RuneProvider and reactively updates the monitor and selector", async () => {
	const target = document.createElement("div");
	document.body.append(target);
	let store!: ApiClient;
	const fetcher = vi.fn(
		async () =>
			new Response('{"status":"ok"}', {
				headers: { "Content-Type": "application/json" },
			}),
	);
	const component = mount(ApiHarness, {
		target,
		props: {
			configuration: {
				environments,
				fetch: fetcher,
				autoCheck: false,
				health: { path: "/health" },
			},
			capture: (value: ApiClient) => {
				store = value;
			},
		},
	});
	try {
		flushSync();
		await store.ready;
		expect(target.textContent).toContain("Not checked");
		expect(fetcher).not.toHaveBeenCalled();
		await store.checkHealth();
		flushSync();
		expect(target.textContent).toContain("Healthy");
		const selector = target.querySelector("select")!;
		selector.value = "prod";
		selector.dispatchEvent(new Event("change", { bubbles: true }));
		await tick();
		expect(store.current).toBe("prod");
		expect(target.textContent).toContain("https://prod.example/api");
		const clipboard = vi.fn(async () => {});
		Object.defineProperty(navigator, "clipboard", {
			configurable: true,
			value: { writeText: clipboard },
		});
		(
			target.querySelector('[aria-label="Copy API URL"]') as HTMLButtonElement
		).click();
		await tick();
		flushSync();
		expect(clipboard).toHaveBeenCalledWith("https://prod.example/api");
		expect(target.textContent).toContain("Copied");
		clipboard.mockRejectedValueOnce(new Error("Denied"));
		(
			target.querySelector('[aria-label="Copy API URL"]') as HTMLButtonElement
		).click();
		await tick();
		flushSync();
		expect(target.textContent).toContain("Could not copy URL");
	} finally {
		await unmount(component);
		target.remove();
	}
});

// jsdom replaces AbortSignal, but Node's native Request requires its native counterpart.
// Keep this adjustment confined to tests; the plugin uses the runtime's native web APIs.

it("owns a single poller and stops cleanly", async () => {
	vi.useFakeTimers();
	const transport = vi.fn(async () => new Response("{}"));
	const { createApiClient } = await import("./client.ts");
	const store = createApiClient({
		environments,
		fetch: transport,
		health: { path: "/health" },
		monitoring: true,
		pollIntervalMs: 100,
	});
	try {
		expect(transport).not.toHaveBeenCalled();
		await store.start();
		await store.start();
		await vi.advanceTimersByTimeAsync(1);
		expect(transport).toHaveBeenCalledTimes(1);
		await vi.advanceTimersByTimeAsync(100);
		expect(transport).toHaveBeenCalledTimes(2);
		store.stop();
		await vi.advanceTimersByTimeAsync(500);
		expect(transport).toHaveBeenCalledTimes(2);
	} finally {
		store.dispose();
		vi.useRealTimers();
	}
});
