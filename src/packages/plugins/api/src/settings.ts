import { defineSettings } from "rune-lab/core";
import APIEnvironmentSelector from "./components/APIEnvironmentSelector.svelte";

export const apiSettings = defineSettings({
	id: "api",
	label: "API",
	icon: "lucide:server",
	fields: [
		{
			id: "api.environment",
			label: "Environment",
			type: "custom",
			component: APIEnvironmentSelector,
			target: { type: "store", storeId: "api", property: "current" },
		},
		{
			id: "api.monitoring",
			label: "Monitor API health",
			type: "toggle",
			target: { type: "store", storeId: "api", property: "monitoring" },
		},
	],
});
