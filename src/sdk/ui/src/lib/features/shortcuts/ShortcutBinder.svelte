<!--
  ShortcutBinder — Declarative shortcut registration component.
  No visual output — purely a lifecycle binder.
  
  Usage:
    <ShortcutBinder shortcuts={[
      { id: "save:doc", keys: "ctrl+s", handler: save, label: "Save" },
    ]} />
-->
<script lang="ts">
    import type { ShortcutConfig } from "@internal/core";
    import { useShortcuts } from "@internal/state";

    let { shortcuts }: { shortcuts: ShortcutConfig[] } = $props();

    useShortcuts(shortcuts);
</script>
