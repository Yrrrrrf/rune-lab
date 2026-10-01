import { getContextSymbol } from "rune-lab/core";
import { createAccessor } from "rune-lab/ui";
import type { CorpoStore } from "./store.svelte.ts";
export const CORPO_PLUGIN_ID = "rune-lab.corpo";
export const getCorpoStore = createAccessor<CorpoStore>(
	getContextSymbol(CORPO_PLUGIN_ID, "corpo"),
	"getCorpoStore()",
	"CorpoStore",
	CORPO_PLUGIN_ID,
);
