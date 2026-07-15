# Rune Lab — Plugin Work Order: i18n (lang + money)

> Executes Phase 3 (parallel track) of `rune-lab-v0.5-completion-spec.md`.
> Assumes Phases 0–2 landed (forge in core, plugin kit + generic settings
> renderer in ui). Independent of the layout/palettes track — can run in
> parallel after Phase 2.

## Context in three paragraphs

Rune Lab is a plugin-based application shell for Svelte 5: a framework-free
kernel resolves plugin specs and exposes schema-guarded state cells; a thin
Svelte adapter bridges cells into runes and publishes stores into context;
plugins own all domain vocabulary. After the forge refactor, a plugin is one
`plugin.ts` declaration — slots with `create` factories and `persist:` flags, a
`defineSettings` schema, generated typed accessors — and `mod.ts` is an
export-only barrel nothing internal imports.

**i18n is dependency-agnostic**: it requires no other plugin. It has two
sub-domains that stay under one plugin id with two concerns: **lang**
(Paraglide-backed message resolution — locale _content_, distinct from layout's
language _selection_ cell, which it observes through the kernel's standard
`language` cell) and **money** (integer-backed Dinero arithmetic, currency
store, exchange-rate triangulation, masked inputs). Money is the plugin with the
strongest existing test culture — every migration step here must keep those
suites green.

Per the completion spec: both lang and money get settings pages _for free_
through the schema pipeline (they currently have none, which you called out),
and money's `mod.ts` cycle cluster (7 dependents, 3+ cycles per fallow) dies via
the plugin.ts convention.

## Target structure

```
plugins/i18n/src/
├─ plugin.ts             createPluginKit — id "rune-lab.i18n"; slots: currency (persist),
│                        exchangeRate, messages; settings; exports accessors
├─ lang/
│  ├─ resolver.ts         message-resolver (pure; keep its test suite)
│  ├─ messages.ts         message catalogs
│  └─ project.inlang/     paraglide settings (build artifact input — stripped from dist as today)
├─ money/
│  ├─ stores/
│  │  ├─ currency.svelte.ts       factory-only (was singleton with setDriver — delete that path)
│  │  └─ exchange-rate.svelte.ts  factory-only; decompose the 36-cognitive arrow (fallow CRITICAL)
│  ├─ primitives/
│  │  ├─ money.ts · money-primitive.ts · strategies.ts   pure math, unchanged semantics
│  │  └─ (their test files stay adjacent)
│  ├─ components/
│  │  ├─ MoneyDisplay.svelte · MoneyInput.svelte · CurrencySelector.svelte
│  ├─ use/
│  │  ├─ useMoney.ts              split: format/convert/payload helpers extracted
│  │  └─ useMoneyFilter.svelte.ts
│  └─ types.ts
├─ settings.ts           defineSettings("localization") — locale-content options (lang) +
│                        defineSettings("money") — default currency select, rate-strategy select,
│                        display options (compact notation toggle, etc.)
├─ types.ts
└─ mod.ts                export-only
```

Public import path stays `rune-lab/i18n/money` (+ lang subpath) exactly as the
specifier table dictates — the internal reshape must not alter what
`manifest.ts`/`build.nu` see as entry files; if `mod.ts` locations move, that is
a three-party contract change and is **forbidden** in this work order (keep
`mod.ts` paths stable).

## TODO — i18n

- [ ] Write `plugin.ts`: slots
      `{ exchangeRate (create, config: base+rates, no persistence), currency (create, persist, dependsOn: exchangeRate, config: currencies/defaultCurrency), messages (create) }`.
      The forge's persist-handle replaces the hand-wired `setDriver` fix and the
      `setExchangeRateStore` module-global coupling — delete both mechanisms.
- [ ] Convert `currency.svelte.ts` and `exchange-rate.svelte.ts` to
      factory-only; the exchange-rate store's cross-store link becomes a
      `dependsOn`-injected reference (kernel-mediated), not a setter mutating
      module state.
- [ ] Decompose `exchange-rate.svelte.ts`'s 50-line/36-cognitive arrow (fallow's
      worst cognitive score in the repo) into named triangulation helpers; keep
      `getRate`/`convertAmount` semantics test-pinned before touching.
- [ ] Split `useMoney.ts` (190-line hook): extract the two 9-line duplicated
      blocks (clone group dup:58e914e1) into one shared helper; extract
      `format`/`toDinero`/`toPayload`/`convert` into `use/` or `primitives/`
      helpers so the hook is composition only.
- [ ] Move components under `money/components/`; rewrite internal imports to
      `plugin.ts` accessors (kills the CurrencySelector/MoneyDisplay/MoneyInput
      ↔ mod.ts cycles and the useMoney/useMoneyFilter ↔ mod.ts cycles — 6 of
      fallow's 21).
- [ ] Author `settings.ts`: money section with primitives (select for default
      currency + strategy, toggle for compact display); localization section for
      lang. If a currency-picker needs richer UX than a select, build it as a
      domain-owned custom field under `money/components/` per the ui
      custom-field contract — do not extend ui.
- [ ] `MoneyInput.svelte`: `handleInput` is the repo's worst CRAP score (420 —
      cyclomatic 20, 65 lines). Decompose into parse/mask/commit helpers in
      `use/` with unit tests per branch family (negative, locale separators,
      paste, IME) _before_ refactoring, so behavior is pinned.
- [ ] `MoneyDisplay.svelte` `formatted` (cyclomatic 12) — extract into a pure
      formatting helper next to `money.ts`, reuse from the component.
- [ ] Keep every existing test file passing at each step (money-primitive,
      money, strategies, currency, exchange-rate, resolver); add tests for the
      new slot factories (persisted currency survives kernel rebuild;
      exchangeRate dependency injection).
- [ ] `mod.ts` export-only; verify nothing internal imports it; lab's money
      showcase re-pointed at new accessor exports.

## Exit criteria

Fallow: zero cycles under `plugins/i18n`; clone group dup:58e914e1 gone;
MoneyInput/exchange-rate/MoneyDisplay/useMoney CRITICAL+HIGH findings cleared.
All pre-existing money/lang test suites green, plus new slot-lifecycle tests.
Lab: currency selection persists across reload through the kernel persist path;
money + localization sections appear in the settings modal purely from schemas.
