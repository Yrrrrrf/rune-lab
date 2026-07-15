<script lang="ts">
import type { Snippet } from "svelte";
import { getLayoutStore } from "../plugin.ts";
import type { NavigationSection } from "../types.ts";
import { createNavigationConnection } from "./connection-factory.ts";
import NavigationPanel from "./NavigationPanel.svelte";

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
