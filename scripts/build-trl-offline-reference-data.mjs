import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const assetDir = path.join(projectRoot, "outputs", "assets", "trl");

const files = {
  base: "reference-base-light.glb",
  long: "reference-tool-long-light.glb",
  standard: "reference-tool-standard-light.glb"
};
const payload = {};
for (const [key, file] of Object.entries(files)) {
  payload[key] = (await readFile(path.join(assetDir, file))).toString("base64");
}

const output = [
  "window.__GL3DPRT_TRL_REFERENCE_OFFLINE__ = ",
  JSON.stringify(payload),
  ";\n"
].join("");

await writeFile(path.join(assetDir, "trl-offline-reference.js"), output);
