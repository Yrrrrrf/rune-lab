import { getContext, untrack } from "svelte";
import { RUNE_LAB_CONTEXT } from "$lib/context";
import type { AppStore } from "./app.svelte";
import type { ApiStore } from "./api.svelte";
import type { ConfigStore } from "$lib/state/createConfigStore.svelte";
import type { ToastStore } from "./toast.svelte";
import type { Theme } from "./theme.svelte";
import type { Language } from "./language.svelte";
import type { Currency } from "./currency.svelte";

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

export class CommandStore {
  // Dependency Injection
  #services: CommandServices;

  constructor(services: CommandServices) {
    this.#services = services;
    this.refreshDefaultCommands();
  }

  commands = $state<Command[]>([]);

  refreshDefaultCommands() {
    // Intentionally empty.
    // Consumers (like the demo app) should inject their own default commands via `commandStore.register`.
    this.commands = [];
  }

  /**
   * Register a new command
   */
  register(command: Command) {
    if (this.commands.find((c) => c.id === command.id)) return;
    this.commands.push(command);
  }

  /**
   * Remove a command by id
   */
  unregister(id: string) {
    this.commands = this.commands.filter((c) => c.id !== id);
  }

  /**
   * Search commands, optionally scoped to a parent's children
   */
  search(query: string, parentId?: string): Command[] {
    const targetList = parentId
      ? this.#findById(parentId, this.commands)?.children ?? []
      : this.commands;

    if (!query) return targetList;

    const q = query.toLowerCase();
    return targetList.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q),
    );
  }

  // Native JS private field — TypeScript CAN emit .d.ts for this, unlike `private`
  #findById(id: string, list: Command[]): Command | undefined {
    for (const cmd of list) {
      if (cmd.id === id) return cmd;
      if (cmd.children) {
        const found = this.#findById(id, cmd.children);
        if (found) return found;
      }
    }
    return undefined;
  }
}

export function createCommandStore(services: CommandServices) {
  return new CommandStore(services);
}

export function getCommandStore() {
  return getContext<CommandStore>(RUNE_LAB_CONTEXT.commands);
}
