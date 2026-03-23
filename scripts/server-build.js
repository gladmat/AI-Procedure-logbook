const { build } = require("esbuild");
const { dependencies } = require("../package.json");

// Bundle ESM-only packages (jose, expo-server-sdk) into the output.
// All other dependencies stay external (loaded at runtime).
const ESM_ONLY_PACKAGES = ["jose", "expo-server-sdk"];

const externalDeps = Object.keys(dependencies || {}).filter(
  (dep) => !ESM_ONLY_PACKAGES.includes(dep),
);

build({
  entryPoints: ["server/index.ts"],
  platform: "node",
  bundle: true,
  format: "esm",
  outfile: "server_dist/index.mjs",
  external: externalDeps,
  // Node needs .mjs extension or "type":"module" for ESM.
  // Using banner to add createRequire for any CJS-only deps.
  banner: {
    js: [
      'import { createRequire as _cr } from "module";',
      "const require = _cr(import.meta.url);",
    ].join("\n"),
  },
}).catch(() => process.exit(1));
