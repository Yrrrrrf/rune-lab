// src/lib/context.ts

export const RUNE_LAB_CONTEXT: {
  app: symbol;
  api: symbol;
  toast: symbol;
  theme: symbol;
  language: symbol;
  currency: symbol;
  shortcut: symbol;
  layout: symbol;
  commands: symbol;
  persistence: symbol;
  cart: symbol;
  session: symbol;
  exchangeRate: symbol;
} = {
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
  cart: Symbol("rl:cart"),
  session: Symbol("rl:session"),
  exchangeRate: Symbol("rl:exchange-rate"),
} as const;
