import { resolveCorpoConfig } from "./config.ts";
import type { CorpoConfig, CorpoRegions } from "./types.ts";

export function createCorpoStore(config: CorpoConfig) {
	// Application configuration is instance-local; never persist one app's layout over another.
	const initial = resolveCorpoConfig(config);
	const state = $state(initial);
	return {
		get company() {
			return state.company;
		},
		get variant() {
			return state.variant;
		},
		get regions() {
			return state.regions;
		},
		get actions() {
			return state.actions;
		},
		get navigation() {
			return state.navigation;
		},
		get footerLinks() {
			return state.footerLinks;
		},
		get showApi() {
			return state.showApi;
		},
		get allowEnvironmentSwitch() {
			return state.allowEnvironmentSwitch;
		},
		get showVersion() {
			return state.showVersion;
		},
		set showVersion(value: boolean) {
			state.showVersion = value;
		},
		get showApiDetails() {
			return state.showApiDetails;
		},
		set showApiDetails(value: boolean) {
			state.showApiDetails = value;
		},
		setRegion(region: keyof CorpoRegions, visible: boolean) {
			state.regions[region] = visible;
		},
		configure(next: CorpoConfig) {
			Object.assign(state, resolveCorpoConfig(next));
		},
	};
}
export type CorpoStore = ReturnType<typeof createCorpoStore>;
