<script lang="ts">
import "./layout.css";
// fallow-ignore-next-line unresolved-import
import { pushState, replaceState } from "$app/navigation";
import { RuneProvider, version } from "rune-lab";
import { I18nPlugin } from "rune-lab/i18n";
import { LayoutPlugin } from "rune-lab/layout";
import { PalettesPlugin } from "rune-lab/palettes";
import type { Snippet } from "svelte";
import AppLayout from "./AppLayout.svelte";

import faviconUrl from "$lib/assets/img/rune.png";

let { children }: { children: Snippet } = $props();

const layoutPlugin = LayoutPlugin.with({ theme: "dark" });
const palettesPlugin = PalettesPlugin.with({
  registry: {
    router: {
      replaceState: (url: string) => replaceState(url, {}),
      pushState: (url: string) => pushState(url, {}),
    },
  },
});
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
  plugins={[layoutPlugin, palettesPlugin, I18nPlugin]}
>
  <AppLayout>
    {@render children()}
  </AppLayout>
</RuneProvider>
