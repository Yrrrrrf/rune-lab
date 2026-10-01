# Corpo integration

## 1. Add the plugin to Rune-Lab

Copy `corpo/` to `src/packages/plugins/corpo/`. The API plugin must already exist.
This package was checked against the published Rune-Lab **0.5.3** contracts.

Apply `integration.patch` from the repository root after the earlier API patch:

```sh
git apply --check src/packages/plugins/corpo/integration.patch
git apply src/packages/plugins/corpo/integration.patch
```

The patch is based on the provided source export plus the previous API plugin
registration patch. If your current registry formatting differs, make the small
registrations manually:

1. Add `./src/packages/plugins/corpo` to the root Deno workspace.
2. Add `corpo` to `scripts/plugins.ts`'s `PLUGINS` and set its dependency list to
   `["layout", "palettes", "i18n", "api"]`.
3. Append `corpo` to `BUILD_PLUGINS` in `scripts/deploy.just`.
4. Add `rune-lab/corpo` → `./packages/plugins/corpo/src/mod.ts` in `src/tsconfig.json`.
5. Add the equivalent Vite alias and `svelteProject("corpo", `${PLUGINS}`)` test project.

The existing manifest/build scripts then produce the `rune-lab/corpo` subpath.
No new pipeline or build task is needed. There are no new runtime dependencies
and no automatic version bump in the patch.

## 2. Share branding from the company SDK

```ts
// In your company SDK, alongside its existing public configuration.
import type { CompanyBrand } from "rune-lab/corpo";

export const company = {
  name: "Acme",
  legalName: "Acme Ltd.",
  tagline: "Tools for your team.",
  homeHref: "/",
  logo: { icon: "lucide:building-2" },
  // Or logo: { src: "/brand/logo.svg" },
  // themeLogos: { dark: { src: "/brand/logo-light.svg" } },
  links: [
    { id: "privacy", label: "Privacy", href: "/privacy" },
    {
      id: "support",
      label: "Support",
      href: "https://support.example.com",
      external: true,
    },
  ],
  copyrightStartYear: 2026,
} satisfies CompanyBrand;
```

These are examples, not shipped routes or hardcoded company values. Reuse this
object across apps; keep app-specific links, API endpoints, and region choices
in each app's configuration.

## 3. Consumer app: footer enabled

```svelte
<script lang="ts">
  import { CorpoShell } from "rune-lab/corpo";
  import { company } from "@acme/sdk";
  import type { Snippet } from "svelte";
  let { children }: { children: Snippet } = $props();
</script>

<CorpoShell
  corpo={{ company, variant: "consumer" }}
  config={{ app: { name: "Acme Portal", version: "1.0.0" } }}
  api={{
    environments: [
      { id: "prod", label: "Production", baseUrl: "https://api.example.com/" },
    ],
  }}
>
  {@render children()}
</CorpoShell>
```

Place it in the app's existing root layout. Remove that layout's outer
`RuneProvider`: CorpoShell already provides it. Keep any app-specific SEO
component inside the shell; RuneProvider still owns its existing app metadata.
The API plugin accepts omitted configuration too, and makes no requests until
configured/start conditions allow it.

## 4. Internal app: shared brand, workspace, no company footer

```svelte
<script lang="ts">
  import { CorpoShell } from "rune-lab/corpo";
  import { company } from "@acme/sdk";
  import type { Snippet } from "svelte";
  let { children }: { children: Snippet } = $props();
</script>

<CorpoShell
  corpo={{
    company,
    variant: "internal",
    navigation: [
      {
        id: "home",
        label: "Dashboard",
        href: "/",
        icon: "lucide:layout-dashboard",
      },
      {
        id: "customers",
        label: "Customers",
        href: "/customers",
        icon: "lucide:users",
      },
    ],
    regions: { footer: false },
    allowEnvironmentSwitch: true,
  }}
  config={{ app: { name: "Acme CRM", version: "1.0.0" } }}
  api={{
    environments: [
      {
        id: "dev",
        label: "Development",
        baseUrl: "http://localhost:8000/api/",
      },
      { id: "prod", label: "Production", baseUrl: "https://api.example.com/" },
    ],
    initialEnvironment: "dev",
    health: { path: "health" },
    autoCheck: true,
    persist: false,
  }}
>
  {#snippet actions()}
    <a class="btn btn-ghost btn-sm" href="/account">Account</a>
  {/snippet}
  {@render children()}
</CorpoShell>
```

Pass `activeHref` from the router for active navigation styling. Supply the
existing `localeAdapter` prop to use your app's locales rather than the bundled
Rune-Lab adapter. Use your API's real routes; Corpo makes no assumptions about
SurrealDB vs. another HTTP service. The existing API plugin's SurrealDB base-URL
helper and request methods work unchanged.

Optional footer for **any** variant:

```svelte
<CorpoShell corpo={{ company, variant: "internal", regions: { footer: true } }}>
  {#snippet footer()}
    <footer class="footer bg-base-200 p-4">Your app-specific footer</footer>
  {/snippet}
  <p>App content</p>
</CorpoShell>
```

A replacement snippet is rendered only when its region is enabled. The
`workspaceStrip` and `detail` snippets likewise require their region flags and
an internal/docs layout. Consumer apps use header/navigation/content/footer/status.

## 5. Keep an app-owned RuneProvider

```svelte
<script lang="ts">
  import { RuneProvider } from "rune-lab/ui";
  import { CorpoLayout, createCorpoIntegration } from "rune-lab/corpo";
  import { company } from "@acme/sdk";

  const integration = createCorpoIntegration({
    corpo: {
      company,
      variant: "docs",
      navigation: [{ id: "start", label: "Start", href: "/docs" }],
    },
    config: { app: { name: "Acme Documentation" } },
  });
</script>

<RuneProvider {...integration}>
  <CorpoLayout activeHref="/docs"><p>Documentation</p></CorpoLayout>
</RuneProvider>
```

`plugins` adds extensions to the standard set. Add Observer explicitly only
where its root takeover is desired. To assemble a provider entirely manually,
register all five plugins and pass:

```ts
pluginConfig: {
  "rune-lab.corpo": { corpo: { company, variant: "internal" } },
  "rune-lab.api": { api: yourApiConfig },
}
```

## 6. CSS and validation

Keep your existing Tailwind/daisyUI setup. For an installed package, ensure its
source is scanned; paths below are relative to your CSS file:

```css
@import "tailwindcss";
@plugin "daisyui" {
  themes: all;
}
@source "../../node_modules/rune-lab/dist";
```

For monorepo development scan `src/packages/plugins/corpo/src` and the other
Rune-Lab component source directories using paths appropriate to your app.
The plugin uses the existing Rune-Lab icon loader rather than adding one.

Run your existing Svelte check and the Corpo test project through your normal
pipeline. Tests are colocated in the plugin, never in app routes. They use the
repository's `vite-plus/test` convention. `VERIFICATION.md` records the external
validation environment used for this delivery.
