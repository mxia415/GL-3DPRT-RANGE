import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { basename, join } from "node:path";

const sourceRoot = process.env.CRL02_SOURCE_ROOT || "/Users/ming/Documents/GL-3DPRT-CRL";
const outputRoot = new URL("../outputs/assets/crl02/", import.meta.url);
const partNames = [
  "er230_00_fx_track.glb", "er230_10_e1_carriage_base.glb",
  "er230_30_a1_rotary_base.glb", "er230_40_a2_upper_arm.glb",
  "er230_50_a3_forearm.glb", "er230_60_a4_wrist_roll.glb",
  "er230_70_a5_wrist_bend.glb", "er230_80_a6_flange.glb",
  "er230_90_tool_extension.glb", "er230_90_tool_extension_standard.glb"
];

const pad4 = (n) => (n + 3) & ~3;
const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");

function envelopeGlb(source) {
  const positions = new Float32Array(source.vertices.length * 3);
  source.vertices.forEach((p, i) => positions.set(p, i * 3));
  const indices = new Uint32Array(source.triangles.length * 3);
  source.triangles.forEach((t, i) => indices.set(t, i * 3));
  const posBytes = Buffer.from(positions.buffer);
  const idxOffset = pad4(posBytes.length);
  const bin = Buffer.alloc(pad4(idxOffset + indices.byteLength));
  posBytes.copy(bin, 0);
  Buffer.from(indices.buffer).copy(bin, idxOffset);
  const gltf = {
    asset: { version: "2.0", generator: "GL-3DPRT-CRL02 package builder" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: `CRL02 ${source.profile} smooth envelope` }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1, mode: 4 }] }],
    buffers: [{ byteLength: bin.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: posBytes.length, target: 34962 },
      { buffer: 0, byteOffset: idxOffset, byteLength: indices.byteLength, target: 34963 }
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: source.vertices.length, type: "VEC3", min: source.bounds[0], max: source.bounds[1] },
      { bufferView: 1, componentType: 5125, count: indices.length, type: "SCALAR", min: [0], max: [source.vertices.length - 1] }
    ]
  };
  const jsonText = JSON.stringify(gltf);
  const json = Buffer.alloc(pad4(Buffer.byteLength(jsonText)), 0x20);
  json.write(jsonText);
  const out = Buffer.alloc(12 + 8 + json.length + 8 + bin.length);
  out.writeUInt32LE(0x46546c67, 0); out.writeUInt32LE(2, 4); out.writeUInt32LE(out.length, 8);
  out.writeUInt32LE(json.length, 12); out.writeUInt32LE(0x4e4f534a, 16); json.copy(out, 20);
  const binHeader = 20 + json.length;
  out.writeUInt32LE(bin.length, binHeader); out.writeUInt32LE(0x004e4942, binHeader + 4); bin.copy(out, binHeader + 8);
  return out;
}

async function writeOfflineScript(path, assignment, bytes) {
  const js = `window.__GL3DPRT_CRL02_OFFLINE__=window.__GL3DPRT_CRL02_OFFLINE__||{envelopes:{},parts:{}};${assignment}=\"${bytes.toString("base64")}\";\n`;
  await writeFile(path, js);
}

await mkdir(new URL("parts/", outputRoot), { recursive: true });
await mkdir(new URL("offline/", outputRoot), { recursive: true });
const evidence = { schema: "gl-3dprt-crl02/evidence-v1", sourceRoot, generatedAt: new Date().toISOString(), profiles: {}, parts: {} };

for (const profile of ["standard", "long"]) {
  const sourcePath = join(sourceRoot, "assets/reachability", `${profile}-surface-v3-ypos-left-cut-no-collision.json`);
  const sourceBytes = await readFile(sourcePath);
  const source = JSON.parse(sourceBytes);
  const glb = envelopeGlb(source);
  await writeFile(new URL(`envelope-${profile}.glb`, outputRoot), glb);
  await writeOfflineScript(new URL(`offline/envelope-${profile}.js`, outputRoot), `window.__GL3DPRT_CRL02_OFFLINE__.envelopes.${profile}`, glb);
  evidence.profiles[profile] = {
    sourceFile: basename(sourcePath), sourceSha256: sha256(sourceBytes), glbSha256: sha256(glb),
    vertices: source.vertices.length, triangles: source.triangles.length, bounds: source.bounds,
    schema: source.schema, kinematicEvidence: source.kinematicEvidence,
    displaySurface: source.displaySurface, deviceExclusion: source.deviceExclusion
  };
}

for (const name of partNames) {
  const sourcePath = join(sourceRoot, "assets/parts", name);
  const bytes = await readFile(sourcePath);
  await copyFile(sourcePath, new URL(`parts/${name}`, outputRoot));
  await writeOfflineScript(new URL(`offline/part-${name}.js`, outputRoot), `window.__GL3DPRT_CRL02_OFFLINE__.parts[${JSON.stringify(name)}]`, bytes);
  evidence.parts[name] = { bytes: bytes.length, sha256: sha256(bytes) };
}
await copyFile(join(sourceRoot, "assets/parts/parts.manifest.json"), new URL("parts/parts.manifest.json", outputRoot));
await writeFile(new URL("evidence.json", outputRoot), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`CRL02 package built in ${outputRoot.pathname}`);
