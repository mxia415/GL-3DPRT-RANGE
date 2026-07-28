import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const assetDir = path.join(projectRoot, "outputs", "assets", "trl");

const classification = JSON.parse(
  await readFile(path.join(assetDir, "classification.json"), "utf8")
);

const envelopes = {};
for (const profile of ["long", "standard"]) {
  const bytes = await readFile(path.join(assetDir, `envelope-${profile}-light.glb`));
  envelopes[profile] = bytes.toString("base64");
}

const payload = { classification, envelopes };
const output = [
  "window.__GL3DPRT_TRL_OFFLINE__ = ",
  JSON.stringify(payload),
  ";\n"
].join("");

await writeFile(path.join(assetDir, "trl-offline-data.js"), output);
