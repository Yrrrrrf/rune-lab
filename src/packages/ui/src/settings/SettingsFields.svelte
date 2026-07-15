<script lang="ts">
import { getContext } from "svelte";
import { useCell } from "../reactivity/use-cell.svelte.ts";

let {
  fields = [],
  disabled = false,
  onCommit,
} = $props<{
  fields: any[];
  disabled?: boolean;
  onCommit?: (fieldId: string, value: any) => void;
}>();

// Resolve cells reactively using Svelte 5's $derived.by
const cellBinds = $derived.by(() => {
  const binds = new Map<string, any>();
  for (const field of fields) {
    if (field.target?.type === "cell") {
      try {
        binds.set(field.id, useCell(field.target.name));
      } catch (e) {
        console.warn(
          `[SettingsFields] Failed to bind cell ${field.target.name}:`,
          e,
        );
      }
    }
  }
  return binds;
});

function getValue(field: any): any {
  if (field.target?.type === "cell") {
    return cellBinds.get(field.id)?.current;
  }
  if (field.target?.type === "store") {
    const parts = field.id.split(".");
    const pluginId = parts[0];
    const store = (getContext(
      Symbol.for(`rl:${pluginId}:${field.target.storeId}`),
    ) || getContext(Symbol.for(`rl:${field.target.storeId}`))) as any;
    return store ? store[field.target.property] : undefined;
  }
  return undefined;
}

function commitValue(field: any, val: any) {
  if (field.target?.type === "cell") {
    const bind = cellBinds.get(field.id);
    if (bind) bind.current = val;
  } else if (field.target?.type === "store") {
    const parts = field.id.split(".");
    const pluginId = parts[0];
    const store = (getContext(
      Symbol.for(`rl:${pluginId}:${field.target.storeId}`),
    ) || getContext(Symbol.for(`rl:${field.target.storeId}`))) as any;
    if (store) {
      if (
        typeof store.set === "function" &&
        field.target.property === "current"
      ) {
        store.set(val);
      } else {
        store[field.target.property] = val;
      }
    }
  }
  if (onCommit) {
    onCommit(field.id, val);
  }
}
</script>

<div class="grid grid-cols-1 gap-4">
  {#each fields as field (field.id)}
    <div class="form-control w-full">
      {#if field.type !== "toggle"}
        <label class="label pb-1.5" for={field.id}>
          <span class="label-text font-medium text-sm text-base-content/80">{field.label}</span>
        </label>
      {/if}

      {#if field.type === "toggle"}
        <label class="label cursor-pointer justify-between py-2 px-1 rounded-lg hover:bg-base-200/50 transition-colors" for={field.id}>
          <span class="label-text font-medium text-sm text-base-content/80">{field.label}</span>
          <input
            id={field.id}
            type="checkbox"
            class="toggle toggle-primary toggle-sm"
            checked={getValue(field)}
            onchange={(e) => commitValue(field, e.currentTarget.checked)}
            disabled={disabled}
          />
        </label>
      {:else}
        {#key field.id}
          {#if field.type === "select"}
            <select
              id={field.id}
              class="select select-bordered select-sm w-full"
              value={getValue(field)}
              onchange={(e) => commitValue(field, e.currentTarget.value)}
              disabled={disabled}
            >
              {#each field.options || [] as opt}
                <option value={opt.value}>{opt.label}</option>
              {/each}
            </select>
          {:else if field.type === "text"}
            <input
              id={field.id}
              type="text"
              class="input input-bordered input-sm w-full"
              value={getValue(field) ?? ""}
              oninput={(e) => commitValue(field, e.currentTarget.value)}
              disabled={disabled}
            />
          {:else if field.type === "number"}
            <input
              id={field.id}
              type="number"
              class="input input-bordered input-sm w-full"
              value={getValue(field) ?? 0}
              oninput={(e) => commitValue(field, Number(e.currentTarget.value))}
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
                value={getValue(field) ?? 0}
                oninput={(e) => commitValue(field, Number(e.currentTarget.value))}
                min={field.min ?? 0}
                max={field.max ?? 100}
                step={field.step ?? 1}
                disabled={disabled}
              />
              <span class="text-xs font-mono w-8 text-right">{getValue(field) ?? 0}</span>
            </div>
          {:else if field.type === "color"}
            <div class="flex items-center gap-3">
              <input
                id={field.id}
                type="color"
                class="input input-bordered p-0 w-10 h-8 cursor-pointer rounded"
                value={getValue(field) ?? "#000000"}
                oninput={(e) => commitValue(field, e.currentTarget.value)}
                disabled={disabled}
              />
              <span class="text-xs font-mono uppercase">{getValue(field) ?? "#000000"}</span>
            </div>
          {:else if field.type === "custom" && field.component}
            {@const CustomComponent = field.component as any}
            <CustomComponent
              value={getValue(field)}
              commit={(val: any) => commitValue(field, val)}
              disabled={disabled}
              metadata={field}
            />
          {/if}
        {/key}
      {/if}
    </div>
  {/each}
</div>
