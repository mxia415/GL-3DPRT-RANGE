import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const pageUrl = new URL("outputs/GL-3DPRT-CRL02.html", root);
const assetRoot = new URL("outputs/assets/crl02/", root);
const page = await readFile(pageUrl, "utf8");
const evidence = JSON.parse(await readFile(new URL("evidence.json", assetRoot), "utf8"));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function glbJson(bytes) {
  assert.equal(bytes.readUInt32LE(0), 0x46546c67);
  assert.equal(bytes.readUInt32LE(4), 2);
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  const jsonLength = bytes.readUInt32LE(12);
  assert.equal(bytes.readUInt32LE(16), 0x4e4f534a);
  return JSON.parse(bytes.subarray(20, 20 + jsonLength).toString("utf8").trim());
}

test("CRL02 page is independent and exposes the full checker contract", () => {
  assert.match(page, /CRL02运动范围判定/);
  assert.doesNotMatch(page, /CRL01/);
  for (const token of [
    'id="nozzleProfile"', 'value="long"', 'value="standard"', 'id="stlFile"',
    'data-stl="positionX"', 'data-stl="rotationZ"', 'data-stl="opacity"',
    'id="toggleStlIntersection"', 'id="toggleModel"', 'data-fit-mode="L"',
    'data-fit-mode="W"', 'data-fit-mode="H"', 'window.__CRL02_DEBUG__', '@media'
  ]) assert.ok(page.includes(token), token);
  assert.match(page, /stlOutOfRangeColor = new THREE\.Color\(0xff3b30\)/);
  assert.match(page, /deviceExclusion: \{ \.\.\.trlDeviceExclusion \}/);
});

test("approved Standard and Long poses and FK outputs stay locked", () => {
  for (const token of [
    "e1:1500,a1:40.3681,a2:-84.193,a3:45.3517,a4:0,a5:-128.84,a6:77.4513",
    "x:0.007954079745559284,y:2399.885566254787,z:3387.613423815419",
    "e1:1499.5,a1:45.927,a2:-85,a3:55.287,a4:0,a5:-119.718,a6:93.6105",
    "x:-0.5407991026797845,y:2211.8675346563723,z:2191.605126674553"
  ]) assert.ok(page.includes(token), token);
  assert.match(page, /xMin: -2335, xMax: 1895, yMin: -1469\.927, yMax: 1469\.926, zMin: 0/);
  assert.equal((page.match(/er230_\d+_[a-z0-9_]+\.glb/g) || []).length >= 10, true);
});

test("derived envelopes preserve approved source hashes, topology counts, and bounds", async () => {
  const expected = {
    standard: { sha: "a1bfe827d062e9b5b86ddb27ded0677de4350918bbb278574832ba9f93f145f1", vertices: 283709, triangles: 567414, maxZ: 3445.842457 },
    long: { sha: "8a7abd8061a81901a1bf2d94374b8b2bc6a1b4294b2520a5f736e1acf4fc98a1", vertices: 237183, triangles: 474362, maxZ: 2445.842457 }
  };
  for (const [profile, contract] of Object.entries(expected)) {
    const record = evidence.profiles[profile];
    assert.equal(record.sourceSha256, contract.sha);
    assert.equal(record.vertices, contract.vertices);
    assert.equal(record.triangles, contract.triangles);
    assert.equal(record.bounds[0][1], 0);
    assert.equal(record.bounds[0][2], 0);
    assert.equal(record.bounds[1][2], contract.maxZ);
    assert.equal(record.displaySurface.topologyAudit.openEdges, 0);
    assert.equal(record.displaySurface.topologyAudit.nonManifoldEdges, 0);
    const bytes = await readFile(new URL(`envelope-${profile}.glb`, assetRoot));
    assert.equal(sha256(bytes), record.glbSha256);
    const json = glbJson(bytes);
    assert.equal(json.accessors[0].count, contract.vertices);
    assert.equal(json.accessors[1].count, contract.triangles * 3);
  }
});

test("ten split device assets and file-mode fallbacks are complete and hashed", async () => {
  assert.equal(Object.keys(evidence.parts).length, 10);
  for (const [name, record] of Object.entries(evidence.parts)) {
    const bytes = await readFile(new URL(`parts/${name}`, assetRoot));
    assert.equal(bytes.length, record.bytes);
    assert.equal(sha256(bytes), record.sha256);
    const offline = await stat(new URL(`offline/part-${name}.js`, assetRoot));
    assert.ok(offline.size > record.bytes);
  }
  for (const profile of ["standard", "long"]) {
    assert.ok((await stat(new URL(`offline/envelope-${profile}.js`, assetRoot))).size > 1_000_000);
  }
});

test("homepage 07 and deployment routes point to CRL02 without replacing CRL01", async () => {
  const home = await readFile(new URL("outputs/index.html", root), "utf8");
  const redirects = await readFile(new URL("_redirects", root), "utf8");
  assert.match(home, /<a class="device-entry" data-index="06" href="GL-3DPRT-CRL01">/);
  assert.match(home, /<a class="device-entry" data-index="07" href="GL-3DPRT-CRL02">/);
  assert.match(redirects, /\/GL-3DPRT-CRL02\s+\/outputs\/GL-3DPRT-CRL02\s+302/);
});

test("package builder derives geometry from kinematics assets, never screenshots", async () => {
  const builder = await readFile(new URL("scripts/build-crl02-package.mjs", root), "utf8");
  assert.match(builder, /assets\/reachability/);
  assert.match(builder, /surface-v3-ypos-left-cut-no-collision\.json/);
  assert.doesNotMatch(builder, /clipboard|\.png|screenshot/i);
});
