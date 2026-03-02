<script lang="ts">
	import "./layout.css";
	import * as m from "$lib/paraglide/messages.js";
	import { RuneProvider } from "@internal/ui";

	let { children } = $props();

	const sections = [
		{
			id: "inventory",
			title: "Inventory",
			items: [
				{ id: "catalogs", label: "Catalogs" },
				{ id: "products", label: "Products" },
			],
		},
		{
			id: "sales",
			title: "Sales",
			items: [
				{ id: "orders", label: "Orders" },
				{ id: "customers", label: "Customers" },
			],
		},
		{
			id: "system",
			title: "System",
			items: [
				{ id: "users", label: "User Management" },
				{ id: "settings", label: "Settings" },
			],
		},
	];
</script>

<RuneProvider
	config={{
		app: { name: "Inventory", version: "0.0.1" },
		apiUrl: "https://api.example.com",
		apiHealthCheck: async () => true,
		dictionary: m,
		favicon: "/img/rune.png",
	}}
>
	{@render children()}
</RuneProvider>
