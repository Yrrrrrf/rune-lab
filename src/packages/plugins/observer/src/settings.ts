import type { SettingsSchema } from "rune-lab/core";
import { defineSettings } from "rune-lab/core";

export const observerSettings: SettingsSchema = defineSettings({
	id: "observer",
	label: "Observer",
	icon: "🔬",
	fields: [
		{
			id: "rune-lab.observer.enabled",
			label: "Enable Observer Shell",
			type: "toggle",
			target: {
				type: "store",
				storeId: "state",
				property: "enabled",
			},
		},
	],
});
