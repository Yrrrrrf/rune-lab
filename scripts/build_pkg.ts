// scripts/build_pkg.ts
import denoConfig from "../deno.json" with { type: "json" };

// Move all current dist contents into dist/src/
await Deno.mkdir("./dist/src", { recursive: true });
for await (const entry of Deno.readDir("./dist")) {
  if (entry.name === "src") continue;
  await Deno.rename(
    `./dist/${entry.name}`,
    `./dist/src/${entry.name}`,
  );
}
const pkg = {
  name: "rune-lab",
  version: denoConfig.version,
  description: denoConfig.description,
  type: "module",
  main: denoConfig.exports["."],
  exports: denoConfig.exports,
  license: denoConfig.license,
  repository: denoConfig.repository,
  peerDependencies: {
    "svelte": "^5.0.0",
    "@inlang/paraglide-js": "^2.0.0",
  },
  keywords: ["svelte", "svelte-5", "runes", "ui", "components"],
};

try {
  await Deno.remove("./dist/src/deno.ts");
} catch {
  // already gone, no problem
}

// Drop both config files and docs into dist
await Deno.copyFile("deno.json", "./dist/deno.json");
await Deno.writeTextFile("./dist/package.json", JSON.stringify(pkg, null, 2));
await Deno.copyFile("README.md", "./dist/README.md");
await Deno.copyFile("LICENSE", "./dist/LICENSE");

console.log("✅ dist/ is ready for both npm and JSR");
console.log("   npm:  cd build/dist && npm publish");
console.log("   jsr:  deno publish --config build/dist/deno.json");
