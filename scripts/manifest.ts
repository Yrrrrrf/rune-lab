#!/usr/bin/env -S deno run -A
// Assemble the publishable npm layout at build/:
//
//   build/package.json  <- root deno.json (identity) + ui/plugin deno.jsons (exports, deps)
//   build/README.md     <- copied from repo root
//   build/LICENSE       <- copied from repo root
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

const root = JSON.parse(await Deno.readTextFile("deno.json"));

// "git+https://github.com/user/repo.git" -> "https://github.com/user/repo"
const repoUrl = root.repository.url.replace(/^git\+/, "").replace(/\.git$/, "");

// Define the canonical nested exports map
const exports = {
  ".": {
    types: "./dist/mod.d.ts",
    svelte: "./dist/mod.js",
    default: "./dist/mod.js",
  },
  "./core": {
    types: "./dist/src/core/mod.d.ts",
    default: "./dist/src/core/mod.js",
  },
  "./layout": {
    types: "./dist/src/plugins/layout/mod.d.ts",
    svelte: "./dist/src/plugins/layout/mod.js",
    default: "./dist/src/plugins/layout/mod.js",
  },
  "./palettes": {
    types: "./dist/src/plugins/palettes/mod.d.ts",
    svelte: "./dist/src/plugins/palettes/mod.js",
    default: "./dist/src/plugins/palettes/mod.js",
  },
  "./money": {
    types: "./dist/src/plugins/money/mod.d.ts",
    svelte: "./dist/src/plugins/money/mod.js",
    default: "./dist/src/plugins/money/mod.js",
  },
  "./i18n/lang": {
    types: "./dist/src/plugins/lang/mod.d.ts",
    svelte: "./dist/src/plugins/lang/mod.js",
    default: "./dist/src/plugins/lang/mod.js",
  },
};

// Gather dependencies dynamically from all packages in the workspace
const packages = [
  "src/packages/ui",
  "src/packages/core",
  "src/packages/plugins/layout",
  "src/packages/plugins/palettes",
  "src/packages/plugins/i18n",
  "src/packages/plugins/observer",
];

const DEV_DEPS = new Set([
  "svelte",
  "@sveltejs/vite-plugin-svelte",
  "@sveltejs/adapter-static",
  "tailwindcss",
  "@tailwindcss/vite",
  "daisyui",
  "@inlang/paraglide-js",
]);

const dependencies: Record<string, string> = {};

for (const pkgPath of packages) {
  try {
    const pkgDeno = JSON.parse(await Deno.readTextFile(`${pkgPath}/deno.json`));
    const imports = pkgDeno.imports || {};
    for (const [_, val] of Object.entries(imports)) {
      if (typeof val === "string" && val.startsWith("npm:")) {
        const { name, range } = parseNpmSpec(val);
        if (!DEV_DEPS.has(name) && !name.startsWith("@rune-lab/")) {
          dependencies[name] = range;
        }
      }
    }
  } catch (e) {
    console.error(`Warning: failed to read dependencies for ${pkgPath}`, e);
  }
}

const manifest = {
  name: "rune-lab",
  version: root.version,
  description: root.description,
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
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(
  `  wrote    build/package.json (${manifest.name}@${manifest.version})`,
);

for (const file of ["README.md", "LICENSE"]) {
  await Deno.copyFile(file, `build/${file}`);
  console.log(`  copied   ${file} -> build/${file}`);
}
