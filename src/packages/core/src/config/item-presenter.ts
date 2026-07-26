/**
 * The item-presenter contract (C24).
 *
 * One domain, one presenter, built from that domain's variant constant. Every
 * surface that has to render "a set of things you pick one of" reads the same
 * presenter instead of restating the set:
 *
 * - `toOptions()` produces the `{value,label}[]` a settings `select` field needs.
 * - `ResourceSelector` renders rows from `items` + `present()`.
 * - Future command-palette entries ("Set theme: …") derive from the same pair.
 *
 * `present()` returns **data, not markup**, and that is forced rather than
 * chosen: `SettingsFields` renders each option as a native `<option>`, which
 * cannot contain elements. A presenter that returned a snippet could not feed
 * the settings schema at all. Where a surface genuinely needs richer markup
 * than `{label, icon, hint}` — the theme swatch is the motivating case — the
 * consuming component takes a snippet override and the `<select>` ignores it.
 */

/** The renderable shape of a single item. Text only, by construction. */
export interface PresentedItem {
  label: string;
  /** A short leading glyph — an emoji, a flag, a currency symbol. */
  icon?: string;
  /** Secondary text, e.g. a key combo or a native-language name. */
  hint?: string;
}

export interface ItemPresenter<T, Id extends string = string> {
  readonly items: readonly T[];
  id(item: T): Id;
  present(item: T): PresentedItem;
}

/** A `{value,label}` pair as consumed by a `select`-type settings field. */
export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Derive the settings-field option list from a presenter.
 *
 * This is the single mechanism that keeps a settings dropdown from drifting
 * away from the constant it was hand-copied from.
 */
export function toOptions<T, Id extends string>(
  presenter: ItemPresenter<T, Id>,
): SelectOption[] {
  return presenter.items.map((item) => ({
    value: presenter.id(item),
    label: presenter.present(item).label,
  }));
}
