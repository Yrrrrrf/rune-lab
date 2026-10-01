// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vite-plus/test";
import { createApiClient } from "./client.ts";
import { ApiConfigurationError } from "./errors.ts";
import { surrealApiBaseUrl } from "./url.ts";
import type { ApiConfig, ApiEnvironment } from "./types.ts";
import type { StandardSchemaV1 } from "up-fetch";

const environments: ApiEnvironment[] = [
	{
		id: "dev",
		label: "Development",
		baseUrl: "https://dev.example/api/app/main",
	},
	{
		id: "prod",
		label: "Production",
		baseUrl: "https://prod.example/api/app/main",
	},
];
const clients: ReturnType<typeof createApiClient>[] = [];
function client(fetcher: typeof fetch, config: Partial<ApiConfig> = {}) {
	const value = createApiClient({ environments, fetch: fetcher, ...config });
	clients.push(value);
	return value;
}
const json = (data: unknown, status = 200) =>
	new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});
function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((done) => {
		resolve = done;
	});
	return { promise, resolve };
}
afterEach(() => {
	clients.splice(0).forEach((value) => value.dispose());
	vi.useRealTimers();
});

describe("API requests", () => {
	it("preserves the API prefix, serializes query/body, and retains falsy JSON", async () => {
		const requests: Request[] = [];
		const api = client(async (input) => {
			requests.push(input as Request);
			return json(false);
		});
		expect(await api.get("/customers", { params: { limit: 10 } })).toBe(false);
		expect(requests[0].url).toBe(
			"https://dev.example/api/app/main/customers?limit=10",
		);
		await api.post("/orders", { total: 0 });
		expect(await requests[1].json()).toEqual({ total: 0 });
		expect(api.state.pending).toBe(0);
		const zero = client(async () => json(0));
		expect(await zero.get("/zero")).toBe(0);
	});
	it("uses fresh environment credentials, allows header deletion, and prevents URL escape", async () => {
		let token = "first";
		const requests: Request[] = [];
		const api = client(
			async (input) => {
				requests.push(input as Request);
				return json({});
			},
			{
				environments: [
					{
						...environments[0],
						getToken: () => token,
						headers: { "X-App": "demo" },
					},
					{ ...environments[1], getToken: () => "production-token" },
				],
			},
		);
		await api.get("/one");
		token = "second";
		await api.get("/two");
		expect(requests[1].headers.get("Authorization")).toBe("Bearer second");
		await api.get("/public", { headers: { Authorization: undefined } });
		expect(requests[2].headers.has("Authorization")).toBe(false);
		for (const path of [
			"https://evil.example/data",
			"//evil.example/data",
			"../secret",
			"/%2e%2e/secret",
			"/bad\\path",
		]) {
			await expect(api.get(path)).rejects.toBeInstanceOf(ApiConfigurationError);
		}
		api.setEnvironment("prod");
		await api.get("/one");
		expect(requests.at(-1)?.headers.get("Authorization")).toBe(
			"Bearer production-token",
		);
		expect(requests.at(-1)?.url).toContain("prod.example");
	});
	it("validates a schema and keeps original validation errors", async () => {
		const schema: StandardSchemaV1<unknown, { name: string }> = {
			"~standard": {
				version: 1,
				vendor: "test",
				validate: (value) =>
					typeof value === "object" &&
					value !== null &&
					"name" in value &&
					typeof value.name === "string"
						? { value: { name: value.name } }
						: { issues: [{ message: "Expected name" }] },
			},
		};
		const api = client(async () => json({ invalid: true }));
		await expect(api.get("/user", { schema })).rejects.toHaveProperty(
			"kind",
			"validation",
		);
		expect(api.state.lastError?.kind).toBe("validation");
		const valid = client(async () => json({ name: "Rune" }));
		const result = await valid.get("/user", { schema });
		const name: string = result.name; // compile-time inference regression guard
		expect(name).toBe("Rune");
	});
	it("preserves HTTP errors and never retries mutations by default", async () => {
		const transport = vi.fn(async () => json({ detail: "Conflict" }, 409));
		const api = client(transport);
		await expect(api.post("/orders", {})).rejects.toMatchObject({
			status: 409,
			data: { detail: "Conflict" },
		});
		expect(transport).toHaveBeenCalledTimes(1);
		expect(api.state.lastError?.status).toBe(409);
	});
	it("supports 204, text, FormData, and custom binary parsing", async () => {
		const requests: Request[] = [];
		const api = client(async (input) => {
			const request = input as Request;
			requests.push(request);
			return request.url.endsWith("empty")
				? new Response(null, { status: 204 })
				: new Response("hello");
		});
		expect(await api.delete("empty")).toBeNull();
		expect(await api.get("text")).toBe("hello");
		const body = new FormData();
		body.set("name", "Rune");
		await api.post("form", body);
		expect(requests.at(-1)?.headers.get("content-type")).toContain(
			"multipart/form-data; boundary=",
		);
		const bytes = await api.get("file", {
			parseResponse: (response) => response.arrayBuffer(),
		});
		expect(bytes.byteLength).toBe(5);
	});
});

describe("environment and lifecycle", () => {
	it("rejects stale completions and notifies SDK consumers", async () => {
		const response = deferred<Response>();
		const started = deferred<void>();
		const api = client(async () => {
			started.resolve();
			return response.promise;
		});
		const changes = vi.fn();
		api.onEnvironmentChange(changes);
		const old = api.get("/slow");
		const rejection = expect(old).rejects.toHaveProperty("name", "AbortError");
		await started.promise;
		expect(api.state.pending).toBe(1);
		api.setEnvironment("prod");
		await rejection;
		response.resolve(json({ old: true }));
		await Promise.resolve();
		expect(api.state.pending).toBe(0);
		expect(api.state.lastSuccessAt).toBeNull();
		expect(changes).toHaveBeenCalledWith({ previous: "dev", current: "prod" });
	});
	it("never redirects a just-started request to a newly selected backend", async () => {
		const transport = vi.fn(async () => json({}));
		const api = client(transport);
		await api.ready;
		const request = api.post("/orders", { quantity: 1 });
		api.setEnvironment("prod");
		await expect(request).rejects.toHaveProperty("name", "AbortError");
		expect(transport).not.toHaveBeenCalled();
	});
	it("does not invoke success hooks for a stale response", async () => {
		const response = deferred<Response>();
		const started = deferred<void>();
		const api = client(async () => {
			started.resolve();
			return response.promise;
		});
		const success = vi.fn();
		const request = api.get("/slow", { onSuccess: success });
		const rejected = expect(request).rejects.toHaveProperty(
			"name",
			"AbortError",
		);
		await started.promise;
		api.setEnvironment("prod");
		await rejected;
		response.resolve(json({ old: true }));
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(success).not.toHaveBeenCalled();
	});
	it("cancels during asynchronous authentication without sending credentials", async () => {
		const token = deferred<string>();
		const authStarted = deferred<void>();
		const transport = vi.fn(async () => json({}));
		const api = client(transport, {
			environments: [
				{
					...environments[0],
					getToken: () => {
						authStarted.resolve();
						return token.promise;
					},
				},
				environments[1],
			],
		});
		const request = api.get("/slow");
		const rejected = expect(request).rejects.toHaveProperty(
			"name",
			"AbortError",
		);
		await authStarted.promise;
		api.setEnvironment("prod");
		await rejected;
		token.resolve("secret");
		await Promise.resolve();
		await Promise.resolve();
		expect(transport).not.toHaveBeenCalled();
	});
	it("honors caller cancellation and bounds a transport that ignores its signal", async () => {
		const started = deferred<void>();
		const api = client(async () => {
			started.resolve();
			return new Promise(() => {});
		});
		const controller = new AbortController();
		const request = api.get("/slow", { signal: controller.signal });
		const rejection = expect(request).rejects.toHaveProperty(
			"name",
			"AbortError",
		);
		await started.promise;
		controller.abort();
		await rejection;
		expect(api.state.pending).toBe(0);
		expect(api.state.lastError).toBeNull();
		await expect(api.get("/timeout", { timeout: 10 })).rejects.toHaveProperty(
			"name",
			"TimeoutError",
		);
		expect(api.state.lastError?.kind).toBe("timeout");
	});
	it("isolates clients and aborts owned requests on idempotent disposal", async () => {
		const a = client(async () => new Promise(() => {}));
		const b = client(async () => json({}));
		a.setEnvironment("prod");
		expect(b.current).toBe("dev");
		const request = a.get("/slow");
		const rejected = expect(request).rejects.toHaveProperty(
			"name",
			"AbortError",
		);
		await Promise.resolve();
		await Promise.resolve();
		a.dispose();
		a.dispose();
		await rejected;
		expect(a.state.pending).toBe(0);
		await expect(a.get("/new")).rejects.toHaveProperty("name", "AbortError");
	});
	it("restores preferences before requests and persists no credentials", async () => {
		const writes: string[] = [];
		const requests: Request[] = [];
		const api = createApiClient(
			{
				environments,
				fetch: async (input) => {
					requests.push(input as Request);
					return json({});
				},
			},
			{
				get: async () =>
					JSON.stringify({ environmentId: "prod", monitoring: true }),
				set: async (_, value) => {
					writes.push(value);
				},
			},
		);
		clients.push(api);
		await api.get("/one");
		expect(requests[0].url).toContain("prod.example");
		api.setEnvironment("dev");
		await Promise.resolve();
		await Promise.resolve();
		expect(JSON.parse(writes[0])).toEqual({
			environmentId: "dev",
			monitoring: true,
		});
	});
	it("does not let late hydration overwrite an explicit user selection", async () => {
		const saved = deferred<string>();
		const api = createApiClient(
			{ environments },
			{ get: () => saved.promise, set: () => {} },
		);
		clients.push(api);
		api.setEnvironment("prod");
		saved.resolve(JSON.stringify({ environmentId: "dev", monitoring: true }));
		await api.ready;
		expect(api.current).toBe("prod");
		expect(api.monitoring).toBe(false);
	});
});

describe("health and execution", () => {
	it("interprets application health separately from HTTP success", async () => {
		const api = client(async () => json({ db_status: "error" }), {
			health: {
				path: "/health",
				interpret: (data) => ({
					status:
						(data as { db_status: string }).db_status === "ok"
							? "healthy"
							: "degraded",
				}),
			},
		});
		expect((await api.checkHealth()).status).toBe("degraded");
		expect(api.state.lastError).toBeNull();
	});
	it("distinguishes denied access from unreachable service", async () => {
		const denied = client(async () => json({}, 401), {
			health: { path: "/health" },
		});
		expect((await denied.checkHealth()).status).toBe("unauthorized");
		const offline = client(
			async () => {
				throw new TypeError("Failed to fetch");
			},
			{ health: { path: "/health" } },
		);
		expect((await offline.checkHealth()).status).toBe("unreachable");
	});
	it("coalesces concurrent health checks", async () => {
		const response = deferred<Response>();
		const transport = vi.fn(async () => response.promise);
		const api = client(transport, { health: { path: "/health" } });
		const a = api.checkHealth();
		const b = api.checkHealth();
		await Promise.resolve();
		await Promise.resolve();
		await Promise.resolve();
		response.resolve(json({}));
		await Promise.all([a, b]);
		expect(transport).toHaveBeenCalledTimes(1);
	});
	it("executes only an explicit mapping, with separate parameters and no retries", async () => {
		const requests: Request[] = [];
		const transport = vi.fn(async (input: RequestInfo | URL) => {
			requests.push(input as Request);
			return json({}, 503);
		});
		const api = client(transport);
		await expect(api.execRaw("RETURN $x", { x: 1 })).rejects.toBeInstanceOf(
			ApiConfigurationError,
		);
		expect(transport).not.toHaveBeenCalled();
		const configured = client(transport, { execRaw: { path: "/exec-raw" } });
		await expect(
			configured.execRaw("RETURN $x", { x: 1 }, { retry: { attempts: 5 } }),
		).rejects.toHaveProperty("status", 503);
		expect(transport).toHaveBeenCalledTimes(1);
		expect(await requests[0].json()).toEqual({
			query: "RETURN $x",
			params: { x: 1 },
		});
	});
	it("constructs SurrealDB custom API paths without an SDK", () => {
		expect(surrealApiBaseUrl("https://db.example", "my app", "main")).toBe(
			"https://db.example/api/my%20app/main",
		);
		expect(() =>
			surrealApiBaseUrl("https://db.example", "..", "main"),
		).toThrow();
	});
});
