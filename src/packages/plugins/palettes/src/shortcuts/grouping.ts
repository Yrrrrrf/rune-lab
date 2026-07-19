import type { ShortcutEntry } from "./types.ts";

export type GroupedShortcuts = Record<string, Record<string, ShortcutEntry[]>>;

export function groupByScopeAndCategory(
  entries: ShortcutEntry[],
): GroupedShortcuts {
  const groups: GroupedShortcuts = {};
  for (const entry of entries) {
    const scope = entry.scope ?? "global";
    const category = entry.category ?? "General";
    if (!groups[scope]) groups[scope] = {};
    if (!groups[scope][category]) groups[scope][category] = [];
    groups[scope][category].push(entry);
  }
  return groups;
}

export function sortScopes(scopes: string[]): string[] {
  return scopes.sort((a, b) => {
    if (a === "global") return -1;
    if (b === "global") return 1;
    if (a === "layout") return -1;
    if (b === "layout") return 1;
    return a.localeCompare(b);
  });
}
