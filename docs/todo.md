# rune-lab · Enhancement Spec
### Principal Software Architect Review — v0.2.3 → Next

---

## 0. Context Snapshot

You have **two apps** and **one library**:

| Asset | Role | State |
|---|---|---|
| `rune-lab` | The library itself — stores, components, layout shells | Published, injected via local build |
| `inventory` (the **Lab**) | A dev-tool app that exercises the library in a 4-quadrant grid | ✅ Excellent — keep as-is |
| `explorer` | A separate demo/showcase app with DaisyUI component browsing + panels | ⚠️ Old implementation — harvest its best parts |

The lab's 4 quadrants today are:

```
┌──────────────────┬──────────────────┐
│   StoresMirror   │ InteractionDeck  │
├──────────────────┼──────────────────┤
│ ComponentsPanel  │PersistenceInspect│
└──────────────────┴──────────────────┘
```

This is a **masterpiece foundation**. The goal is to make it richer without ever breaking what works.

---

## 1. The Main Goal

**Merge the best of `explorer` into `inventory/lab`, then evolve the lab itself into a first-class dev dashboard.**

Three concrete outcomes:

1. **Showcase Panel** — bring the DaisyUI component showcase (Actions, DataInput, Display, Feedback, Navigation, Visual tabs) into the lab's bottom-left quadrant, replacing or upgrading `ComponentsPanel`.
2. **Dashboard Panel** — a real reactive "heartbeat" panel that surfaces store health, activity, and quick-fire actions — already designed in `explorer`'s `DashboardPanel.svelte`, ready to integrate.
3. **Quad-aware navigation** — the lab header or a sidebar should let the user swap what lives in each quadrant, making the lab extensible rather than hard-coded.

---

## 2. Architecture Rules

These are non-negotiable constraints that protect the 10-year horizon:

- **Svelte 5 runes-first**: `$state`, `$derived`, `$effect`. Zero legacy reactive statements.
- **rune-lab stores only**: Never import raw stores directly — always use `getToastStore()`, `getLayoutStore()`, etc. via context.
- **DaisyUI v5 + Tailwind v4**: All styling through utility classes. No custom CSS unless absolutely unavoidable.
- **Paraglide for i18n**: All user-facing strings go through the message catalog. No hardcoded English in components.
- **One source of truth per panel**: Each quadrant panel is a single self-contained `.svelte` file in `src/routes/lab/`. It imports from `rune-lab` and nothing else from the outside. No shared local state between panels.
- **Zero prop drilling**: Panels communicate only through rune-lab stores. If two panels need to react to the same thing, that thing lives in a store.

---

## 3. What to Build — The Full Spec

### 3.1 — `ShowcasePanel.svelte` (replaces `ComponentsPanel.svelte`)

**What:** A tabbed DaisyUI component explorer living in the bottom-left quadrant.

**Why:** `ComponentsPanel` today only shows rune-lab primitives (UserAvatar, Icon, DatePicker, etc). The `explorer` app has a fully built showcase with 5 rich tabs. Merging these gives developers a live, interactive DaisyUI reference inside the lab itself — no context switching needed.

**How:**

The showcase from `explorer` is already architected correctly. The migration path is:

- Copy `src/lib/showcase/tabs/` (Actions, DataInput, Display, Feedback, Navigation, Visual) into the inventory project.
- Copy `ShowcaseCard.svelte`, `shared.ts`, and `state.svelte.ts`.
- Replace `ComponentsPanel.svelte` with a new `ShowcasePanel.svelte` that wraps these tabs.
- The tab state (`showcaseState.activeTab`) is module-level `$state` — this is correct. It should remain local to the showcase and not pollute any store.
- The panel header should mirror the current quadrant style: `text-xs font-black uppercase tracking-widest text-primary/70`.

**What changes from the explorer version:**

The explorer's `Showcase.svelte` uses a large `tabs-box tabs-lg` bar that takes a lot of vertical space. For the lab's compact quadrant layout, replace it with a compact `menu menu-xs` vertical navigation on the left side of the panel, with the content to the right — similar to how `ShowcasePanel.svelte` already does in the explorer's detail panel. This is the right pattern for a quadrant.

**Rune-lab components section** — keep a dedicated sub-tab called "Primitives" inside the showcase that covers `UserAvatar`, `NotificationBell`, `Icon`, `DatePicker`, `MoneyDisplay`, and `MoneyInput`. These are what was in `ComponentsPanel` and must not be lost.

---

### 3.2 — `DashboardPanel.svelte` (new, in bottom-left or swappable)

**What:** A reactive "heartbeat" panel showing live store state, quick-fire actions, and an activity log.

**Why:** The `explorer`'s `DashboardPanel.svelte` is already a beautiful, well-thought-out component. It has four sections: a reactive pulse indicator, a store snapshot table, quick-fire control buttons, and a timeline activity log. This is exactly what a dev lab needs.

**How:**

- Copy `DashboardPanel.svelte` from `explorer/src/lib/panels/` directly into `inventory/src/routes/lab/`.
- It needs zero structural changes — it already uses `getToastStore`, `getApiStore`, `getThemeStore`, `getShortcutStore`, `getAppStore`, `getLanguageStore`, all via context.
- The `cycleTheme` function is a valuable quick action — keep it.
- The `stateHash` derived value and `beat` pulse animation are elegant reactive patterns — keep them exactly as-is.

---

### 3.3 — Quad Navigation System

**What:** A mechanism to swap what panel lives in each quadrant.

**Why:** Right now the 4-quadrant grid is hard-coded in `+page.svelte`. As the library grows, you'll want more panels. A swappable quad system means the lab stays useful at year 5 and year 10 without becoming a maze of `{#if}` branches.

**How:**

Define a `LabPanel` type in a new file `src/routes/lab/panels.ts`:

```
type LabPanel = {
  id: string
  label: string
  icon: string
  component: Component  // Svelte component type
}
```

Register all available panels in a static array. Store the current quad assignments in a simple `$state` object (4 slots → 4 panel IDs). Render in `+page.svelte` by looking up the component from the registry.

The LabHeader (top bar) should have a small "Quad Config" button (a grid icon) that opens a popover or drawer where the user can drag-assign panels to quadrants. For V1, a simple select per quadrant is fine — the drag interface can come later.

This system should **not** be in a rune-lab store. It is local lab state, not application state. A `labState.svelte.ts` module-level `$state` is the right pattern (same as `showcaseState`).

---

### 3.4 — `AppStateInspector` Promotion

**What:** Move `AppStateInspector.svelte` from `explorer` into the lab as a panel option.

**Why:** The big "Live Store Dashboard" view with the stats bar and detail cards is impressive and useful. It currently only lives in `explorer`. Making it a swappable lab panel gives it a permanent home.

**How:** Copy it as `StoreInspectorPanel.svelte` and register it in the quad navigation system. It becomes quadrant option #5 alongside StoresMirror, InteractionDeck, ShowcasePanel, and DashboardPanel.

---

### 3.5 — `ShortcutsPanel` Integration

**What:** The `ShortcutsPanel.svelte` from `explorer` (live shortcut registry, conflict detector, enable/disable toggles) becomes a quadrant panel option in the lab.

**Why:** The `InteractionDeck` has a "Shortcut Lab" section for registering shortcuts. The `ShortcutsPanel` complements it by showing the full registry and detecting conflicts in real time. Together they tell the full story.

**How:** Copy `ShortcutsPanel.svelte` into `src/routes/lab/`, register it as `panel:shortcuts`. The `Icon` import already works since `rune-lab` exports it.

---

## 4. File Structure After Enhancement

```
src/routes/lab/
├── +page.svelte              ← quad layout orchestrator (refactored)
├── labState.svelte.ts        ← NEW: quad assignments, active panel registry
├── panels.ts                 ← NEW: panel registry (id, label, icon, component)
├── LabHeader.svelte          ← existing + quad config trigger
├── StoresMirror.svelte       ← existing, untouched
├── InteractionDeck.svelte    ← existing, untouched
├── PersistenceInspector.svelte ← existing, untouched
├── DashboardPanel.svelte     ← NEW (from explorer)
├── ShortcutsPanel.svelte     ← NEW (from explorer)
├── StoreInspectorPanel.svelte← NEW (from explorer's AppStateInspector)
├── ShowcasePanel.svelte      ← REPLACES ComponentsPanel
└── showcase/
    ├── ShowcaseCard.svelte
    ├── shared.ts
    ├── state.svelte.ts
    └── tabs/
        ├── Actions.svelte
        ├── DataInput.svelte
        ├── Display.svelte
        ├── Feedback.svelte
        ├── Navigation.svelte
        ├── Visual.svelte
        └── Primitives.svelte  ← NEW: rune-lab components tab
```

---

## 5. Out of Scope (for this iteration)

- The `explorer` app itself — do not touch it. Keep it alive as a public-facing reference app.
- Authentication / SessionStore — `inventory` has a `/` route with AppLayout and the lab is at `/lab`. The auth layer of the main app is separate.
- Database, API, or any backend concern.
- Publishing rune-lab to npm — this is a local dev workflow for now.
- The `explorer`'s full `WorkspaceLayout` shell — the lab doesn't need a side nav, workspace strip, or detail panel. Its 4-quadrant grid is intentionally different and better for this use case.

---

## 6. Validation Strategy

### 6.1 Visual Regression (manual, no tooling yet)

For each new panel, verify:
- It renders without error in all DaisyUI themes (use the ThemeStore cycle button).
- It renders correctly in both Italian and English (paraglide).
- It renders correctly in MXN and other currencies.
- Quadrant resize (the grid) doesn't cause layout overflow — each panel must have `overflow-y-auto` on its scroll container.

### 6.2 Reactive Correctness

For `DashboardPanel`:
- Fire a toast → the beat pulse should trigger → the activity log should update.
- Reconnect the API → the snapshot table's API row should update within one render cycle.
- Cycle theme → the snapshot table's Theme row should update.

For `ShowcasePanel`:
- Switch tabs → the content should animate in (`animate-in fade-in`).
- Switching tabs in the showcase should NOT affect the quad assignment state or any store.

### 6.3 Quad Navigation

- Assigning the same panel to two quadrants should be prevented (validate in the UI, show a warning badge).
- Refreshing the page should restore the default quad layout (quad state is intentionally ephemeral, not persisted).

### 6.4 Zero-regression Gate

Before shipping, verify the existing four panels still work exactly as before:
- **StoresMirror**: all 8 stores render with correct values.
- **InteractionDeck**: Toast Cannon, Shortcut Lab, Command Palette, Cart Controls, API Mock, Reload Test — all sections function.
- **PersistenceInspector**: Cookies, localStorage, sessionStorage panels populate correctly.
- The LabHeader version badge, DEV tag, language/currency/theme icons, and `ctrl+/` shortcut hint all render.

---

## 7. Prioritized Build Order

This is the sequence that minimizes risk and delivers value incrementally:

1. **Port `DashboardPanel`** — one file, zero dependencies outside rune-lab. Fastest win.
2. **Port `ShortcutsPanel`** — one file, one `Icon` import. Also fast.
3. **Build `labState.svelte.ts` + panel registry** — the quad navigation backbone.
4. **Refactor `+page.svelte`** to use the registry — swap the hard-coded quadrants for dynamic lookup.
5. **Add quad config UI to `LabHeader`** — simple selects per quadrant, no drag-and-drop yet.
6. **Port the showcase tabs + build `ShowcasePanel`** — most work, but contained.
7. **Add the `Primitives` tab** — move rune-lab component demos here from the old `ComponentsPanel`.
8. **Port `StoreInspectorPanel`** — the big "Live Store Dashboard" as a bonus fifth panel.

---

## 8. The 10-Year Vision

rune-lab is evolving into something genuinely valuable: a **batteries-included Svelte 5 application framework** with a world-class dev experience. The lab is the proof of that claim — it should be the most pleasant dev tool you've ever used for your own library.

The architecture above gives you an extensible panel registry. Future panels could include:

- **Performance Panel**: render counts, effect trigger frequency, derived recalculation stats.
- **Network Panel**: API request log, response times, error rates — fed by the ApiStore.
- **i18n Panel**: live message catalog browser, missing key detector.
- **Theme Designer**: visual token editor that writes back to the ThemeStore.

None of these require changing the quad layout system — they're just new entries in the panel registry. That is the mark of a 10/10 architecture.

---

*Generated as a planning document only. Zero code. Build it in the order above and you'll have a masterpiece.*
