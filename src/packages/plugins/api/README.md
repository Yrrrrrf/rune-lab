# Rune-Lab API plugin — v0.5.3

A provider-scoped HTTP client built on **up-fetch 2.6.0**, with reactive environment selection, health monitoring, settings, and a small Svelte monitor. No dependency on layout, palettes, i18n, observer, or a database SDK. The host can compose these integrations later through corpo.

## Install into the supplied Rune-Lab project

1. Copy this entire `api/` directory to `src/packages/plugins/api/`.
2. From the repository root, check and apply the included registration patch:

   ```sh
   git apply --check src/packages/plugins/api/integration.patch
   git apply src/packages/plugins/api/integration.patch
   deno install
   ```

   The patch targets the exact supplied September 30 source export. It registers the workspace member, build plugin, dependency entry, source aliases, and test project; it also sets both version declarations to `0.5.3`. It does not redesign the pipeline or add corpo. If your files have since changed, use `INTEGRATION.md` to make those small registrations manually.

3. Add `api` to `RuneProvider.plugins` and supply the configuration below.
4. Build and inject the package using your existing `just build` and `just inject` workflow. `scripts/manifest.ts` derives the `rune-lab/api` public export and the `up-fetch` runtime dependency from the plugin registry and its `deno.json`.

Copying a directory alone cannot register a plugin in the supplied explicit workspace/build lists. The patch handles those required registrations; it is not an automatic installer.

## Provider setup

```svelte
<script lang="ts">
  import { RuneProvider } from "rune-lab";
  import { api, type ApiConfig } from "rune-lab/api";
  import { layout } from "rune-lab/layout";
  import { palettes } from "rune-lab/palettes";
  import type { Snippet } from "svelte";
  import AppLayout from "./AppLayout.svelte";

  let { children }: { children: Snippet } = $props();

  const apiConfig = {
    environments: [
      { id: "dev", label: "Development", baseUrl: "http://localhost:8000/api/app/main" },
      { id: "prod", label: "Production", baseUrl: "https://db.example.com/api/app/main" },
    ],
    initialEnvironment: "dev",
    health: {
      path: "/health",
      interpret: (data) => {
        const result = data as { status?: string; db_status?: string };
        return { status: result.status === "ok" && result.db_status !== "error" ? "healthy" : "degraded" };
      },
    },
    autoCheck: true,
    monitoring: false,
    pollIntervalMs: 30_000,
  } satisfies ApiConfig;
</script>

<RuneProvider
  plugins={[layout, palettes, api]}
  config={{ pluginConfig: { "rune-lab.api": { api: apiConfig } } }}
>
  <AppLayout>{@render children()}</AppLayout>
</RuneProvider>
```

Include your existing plugins alongside `api`. The supplied `RuneProvider` does not insert layout/palettes automatically, despite the older README description. Configuration is read once during provider creation. Change environments with `setEnvironment()`; recreate the provider to replace the environment catalog.

An absent configuration creates an inert store so application setup can be composed incrementally. Requests fail with `ApiConfigurationError` until a configured instance is provided.

## Requests in components and company SDKs

```svelte
<script lang="ts">
  import { getApiStore, isResponseError } from "rune-lab/api";
  const api = getApiStore(); // During component initialization.

  async function saveOrder() {
    try {
      const order = await api.post("/orders", { quantity: 2 });
      // Use a schema for validated, inferred response types.
    } catch (error) {
      if (isResponseError(error)) console.error(error.status, error.data);
    }
  }
</script>
```

The small public request surface is:

| Method | Arguments |
| --- | --- |
| `request<T>()` | `path, options?` |
| `get<T>()` | `path, options?` |
| `post<T>()`, `put<T>()`, `patch<T>()` | `path, body?, options?` |
| `delete<T>()` | `path, options?` |
| `execRaw<T>()` | `query, params?, options?` |
| `checkHealth()` | No arguments; resolves to a health snapshot |
| `setEnvironment()` | A configured environment ID |
| `onEnvironmentChange()` | Listener; returns unsubscribe |

Options retain up-fetch's `params`, `headers`, `schema`, custom parsing/serialization, hooks, progress callbacks, retry policy, and standard fetch options. `baseUrl` is owned by the selected environment. Requests accept base-relative string paths, not arbitrary origins or `Request` objects.

With a Standard Schema implementation already used by your app:

```ts
const customer = await api.get("/customers/42", { schema: CustomerSchema });
// customer is inferred from CustomerSchema, which also validates the payload.
const controller = new AbortController();
await api.get("/customers", {
  params: { limit: 20, offset: 0 },
  signal: controller.signal,
});
```

Without a schema, results default to `unknown`. An explicit `<Customer>` is a TypeScript assertion, not runtime validation. Backend payloads remain unchanged; there is no automatic `data` envelope extraction. JSON `false`, `0`, and `""` are preserved; empty responses resolve to `null`. Use `parseResponse` for binary payloads.

HTTP, schema, transport, timeout, and abort failures retain their original rejection values. `describeApiError()` provides a presentation-oriented classification. The store records the last non-cancellation failure without retaining request bodies or credentials as telemetry. Error causes can contain backend payloads; display only appropriate messages in user-facing UI.

## Authentication and environments

Put authentication on each environment:

```ts
{
  id: "prod",
  label: "Production",
  baseUrl: "https://db.example.com/api/app/main",
  getToken: () => sessionForProduction.accessToken,
  // Alternatively use headers: () => ({ Authorization: ... }).
  // credentials: "include" for an appropriate cookie-authenticated backend.
}
```

Tokens are resolved before each request and never persisted by this plugin. `Authorization: undefined` in request headers removes the inherited header. Cookie sessions and bearer-token lifecycle remain the application's responsibility. Server CORS must allow the actual frontend origin and required headers; browser applications use credentials intended for application users.

The default redirect policy is `error`, avoiding accidental credential forwarding. Per-request options can explicitly override it when the app owns and understands the redirect destination.

Switching environments aborts outstanding work and prevents stale responses from updating the store or resolving successfully to callers. An abort does not reverse a mutation already accepted by a server. Subscribe to `onEnvironmentChange()` to clear company-SDK caches and visible application data; the plugin does not own those caches. Authentication state should be scoped to each environment.

Only the selected ID and monitoring preference are persisted. Set `persist: false` to disable preference persistence, or supply the provider's existing memory/session driver. Await `api.ready` when you need the restored selection before reading it; requests already do this automatically. An explicit selection made before async hydration finishes takes precedence.

## Health and lifecycle

A health endpoint must be configured. The plugin does not guess `/health`, `/status`, `/docs`, or a version suffix. A successful HTTP response means healthy by default; use `health.interpret` to detect failed dependencies returned with HTTP 200. The interpreter can return `healthy`, `degraded`, or `unhealthy`, with optional `message` and `version`.

`api.state.health` also reports `unknown`, `unreachable`, or `unauthorized`, plus `checking`, `checkedAt`, and client-observed `latencyMs`. Request loading (`api.state.pending`) is separate from service health. A 401/403 health response means access denied, not offline. An invalid interpreter result remains unknown rather than claiming the service is down.

The invisible `APIRuntime` overlay starts once on browser mount. Defaults:

- One initial health check when configured (`autoCheck: true`).
- Repeated polling disabled (`monitoring: false`).
- Poll interval 30 seconds, measured after completion, with no overlapping checks.
- Polling pauses while the document is hidden and rechecks when visible/online.
- Concurrent manual checks share the same work.
- Provider disposal removes listeners, cancels owned requests, and stops timers.

Set `health: false` on an environment to disable the global health configuration there. `start()`/`stop()` control browser monitoring for manual client usage; construction and SSR never initiate requests or polling. `stop()` stops automatic scheduling; `dispose()` also aborts outstanding work.

Requests default to a 10-second total deadline, including async authentication and response parsing; health requests default to 5 seconds. The same timeout is passed to up-fetch, but the plugin's outer deadline bounds the entire request including retries. A per-request `timeout: 0` disables that deadline. Abort signals continue to work regardless. All automatic retries are off by default; opt in per request only where safe.

## APIMonitor and settings

Render inside your existing status-bar snippet:

```svelte
<script lang="ts">
  import { APIMonitor } from "rune-lab/api";
</script>

<APIMonitor showEnvironmentSelector showDetails />
```

Or opt into floating placement with `<APIMonitor floating />`. A monitor never owns a polling loop. It uses Rune-Lab's `Icon` and `getT()` fallback translations, and works without palettes or i18n. `docsUrl` is optional per environment. Clipboard success is shown only after completion; `onCopied(url)` lets the host add its preferred notification. The `api.*` translation keys are visible in the two UI components.

`APIEnvironmentSelector` can be used independently. Settings register the environment selector and monitoring toggle through the existing settings schema. Corpo can compose these exports directly without duplicating networking state.

## SurrealDB custom API routes

```ts
import { surrealApiBaseUrl } from "rune-lab/api";
const baseUrl = surrealApiBaseUrl("https://db.example.com", "app", "main");
// https://db.example.com/api/app/main
```

A leading slash in `api.get("/customers")` is relative to that full base, preserving the namespace/database prefix. The helper also preserves a reverse-proxy prefix in the supplied server URL.

Define application HTTP endpoints on your server. For example, a public liveness endpoint:

```surql
DEFINE API OVERWRITE "/health"
  FOR get
  THEN {
    RETURN { status: 200, body: { status: "ok" } };
  }
  PERMISSIONS FULL;
```

The browser receives the configured HTTP body. `status: 200` is the server's HTTP response status; the health payload belongs inside `body`. Application authorization, invariants, transactions, and derivation stay server-side.

Reference: https://surrealdb.com/docs/reference/query-language/statements/define/api

This plugin does not implement `/sql`, `/rpc`, database sessions, or live queries. Custom `DEFINE API` routes work using HTTP alone.

## Explicit raw execution

Configure only when your backend implements an execution endpoint:

```ts
const configuration: ApiConfig = {
  environments: [{ id: "dev", label: "Development", baseUrl: "/api" }],
  execRaw: { path: "/exec-raw" },
};
// Sends POST /api/exec-raw with { query, params }.
await api.execRaw("RETURN $value", { value: 42 });
```

`execRaw.body(query, params)` adapts a different server payload contract. `execRaw: false` disables the global mapping for an environment. This is a client convenience, not a built-in SurrealDB route or an authorization boundary. It always uses POST and disables retries, including when per-call options request them. The server must independently authorize and constrain execution. Query parameters are sent separately; the client does not interpolate query strings.

## Headless use and SSR

`createApiClient(config, persistence?)` is ordinary TypeScript. It has no Svelte state or context dependency. Pass a request-scoped fetch and absolute base URL (or `origin`) for server-side requests. Never share an authenticated client across SSR users.

The aggregate `rune-lab/api` entry also exports Svelte components; it is intended for Svelte-aware bundlers. Direct source consumers needing no Svelte loader can import `src/client.ts`. The current Rune-Lab manifest generator creates one public subpath per plugin, so a separate published headless subpath is not added by this package.

## Files and verification

- `src/client.ts`: transport, state, health, environments, persistence, lifecycle.
- `src/store.svelte.ts`: Svelte subscription bridge over that client.
- `src/plugin.ts`, `context.ts`, `settings.ts`: Rune-Lab integration.
- `src/types.ts`, `errors.ts`, `url.ts`: contracts and small shared helpers.
- `src/components/`: monitor, selector, invisible runtime, and test hosts.
- `src/*.test.ts`: behavior and actual provider/kernel integration tests.

See `VERIFICATION.md` for the checks performed and their limits. Tests and test hosts are named `*.test.*` so your existing distribution cleanup removes them.
