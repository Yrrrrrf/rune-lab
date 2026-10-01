import { createSubscriber } from "svelte/reactivity";
import { createApiClient, type ApiClient } from "./client.ts";
import type { ApiConfig, ApiPersistence } from "./types.ts";

/** One controller, with a Svelte subscription bridge; no global state or duplicate snapshots. */
export function createApiStore(
	config?: ApiConfig,
	persistence?: ApiPersistence,
): ApiClient {
	const client = createApiClient(config, persistence);
	const track = createSubscriber((update) => client.subscribe(update));
	return {
		...client,
		get state() {
			track();
			return client.state;
		},
		get environment() {
			track();
			return client.environment;
		},
		get current() {
			track();
			return client.current;
		},
		set current(value) {
			client.current = value;
		},
		get monitoring() {
			track();
			return client.monitoring;
		},
		set monitoring(value) {
			client.monitoring = value;
		},
		get canCheckHealth() {
			track();
			return client.canCheckHealth;
		},
		get canExecRaw() {
			track();
			return client.canExecRaw;
		},
	};
}
