// mod.ts
// * This is the entry point for the JSR package

// export { forge } from './forge.svelte.js'
export { themeStore } from "./stores/theme.svelte.ts";
export { apiStore } from "./stores/api.svelte.ts";
export { type AppData, appData } from "./stores/app.svelte.ts";

// * Import the main forge from the ts-forge library...
export {
	type FooterConfig,
	type FooterLink,
	type FooterSection,
	footerStore,
} from "./stores/footer.svelte.ts";
export { authStore, type UserProfile } from "./stores/auth.svelte.ts";

// * Components
// todo: Comment this when using JSR to avoid the export error
// todo: JSR don't support exporting anything else than '.ts' files
