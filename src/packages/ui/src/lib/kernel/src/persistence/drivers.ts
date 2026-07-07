import { BROWSER as browser } from "esm-env";
import {
  createInMemoryDriver,
  inMemoryDriver,
  namespaced,
  type PersistenceDriver,
} from "@rune-lab/core";

export { createInMemoryDriver, inMemoryDriver, namespaced };

export const localStorageDriver: PersistenceDriver = {
  get: (key: string) => {
    if (!browser) return null;
    return globalThis.localStorage.getItem(key);
  },
  set: (key: string, value: string) => {
    if (!browser) return;
    globalThis.localStorage.setItem(key, value);
  },
  remove: (key: string) => {
    if (!browser) return;
    globalThis.localStorage.removeItem(key);
  },
};

export const sessionStorageDriver: PersistenceDriver = {
  get: (key: string) => {
    if (!browser) return null;
    return globalThis.sessionStorage.getItem(key);
  },
  set: (key: string, value: string) => {
    if (!browser) return;
    globalThis.sessionStorage.setItem(key, value);
  },
  remove: (key: string) => {
    if (!browser) return;
    globalThis.sessionStorage.removeItem(key);
  },
};

export const createCookieDriver = (
  options: {
    path?: string;
    maxAge?: number;
    sameSite?: "Lax" | "Strict" | "None";
    secure?: boolean;
  } = {},
): PersistenceDriver => ({
  get: (key: string) => {
    if (!browser) return null;
    const match = document.cookie.match(new RegExp(`(^| )${key}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : null;
  },
  set: (key: string, value: string) => {
    if (!browser) return;
    let cookie = `${key}=${encodeURIComponent(value)}`;
    if (options.path) cookie += `; path=${options.path}`;
    if (options.maxAge) cookie += `; max-age=${options.maxAge}`;
    if (options.sameSite) cookie += `; samesite=${options.sameSite}`;
    if (options.secure) cookie += "; Secure";
    document.cookie = cookie;
  },
  remove: (key: string) => {
    if (!browser) return;
    document.cookie = `${key}=; max-age=0; path=${options.path || "/"}`;
  },
});

/** Default cookie driver singleton (path='/') */
export const cookieDriver: PersistenceDriver = createCookieDriver({
  path: "/",
});
