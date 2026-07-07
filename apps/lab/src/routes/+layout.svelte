<script lang="ts">
	import "./layout.css";
	import {
		RuneProvider,
		type NavigationSection,
		version,
	} from "@rune-lab/svelte";
	import { LayoutPlugin } from "@rune-lab/layout";
	import { PalettesPlugin } from "@rune-lab/palettes";
	import { MoneyPlugin } from "@rune-lab/money";
	import { I18nPlugin, createParaglideAdapter } from "@rune-lab/i18n";
	import { ObserverPlugin } from "@rune-lab/observer";
	import * as paraglideRuntime from "$lib/i18n/paraglide/runtime.js";
	import { m } from "$lib/i18n/messages.ts";
	import AppLayout from "./AppLayout.svelte";

	const localeAdapter = createParaglideAdapter(paraglideRuntime);

	let { children } = $props();

	const sections: NavigationSection[] = [
		{
			id: "lab",
			title: m.lab_label(),
			items: [
				{
					id: "lab.overview",
					label: m.overview_label(),
					icon: "🔬",
					href: "/lab",
				},
				{
					id: "lab.components",
					label: m.components_label(),
					icon: "🧩",
				},
				{ id: "lab.themes", label: m.themes_label(), icon: "🎨" },
			],
		},
		{
			id: "system",
			title: m.system_label(),
			items: [
				{
					id: "system.settings",
					label: m.settings_label(),
					icon: "⚙️",
				},
				{
					id: "system.logs",
					label: m.activity_logs_label(),
					icon: "📋",
				},
				{ id: "system.users", label: m.users_label(), icon: "👤" },
			],
		},
	];
</script>

<RuneProvider
	config={{
		favicon: "/img/rune.png",
		icons: "material",
		app: {
			name: "Rune Lab",
			version: version(),
			description: m.rune_lab_desc(),
			author: "Yrrrrrf",
		},
	}}
	plugins={[LayoutPlugin, PalettesPlugin, MoneyPlugin, ObserverPlugin, I18nPlugin]}
	localeAdapter={localeAdapter}
>
	<AppLayout {sections}>
		{@render children()}
	</AppLayout>
</RuneProvider>
