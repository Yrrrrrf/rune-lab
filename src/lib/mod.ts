// mod.ts
// * This is the entry point for the JSR package

// export { forge } from './forge.svelte.js'
// export { themeStore } from "./stores/theme.svelte.ts";
export { apiStore } from "./components/stores/api.svelte.ts";
export { appData } from "./components/stores/app.svelte.ts";
// export { type AppData, appData } from "./stores/app.svelte.ts";

export * from "./tools/schema-transformer.ts";
export * from "./tools/form-helpers.ts";

// // * Import the main forge from the ts-forge library...
// export {
// 	type FooterConfig,
// 	type FooterLink,
// 	type FooterSection,
// 	footerStore,
// } from "./stores/footer.svelte.ts";
// export { authStore, type UserProfile } from "./stores/auth.svelte.ts";

// * Components
// todo: Comment this when using JSR to avoid the export error
// todo: JSR don't support exporting anything else than '.ts' files

export function getVersion(): string {
	return "0.0.1";
}

export function init() {
	// * This is the entry point for the JSR package
	// * This function is called when the package is imported
	// * You can use this function to initialize the package
	// * For example, you can fetch data from an API
	// * or initialize a store
	console.log("JSR package initialized");

	// * Initialize the theme store
	// themeStore.init();
}
