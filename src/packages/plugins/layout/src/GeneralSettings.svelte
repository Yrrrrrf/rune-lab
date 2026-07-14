<script lang="ts">
import {
  cookieDriver,
  createInMemoryDriver,
  localStorageDriver,
  namespaced,
  sessionStorageDriver,
} from "@rune-lab/svelte";
import LanguageSelector from "./LanguageSelector.svelte";
import { getLanguageStore, getLayoutStore, getThemeStore } from "./mod.ts";
import ThemeSelector from "./ThemeSelector.svelte";

const themeStore = getThemeStore();
const languageStore = getLanguageStore();
const layoutStore = getLayoutStore();

let selectedDriver = $state("local");

if (typeof window !== "undefined") {
  selectedDriver = window.localStorage.getItem("rl:persistence:driver") ||
    "local";
}

function handleDriverChange(event: Event) {
  const select = event.target as HTMLSelectElement;
  const value = select.value;
  selectedDriver = value;

  if (typeof window !== "undefined") {
    window.localStorage.setItem("rl:persistence:driver", value);
  }

  let driver = localStorageDriver;
  if (value === "memory") driver = createInMemoryDriver();
  else if (value === "session") driver = sessionStorageDriver;
  else if (value === "cookie") driver = cookieDriver;

  const wrapped = namespaced(driver, "rl:");
  themeStore.setDriver(wrapped);
  languageStore.setDriver(wrapped);
  layoutStore.setDriver(wrapped);
}
</script>

<div class="space-y-8 p-6 max-w-2xl">
  <div>
    <h3 class="text-lg font-semibold mb-1">Appearance</h3>
    <p class="text-sm text-base-content/60 mb-4">
      Customize how Rune Lab looks on your device.
    </p>
    <div class="bg-base-200/50 p-4 rounded-xl border border-base-200/50">
      <ThemeSelector />
    </div>
  </div>

  <div class="divider"></div>

  <div>
    <h3 class="text-lg font-semibold mb-1">Language</h3>
    <p class="text-sm text-base-content/60 mb-4">
      Choose your preferred display language.
    </p>
    <div class="bg-base-200/50 p-4 rounded-xl border border-base-200/50">
      <LanguageSelector />
    </div>
  </div>

  <div class="divider"></div>

  <div>
    <h3 class="text-lg font-semibold mb-1">Storage Driver</h3>
    <p class="text-sm text-base-content/60 mb-4">
      Select where layout settings and config options should be persisted.
    </p>
    <div class="bg-base-200/50 p-4 rounded-xl border border-base-200/50">
      <select
        class="select select-bordered w-full max-w-xs"
        value={selectedDriver}
        onchange={handleDriverChange}
      >
        <option value="local">Local Storage (Persistent)</option>
        <option value="session">Session Storage (Tab lifetime)</option>
        <option value="cookie">Cookies (HTTP accessible)</option>
        <option value="memory">In-Memory (Ephemeral)</option>
      </select>
    </div>
  </div>
</div>
