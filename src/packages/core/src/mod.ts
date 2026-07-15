export type { RuneLabCells } from "./cells/cells.ts";
export {
  type ConfigStore,
  ConfigStoreImpl,
  type ConfigStoreOptions,
} from "./config/config-store.ts";
// Legacy exports for backward compatibility
export type { PluginInput } from "./forge/define-plugin.ts";
export { definePlugin, type ForgedPlugin } from "./forge/define-plugin.ts";
export {
  defineSettings,
  type SettingsFieldSchema,
  type SettingsSchema,
} from "./forge/define-settings.ts";
export type { SlotContext, SlotSpec } from "./forge/define-slot.ts";
export type { PersistenceHandle, SlotDescriptor } from "./forge/descriptors.ts";
export { createKernel, type Kernel } from "./kernel/kernel.ts";
export { normalizePlugins as resolvePlugins } from "./kernel/wiring.ts";
export type { RunePlugin, StoreRegistryEntry } from "./plugin/manifest.ts";
export type { LocaleAdapter } from "./ports/locale.ts";
export {
  createInMemoryDriver,
  inMemoryDriver,
  namespaced,
} from "./ports/memory.ts";
export type { PersistenceDriver } from "./ports/persistence.ts";
export type {
  LayoutCursor,
  LayoutLine,
  LayoutLineRange,
  LayoutLinesResult,
  LayoutResult,
  LineStats,
  PreparedRichInline,
  PreparedText,
  PreparedTextWithSegments,
  PrepareOptions,
  RichInlineCursor,
  RichInlineFragment,
  RichInlineFragmentRange,
  RichInlineItem,
  RichInlineLine,
  RichInlineLineRange,
  RichInlineStats,
  TextMeasurer,
  WhiteSpaceMode,
  WordBreakMode,
} from "./ports/text.ts";
export { FakeTextMeasurer } from "./ports/text-fake.ts";
export {
  clearRegistry,
  getAllRegisteredStores,
  getRegisteredStore,
  registerStore,
  unregisterStore,
} from "./registry/registry.ts";
export type { StateCells } from "./services/layers.ts";
