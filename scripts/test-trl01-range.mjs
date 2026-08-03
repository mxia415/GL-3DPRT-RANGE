import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const html = readFileSync(new URL('outputs/GL-3DPRT-TRL01.html', root), 'utf8');
const home = readFileSync(new URL('outputs/index.html', root), 'utf8');
const assetUrl = new URL(
  'outputs/assets/trl01/envelope-v1-ypos-fullx-50mm-conservative.json',
  root,
);
const assetBytes = readFileSync(assetUrl);
const asset = JSON.parse(assetBytes);
const manifest = JSON.parse(readFileSync(
  new URL('outputs/assets/trl01/parts/parts.manifest.json', root),
  'utf8',
));

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

assert.match(html, /TRL01运动范围判定 V1\.0/);
assert.match(html, /e1: 2900, a1: 0, a2: -98\.6, a3: 59\.2, a4: 0, a5: 129\.4, a6: 0/);
assert.match(html, /trlToolDirection = Object\.freeze\(\{ x: 0, y: [^,]+, z: -1 \}\)/);
assert.match(html, /assets\/trl01\/envelope-v1-ypos-fullx-50mm-conservative\.json/);
assert.match(html, /assets\/vendor\/three\/build\/three\.module\.js/);
assert.doesNotMatch(html, /cdn\.jsdelivr\.net|unpkg\.com/);
assert.match(home, /data-index="04" href="GL-3DPRT-TRL01"/);

assert.equal(asset.schema, 'trl01-tcp-envelope/v1');
assert.equal(asset.algorithmVersion, 'trl01-ik-evidence-20260803-v1');
assert.equal(asset.sampling.resolutionMm, 50);
assert.equal(asset.statistics.vertexCount, 79571);
assert.equal(asset.statistics.triangleCount, 158740);
assert.equal(asset.boundaryMesh.vertices.length, 79571);
assert.equal(asset.boundaryMesh.triangles.length, 158740);
assert.equal(asset.smoothing.conservativeOnly, true);
assert.equal(asset.smoothing.unsupportedReachableSamples, 0);
assert.equal(asset.hardExclusionAudit.verticesBelowGround, 0);
assert.equal(asset.hardExclusionAudit.verticesInsideDevice, 0);
assert.equal(
  sha256(assetBytes),
  'a26f553c80b513391035b1d8670f90ce28c28b670804babae1e167be5b880765',
);

assert.equal(manifest.calibration.locked, true);
assert.equal(manifest.parts.length, 9);
for (const part of manifest.parts) {
  const bytes = readFileSync(new URL(
    `outputs/assets/trl01/parts/${part.file}`,
    root,
  ));
  assert.equal(sha256(bytes), part.sha256, `${part.file} hash mismatch`);
  assert.ok(html.includes(part.file), `${part.file} missing from page`);
}

console.log('TRL01 RANGE contracts: PASS');
