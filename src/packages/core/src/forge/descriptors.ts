export interface SlotDescriptor {
  slotName: string;
  contextKey: symbol;
  accessorName: string;
}

export interface PersistenceHandle {
  get(key: string): string | null | Promise<string | null>;
  set(key: string, value: string): void | Promise<void>;
  remove(key: string): void | Promise<void>;
}

export function getAccessorName(slotName: string): string {
  if (!slotName) return "";
  return `get${slotName.charAt(0).toUpperCase()}${slotName.slice(1)}Store`;
}

export function getContextSymbol(pluginId: string, slotName: string): symbol {
  return Symbol.for(`rl:${pluginId}:${slotName}`);
}
