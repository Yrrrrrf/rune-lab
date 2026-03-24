import type { Session, User } from "./types.ts";
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
export declare class SessionStore {
  /** Whether authentication has been checked (vs. loading) */
  isReady: boolean;
  /** Whether a user is currently authenticated */
  isAuthenticated: boolean;
  /** Current user (null when logged out) */
  user: User | null;
  /** Current session (null when logged out) */
  session: Session | null;
  /**
   * Initialize the session — placeholder for Better-Auth client setup
   */
  init(): Promise<void>;
  /**
   * Log in — placeholder
   */
  login(_credentials: {
    email: string;
    password: string;
  }): Promise<boolean>;
  /**
   * Log out — placeholder
   */
  logout(): Promise<void>;
}
export declare function createSessionStore(): SessionStore;
export declare function getSessionStore(): SessionStore;
