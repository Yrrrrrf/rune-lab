// src/lib/context.ts

export const RUNE_LAB_CONTEXT = {
  app: Symbol("rl:app"),
  api: Symbol("rl:api"),
  toast: Symbol("rl:toast"),
  theme: Symbol("rl:theme"),
  language: Symbol("rl:language"),
  currency: Symbol("rl:currency"),
  shortcut: Symbol("rl:shortcut"),
  layout: Symbol("rl:layout"),
  commands: Symbol("rl:commands"),
  persistence: Symbol("rl:persistence"),
} as const satisfies Record<string, symbol>;
