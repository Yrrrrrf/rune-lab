# Manual registration

The included patch targets the supplied source snapshot. Copy `api/` to `src/packages/plugins/api/` first. If `git apply --check` reports changed context, make these equivalent edits manually:

| File | Edit |
| --- | --- |
| Root `deno.json` | Add `./src/packages/plugins/api` to `workspace`; set root version to `0.5.3`. |
| `scripts/plugins.ts` | Add `"api"` to `PLUGINS`; add `api: []` to `PLUGIN_DEPS`. |
| `scripts/deploy.just` | Append `api` to `BUILD_PLUGINS`. |
| `src/tsconfig.json` | Add `"rune-lab/api": ["./packages/plugins/api/src/mod.ts"]` to paths. |
| Root `vite.config.ts` | Add `"rune-lab/api": resolve("./src/packages/plugins/api/src/mod.ts")` to aliases and `svelteProject("api", PLUGINS)` to projects (using the existing `PLUGINS` variable). |
| `src/packages/ui/src/mod.ts` | Update `version()` to return `"0.5.3"`. |

No changes are required to the kernel, provider, core contracts, existing plugin source, or manifest generation logic. No runtime plugin dependencies are declared: core/UI are always shipped by the existing packaging system, and `up-fetch` is declared in this plugin's own `deno.json`.

The runtime plugin ID is **`rune-lab.api`**, with slot **`api`**. Therefore the provider configuration path is exactly:

```ts
config: {
  pluginConfig: {
    "rune-lab.api": {
      api: apiConfig
    }
  }
}
```

Register the exported `api` descriptor in the provider's `plugins` array. Read `getApiStore()` only during Svelte component initialization, or inject the resulting client into ordinary SDK functions. For a headless instance, use `createApiClient()`.

## Existing project caveats

- The supplied test recipe runs core tests only. Adding the API test project does not, by itself, make that recipe run plugin tests. Use your Svelte/Vitest runner explicitly when validating this plugin.
- The supplied root Vite config declares Svelte at both the root and inline project levels. Whether those declarations duplicate compilation depends on your runner's config inheritance. The isolated verification used one Svelte transform. The registration patch preserves your pipeline configuration.
- The existing `rune-lab` root source alias points at `packages/rune-lab/src/mod.ts`, which is absent from the export. The plugin imports `rune-lab/core` and `rune-lab/ui`; its tests do the same. If testing the full app from source, reconcile that existing root alias with the actual UI entry.
- The existing `Icon` component renders Iconify markup; icon rendering follows the host application's existing Iconify setup. Monitor buttons retain visible text/accessible labels.

These integration notes are separate from plugin implementation; they do not require adding corpo or modifying existing application routes.
