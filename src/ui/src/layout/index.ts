// src/lib/layout/index.ts

export { default as WorkspaceLayout } from "./WorkspaceLayout.svelte";
export { default as WorkspaceStrip } from "./WorkspaceStrip.svelte";
export { default as NavigationPanel } from "./NavigationPanel.svelte";
export { default as ContentArea } from "./ContentArea.svelte";
export { default as DetailPanel } from "./DetailPanel.svelte";

export { createLayoutStore, getLayoutStore } from "@internal/state";
export type {
  NavigationItem,
  NavigationSection,
  WorkspaceItem,
} from "@internal/state";
