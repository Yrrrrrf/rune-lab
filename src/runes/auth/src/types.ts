// sdk/state/src/auth/types.ts
// Core auth types — framework-agnostic interfaces

/**
 * Minimal user representation for rune-lab's auth layer.
 * Consuming apps can extend this with domain-specific fields.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role?: string;
}

/**
 * Active session information
 */
export interface Session {
  user: User;
  accessToken: string;
  expiresAt: Date;
}

/**
 * Auth configuration passed to RuneProvider
 */
export interface AuthConfig {
  /** Better-Auth client instance */
  client?: unknown; // Will be typed to BetterAuthClient once integrated
  /** Callback when session changes (login, logout, expiry) */
  onSessionChange?: (session: Session | null) => void;
  /** Routes that require authentication */
  protectedRoutes?: string[];
}
