// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { flushSync, mount, tick, unmount } from "svelte";
import type { ComponentProps } from "svelte";
import Harness from "./components/CorpoHarness.test.svelte";
import type { CorpoConfig } from "./types.ts";

type Probe = Parameters<ComponentProps<typeof Harness>["onReady"]>[0];
const mounted: ReturnType<typeof mount>[] = [];
beforeAll(() => {
	// jsdom lacks these browser APIs used by the existing Rune-Lab plugins.
	Object.defineProperty(window, "matchMedia", {
		configurable: true,
		value: vi.fn(() => ({
			matches: false,
			addEventListener() {},
			removeEventListener() {},
		})),
	});
	Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
		configurable: true,
		value() {
			this.open = true;
		},
	});
	Object.defineProperty(HTMLDialogElement.prototype, "close", {
		configurable: true,
		value() {
			this.open = false;
		},
	});
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe() {}
			disconnect() {}
		},
	);
});
afterEach(async () => {
	for (const component of mounted.splice(0)) await unmount(component);
	document.body.innerHTML = "";
});
async function render(config: CorpoConfig, custom = false) {
	let state!: Probe;
	const target = document.createElement("div");
	document.body.append(target);
	mounted.push(
		mount(Harness, {
			target,
			props: {
				config,
				custom,
				onReady: (value) => {
					state = value;
				},
			},
		}),
	);
	flushSync();
	await tick();
	return { target, state };
}
const company = { name: "Acme", logo: { icon: "lucide:building-2" } };
describe("CorpoShell with real Rune-Lab 0.5.3 plugins", () => {
	it("creates one provider, renders consumer branding and footer, and disposes stores", async () => {
		const { target, state } = await render({ company });
		expect(target.querySelectorAll("[data-corpo-shell]")).toHaveLength(1);
		expect(state.kernel.stores.has("rl:rune-lab.api:api")).toBe(true);
		expect(state.kernel.stores.has("rl:rune-lab.corpo:corpo")).toBe(true);
		expect(target.querySelector("[data-corpo-footer]")?.textContent).toContain(
			"Acme",
		);
		expect(target.textContent).toContain("App content");
		expect(
			target.querySelector("[data-icon='lucide:building-2']"),
		).not.toBeNull();
		const api = state.kernel.stores.get("rl:rune-lab.api:api") as {
			dispose(): void;
		};
		const dispose = vi.spyOn(api, "dispose");
		await unmount(mounted.pop()!);
		await vi.waitFor(() => expect(dispose).toHaveBeenCalledOnce());
	});
	it("omits the CRM footer, connects API switching and palette actions", async () => {
		const { target, state } = await render({
			company,
			variant: "internal",
			allowEnvironmentSwitch: true,
		});
		expect(target.querySelector("[data-corpo-footer]")).toBeNull();
		const selector = target.querySelector<HTMLSelectElement>(
			"select[aria-label='API environment']",
		)!;
		expect(selector).not.toBeNull();
		selector.value = "prod";
		selector.dispatchEvent(new Event("change", { bubbles: true }));
		flushSync();
		expect(
			(state.kernel.stores.get("rl:rune-lab.api:api") as { current: string })
				.current,
		).toBe("prod");
		target
			.querySelector<HTMLButtonElement>("button[aria-label='Commands']")!
			.click();
		flushSync();
		expect(
			(
				state.kernel.stores.get("rl:rune-lab.palettes:registry") as {
					activePaletteId: string;
				}
			).activePaletteId,
		).toBe("commands");
		expect(target.textContent).toContain("v1.2.3");
	});
	it("honors custom regions and reactive footer configuration", async () => {
		const { target, state } = await render(
			{ company, variant: "internal", regions: { footer: true } },
			true,
		);
		expect(target.querySelector("[data-custom-header]")).not.toBeNull();
		expect(target.querySelector("[data-custom-footer]")).not.toBeNull();
		expect(target.querySelector("[data-corpo-footer]")).toBeNull();
		state.corpo.setRegion("footer", false);
		flushSync();
		expect(target.querySelector("[data-custom-footer]")).toBeNull();
	});
	it("keeps user navigation toggles when unrelated preferences change", async () => {
		const { state } = await render({
			company,
			variant: "internal",
			navigation: [{ id: "home", label: "Home", href: "/" }],
		});
		state.layout.toggleZone("nav");
		flushSync();
		expect(state.layout.zones.nav.visible).toBe(false);
		state.corpo.showVersion = false;
		flushSync();
		expect(state.layout.zones.nav.visible).toBe(false);
		state.corpo.setRegion("footer", true);
		flushSync();
		expect(state.layout.zones.nav.visible).toBe(false);
	});
});
