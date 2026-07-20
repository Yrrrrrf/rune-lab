#!/usr/bin/env -S deno run -A
// Assemble the publishable npm layout at build/:
//
//   build/package.json  <- root deno.json (identity) + ui/plugin deno.jsons (exports, deps)
//   build/README.md     <- copied from repo root
//   build/LICENSE       <- copied from repo root
//
// Usage: deno run -A scripts/manifest.ts <plugin> [<plugin> ...]
//
// core + ui always ship; plugins are opt-in via the arg list. The canonical
// list is validated against scripts/plugins.ts so the build recipe and
// this manifest can never disagree about what's in the package.
//
// Run from the repo root. svelte-package fills build/dist afterwards.
// The root deno.json is the canonical source for name/version/description/
// license/repository.

// "npm:@scope/pkg@^1.2" | "npm:pkg@^1" | "npm:pkg" -> { name, range }
const parseNpmSpec = (spec: string): { name: string; range: string } => {
  const m = spec.replace(/^npm:/, "").match(/^((?:@[^/]+\/)?[^@]+)(?:@(.+))?$/);
  if (m === null) throw new Error(`unparseable npm spec: ${spec}`);
  return { name: m[1], range: m[2] ?? "*" };
};

import { PLUGIN_DEPS, type PluginName, PLUGINS } from "./plugins.ts";

const plugins = Deno.args as PluginName[];

// 1. Check for unknown plugins
for (const p of plugins) {
  if (!PLUGINS.includes(p)) {
    console.error(
      `Error: Unknown plugin "${p}". Expected one of: ${PLUGINS.join(", ")}`,
    );
    Deno.exit(1);
  }
}

// 2. Validate dependency closure
for (const p of plugins) {
  const deps = PLUGIN_DEPS[p];
  const missing = deps.filter((d) => !plugins.includes(d));
  if (missing.length > 0) {
    console.error(
      `Error: Plugin "${p}" is missing required dependencies: ${
        missing.join(
          ", ",
        )
      }`,
    );
    Deno.exit(1);
  }
}

const root = JSON.parse(await Deno.readTextFile("deno.json"));

// "git+https://github.com/user/repo.git" -> "https://github.com/user/repo"
const repoUrl = root.repository.url.replace(/^git\+/, "").replace(/\.git$/, "");

// dist layout is uniform: every member lives at dist/src/<path>/mod.{js,d.ts}
const member = (path: string, svelteEntry = true) => ({
  types: `./dist/src/${path}/mod.d.ts`,
  ...(svelteEntry ? { svelte: `./dist/src/${path}/mod.js` } : {}),
  default: `./dist/src/${path}/mod.js`,
});

const exports = {
  ".": member("ui"),
  "./core": member("core", false), // core has no svelte components
  ...Object.fromEntries(plugins.map((p) => [`./${p}`, member(`plugins/${p}`)])),
};

// Gather dependencies from every shipped member's deno.json
const packages = [
  "src/packages/ui",
  "src/packages/core",
  ...plugins.map((p) => `src/packages/plugins/${p}`),
];

// todo: Enhance this part to now let it...
// To be able to read those from the deno.json & then add those in the package.json.dev-deps.
const DEV_DEPS = new Set([
  "svelte",
  "tailwindcss",
  "daisyui",
  "@inlang/paraglide-js",
]);

const dependencies: Record<string, string> = {};

for (const pkgPath of packages) {
  const pkgDeno = JSON.parse(await Deno.readTextFile(`${pkgPath}/deno.json`));
  const imports = pkgDeno.imports || {};
  for (const [_, val] of Object.entries(imports)) {
    if (typeof val === "string" && val.startsWith("npm:")) {
      const { name, range } = parseNpmSpec(val);
      if (
        !DEV_DEPS.has(name) &&
        !(name === "rune-lab" || name.startsWith("rune-lab/"))
      ) {
        dependencies[name] = range;
      }
    }
  }
}

const manifest = {
  name: "rune-lab",
  version: root.version,
  description: root.description,
  readme: root.readme,
  license: root.license,
  repository: root.repository,
  homepage: `${repoUrl}#readme`,
  bugs: `${repoUrl}/issues`,
  type: "module",
  files: ["dist"],
  svelte: exports["."].svelte,
  exports,
  peerDependencies: {
    svelte: "*",
  },
  dependencies,
};

await Deno.mkdir("build", { recursive: true });
await Deno.writeTextFile(
  "build/package.json",
  `${JSON.stringify(manifest, null, 2)}\n`,
);
console.log(
  `  wrote    build/package.json (${manifest.name}@${manifest.version})`,
);
console.log(`  plugins  ${plugins.length > 0 ? plugins.join(", ") : "(none)"}`);

for (const file of ["README.md", "LICENSE"]) {
  await Deno.copyFile(file, `build/${file}`);
  console.log(`  copied   ${file} -> build/${file}`);
}
