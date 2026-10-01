import { ApiConfigurationError } from "./errors.ts";

export function resolveBaseUrl(base: string, origin?: string): URL {
	let url: URL;
	try {
		url = new URL(
			base,
			origin ?? (typeof location !== "undefined" ? location.origin : undefined),
		);
	} catch {
		throw new ApiConfigurationError(
			"API baseUrl must be absolute on the server, or use an explicit origin.",
		);
	}
	if (
		!/^https?:$/.test(url.protocol) ||
		url.username ||
		url.password ||
		url.search ||
		url.hash
	) {
		throw new ApiConfigurationError(
			"API baseUrl must be an HTTP(S) URL without credentials, query, or fragment.",
		);
	}
	url.pathname = `${url.pathname.replace(/\/+$/, "")}/`;
	return url;
}

/** A leading slash is base-relative. Reject traversal and URL overrides before adding credentials. */
export function resolveApiUrl(
	base: string,
	path: string,
	origin?: string,
): string {
	const root = resolveBaseUrl(base, origin);
	if (
		/^[a-z][a-z\d+.-]*:/i.test(path) ||
		path.startsWith("//") ||
		path.includes("\\") ||
		path.includes("#")
	) {
		throw new ApiConfigurationError(
			"Use an API-relative path, without an origin or fragment.",
		);
	}
	let decoded: string;
	try {
		decoded = decodeURIComponent(path.split("?")[0]);
	} catch {
		throw new ApiConfigurationError("Malformed API path encoding.");
	}
	if (
		decoded.includes("\\") ||
		decoded.split("/").some((part) => part === "." || part === "..")
	) {
		throw new ApiConfigurationError(
			"API paths cannot traverse outside their configured base.",
		);
	}
	const url = new URL(path.replace(/^\/+/, ""), root);
	if (url.origin !== root.origin || !url.pathname.startsWith(root.pathname)) {
		throw new ApiConfigurationError(
			"Request URL must remain within the configured API base.",
		);
	}
	return url.href;
}

/** Custom DEFINE API routes only. Does not select the /sql or /rpc protocol. */
export function surrealApiBaseUrl(
	server: string,
	namespace: string,
	database: string,
): string {
	if (
		![namespace, database].every(
			(s) => s.length > 0 && s !== "." && s !== ".." && !/[\\/]/.test(s),
		)
	) {
		throw new ApiConfigurationError(
			"SurrealDB namespace and database must be nonempty path segments.",
		);
	}
	const base = resolveBaseUrl(server);
	return `${base.href}api/${encodeURIComponent(namespace)}/${encodeURIComponent(database)}`;
}
