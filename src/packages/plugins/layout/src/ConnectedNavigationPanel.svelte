<!-- src/features/layout/smart/ConnectedNavigationPanel.svelte -->
<script lang="ts">
import type { Snippet } from "svelte";
import { createNavigationConnection } from "./connection-factory.ts";
import { getLayoutStore } from "./mod.ts";
import NavigationPanel from "./NavigationPanel.svelte";
import type { NavigationSection } from "./types.ts";

interface Props {
  sections: NavigationSection[];
  header?: Snippet;
  footer?: Snippet;
}

let { sections, header, footer }: Props = $props();

const layoutStore = getLayoutStore();
const connection = createNavigationConnection(layoutStore);
</script>

<NavigationPanel
  {sections}
  {header}
  {footer}
  activeId={connection.activeId}
  collapsedIds={connection.collapsedIds}
  onSelect={connection.onSelect}
  onToggle={connection.onToggle}
/>
