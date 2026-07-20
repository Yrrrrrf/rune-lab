import { type ContributionKey, defineContribution } from "rune-lab/core";
import type { StatusbarItem } from "./components/StatusbarOverflow.svelte";

export const statusbar: ContributionKey<StatusbarItem> = defineContribution<
  StatusbarItem
>("statusbar");
