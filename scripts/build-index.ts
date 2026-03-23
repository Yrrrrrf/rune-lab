/**
 * build-index.js
 * Generates root barrel files (index.js + index.d.ts) for the dist folder.
 * Re-exports from core, state, and ui sub-packages.
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const distDir = join(rootDir, "dist");

// Ensure dist exists
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// Generate JavaScript barrel
const indexJs = `// Auto-generated root barrel file
export * from "./core/index.js";
export * from "./state/index.js";
export * from "./ui/index.js";

import pkg from "../package.json" with { type: "json" };
export const version = () => pkg.version;
`;

// Generate TypeScript declarations barrel
const indexDts = `// Auto-generated root barrel file
export * from "./core/index.js";
export * from "./state/index.js";
export * from "./ui/index.js";

export declare const version: () => string;
`;

writeFileSync(join(distDir, "index.js"), indexJs);
writeFileSync(join(distDir, "index.d.ts"), indexDts);

console.log("✓ Generated dist/index.js and dist/index.d.ts");
