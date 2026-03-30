// scripts/build_pkg.ts
import denoConfig from "../deno.json" with { type: "json" };

// ── 1. Restructure: move dist/* → dist/src/ ──────────────────────────────────
await Deno.mkdir("./dist/src", { recursive: true });
for await (const entry of Deno.readDir("./dist")) {
  if (entry.name === "src") continue;
  await Deno.rename(`./dist/${entry.name}`, `./dist/src/${entry.name}`);
}

// Clean up any stray deno.ts artifact
try {
  await Deno.remove("./dist/src/deno.ts");
} catch { /* already gone */ }

// ── 2. Generate dist/deno.json (standalone — no workspace members) ────────────
const denoDistConfig = {
  name: denoConfig.name,
  version: denoConfig.version,
  description: denoConfig.description,
  license: denoConfig.license,
  exports: { ".": "./src/mod.ts" },
  repository: denoConfig.repository,
};
await Deno.writeTextFile(
  "./dist/deno.json",
  JSON.stringify(denoDistConfig, null, 2),
);

// ── 3. Generate dist/package.json (derived from deno.json) ───────────────────
const pkg = {
  name: "rune-lab",
  version: denoConfig.version,
  description: denoConfig.description,
  type: "module",
  exports: { ".": "./src/mod.ts" },
  license: denoConfig.license,
  repository: denoConfig.repository,
  peerDependencies: {
    "svelte": "^5.0.0",
    "@inlang/paraglide-js": "^2.0.0",
  },
  keywords: ["svelte", "svelte-5", "runes", "ui", "components"],
};
await Deno.writeTextFile("./dist/package.json", JSON.stringify(pkg, null, 2));

// ── 4. Copy metadata ──────────────────────────────────────────────────────────
await Deno.copyFile("README.md", "./dist/README.md");
await Deno.copyFile("LICENSE", "./dist/LICENSE");

console.log(`dist/ (v${denoConfig.version})`);
