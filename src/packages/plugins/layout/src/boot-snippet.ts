// C19: a library cannot inject into the consumer's `app.html`, so the only
// mechanism that eliminates the flash-of-default-theme is a snippet the
// consumer pastes into `<head>` before any bundle loads. The key below must
// mirror the kernel's real composition rule exactly — `wiring.ts` prefixes a
// persisted slot's storage key with `${pluginId}:${slotName}:` and nothing
// else (RuneProvider's own extra "rl:" wrap was removed, see C15) — so this
// is stated once, as a constant, rather than re-derived by hand elsewhere.
const THEME_STORAGE_KEY = "rune-lab.layout:theme:theme";

/**
 * Inline `<head>` script that applies a persisted theme before first paint.
 * Paste into `app.html`, above any script/style tag that could paint content.
 *
 * "system" (C18's pseudo-item for "no explicit choice yet") is deliberately
 * never written to `data-theme` — leaving it unset lets daisyUI's own
 * `:root:not([data-theme])` media-query rule resolve the OS preference.
 */
export const THEME_BOOT_SCRIPT = `<script>
try {
  var t = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
  if (t && t !== "system") document.documentElement.dataset.theme = t;
} catch (_) {}
</script>`;
