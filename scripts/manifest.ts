#!/usr/bin/env -S deno run -A
// Assemble the publishable npm layout at build/:
//
//   build/package.json  <- root deno.json (identity) + ui deno.json (exports, deps)
//   build/README.md     <- copied from repo root
//   build/LICENSE       <- copied from repo root
//
// Run from the repo root. svelte-package fills build/dist afterwards.
// The root deno.json is the canonical source for name/version/description/
// license/repository; the ui deno.json only contributes exports and the
// concrete dependency ranges (the workspace root has no per-package deps).

const UI_DIR = "src/packages/ui";

// deno.json `imports` mixes dev-time and runtime deps, so the runtime surface
// is declared here; versions are pulled from the ui deno.json.
const PEER_IMPORTS = ["svelte"];
const RUNTIME_IMPORTS = ["esm-env"];

type Imports = Record<string, string>;

// "npm:@scope/pkg@^1.2" | "npm:pkg@^1" | "npm:pkg" -> { name, range }
const parseNpmSpec = (spec: string): { name: string; range: string } => {
  const m = spec.replace(/^npm:/, "").match(/^((?:@[^/]+\/)?[^@]+)(?:@(.+))?$/);
  if (m === null) throw new Error(`unparseable npm spec: ${spec}`);
  return { name: m[1], range: m[2] ?? "*" };
};

// Pick the listed import keys out of deno.json imports as { pkg: range }.
const pickDeps = (imports: Imports, keys: string[]): Imports =>
  Object.fromEntries(
    keys
      .filter((k) => k in imports)
      .map((k) => parseNpmSpec(imports[k]))
      .map(({ name, range }) => [name, range]),
  );

// Map ui deno.json exports (./src/lib/*.ts) onto the packaged dist/*.js layout.
const distExports = (exports: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(exports).map(([key, src]) => {
      const js = src
        .replace(/^\.\/src\/lib\//, "./dist/")
        .replace(/\.ts$/, ".js");
      return [
        key,
        {
          types: js.replace(/\.js$/, ".d.ts"),
          svelte: js,
          default: js,
        },
      ];
    }),
  );

const root = JSON.parse(await Deno.readTextFile("deno.json"));
const ui = JSON.parse(await Deno.readTextFile(`${UI_DIR}/deno.json`));
const core = JSON.parse(await Deno.readTextFile("src/packages/core/deno.json"));

// "git+https://github.com/user/repo.git" -> "https://github.com/user/repo"
const repoUrl = root.repository.url.replace(/^git\+/, "").replace(/\.git$/, "");

// Map core deno.json exports (./src/*.ts) onto the packaged dist/core/*.js layout.
const coreDistExports = (exports: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(exports).map(([key, src]) => {
      const js = src
        .replace(/^\.\/src\//, "./dist/core/")
        .replace(/\.ts$/, ".js");
      const mappedKey = key === "."
        ? "./core"
        : key.replace(/^\.\//, "./core/");
      return [
        mappedKey,
        {
          types: js.replace(/\.js$/, ".d.ts"),
          default: js,
        },
      ];
    }),
  );

const exports = {
  ...distExports(ui.exports),
  ...coreDistExports(core.exports),
};

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
  // NOTE: `workspace:*` dependencies (like `@rune-lab/core`) are dropped by design
  // because core is folded directly into the `rune-lab` package under `dist/core`
  // and resolved via self-referencing exports.
  peerDependencies: pickDeps(ui.imports, PEER_IMPORTS),
  dependencies: pickDeps(ui.imports, RUNTIME_IMPORTS),
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

const jsrOnly = Object.entries(ui.imports as Imports)
  .filter(([, v]) => v.startsWith("jsr:"))
  .map(([k]) => k);
if (jsrOnly.length > 0) {
  console.log(
    `  note     jsr-only imports skipped in package.json: ${
      jsrOnly.join(
        ", ",
      )
    }`,
  );
}
