// import * as dnt from "@deno/dnt";
// import denoConfig from "../deno.json" with { type: "json" };

// await dnt.emptyDir("./npm");

// await dnt.build({
//   entryPoints: ["./mod.ts"],
//   outDir: "./npm",
//   // see JS docs for overview and more options
//   shims: { deno: true },
//   package: {
//     name: denoConfig.name,
//     version: denoConfig.version,
//     description: denoConfig.description,
//     license: denoConfig.license,
//     repository: denoConfig.repository
//   },
//   postBuild() {
//     // // steps to run after building and before running the tests
//     // Deno.copyFileSync("LICENSE", "npm/LICENSE");
//     // Deno.copyFileSync("README.md", "npm/README.md");
//   },
// });
