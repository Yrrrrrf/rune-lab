// sdk/auth/src/index.ts
// Public barrel for @internal/auth

export type { User, Session, AuthConfig } from "./types";
export { SessionStore, createSessionStore, getSessionStore } from "./session.svelte";
