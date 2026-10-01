import { getContextSymbol } from "rune-lab/core";
import { createAccessor } from "rune-lab/ui";
import type { ApiClient } from "./client.ts";

export const API_PLUGIN_ID = "rune-lab.api";
// Kept separate from plugin.ts to avoid a component -> plugin -> component cycle.
export const getApiStore = createAccessor<ApiClient>(
	getContextSymbol(API_PLUGIN_ID, "api"),
	"getApiStore()",
	"ApiStore",
	API_PLUGIN_ID,
);
