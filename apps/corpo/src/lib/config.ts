import type { ApiConfig } from "rune-lab/api";
import type {
	CompanyBrand,
	CorpoConfig,
	CorpoProviderConfig,
} from "rune-lab/corpo";

// BRANDING: replace this object, or import it from your company's SDK.
export const company = {
	name: "Northstar",
	legalName: "Northstar Studio",
	tagline: "Good ideas. Thoughtfully built.",
	homeHref: "/",
	logo: { icon: "lucide:sparkles" },
	links: [
		{ id: "about", label: "About", href: "/#about" },
		{ id: "experience", label: "Try it", href: "/#experience" },
	],
} satisfies CompanyBrand;

export const corpoConfig = {
	company,
	variant: "consumer",
	// FOOTER VISIBILITY: set footer: false here for an app without a company footer.
	// Footer markup/content is customized in src/routes/+layout.svelte.
	regions: { footer: true },
	actions: { commands: true, settings: true, theme: true, language: true },
} satisfies CorpoConfig;

export const providerConfig = {
	app: {
		name: "Northstar Studio",
		version: "0.1.0",
		description: "A small studio for useful digital experiences.",
		author: company.name,
	},
} satisfies CorpoProviderConfig;

const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
export const apiConfig: ApiConfig = {
	environments: baseUrl ? [{ id: "main", label: "Main API", baseUrl }] : [],
	health: { path: import.meta.env.VITE_API_HEALTH_PATH || "health" },
	// The landing page never polls automatically. Use the existing monitor's Check button.
	autoCheck: false,
	monitoring: false,
	persist: false,
};
