import { getCommandStore } from "../../../../kernel/src/mod.ts";
import type {
  Command,
  ConfigStore,
  IToastStore,
} from "../../../../kernel/src/mod.ts";

export type { Command };

export interface CommandServices {
  appStore: unknown;
  apiStore: unknown;
  toastStore: IToastStore;
  themeStore: ConfigStore<unknown>;
  languageStore: ConfigStore<unknown>;
  currencyStore: ConfigStore<unknown>;
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
    if (this.commands.find((c) => c.id === command.id)) return;
    this.commands.push(command);
  }

  /**
   * Remove a command by id
   */
  unregister(id: string): void {
    this.commands = this.commands.filter((c) => c.id !== id);
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

export { getCommandStore };
