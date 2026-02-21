// src/lib/persistence/drivers.ts
import type { PersistenceDriver } from "./types";

export function createInMemoryDriver(): PersistenceDriver {
  const store = new Map<string, string>();
  return {
    get: (key) => store.get(key) ?? null,
    set: (key, value) => store.set(key, value),
    remove: (key) => store.delete(key),
  };
}

export const inMemoryDriver: PersistenceDriver = createInMemoryDriver();

export const localStorageDriver: PersistenceDriver = {
  get: (key) => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  },
  set: (key, value) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  },
  remove: (key) => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  },
};

export const sessionStorageDriver: PersistenceDriver = {
  get: (key) => {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem(key);
  },
  set: (key, value) => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(key, value);
  },
  remove: (key) => {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(key);
  },
};

export const cookieDriver = (
  options: {
    path?: string;
    maxAge?: number;
    sameSite?: "Lax" | "Strict" | "None";
  } = {},
): PersistenceDriver => ({
  get: (key) => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return null;
    }
    const match = document.cookie.match(new RegExp(`(^| )${key}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : null;
  },
  set: (key, value) => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }
    let cookie = `${key}=${encodeURIComponent(value)}`;
    if (options.path) cookie += `; path=${options.path}`;
    if (options.maxAge) cookie += `; max-age=${options.maxAge}`;
    if (options.sameSite) cookie += `; samesite=${options.sameSite}`;
    document.cookie = cookie;
  },
  remove: (key) => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }
    document.cookie = `${key}=; max-age=0; path=${options.path || "/"}`;
  },
});
