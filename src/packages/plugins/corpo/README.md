# Rune-Lab Corpo

Reusable company branding and application chrome for Rune-Lab 0.5.3, Svelte 5,
Tailwind CSS 4, and daisyUI 5. Copy this directory to
`src/packages/plugins/corpo`, then follow [INTEGRATION.md](./INTEGRATION.md).

## One app entry point

`CorpoShell` includes `RuneProvider`, registers `layout`, `palettes`, `i18n`,
`api`, and `corpo`, and renders the connected branded layout within their context.
App code needs only `CorpoShell`. Components below it can use the standard
Rune-Lab store accessors. Existing overlays supply settings, commands, shortcuts,
and toast notifications; Corpo does not mount a second set of hosts.

Apps with an existing `RuneProvider` use `createCorpoIntegration()` and
`CorpoLayout` instead. Nesting `CorpoShell` inside a provider throws a descriptive
error. Observer remains an explicit extension because it takes over the root UI.

## Shared company, separate apps

Keep one `CompanyBrand` object in the company SDK. App metadata belongs to
Rune-Lab's existing `config.app`; company identity belongs to `corpo.company`.
Each app supplies its own `variant`, regions, navigation, and actions.

| Variant    | Layout                                | Footer default | Status bar default | Command/settings actions |
| ---------- | ------------------------------------- | -------------- | ------------------ | ------------------------ |
| `consumer` | Natural document scrolling            | On             | Off                | Off                      |
| `internal` | Existing WorkspaceLayout              | Off            | On                 | On                       |
| `docs`     | Existing WorkspaceLayout, docs preset | Off            | Off                | Off                      |

Every region has an explicit boolean override. Theme and language selectors are
on by default. Navigation is enabled when links are supplied; docs also enables
its navigation region for a supplied snippet. Workspace strip and detail panel
are opt-in and use app snippets in internal/docs layouts. They are not regions
of the consumer document layout.

`footer: false` removes the company footer entirely. Rune-Lab's workspace status
bar uses a separate `<footer>` element internally; it is not the company footer.

## Public components

| Component       | Responsibility                                                                        |
| --------------- | ------------------------------------------------------------------------------------- |
| `Logo`          | Company Iconify mark through Rune-Lab `Icon`, or image asset; exact theme overrides   |
| `AppIdentity`   | Company name/mark, app name, optional home link                                       |
| `AppHeader`     | daisyUI navbar, identity, existing layout navigation toggle, actions                  |
| `AppActions`    | Existing command/settings palettes, theme/language selectors, custom actions          |
| `AppNavigation` | daisyUI menu, app links, router-provided active URL                                   |
| `AppStatusbar`  | Existing APIMonitor, optional environment selector, status contributions, app version |
| `AppFooter`     | Identity, tagline, copyright, configured company links, optional extra snippet        |
| `CorpoLayout`   | Connects regions under an existing configured RuneProvider                            |
| `CorpoShell`    | Provider + standard plugins + CorpoLayout                                             |

Use named snippet props `header`, `navigation`, `workspaceStrip`, `detail`,
`statusbar`, and `footer` to replace regions. Their corresponding region flags
still control visibility. `actions` adds content to the default AppActions.
`children` is the app content. A custom header can render `<AppActions />` itself.
Standalone AppActions, AppStatusbar and AppFooter also accept a `children` snippet.

## Configuration and lifecycle

- `corpo` is a required `CorpoConfig` with `company.name`.
- `api` is the existing `ApiConfig`; no new HTTP client, polling loop, or credentials store.
- `config`, `plugins`, and `localeAdapter` preserve RuneProvider's extension points.
- Explicit `api` and `corpo` props take precedence over their matching slot configs.
  Other provider configuration is preserved. Standard plugin definitions win
  duplicate IDs, following Rune-Lab's first-registration-wins behavior.
- Provider inputs are captured once, matching RuneProvider. For live branding or
  region changes, call `getCorpoStore().configure(nextConfig)` or
  `.setRegion("footer", false)` in a descendant. To replace provider inputs,
  remount the shell (for example with a Svelte `{#key appId}` block).
- `showVersion` and `showApiDetails` are writable store preferences exposed in
  the existing Settings modal. Company/app configuration is not persisted; one
  app's footer choice cannot overwrite another's.
- Layout owns interactive panel toggles. Updating unrelated Corpo preferences
  does not reset those toggles. Changing the variant intentionally reapplies
  its preset and explicit region choices.
- `activeHref` comes from your router; Corpo neither intercepts links nor imports
  SvelteKit. `dir` accepts `ltr`/`rtl` and passes through to the layout.
- Labels use `getT()` keys prefixed with `corpo.` and readable English fallbacks.
  Company names and supplied link labels are application-owned content.

API status is shown by default only for internal apps. Environment switching is
always opt-in via `allowEnvironmentSwitch: true`. The flag controls the shell's
selector; it is not an authorization policy, and the existing API settings remain
available. The API plugin owns endpoint selection, persistence, health state,
request execution, and cancellation. Configure its permitted environments per app.

`themeLogos` is keyed by the theme store's exact selection (for example `dark`,
`corporate`, or `system`). An unmapped theme uses `logo`; absent `logo` uses
`lucide:building-2`. Use assets that suit both backgrounds for the `system` choice.
Images use their own assets; Iconify marks use your existing icon loader.

## Styling

No new primitives, UI dependency, or custom stylesheet. Corpo composes daisyUI
`navbar`, `menu`, `footer`, `btn`, and `link` classes with semantic theme colors
and Tailwind layout utilities. Theme/language selectors, API monitor, status bar
contributions, and palette dialogs are the existing Rune-Lab components.

Ensure Tailwind scans the installed Rune-Lab package (see integration guide).
The internal status bar has horizontal overflow for narrow viewports; detailed
API information does not expand the workspace vertically. Content has a keyboard
skip link. Document layouts use normal scrolling; workspace layouts retain
Rune-Lab's own sizing, responsive panels, shortcuts, and scroll behavior.

See [VERIFICATION.md](./VERIFICATION.md) for the tested scope.
