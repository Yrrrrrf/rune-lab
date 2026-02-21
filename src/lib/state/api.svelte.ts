/**
 * API connection state and configuration
 */
export type ConnectionState = "connected" | "connecting" | "disconnected";
import { getContext } from "svelte";
import { RUNE_LAB_CONTEXT } from "$lib/context";

export class ApiStore {
  // State
  url = $state("http://localhost:8000");
  version = $state("v1");
  connectionState = $state<ConnectionState>("disconnected");

  // Derived
  isConnected = $derived(this.connectionState === "connected");
  isLoading = $derived(this.connectionState === "connecting");

  // Short aliases for compatibility with the user's snippet
  get URL() {
    return this.url;
  }
  get VERSION() {
    return this.version;
  }
  get IS_CONNECTED() {
    return this.isConnected;
  }
  get IS_LOADING() {
    return this.isLoading;
  }

  /**
   * Reconnect to the API
   */
  async reconnect() {
    this.connectionState = "connecting";

    // Simulate connection
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      this.connectionState = "connected";
    } catch (e) {
      this.connectionState = "disconnected";
    }
  }

  /**
   * Initialize API settings
   */
  init(url: string, version: string = "v1") {
    this.url = url;
    this.version = version;
    this.reconnect();
  }
}

export function createApiStore() {
  return new ApiStore();
}

export function getApiStore() {
  return getContext<ApiStore>(RUNE_LAB_CONTEXT.api);
}
