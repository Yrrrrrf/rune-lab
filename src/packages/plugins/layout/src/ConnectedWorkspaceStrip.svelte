<!-- src/lib/features/layout/smart/ConnectedWorkspaceStrip.svelte -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { createWorkspaceConnection } from "./connection-factory.ts";
  import { getLayoutStore } from "./mod.ts";
  import type { WorkspaceItem } from "./types.ts";
  import WorkspaceStrip from "./WorkspaceStrip.svelte";

  interface Props {
    items: WorkspaceItem[];
    globalActions?: Snippet;
  }

  let { items, globalActions }: Props = $props();

  const layoutStore = getLayoutStore();
  const connection = createWorkspaceConnection(layoutStore);
</script>

<WorkspaceStrip
  {items}
  {globalActions}
  activeId={connection.activeId}
  onSelect={connection.onSelect}
/>
