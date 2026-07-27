export { StateCell } from "./cells/define-cell.ts";
export {
  type ConfigStore,
  ConfigStoreImpl,
  type ConfigStoreOptions,
} from "./config/config-store.ts";
export {
  type ItemPresenter,
  type PresentedItem,
  type SelectOption,
  toOptions,
} from "./config/item-presenter.ts";
export {
  CircularPluginDependency,
  CircularSlotDependency,
  MissingRequirement,
  SlotConfigInvalid,
  SlotInitFailed,
  UndeclaredCrossPluginDependency,
  UnresolvableSlotRef,
} from "./errors.ts";
export {
  contribute,
  type ContributionEntry,
  type ContributionKey,
  defineContribution,
  type SettingsSectionContribution,
  settingsSections,
} from "./forge/define-contribution.ts";
// Legacy exports for backward compatibility
export type { PluginInput } from "./forge/define-plugin.ts";
export { definePlugin, type ForgedPlugin } from "./forge/define-plugin.ts";
export {
  defineSettings,
  type SettingsFieldSchema,
  type SettingsSchema,
} from "./forge/define-settings.ts";
export type {
  BaseSlotSpec,
  Disposable,
  SlotContext,
  SlotSpec,
} from "./forge/define-slot.ts";
export { defineSlot } from "./forge/define-slot.ts";
export type { PersistenceHandle, SlotDescriptor } from "./forge/descriptors.ts";
export { getContextSymbol } from "./forge/descriptors.ts";
export { createKernel, type Kernel } from "./kernel/kernel.ts";
export type { LocaleAdapter } from "./ports/locale.ts";
export {
  createInMemoryDriver,
  inMemoryDriver,
  namespaced,
} from "./ports/memory.ts";
export type { PersistenceDriver } from "./ports/persistence.ts";
export type { TextMeasurer } from "./ports/text.ts";
export type { Translator } from "./ports/translate.ts";
export type { StateCells } from "./services/layers.ts";
