import type { ItemPresenter } from "rune-lab/core";
import { type Theme, THEMES } from "./stores/theme.svelte.ts";

// C20: every daisyUI theme name capitalizes cleanly except one — a single
// override map, not a fourth naming rule. A second exception here would mean
// the rule itself is wrong.
const LABEL_OVERRIDES: Record<string, string> = {
  cmyk: "CMYK",
};

function themeLabel(name: string): string {
  if (name === "system") return "System";
  return LABEL_OVERRIDES[name] ?? name.charAt(0).toUpperCase() + name.slice(1);
}

export const themePresenter: ItemPresenter<Theme> = {
  items: THEMES,
  id: (t) => t.name,
  present: (t) => ({ label: themeLabel(t.name) }),
};
