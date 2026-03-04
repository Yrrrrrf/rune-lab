// sdk/state/src/auth/session.svelte.ts
// SessionStore — manages authentication state via Svelte 5 runes.
// This is a SKELETON — full Better-Auth wiring is deferred to a dedicated spec.

import { getContext } from "svelte";
import { RUNE_LAB_CONTEXT } from "../context";
import type { Session, User } from "./types";

/**
 * SessionStore — reactive authentication state.
 *
 * Once Better-Auth is fully integrated, this store will:
 * - Initialize from the Better-Auth client SDK
 * - Manage session lifecycle (login, logout, refresh)
 * - Expose the current user + session tokens
 * - Fire onSessionChange callbacks
 *
 * For now, it provides the interface contract that consuming apps
 * and other rune-lab components (UserAvatar, UserProfile) can code against.
 */
export class SessionStore {
  /** Whether authentication has been checked (vs. loading) */
  isReady: boolean = $state(false);

  /** Whether a user is currently authenticated */
  isAuthenticated: boolean = $state(false);

  /** Current user (null when logged out) */
  user: User | null = $state(null);

  /** Current session (null when logged out) */
  session: Session | null = $state(null);

  /**
   * Initialize the session — placeholder for Better-Auth client setup
   */
  async init(): Promise<void> {
    // TODO: Wire Better-Auth client.getSession() here
    this.isReady = true;
  }

  /**
   * Log in — placeholder
   */
  async login(
    _credentials: { email: string; password: string },
  ): Promise<boolean> {
    // TODO: Wire Better-Auth client.signIn.email() here
    console.warn(
      "SessionStore.login() is a stub — implement Better-Auth integration",
    );
    return false;
  }

  /**
   * Log out — placeholder
   */
  async logout(): Promise<void> {
    // TODO: Wire Better-Auth client.signOut() here
    this.user = null;
    this.session = null;
    this.isAuthenticated = false;
  }
}

export function createSessionStore(): SessionStore {
  return new SessionStore();
}

export function getSessionStore(): SessionStore {
  return getContext<SessionStore>(RUNE_LAB_CONTEXT.session);
}
