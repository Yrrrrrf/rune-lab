// scripts/build_pkg.ts
import denoConfig from "../deno.json" with { type: "json" };

// ── 1. Restructure: move dist/* → dist/src/ ──────────────────────────────────
await Deno.mkdir("./dist/src", { recursive: true });
for await (const entry of Deno.readDir("./dist")) {
  if (entry.name === "src") continue;
  await Deno.rename(`./dist/${entry.name}`, `./dist/src/${entry.name}`);
}

// ── Shared metadata ───────────────────────────────────────────────────────────
const exports = { ".": "./src/mod.ts" };
const imports = {
  "esm-env": "npm:esm-env@^1.2.2",
  "hotkeys-js": "npm:hotkeys-js@^4.0.2",
  "dinero.js": "npm:dinero.js@^2.0.2",
  "svelte": "npm:svelte@^5.55.0",
  "svelte/": "npm:svelte@^5.55.0/",
  "@sveltejs/kit": "npm:@sveltejs/kit@^2.55.0",
  "@inlang/paraglide-js": "npm:@inlang/paraglide-js@^2.15.1",
  "@inlang/": "npm:@inlang/paraglide-js@^2.15.1/",
};
const peerDependencies = {
  "svelte": "^5.0.0",
  "@inlang/paraglide-js": "^2.0.0",
};
const meta = {
  version: denoConfig.version,
  description: denoConfig.description,
  license: denoConfig.license,
  repository: denoConfig.repository,
};

// ── 2. Generate dist/deno.json ────────────────────────────────────────────────
await Deno.writeTextFile("./dist/deno.json", JSON.stringify({
  name: "@yrrrrrf/rune-lab",  // JSR scoped name
  ...meta,
  exports,
  imports,
}, null, 2));

// ── 3. Generate dist/package.json ─────────────────────────────────────────────
await Deno.writeTextFile("./dist/package.json", JSON.stringify({
  name: "rune-lab",           // npm unscoped name
  ...meta,
  type: "module",
  exports,
  imports,
  peerDependencies,
  keywords: ["svelte", "svelte-5", "runes", "ui", "components"],
}, null, 2));

// ── 4. Copy metadata ──────────────────────────────────────────────────────────
await Deno.copyFile("README.md", "./dist/README.md");
await Deno.copyFile("LICENSE", "./dist/LICENSE");

console.log(`dist/ (v${denoConfig.version})`);