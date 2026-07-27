<script lang="ts">
import type { SettingsFieldSchema } from "rune-lab/core";
import type { Component } from "svelte";
import { getKernel, type SettingsSection } from "../provider/context.ts";

let {
  fields = [],
  section,
  disabled = false,
  onCommit,
}: {
  fields?: SettingsFieldSchema[];
  section?: SettingsSection;
  disabled?: boolean;
  onCommit?: (fieldId: string, value: unknown) => void;
} = $props();

const kernel = getKernel();

function getStoreForField(
  field: SettingsFieldSchema,
): Record<string, unknown> | undefined {
  if (field.target?.type !== "store") return undefined;
  const pluginId = (field as { pluginId?: string }).pluginId ??
    section?.pluginId ?? "";
  const storeKey = `rl:${pluginId}:${field.target.storeId}`;
  return kernel.stores.get(storeKey) as Record<string, unknown> | undefined;
}

function getValue(field: SettingsFieldSchema): unknown {
  const store = getStoreForField(field);
  return field.target?.type === "store"
    ? store?.[field.target.property]
    : undefined;
}

function commitValue(field: SettingsFieldSchema, val: unknown) {
  if (field.target?.type === "store") {
    const store = getStoreForField(field);
    if (store) {
      if (
        typeof store.set === "function" &&
        field.target.property === "current"
      ) {
        (store.set as (v: unknown) => void)(val);
      } else {
        store[field.target.property] = val;
      }
    }
  }
  if (onCommit) {
    onCommit(field.id, val);
  }
}

function handleInput(field: SettingsFieldSchema, event: Event) {
  const target = event.currentTarget as HTMLInputElement | HTMLSelectElement;
  let val: unknown;
  if (field.type === "toggle") {
    val = (target as HTMLInputElement).checked;
  } else if (field.type === "number" || field.type === "range") {
    val = Number(target.value);
  } else {
    val = target.value;
  }
  commitValue(field, val);
}
</script>

<div class="grid grid-cols-1 gap-4">
  {#each fields as field (field.id)}
    <div class="flex flex-col w-full">
      {#if field.type !== "toggle"}
        <label class="label pb-1.5 font-medium text-sm text-base-content/80" for={field.id}>{field.label}</label>
      {/if}

      {#if field.type === "toggle"}
        <label class="label cursor-pointer justify-between py-2 px-1 rounded-lg hover:bg-base-200/50 transition-colors font-medium text-sm text-base-content/80" for={field.id}>
          {field.label}
          <input
            id={field.id}
            type="checkbox"
            class="toggle toggle-primary toggle-sm"
            checked={Boolean(getValue(field))}
            onchange={(e) => handleInput(field, e)}
            disabled={disabled}
          />
        </label>
      {:else if field.type === "select"}
        <select
          id={field.id}
          class="select select-sm w-full"
          value={String(getValue(field) ?? "")}
          onchange={(e) => handleInput(field, e)}
          disabled={disabled}
        >
          {#each field.options?.() ?? [] as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      {:else if field.type === "text"}
        <input
          id={field.id}
          type="text"
          class="input input-sm w-full"
          value={String(getValue(field) ?? "")}
          oninput={(e) => handleInput(field, e)}
          disabled={disabled}
        />
      {:else if field.type === "number"}
        <input
          id={field.id}
          type="number"
          class="input input-sm w-full"
          value={Number(getValue(field) ?? 0)}
          oninput={(e) => handleInput(field, e)}
          min={field.min}
          max={field.max}
          step={field.step}
          disabled={disabled}
        />
      {:else if field.type === "range"}
        <div class="flex items-center gap-3 w-full">
          <input
            id={field.id}
            type="range"
            class="range range-primary range-xs flex-1"
            value={Number(getValue(field) ?? 0)}
            oninput={(e) => handleInput(field, e)}
            min={field.min ?? 0}
            max={field.max ?? 100}
            step={field.step ?? 1}
            disabled={disabled}
          />
          <span class="text-xs font-mono w-8 text-right">{String(getValue(field) ?? 0)}</span>
        </div>
      {:else if field.type === "color"}
        <div class="flex items-center gap-3">
          <input
            id={field.id}
            type="color"
            class="input p-0 w-10 h-8 cursor-pointer rounded"
            value={String(getValue(field) ?? "#000000")}
            oninput={(e) => handleInput(field, e)}
            disabled={disabled}
          />
          <span class="text-xs font-mono uppercase">{String(getValue(field) ?? "#000000")}</span>
        </div>
      {:else if field.type === "custom" && field.component}
        {@const CustomComponent = field.component as Component<Record<string, unknown>>}
        <CustomComponent
          value={getValue(field)}
          commit={(val: unknown) => commitValue(field, val)}
          disabled={disabled}
          metadata={field}
        />
      {/if}
    </div>
  {/each}
</div>
