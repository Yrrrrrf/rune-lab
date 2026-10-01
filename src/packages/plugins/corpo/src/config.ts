import type { CorpoConfig, ResolvedCorpoConfig } from "./types.ts";

export function resolveCorpoConfig(config: CorpoConfig): ResolvedCorpoConfig {
	if (!config?.company?.name?.trim()) {
		throw new Error("[rune-lab.corpo] company.name is required.");
	}
	const variant = config.variant ?? "consumer";
	if (!["consumer", "internal", "docs"].includes(variant)) {
		throw new Error(`[rune-lab.corpo] Unknown variant: ${variant}`);
	}
	const internal = variant === "internal";
	return {
		...config,
		company: { ...config.company },
		variant,
		regions: {
			header: true,
			navigation: config.navigation
				? config.navigation.length > 0
				: variant === "docs",
			workspaceStrip: false,
			detail: false,
			statusbar: internal,
			footer: variant === "consumer",
			...config.regions,
		},
		actions: {
			commands: internal,
			settings: internal,
			theme: true,
			language: true,
			...config.actions,
		},
		navigation: [...(config.navigation ?? [])],
		footerLinks: [...(config.footerLinks ?? config.company.links ?? [])],
		showVersion: config.showVersion ?? internal,
		showApi: config.showApi ?? internal,
		allowEnvironmentSwitch: config.allowEnvironmentSwitch ?? false,
		showApiDetails: config.showApiDetails ?? false,
	};
}
