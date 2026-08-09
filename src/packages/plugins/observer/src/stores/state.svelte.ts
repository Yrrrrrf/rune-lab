import type { SlotContext } from "rune-lab/core";

export type ObserverSection = "content" | "storage";

export interface ObserverState {
	enabled: boolean;
	targetUrl: string;
	activeSection: ObserverSection;
}

function currentRoute(): string {
	if (typeof location === "undefined") return "/";
	return location.pathname + location.search;
}

export function createObserverStateStore(
	ctx: SlotContext<unknown>,
): ObserverState {
	let enabled = $state(ctx.persistence.get("enabled") !== "false");
	let activeSection = $state<ObserverSection>(
		(ctx.persistence.get("activeSection") as ObserverSection | null) ??
			"content",
	);
	// Deliberately not read from/written to persistence: "current route by
	// default" means every fresh load, not "last URL ever typed into the bar".
	let targetUrl = $state(currentRoute());

	return {
		get enabled() {
			return enabled;
		},
		set enabled(value: boolean) {
			enabled = value;
			ctx.persistence.set("enabled", String(value));
		},
		get targetUrl() {
			return targetUrl;
		},
		set targetUrl(value: string) {
			targetUrl = value;
		},
		get activeSection() {
			return activeSection;
		},
		set activeSection(value: ObserverSection) {
			activeSection = value;
			ctx.persistence.set("activeSection", value);
		},
	};
}
