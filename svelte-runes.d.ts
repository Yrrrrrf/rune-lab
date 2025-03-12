// svelte-runes.d.ts
declare function $state<T>(initialValue: T): T;
declare function $state<T>(): T | undefined;
declare function $effect(fn: () => void | (() => void)): void;
declare function $effect<T>(fn: () => T): T;
declare function $derived<T>(fn: () => T): T;
declare function $derived<T, D>(store: T, fn: ($: T) => D): D;
declare function $props<T>(): T;
declare function $props<T>(defaults: Partial<T>): T;
