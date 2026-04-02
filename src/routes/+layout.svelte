<script lang="ts">
	import "./layout.css";
	import {
		RuneProvider,
		LayoutPlugin,
		PalettesPlugin,
		MoneyPlugin,
		type NavigationSection,
		version,
	} from "rune-lab";
	import AppLayout from "./AppLayout.svelte";

	let { children } = $props();

	const sections: NavigationSection[] = [
		{
			id: "lab",
			title: "Lab",
			items: [
				{
					id: "lab.overview",
					label: "Overview",
					icon: "🔬",
					href: "/lab",
				},
				{ id: "lab.components", label: "Components", icon: "🧩" },
				{ id: "lab.themes", label: "Themes", icon: "🎨" },
			],
		},
		{
			id: "system",
			title: "System",
			items: [
				{ id: "system.settings", label: "Settings", icon: "⚙️" },
				{ id: "system.logs", label: "Activity Logs", icon: "📋" },
				{ id: "system.users", label: "Users", icon: "👤" },
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
			description: "Modern toolkit for Svelte 5 Runes",
			author: "Yrrrrrf",
		},
	}}
	plugins={[LayoutPlugin, PalettesPlugin, MoneyPlugin]}
>
	<AppLayout {sections}>
		{@render children()}
	</AppLayout>
</RuneProvider>
