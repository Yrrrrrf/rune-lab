/**
 * Post-build cleanup for the rune-lab package.
 *
 * Runs from the `src/package` directory and expects `dist/` to already exist
 * (produced by `@sveltejs/package`).
 *
 * Steps:
 *   1. Remove i18n build artifacts that shouldn't ship (project.inlang/, translations/, .gitignore)
 *   2. Delete any leftover *.test.js files inside dist/i18n/
 *   3. Rewrite  `.ts`  →  `.js`  in every import/export across dist/
 *   4. Replace `pkgConfig.version` with the literal version string from package.json
 *      and drop the corresponding `import pkgConfig from …package.json` line.
 */

import { walk } from "jsr:@std/fs@1/walk";
import { join, resolve } from "jsr:@std/path@1";

// ── resolve paths ──────────────────────────────────────────────────────
const PKG_DIR = resolve(Deno.cwd()); // expected: src/package
const DIST = join(PKG_DIR, "dist");
const PKG_JSON = join(PKG_DIR, "package.json");

// ── 1. Remove unwanted i18n directories / files ────────────────────────
const REMOVE_PATHS = [
  join(DIST, "i18n", "project.inlang"),
  join(DIST, "i18n", "translations"),
  join(DIST, "i18n", "paraglide", ".gitignore"),
];

for (const p of REMOVE_PATHS) {
  try {
    await Deno.remove(p, { recursive: true });
    console.log(`  removed  ${p.replace(PKG_DIR + "/", "")}`);
  } catch {
    // already gone — that's fine
  }
}

// ── 2. Delete *.test.js inside dist/i18n/ ──────────────────────────────
const i18nDir = join(DIST, "i18n");
try {
  for await (
    const entry of walk(i18nDir, { exts: [".test.js"], includeDirs: false })
  ) {
    await Deno.remove(entry.path);
    console.log(`  removed  ${entry.path.replace(PKG_DIR + "/", "")}`);
  }
} catch {
  // i18n dir might not exist at all
}

// ── helpers ────────────────────────────────────────────────────────────
const DIST_EXTS = [".js", ".ts", ".svelte"];

async function forEachDistFile(
  fn: (path: string, content: string) => string | null,
) {
  for await (const entry of walk(DIST, { includeDirs: false })) {
    if (!DIST_EXTS.some((ext) => entry.path.endsWith(ext))) continue;
    const original = await Deno.readTextFile(entry.path);
    const updated = fn(entry.path, original);
    if (updated !== null && updated !== original) {
      await Deno.writeTextFile(entry.path, updated);
    }
  }
}

// ── 3. Rewrite .ts → .js in imports / exports ─────────────────────────
//    Matches:  from "./foo.ts"  /  from './foo.ts'  /  export … from "…"
const TS_IMPORT_RE = /(from\s+['"])([^'"]*?)\.ts(['"])/g;

await forEachDistFile((_path, content) =>
  content.replaceAll(TS_IMPORT_RE, "$1$2.js$3")
);
console.log("  rewrote  .ts → .js imports");

// ── 4. Inject package.json version ─────────────────────────────────────
const { version } = JSON.parse(await Deno.readTextFile(PKG_JSON));
const PKG_IMPORT_RE =
  /import\s+pkgConfig\s+from\s+['"].*package\.json['"];?\s*\n?\s*(?:with\s*\{[^}]*\}\s*;?\s*\n?)?/g;
const PKG_VERSION_RE = /pkgConfig\.version/g;

await forEachDistFile((_path, content) => {
  let out = content.replace(PKG_IMPORT_RE, "");
  out = out.replace(
    /^\s*with\s*\{\s*type:\s*["']json["']\s*\}\s*;?\s*\n?/gm,
    "",
  );
  out = out.replaceAll(PKG_VERSION_RE, `"${version}"`);
  return out;
});
console.log(`  injected version "${version}"`);

console.log("✓ build-pkg cleanup done");
