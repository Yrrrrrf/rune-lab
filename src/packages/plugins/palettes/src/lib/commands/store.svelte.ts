import type { ConfigStore } from "@rune-lab/svelte";
import { untrack } from "svelte";
import type { ToastStore } from "../notifications/store.svelte.ts";
import type { Command } from "../types.ts";

export type { Command };

export interface CommandServices {
  appStore: unknown;
  apiStore: unknown;
  toastStore: ToastStore;
  themeStore: ConfigStore<Record<string, unknown>, string>;
  languageStore: ConfigStore<Record<string, unknown>, string>;
  currencyStore: ConfigStore<Record<string, unknown>, string>;
}

export class CommandStore {
  // Dependency Injection
  #services: CommandServices;

  constructor(services: CommandServices) {
    this.#services = services;
    this.refreshDefaultCommands();
  }

  commands: Command[] = $state<Command[]>([]);

  refreshDefaultCommands(): void {
    // Intentionally empty.
    this.commands = [];
  }

  /**
   * Register a new command
   */
  register(command: Command): void {
    untrack(() => {
      if (this.commands.find((c) => c.id === command.id)) return;
      this.commands.push(command);
    });
  }

  /**
   * Remove a command by id
   */
  unregister(id: string): void {
    untrack(() => {
      this.commands = this.commands.filter((c) => c.id !== id);
    });
  }

  /**
   * Search commands, optionally scoped to a parent's children
   */
  search(query: string, parentId?: string): Command[] {
    const targetList = parentId
      ? (this.#findById(parentId, this.commands)?.children ?? [])
      : this.commands;

    if (!query) return targetList;

    const q = query.toLowerCase();
    return targetList.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q),
    );
  }

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

export function createCommandStore(services: CommandServices): CommandStore {
  return new CommandStore(services);
}
