// rune-lab/src/lib/index.ts
// * UI Library entry point...

// ^ UI Showcase
export { default as UIShowcase } from './components/UIShowcase.svelte';

// * RUENES OF...

// * Kyntharil 
// *    from Old Norse "kyn" = kind, kin + suffix -tharil suggesting evolution
export { default as Altharun } from './components/dt/Altharun.svelte';

// * Altharun
// *    from Old Norse "aldir" = age, wisdom
export { default as Kyntharil } from './components/dt/Kyntharil.svelte';


// layout related components
export { default as NavBar } from './components/layout/NavBar.svelte';
export { default as UrlDisplay } from './components/layout/URLDisplay.svelte';
export { default as Footer } from './components/layout/Footer.svelte';

// ^ data related components
// export { default as DataDisplay } from './components/data/DataDisplay.svelte';
// export { default as DataForm } from './components/data/DataForm.svelte';
// export { default as DataList } from './components/data/DataList.svelte';
// export { default as DataItem } from './components/data/DataItem.svelte';

// ^ Theme related components
export { themeStore  } from './stores/theme.svelte.js';
export { default as ThemeSelector } from './components/layout/ThemeSelector.svelte';


// ^ Tools related components
// export * from './components/tools/format.js';
// export * from './components/tools/pdf.js';
// todo: add more useful tools!
// export * from './components/tools/qr.js';
// export * from './components/tools/uuid.js';
// export * from './components/tools/validate.js';

// * I don't know if this is some allusion or something...
// * But I think that if I import this later, (I mean, at last)
// * This fix some of the problems with the store management...
// * I don't know why, but it works...
// todo: investigate why this works...
// ^ App related components
export {
    footerStore, 
    type FooterLink,
    type FooterConfig,
    type FooterSection
 } from './stores/layout/footer.svelte.js';


export { appData, type AppData } from './stores/app.svelte.js';
export { apiStore, type ApiStore } from './stores/api.svelte.js';
export { authStore, type AuthState } from './stores/auth.svelte.js';
export { databaseStore, type DatabaseState,} from './stores/db.svelte.js';
