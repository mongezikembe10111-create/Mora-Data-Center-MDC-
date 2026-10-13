import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const packageFile = require.resolve("maplibre-gl/package.json");
const dependency = JSON.parse(await readFile(packageFile, "utf8"));
const root = fileURLToPath(new URL("../", import.meta.url));
const destination = join(root, "public", "vendor", "maplibre");

// The checked-in licence corresponds to this dependency release. Review it
// alongside the worker files when upgrading MapLibre rather than silently
// distributing a different release under the current licence attribution.
if (dependency.version !== "6.4.1") {
  throw new Error(
    "Review the public MapLibre worker assets and licence before changing MapLibre 6.4.1.",
  );
}
await mkdir(destination, { recursive: true });
for (const filename of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  const source = await readFile(join(dirname(packageFile), "dist", filename));
  let current;
  try {
    current = await readFile(join(destination, filename));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (!current?.equals(source))
    await writeFile(join(destination, filename), source);
}
await readFile(join(destination, "LICENSE.txt"));
console.log(
  `Prepared MapLibre ${dependency.version} module worker and shared bundle.`,
);
