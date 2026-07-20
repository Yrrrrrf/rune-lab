import type { SettingsSection } from "rune-lab";

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
  type: "section" | "shortcut" | "command";
  title: string;
  description?: string;
  badge?: string;
  sectionId: string;
  action?: () => void;
  score: number;
}

export function computeSearchResults(
  query: string,
  sections: SettingsSection[],
  shortcuts: { label?: string; keys: string; category?: string }[],
  commands: { label: string; category?: string; action?: () => void }[],
): SearchResult[] {
  const q = query.trim();
  if (!q) return [];

  const list: SearchResult[] = [];

  for (const sec of sections) {
    const score = Math.max(fuzzyScore(q, sec.label), fuzzyScore(q, sec.id));
    if (score > 0) {
      list.push({
        type: "section",
        title: sec.label,
        description: `Go to ${sec.label} settings section`,
        badge: "Section",
        sectionId: sec.id,
        score,
      });
    }
  }

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
