import { describe, expect, it } from "vite-plus/test";
import { resolveCorpoConfig } from "./config.ts";
import { createCorpoIntegration } from "./integration.ts";
import { createCorpoStore } from "./store.svelte.ts";
const company = {
	name: "Acme",
	links: [{ id: "privacy", label: "Privacy", href: "/privacy" }],
};
describe("corpo configuration", () => {
	it("shares company branding without sharing app-specific regions", () => {
		const consumer = createCorpoStore({ company });
		const crm = createCorpoStore({ company, variant: "internal" });
		expect(consumer.regions.footer).toBe(true);
		expect(crm.regions.footer).toBe(false);
		crm.setRegion("footer", true);
		consumer.setRegion("footer", false);
		expect(crm.regions.footer).toBe(true);
		expect(company).not.toHaveProperty("regions");
	});
	it("accepts explicit region overrides and an intentionally empty link list", () => {
		const config = resolveCorpoConfig({
			company,
			variant: "internal",
			regions: { footer: true },
			footerLinks: [],
		});
		expect(config.regions.footer).toBe(true);
		expect(config.footerLinks).toEqual([]);
		expect(config.allowEnvironmentSwitch).toBe(false);
	});
	it("requires a named company and a supported layout", () => {
		expect(() => resolveCorpoConfig({ company: { name: " " } })).toThrow(
			"company.name",
		);
		expect(() =>
			resolveCorpoConfig({ company, variant: "typo" as never }),
		).toThrow("Unknown variant");
	});
	it("preserves provider options and unrelated slot configuration", () => {
		const configuredApi = { environments: [] };
		const provider = createCorpoIntegration({
			corpo: { company },
			config: {
				app: { name: "CRM" },
				pluginConfig: {
					"rune-lab.api": { api: configuredApi, custom: true },
					"custom.plugin": { value: 12 },
				},
			},
		});
		expect(provider.config.app?.name).toBe("CRM");
		expect(provider.config.pluginConfig["rune-lab.api"].api).toBe(
			configuredApi,
		);
		expect(provider.config.pluginConfig["custom.plugin"]).toEqual({
			value: 12,
		});
		expect(provider.plugins).toHaveLength(5);
	});
	it("gives the explicit API prop precedence", () => {
		const api = { environments: [] };
		expect(
			createCorpoIntegration({
				corpo: { company },
				api,
				config: { pluginConfig: { "rune-lab.api": { api: { stale: true } } } },
			}).config.pluginConfig["rune-lab.api"].api,
		).toBe(api);
	});
});
