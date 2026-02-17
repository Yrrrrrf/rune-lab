import { untrack } from "svelte";
import { appStore } from "./app.svelte";
import { apiStore } from "./api.svelte";
import { themeStore } from "./theme.svelte";
import { languageStore } from "./language.svelte";
import { currencyStore } from "./currency.svelte";
import { toastStore } from "./toast.svelte";

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

class CommandStore {
  commands = $state<Command[]>([
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
          action: () => toastStore.success("Operation completed successfully!"),
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
        const stores = {
          app: appStore,
          api: apiStore,
          theme: themeStore,
          language: languageStore,
          currency: currencyStore,
          toast: toastStore,
          commands: commandStore,
        };
        console.group("📚 Rune Lab — Full Store Dump");
        Object.entries(stores).forEach(([name, store]) => {
          console.group(`Store: ${name}`);
          console.log("Reactive Instance:", store);
          if ("available" in (store as any)) {
            console.log("Available:", (store as any).available);
          }
          if ("current" in (store as any)) {
            console.log("Current:", (store as any).current);
          }
          if ("toasts" in (store as any)) {
            console.log("Queue:", (store as any).toasts);
          }
          if ("commands" in (store as any)) {
            console.log("Registry:", (store as any).commands);
          }
          console.groupEnd();
        });
        console.groupEnd();
      },
    },
  ]);

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

export const commandStore = new CommandStore();
