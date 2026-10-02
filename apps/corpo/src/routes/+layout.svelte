<script lang="ts">
  import "./layout.css";
  import { onMount, type Snippet } from "svelte";
  import { CorpoShell, AppFooter } from "rune-lab/corpo";
  import { apiConfig, corpoConfig, providerConfig } from "$lib/config";

  let { children }: { children: Snippet } = $props();

  // Rune-Lab Icon renders Iconify markup. Load its renderer once on the client.
  onMount(() => {
    void import("@iconify/iconify");
  });
</script>

<!-- Observer Shell stays disabled: no observer plugin is registered.
     CorpoShell already registers layout, palettes, i18n, api, and corpo. -->
<CorpoShell corpo={corpoConfig} api={apiConfig} config={providerConfig}>
  {#snippet footer()}
    <!-- FOOTER CUSTOMIZATION: edit/extend AppFooter here, or replace this snippet.
         Company text and links live in $lib/config.ts.
         To remove it, set corpoConfig.regions.footer = false there. -->
    <AppFooter />
  {/snippet}
  {@render children()}
</CorpoShell>
