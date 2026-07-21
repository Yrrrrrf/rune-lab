import type { FieldGroup, SidebarEntry } from "./sections.ts";

function fuzzyScore(query: string, text: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (!q) return 0;
  if (t.includes(q)) return 100 - t.indexOf(q);

  let score = 0;
  let qIdx = 0;
  for (let i = 0; i < t.length && qIdx < q.length; i++) {
    if (t[i] === q[qIdx]) {
      score += 10;
      qIdx++;
      if (i > 0 && t[i - 1] === q[qIdx - 2]) {
        score += 5;
      }
    }
  }
  return qIdx === q.length ? score : 0;
}

export interface SearchResult {
  type: "section" | "field" | "shortcut" | "command";
  title: string;
  description?: string;
  badge?: string;
  sectionId: string;
  action?: () => void;
  score: number;
}

export function computeSearchResults(
  query: string,
  sidebar: SidebarEntry[],
  generalGroups: FieldGroup[],
  shortcuts: { label?: string; keys: string; category?: string }[],
  commands: { label: string; category?: string; action?: () => void }[],
): SearchResult[] {
  const q = query.trim();
  if (!q) return [];

  const list: SearchResult[] = [];

  // (a) each sidebar entry
  for (const entry of sidebar) {
    const score = Math.max(fuzzyScore(q, entry.label), fuzzyScore(q, entry.id));
    if (score > 0) {
      list.push({
        type: "section",
        title: entry.label,
        description: `Go to ${entry.label} settings section`,
        badge: "Section",
        sectionId: entry.id,
        score,
      });
    }
  }

  // (b) each field in each generalGroups[*].fields
  for (const group of generalGroups) {
    for (const field of group.fields) {
      const score = Math.max(
        fuzzyScore(q, field.label || ""),
        fuzzyScore(q, group.label),
      );
      if (score > 0) {
        list.push({
          type: "field",
          title: field.label || "",
          description: `Setting in ${group.label}`,
          badge: group.label,
          sectionId: "general",
          score,
        });
      }
    }
  }

  // (c) each shortcut
  for (const sh of shortcuts) {
    const score = Math.max(
      fuzzyScore(q, sh.label || ""),
      fuzzyScore(q, sh.keys || ""),
      fuzzyScore(q, sh.category || ""),
    );
    if (score > 0) {
      list.push({
        type: "shortcut",
        title: sh.label || "",
        description: `Shortcut: ${sh.keys || ""}`,
        badge: sh.category || "Shortcut",
        sectionId: "shortcuts",
        score,
      });
    }
  }

  // (d) each command
  for (const cmd of commands) {
    const score = Math.max(
      fuzzyScore(q, cmd.label),
      fuzzyScore(q, cmd.category || ""),
    );
    if (score > 0) {
      list.push({
        type: "command",
        title: cmd.label,
        description: `Command Category: ${cmd.category || "General"}`,
        badge: "Command",
        sectionId: "commands",
        action: cmd.action,
        score,
      });
    }
  }

  return list.sort((a, b) => b.score - a.score);
}
