import type { PaletteRegistryStore } from "../registry/registry.svelte.ts";
import { formatSettingsHash, parseSettingsHash } from "./hash-routing.ts";

export function installSettingsRoute(
  registry: PaletteRegistryStore,
): () => void {
  const syncHashToState = () => {
    if (typeof globalThis === "undefined" || !globalThis.location) return;
    const sec = parseSettingsHash(globalThis.location.hash);
    if (sec !== null) {
      registry.open("settings", sec);
    } else if (registry.activePaletteId === "settings") {
      registry.close();
    }
  };

  // Run on install
  syncHashToState();

  if (typeof globalThis !== "undefined" && globalThis.addEventListener) {
    globalThis.addEventListener("hashchange", syncHashToState);
  }

  const cleanup = $effect.root(() => {
    $effect(() => {
      if (typeof globalThis === "undefined" || !globalThis.location) return;
      const activeId = registry.activePaletteId;
      const activeSec = registry.activeSectionId;

      if (activeId === "settings") {
        const want = formatSettingsHash(activeSec);
        if (globalThis.location.hash !== want) {
          history.replaceState(null, "", want);
        }
      } else {
        if (globalThis.location.hash.startsWith("#settings")) {
          history.pushState(
            null,
            "",
            globalThis.location.pathname + globalThis.location.search,
          );
        }
      }
    });
  });

  return () => {
    if (typeof globalThis !== "undefined" && globalThis.removeEventListener) {
      globalThis.removeEventListener("hashchange", syncHashToState);
    }
    cleanup();
  };
}
