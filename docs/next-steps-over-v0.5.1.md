# Rune Lab — The Check Loop & The Showcase Move

> Companion to `rune-lab-v0.5-completion-spec.md`. Two parts: (A) what to verify
> **every time** you land a change, at three speeds; (B) the next-up work order
> — dissolving the lab boilerplate into a `showcase` plugin.

---

## Part A — What to check each time

### A.1 Fast loop (every commit, < 1 min)

Run before every commit; if any step fails, the commit doesn't happen.

1. **Format + types** — `just check` (fmt via deno/biome, svelte-check/type pass
   per touched ring).
2. **Unit tests of the touched ring only** — core edit → kernel/forge suite; ui
   edit → kit/settings/cells suite; plugin edit → that plugin's suite.
3. **Standard-shape gate** (plugins only) — the touched plugin still has the
   five-folder shape, and _nothing inside it imports its own `mod.ts`_.
4. **Boundary grep** —
   `rg -l "Theme|Shortcut|Command|Toast|Currency|hotkeys" src/packages/ui/` →
   zero hits. Ten seconds, catches the worst class of drift.

### A.2 Structural loop (every merged task / end of day)

5. **`just audit`** (fallow) and compare against the frozen baseline:
   - circular dependencies: must be **0** in every migrated tree, never
     increases anywhere;
   - clone groups: never increases; the two shortcut clones and the useMoney
     clone must stay dead;
   - complexity: no new CRITICAL; any function you touched that was CRITICAL
     must exit below threshold;
   - dead exports: only trust after entry-points config (Phase 0); investigate
     anything newly-dead — it's either a real kill (delete it) or a wiring
     mistake (fix it).
6. **Sideways-import gate** — a plugin's tree imports only: itself, ui public
   surface, core types; palettes may additionally import layout's `mod.ts`
   surface. Anything else fails.
7. **Kernel graph sanity** — kernel tests for: plugin-level topo order,
   `requires` missing/cycle errors naming both ids, persist-handle namespacing,
   contribution single-registration.

### A.3 Lab acceptance script (every phase exit + before any publish)

Boot `apps/lab` and walk this exact sequence — it exercises every load-bearing
seam:

8. **Boot** — provider mounts with layout + palettes + i18n + observer; zero
   console errors; no flash-of-wrong-theme on SSR load.
9. **Persistence round-trip** — change theme → reload → theme held. Same for
   language and currency. This proves the kernel `persist:` path end-to-end
   (schema-guarded load, namespaced handle, driver).
10. **Corrupt-value guard** — hand-edit one persisted value in devtools to
    garbage → reload → app boots on the fallback, never crashes (cells' schema
    guard).
11. **Zones & presets** — switch `page` ↔ `docs` ↔ `workspace`; toggle detail
    panel; state survives reload if persisted.
12. **Palettes** — Ctrl+K opens commands, Ctrl+/ opens shortcuts, Escape closes,
    focus returns to trigger; run a built-in layout command ("toggle detail")
    and watch the zone respond — this proves palettes→layout through public
    surface only.
13. **Settings modal** — every section present is schema-driven; search finds a
    field by label; a keybind field captures a combo; changed values persist.
14. **Observer** — plugin graph shows all four plugins and the palettes→layout
    edge; change theme and watch the cell version tick; persistence view lists
    namespaced keys. If the graph matches your specs, the wiring is real.
15. **Kernel disposal** — navigate in a way that unmounts the provider (or run
    the disposal test) → no listener leaks, hotkeys unbound.

### A.4 Dist loop (Phase 4 and every release forever)

16. `just build` then the gate suite against `build/`:
    - `rg "@rune-lab" build/` → zero hits;
    - every exports-map entry resolves to an existing file;
    - reshuffle integrity: every relative import under `dist/src/**` and in root
      `mod.js` resolves.
17. **Clean-room** — pack the tarball, install into a scratch SvelteKit app
    _outside_ the workspace (never trust `just run lab` alone — workspace
    resolution shadows), import root + `/core` + `/layout` + `/palettes`, render
    the provider, run steps 9 and 12 there.
18. **Consumer config reality check** — scratch app has the two mandatory
    consumer steps (`ssr.noExternal: ["rune-lab"]`, Tailwind `@source` pointing
    at the dist) and _only_ those; if a third step became necessary, that's a
    regression in the product, stop and fix.

---

## Part B — Next up: the lab boilerplate becomes the `showcase` plugin

The lab app currently owns real product code that belongs in the platform: the
showcase tabs (Actions/DataInput/Display/Feedback/Navigation/Visual), the
dashboard/shortcuts panels, the interaction deck, and the
stores-mirror/persistence-inspector (the latter two already dissolve into
observer per its work order). The end state: **`apps/lab` is a ~40-line
consumer** — provider + plugin list + one route — and everything demonstrative
is `plugins/showcase`.

### B.1 Target shape (same standard as every plugin)

```
plugins/showcase/src/
├─ plugin.ts        id "rune-lab.showcase" · requires: [layout, palettes]
│                   slot: showcase (active tab/card state, factory-only)
│                   contributions: navigation sections (into layout), demo commands +
│                   a "showcase" palette (into palettes), settings section (demo toggles)
├─ stores/          showcase.svelte.ts — tab/card/selection state
├─ components/      Showcase shell + ShowcaseCard + one component per tab
├─ settings.ts      defineSettings("showcase") — visibility toggles per tab
├─ types.ts         ShowcaseTab, ShowcaseCard descriptors (cards as data, not markup)
└─ mod.ts           export-only
```

Design intent: showcase is the platform's **reference consumer** — it must use
only public surface (kit accessors, contributions, zones, palette registry). If
showcase needs a private hook to work, the platform has a gap; fix the platform,
never punch a hole.

### B.2 TODO — the move

- [ ] **Precondition:** all four plugin work orders complete; lab acceptance
      script (A.3) fully green.
- [ ] Define `ShowcaseTab`/`ShowcaseCard` as _data descriptors_ in `types.ts`;
      convert each lab tab component to render from descriptors (kills
      copy-paste growth as tabs multiply).
- [ ] Write `plugin.ts` with `requires: [layout, palettes]` — second real
      consumer of plugin-level deps; contribute nav sections into layout's zones
      and a demo palette + commands into the palette registry.
- [ ] Move `InteractionDeck`, `Showcase*`, tab components, dashboard/shortcuts
      panels into `components/`; every import goes through public accessors
      only.
- [ ] Migrate lab's paraglide messages: showcase-owned strings move into the
      plugin's message catalog through i18n's public resolution surface; lab
      keeps only app-identity strings.
- [ ] Shrink `apps/lab` to: `+layout.svelte` (provider +
      `[LayoutPlugin, PalettesPlugin, I18nPlugin, ObserverPlugin, ShowcasePlugin]`),
      `+page.svelte` (mount point), app config. Target ≤ 40 lines of consumer
      code total — this number is the acceptance criterion, put it in the
      fitness suite.
- [ ] **Decide the distribution question before merging** (trade-off, don't
      default): does `showcase` ship in the npm package (new exports entry →
      touches the three-party contract → all three files change together) or
      stay workspace-internal as a dev/e2e plugin? Recommendation:
      **workspace-internal for v0.5** — zero contract risk, and the clean-room
      scratch app becomes the honest external consumer instead. Revisit for
      docs-site purposes later.
- [ ] Add to the fitness suite: showcase's tree imports zero deep paths (public
      surfaces only) — the "reference consumer" guarantee, enforced.
- [ ] Re-run the full A.3 script; then A.4 including clean-room. The lab boots
      identically to before the move — that equivalence is the exit criterion.

### B.3 What this unlocks (why it's worth doing right after v0.5)

Every future feature demo becomes a showcase contribution instead of lab
surgery; the docs site can mount the showcase plugin directly; and the platform
gains a permanent, CI-enforced answer to "can a real plugin be built on public
surface alone?" — which is the three-line-recipe promise, tested forever.
