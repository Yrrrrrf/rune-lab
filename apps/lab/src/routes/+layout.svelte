<script lang="ts">
import "./layout.css";
import { RuneProvider, version } from "rune-lab";
import { I18nPlugin } from "rune-lab/i18n";
import { LayoutPlugin } from "rune-lab/layout";
import { PalettesPlugin } from "rune-lab/palettes";
import type { Snippet } from "svelte";
import AppLayout from "./AppLayout.svelte";

import faviconUrl from "$lib/assets/img/rune.png";

let { children }: { children: Snippet } = $props();
</script>

<RuneProvider
  config={{
    favicon: faviconUrl,
    icons: "material",
    app: {
      name: "Rune Lab",
      version: version(),
      description: "Plugin test bench",
      author: "Yrrrrrf",
    },
    // Namespaced per-plugin config — without this key the kernel hands the theme
    // slot the whole object above and schema validation crashes (see §0).
    "rune-lab.layout": "dark",
  }}
  plugins={[LayoutPlugin, PalettesPlugin, I18nPlugin]}
>
  <AppLayout>
    {@render children()}
  </AppLayout>
</RuneProvider>
