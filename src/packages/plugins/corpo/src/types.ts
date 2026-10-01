import type { ComponentProps, Snippet } from "svelte";
import type { RuneProvider } from "rune-lab/ui";
import type { ApiConfig } from "rune-lab/api";

export type CorpoVariant = "consumer" | "internal" | "docs";
export interface CorpoLink {
	id: string;
	label: string;
	href: string;
	icon?: string;
	external?: boolean;
}
export type BrandMark =
	| { icon: string; src?: never }
	| { src: string; icon?: never };
export interface CompanyBrand {
	name: string;
	legalName?: string;
	tagline?: string;
	homeHref?: string;
	/** Iconify identifier, as accepted by rune-lab/ui's Icon. */
	logo?: BrandMark;
	/** Exact daisyUI theme names, with the default logo as fallback. */
	themeLogos?: Readonly<Record<string, BrandMark>>;
	links?: readonly CorpoLink[];
	copyrightStartYear?: number;
}
export interface CorpoRegions {
	header: boolean;
	navigation: boolean;
	workspaceStrip: boolean;
	detail: boolean;
	statusbar: boolean;
	footer: boolean;
}
export interface CorpoActions {
	commands: boolean;
	settings: boolean;
	theme: boolean;
	language: boolean;
}
export interface CorpoConfig {
	company: CompanyBrand;
	variant?: CorpoVariant;
	regions?: Partial<CorpoRegions>;
	actions?: Partial<CorpoActions>;
	navigation?: readonly CorpoLink[];
	/** Omit to reuse company.links; [] explicitly removes those links. */
	footerLinks?: readonly CorpoLink[];
	showVersion?: boolean;
	showApi?: boolean;
	allowEnvironmentSwitch?: boolean;
	showApiDetails?: boolean;
}
export interface ResolvedCorpoConfig
	extends Omit<
		CorpoConfig,
		| "variant"
		| "regions"
		| "actions"
		| "navigation"
		| "footerLinks"
		| "showVersion"
		| "showApi"
		| "allowEnvironmentSwitch"
		| "showApiDetails"
	> {
	variant: CorpoVariant;
	regions: CorpoRegions;
	actions: CorpoActions;
	navigation: readonly CorpoLink[];
	footerLinks: readonly CorpoLink[];
	showVersion: boolean;
	showApi: boolean;
	allowEnvironmentSwitch: boolean;
	showApiDetails: boolean;
}
export interface CorpoLayoutProps {
	children: Snippet;
	/** Explicit router state; no window.location access or routing dependency. */
	activeHref?: string;
	dir?: "ltr" | "rtl";
	class?: string;
	header?: Snippet;
	actions?: Snippet;
	navigation?: Snippet;
	workspaceStrip?: Snippet;
	detail?: Snippet;
	statusbar?: Snippet;
	footer?: Snippet;
}
type ProviderProps = ComponentProps<typeof RuneProvider>;
export type CorpoProviderConfig = NonNullable<ProviderProps["config"]>;
export interface CorpoShellProps extends CorpoLayoutProps {
	corpo: CorpoConfig;
	api?: ApiConfig;
	config?: CorpoProviderConfig;
	plugins?: ProviderProps["plugins"];
	localeAdapter?: ProviderProps["localeAdapter"];
}
