import type { PresetState } from "./types.ts";

export const PRESETS: Record<string, PresetState> = {
  page: {
    nav: { visible: false },
    strip: { visible: false },
    content: { visible: true },
    detail: { visible: false },
    statusbar: { visible: false },
    "overlay-anchor": { visible: true },
  },
  docs: {
    nav: { visible: true, size: 240 },
    strip: { visible: false },
    content: { visible: true },
    detail: { visible: false },
    statusbar: { visible: false },
    "overlay-anchor": { visible: true },
  },
  workspace: {
    nav: { visible: true, size: 280 },
    strip: { visible: true, size: 64 },
    content: { visible: true },
    detail: { visible: true, size: 300 },
    statusbar: { visible: true, size: 24 },
    "overlay-anchor": { visible: true },
  },
};
