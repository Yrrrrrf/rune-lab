# Architecture

## Layers

| Layer     | Rule                                                                                                                       |
| --------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`    | No Svelte, no DOM, no plugin knowledge. Kernel, contracts, ports.                                                          |
| `ui`      | The Svelte layer. Holds anything **any** plugin could need. Depends on `core`. Never imports a plugin.                     |
| `plugins` | Depend on `ui` + `core`. May depend on each other, through declared edges only (see `scripts/plugins.ts`'s `PLUGIN_DEPS`). |

Dependencies only point downward: `plugins → ui → core`. Nothing imports upward,
and `ui` never reaches sideways into a plugin.

## Placement test

_A component belongs where its logic lives._

A component that knows a domain (a store, a domain type, a domain-specific
rendering rule) stays with that domain's plugin. A component that knows nothing
about any one domain — it renders a list, a shell, a generic selection UI —
belongs in `ui`, because every plugin could need it and none of them owns it.

When in doubt, ask: if this component were deleted, which single plugin would
notice? If the honest answer is "none in particular, several would each
reimplement it," it belongs in `ui`.

## Verifying the invariant

```bash
# ui never imports a plugin
grep -rn 'from "rune-lab/\(layout\|palettes\|i18n\|observer\)"' src/packages/ui   # must be empty

# core never imports Svelte, DOM, ui, or a plugin
grep -rn "svelte" src/packages/core/src --include="*.ts"                          # must be empty
```
