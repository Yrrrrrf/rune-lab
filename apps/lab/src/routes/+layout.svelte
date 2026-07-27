<script lang="ts">
import "./layout.css";
// fallow-ignore-next-line unresolved-import
import { pushState, replaceState } from "$app/navigation";
import { RuneProvider, version } from "rune-lab";
import { i18n } from "rune-lab/i18n";
import { layout } from "rune-lab/layout";
import { palettes } from "rune-lab/palettes";
import type { Snippet } from "svelte";
import AppLayout from "./AppLayout.svelte";

import faviconUrl from "$lib/assets/img/rune.png";

let { children }: { children: Snippet } = $props();
</script>

<RuneProvider
  config={{
    icons: "material",
    app: {
      name: "Rune Lab",
      version: version(),
      description: "Plugin test bench",
      author: "Yrrrrrf",
      icon: faviconUrl,
    },
  }}
  plugins={[layout, palettes, i18n]}
>
  <AppLayout>
    {@render children()}
  </AppLayout>
</RuneProvider>
