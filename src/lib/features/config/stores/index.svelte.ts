import { appStore } from "./app.svelte";
import { apiStore } from "./api.svelte";
import { themeStore } from "./theme.svelte";
import { languageStore } from "./language.svelte";
import { currencyStore } from "./currency.svelte";
import { toastStore } from "./toast.svelte";
import { commandStore } from "../../command-palette/commands.svelte";

export const appConfig = {
  app: appStore,
  api: apiStore,
  theme: themeStore,
  language: languageStore,
  currency: currencyStore,
  toast: toastStore,
  commands: commandStore,
};

export {
  apiStore,
  appStore,
  currencyStore,
  languageStore,
  themeStore,
  toastStore,
};
export { commandStore } from "../../command-palette/commands.svelte";
