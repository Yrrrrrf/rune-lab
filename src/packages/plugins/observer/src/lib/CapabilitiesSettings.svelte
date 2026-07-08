<script lang="ts">
  import {
    getCommandStore,
    getSettingsSections,
    getShortcutStore,
  } from "@rune-lab/svelte";

  const shortcutStore = getShortcutStore();
  const commandStore = getCommandStore();
  const sections = getSettingsSections();

  let showPreview = $state(true);

  if (typeof window !== "undefined") {
    showPreview =
      window.localStorage.getItem("rl:observer:showPreview") !== "false";
  }

  function handleToggle() {
    showPreview = !showPreview;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "rl:observer:showPreview",
        String(showPreview),
      );
      window.dispatchEvent(new Event("rl:observer:toggle"));
    }
  }
</script>

<div class="p-6 space-y-6 max-w-2xl">
  <div>
    <h3 class="text-lg font-semibold mb-1">Microkernel Capabilities</h3>
    <p class="text-sm text-base-content/60">
      Explore the live registered metrics and configuration of the Rune Lab
      engine.
    </p>
  </div>

  <div
    class="bg-base-200/50 p-6 rounded-xl border border-base-200/50 space-y-4"
  >
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
      <div
        class="bg-base-100 p-4 rounded-lg shadow-sm border border-base-200/50"
      >
        <div class="text-2xl font-bold text-primary">
          {commandStore.commands.length}
        </div>
        <div class="text-xs text-base-content/50 uppercase font-semibold mt-1">
          Commands
        </div>
      </div>
      <div
        class="bg-base-100 p-4 rounded-lg shadow-sm border border-base-200/50"
      >
        <div class="text-2xl font-bold text-secondary">
          {shortcutStore.entries.length}
        </div>
        <div class="text-xs text-base-content/50 uppercase font-semibold mt-1">
          Shortcuts
        </div>
      </div>
      <div
        class="bg-base-100 p-4 rounded-lg shadow-sm border border-base-200/50"
      >
        <div class="text-2xl font-bold text-accent">{sections.length}</div>
        <div class="text-xs text-base-content/50 uppercase font-semibold mt-1">
          Settings
        </div>
      </div>
      <div
        class="bg-base-100 p-4 rounded-lg shadow-sm border border-base-200/50"
      >
        <div class="text-2xl font-bold text-neutral">5</div>
        <div class="text-xs text-base-content/50 uppercase font-semibold mt-1">
          Plugins
        </div>
      </div>
    </div>
  </div>

  <div class="divider"></div>

  <div>
    <h3 class="text-lg font-semibold mb-1">Observer Settings</h3>
    <p class="text-sm text-base-content/60 mb-4">
      Control the docked developer inspector tools and live iframe preview
      panel.
    </p>
    <div
      class="bg-base-200/50 p-4 rounded-xl border border-base-200/50 flex items-center justify-between"
    >
      <div>
        <span class="font-medium text-sm">Enable Docked Developer Panel</span>
        <p class="text-xs text-base-content/50 mt-0.5">
          Shows a dev console at the bottom of the screen with local storage
          inspector.
        </p>
      </div>
      <input
        type="checkbox"
        class="toggle toggle-primary"
        checked={showPreview}
        onchange={handleToggle}
      />
    </div>
  </div>
</div>
