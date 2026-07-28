<script lang="ts">
import "./layout.css";
import { RuneProvider, version } from "rune-lab";
import type { Snippet } from "svelte";
import faviconUrl from "$lib/assets/img/rune.png";
import AppLayout from "./AppLayout.svelte";

let { children }: { children: Snippet } = $props();
</script>

<RuneProvider
  config={{
    app: {
      name: "Rune Lab",
      version: version(),
      description: "Plugin test bench",
      author: "Yrrrrrf",
      icon: faviconUrl,
    }
  }}
>
  <AppLayout>
    {@render children()}
  </AppLayout>
</RuneProvider>
