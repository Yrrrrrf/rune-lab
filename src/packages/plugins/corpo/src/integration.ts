import type { PluginInput } from "rune-lab/core";
import { layout } from "rune-lab/layout";
import { palettes } from "rune-lab/palettes";
import { i18n } from "rune-lab/i18n";
import { api } from "rune-lab/api";
import type { ApiConfig } from "rune-lab/api";
import { corpo } from "./plugin.ts";
import type { CorpoConfig, CorpoProviderConfig } from "./types.ts";

/** Provider inputs for both CorpoShell and an app-owned RuneProvider. */
export function createCorpoIntegration(options: {
	corpo: CorpoConfig;
	api?: ApiConfig;
	config?: CorpoProviderConfig;
	plugins?: PluginInput[];
}): {
	plugins: PluginInput[];
	config: CorpoProviderConfig & {
		pluginConfig: Record<string, Record<string, unknown>>;
	};
} {
	const config = options.config ?? {};
	const pluginConfig = config.pluginConfig ?? {};
	return {
		plugins: [
			layout,
			palettes,
			i18n,
			api,
			corpo,
			...(options.plugins ?? []),
		] satisfies PluginInput[],
		config: {
			...config,
			pluginConfig: {
				...pluginConfig,
				"rune-lab.api": {
					...pluginConfig["rune-lab.api"],
					...(options.api === undefined ? {} : { api: options.api }),
				},
				"rune-lab.corpo": {
					...pluginConfig["rune-lab.corpo"],
					corpo: options.corpo,
				},
			},
		},
	};
}
