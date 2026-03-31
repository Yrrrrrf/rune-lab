import { untrack } from "svelte";
import { getShortcutStore, shortcutListener } from "@rune-lab/kernel";
import type { ShortcutConfig, ShortcutEntry } from "@rune-lab/kernel";

export type { ShortcutConfig, ShortcutEntry };

export class ShortcutStore {
  entries: ShortcutEntry[] = $state<ShortcutEntry[]>([]);
  showPalette: boolean = $state(false);

  /**
   * Filtered list of entries active in the current scope
   */
  active: ShortcutEntry[] = $derived(
    this.entries.filter((e) => e.enabled !== false),
  );

  /**
   * Grouped view for documentation/palette
   */
  byScopeAndCategory: Record<string, Record<string, ShortcutEntry[]>> = $derived
    .by(() => {
      const groups: Record<string, Record<string, ShortcutEntry[]>> = {};
      for (const entry of this.entries) {
        const scope = entry.scope ?? "global";
        const category = entry.category ?? "General";
        if (!groups[scope]) groups[scope] = {};
        if (!groups[scope][category]) groups[scope][category] = [];
        groups[scope][category].push(entry);
      }
      return groups;
    });

  /**
   * Scopes sorted for palette display
   */
  sortedScopes: string[] = $derived.by(() => {
    const scopes = Object.keys(this.byScopeAndCategory).sort((a, b) => {
      if (a === "global") return -1;
      if (b === "global") return 1;
      if (a === "layout") return -1;
      if (b === "layout") return 1;
      return a.localeCompare(b);
    });
    return scopes;
  });

  /**
   * Register a single shortcut or an array
   */
  register(entry: ShortcutEntry): void {
    if (this.entries.find((e) => e.id === entry.id)) return;
    this.entries.push({ ...entry, enabled: true });
  }

  /**
   * Remove shortcut by ID
   */
  unregister(id: string): void {
    this.entries = this.entries.filter((e) => e.id !== id);
  }

  /**
   * Enable/Disable a shortcut
   */
  setEnabled(id: string, enabled: boolean): void {
    const entry = this.entries.find((e) => e.id === id);
    if (entry) entry.enabled = enabled;
  }

  /**
   * Find conflicts for a given key combo and scope
   */
  findConflicts(keys: string, scope: string): ShortcutEntry[] {
    return untrack(() =>
      this.entries.filter((e) => e.keys === keys && e.scope === scope)
    );
  }
}

export function createShortcutStore(): ShortcutStore {
  return new ShortcutStore();
}

export { getShortcutStore, shortcutListener };
