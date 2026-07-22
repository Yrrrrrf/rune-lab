<script lang="ts">
import { getKernel } from "../provider/context.ts";
import { useCell } from "../reactivity/use-cell.svelte.ts";

let {
  fields = [],
  disabled = false,
  onCommit,
}: {
  fields: any[];
  disabled?: boolean;
  onCommit?: (fieldId: string, value: any) => void;
} = $props();

const kernel = getKernel();

// Resolve cells reactively using Svelte 5's $derived.by
const cellBinds = $derived.by(() => {
  const binds = new Map<string, any>();
  for (const field of fields) {
    if (field.target?.type === "cell") {
      try {
        binds.set(field.id, useCell(kernel, field.target.name));
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

function getStoreForField(field: any): any {
  if (field.target?.type !== "store") return undefined;
  const pluginId = field.id.slice(0, field.id.lastIndexOf("."));
  const storeKey = `rl:${pluginId}:${field.target.storeId}`;
  return kernel.stores.get(storeKey);
}

function getValue(field: any): any {
  if (field.target?.type === "cell") {
    return cellBinds.get(field.id)?.current;
  }
  const store = getStoreForField(field);
  return store ? store[field.target.property] : undefined;
}

function commitValue(field: any, val: any) {
  if (field.target?.type === "cell") {
    const bind = cellBinds.get(field.id);
    if (bind) bind.current = val;
  } else if (field.target?.type === "store") {
    const store = getStoreForField(field);
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

function handleInput(field: any, event: Event) {
  const target = event.currentTarget as HTMLInputElement | HTMLSelectElement;
  let val: any;
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
            onchange={(e) => handleInput(field, e)}
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
              onchange={(e) => handleInput(field, e)}
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
              oninput={(e) => handleInput(field, e)}
              disabled={disabled}
            />
          {:else if field.type === "number"}
            <input
              id={field.id}
              type="number"
              class="input input-bordered input-sm w-full"
              value={getValue(field) ?? 0}
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
                value={getValue(field) ?? 0}
                oninput={(e) => handleInput(field, e)}
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
                oninput={(e) => handleInput(field, e)}
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
