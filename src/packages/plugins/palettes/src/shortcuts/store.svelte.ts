import { untrack } from "svelte";
import type { ShortcutEntry } from "../types.ts";

import { groupByScopeAndCategory, sortScopes } from "./grouping.ts";

export class ShortcutStore {
  entries: ShortcutEntry[] = $state<ShortcutEntry[]>([]);

  /**
   * Filtered list of entries active in the current scope
   */
  active: ShortcutEntry[] = $derived(
    this.entries.filter((e) => e.enabled !== false),
  );

  /**
   * Grouped view for documentation/palette
   */
  byScopeAndCategory: Record<string, Record<string, ShortcutEntry[]>> =
    $derived(groupByScopeAndCategory(this.entries));

  /**
   * Scopes sorted for palette display
   */
  sortedScopes: string[] = $derived(
    sortScopes(Object.keys(this.byScopeAndCategory)),
  );

  /**
   * Register a single shortcut or an array
   */
  register(entry: ShortcutEntry): void {
    untrack(() => {
      if (this.entries.find((e) => e.id === entry.id)) return;
      this.entries.push({ ...entry, enabled: true });
    });
  }

  /**
   * Remove shortcut by ID
   */
  unregister(id: string): void {
    untrack(() => {
      this.entries = this.entries.filter((e) => e.id !== id);
    });
  }

  /**
   * Enable/Disable a shortcut
   */
  setEnabled(id: string, enabled: boolean): void {
    untrack(() => {
      const entry = this.entries.find((e) => e.id === id);
      if (entry) entry.enabled = enabled;
    });
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
