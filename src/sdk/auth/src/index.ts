// sdk/auth/src/index.ts
// Public barrel for @internal/auth

export type { AuthConfig, Session, User } from "./types";
export {
  createSessionStore,
  getSessionStore,
  SessionStore,
} from "./session.svelte";
