import type { AppStore } from "./app.svelte.ts";
import type { ApiStore } from "./api.svelte.ts";
import type { ConfigStore } from "./createConfigStore.svelte.ts";
import type { ToastStore } from "./toast.svelte.ts";
import type { Theme } from "./theme.svelte.ts";
import type { Language } from "./language.svelte.ts";
import type { Currency } from "./currency.svelte.ts";
/**
 * Command Palette Store
 */
export interface Command {
  id: string;
  label: string;
  category?: string;
  icon?: string;
  action?: () => void;
  children?: Command[];
}
export interface CommandServices {
  appStore: AppStore;
  apiStore: ApiStore;
  toastStore: ToastStore;
  themeStore: ConfigStore<Theme>;
  languageStore: ConfigStore<Language>;
  currencyStore: ConfigStore<Currency>;
}
export declare class CommandStore {
  #private;
  constructor(services: CommandServices);
  commands: Command[];
  refreshDefaultCommands(): void;
  /**
   * Register a new command
   */
  register(command: Command): void;
  /**
   * Remove a command by id
   */
  unregister(id: string): void;
  /**
   * Search commands, optionally scoped to a parent's children
   */
  search(query: string, parentId?: string): Command[];
}
export declare function createCommandStore(
  services: CommandServices,
): CommandStore;
export declare function getCommandStore(): CommandStore;
