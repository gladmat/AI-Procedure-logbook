const { build } = require("esbuild");
const { dependencies } = require("../package.json");

// Bundle ESM-only packages (like jose) into the CJS output.
// All other dependencies stay external (loaded via require at runtime).
const ESM_ONLY_PACKAGES = ["jose", "expo-server-sdk"];

const externalDeps = Object.keys(dependencies || {}).filter(
  (dep) => !ESM_ONLY_PACKAGES.includes(dep),
);

build({
  entryPoints: ["server/index.ts"],
  platform: "node",
  bundle: true,
  format: "cjs",
  outdir: "server_dist",
  external: externalDeps,
}).catch(() => process.exit(1));
