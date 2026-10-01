import { defineSettings } from "rune-lab/core";
export const corpoSettings = defineSettings({
	id: "corpo",
	label: "Application",
	icon: "lucide:building-2",
	fields: [
		{
			id: "corpo.showVersion",
			label: "Show app version",
			type: "toggle",
			target: { type: "store", storeId: "corpo", property: "showVersion" },
		},
		{
			id: "corpo.showApiDetails",
			label: "Show API details",
			type: "toggle",
			target: { type: "store", storeId: "corpo", property: "showApiDetails" },
		},
	],
});
