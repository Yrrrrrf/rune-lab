import { getContext, untrack } from "svelte";
import type { AppStore } from "./app.svelte";
import type { ApiStore } from "./api.svelte";
import type { ConfigStore } from "$lib/devtools/createConfigStore.svelte";
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
    const {
      appStore,
      apiStore,
      toastStore,
      themeStore,
      languageStore,
      currencyStore,
    } = this.#services;

    this.commands = [
      {
        id: "send-toast",
        label: "Send Toast Notification",
        category: "System",
        icon: "🔔",
        children: [
          {
            id: "toast-success",
            label: "Success Toast",
            icon: "✨",
            action: () =>
              toastStore.success("Operation completed successfully!"),
          },
          {
            id: "toast-info",
            label: "Info Toast",
            icon: "ℹ️",
            action: () => toastStore.info("Here is some information."),
          },
          {
            id: "toast-warning",
            label: "Warning Toast",
            icon: "⚠️",
            action: () => toastStore.warn("Please be careful."),
          },
          {
            id: "toast-error",
            label: "Error Toast",
            icon: "🚫",
            action: () => toastStore.error("Something went wrong!"),
          },
        ],
      },
      {
        id: "log-app",
        label: "Log Current App State",
        category: "Debug",
        icon: "📋",
        action: () => {
          console.group("🚀 Rune Lab — Current State");
          console.table(appStore.info);
          console.log(
            "🎨 Theme:",
            themeStore.current,
            themeStore.getProp("icon"),
          );
          console.log(
            "🌐 Language:",
            languageStore.current,
            languageStore.getProp("flag"),
          );
          console.log(
            "💰 Currency:",
            currencyStore.current,
            currencyStore.getProp("symbol"),
          );
          console.log("🔌 API:", apiStore.connectionState, apiStore.URL);
          console.groupEnd();
        },
      },
      {
        id: "log-all-stores",
        label: "Log All Stores (Full Dump)",
        category: "Debug",
        icon: "🗃️",
        action: () => {
          console.group("📚 Rune Lab — Full Store Dump");
          Object.entries(this.#services).forEach(([name, store]) => {
            console.group(`Store: ${name}`);
            console.log("Reactive Instance:", store);
            if (store && "available" in (store as any)) {
              console.log("Available:", (store as any).available);
            }
            if (store && "current" in (store as any)) {
              console.log("Current:", (store as any).current);
            }
            if (store && "toasts" in (store as any)) {
              console.log("Queue:", (store as any).toasts);
            }
            if (store && "commands" in (store as any)) {
              console.log("Registry:", (store as any).commands);
            }
            console.groupEnd();
          });
          console.groupEnd();
        },
      },
    ];
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
  return getContext<CommandStore>("rl:commands");
}
