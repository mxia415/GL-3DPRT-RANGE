import * as THREE from 'three';

const TETRAHEDRA = Object.freeze([
  [0, 5, 1, 6], [0, 1, 2, 6], [0, 2, 3, 6],
  [0, 3, 7, 6], [0, 7, 4, 6], [0, 4, 5, 6],
]);
const CUBE_CORNERS = Object.freeze([
  [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
  [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1],
]);
const TETRA_EDGES = Object.freeze([
  [0, 1], [1, 2], [2, 0], [0, 3], [1, 3], [2, 3],
]);
const TRIANGLE_TABLE = Object.freeze([
  [],
  [0, 3, 2],
  [0, 1, 4],
  [1, 4, 2, 2, 4, 3],
  [1, 2, 5],
  [0, 3, 5, 0, 5, 1],
  [0, 2, 5, 0, 5, 4],
  [5, 4, 3],
  [3, 4, 5],
  [4, 5, 0, 5, 2, 0],
  [1, 5, 0, 5, 3, 0],
  [5, 2, 1],
  [3, 4, 2, 2, 4, 1],
  [4, 1, 0],
  [2, 3, 0],
  [],
]);

function inclusiveBounds(rows, spacing, paddingCells = 2) {
  const rawMinimum = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
  const rawMaximum = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
  for (const row of rows) {
    for (let axis = 0; axis < 3; axis += 1) {
      rawMinimum[axis] = Math.min(rawMinimum[axis], row[axis]);
      rawMaximum[axis] = Math.max(rawMaximum[axis], row[axis]);
    }
  }
  const minimum = rawMinimum.map((value) => (
    Math.floor(value / spacing) * spacing - spacing * paddingCells
  ));
  const maximum = rawMaximum.map((value) => (
    Math.ceil(value / spacing) * spacing + spacing * paddingCells
  ));
  minimum[2] = -spacing;
  return { minimum, maximum };
}

function blurAxis(source, dimensions, indexOf, axis) {
  const [nx, ny, nz] = dimensions;
  const target = new Float32Array(source.length);
  for (let z = 0; z < nz; z += 1) {
    for (let y = 0; y < ny; y += 1) {
      for (let x = 0; x < nx; x += 1) {
        const coordinates = [x, y, z];
        const before = [...coordinates];
        const after = [...coordinates];
        before[axis] = Math.max(0, before[axis] - 1);
        after[axis] = Math.min(dimensions[axis] - 1, after[axis] + 1);
        target[indexOf(x, y, z)] = (
          source[indexOf(...before)]
          + 2 * source[indexOf(x, y, z)]
          + source[indexOf(...after)]
        ) / 4;
      }
    }
  }
  return target;
}

function maxFilterAxis(source, dimensions, indexOf, axis, radius) {
  const [nx, ny, nz] = dimensions;
  const target = new Float32Array(source.length);
  for (let z = 0; z < nz; z += 1) {
    for (let y = 0; y < ny; y += 1) {
      for (let x = 0; x < nx; x += 1) {
        let value = 0;
        for (let offset = -radius; offset <= radius; offset += 1) {
          const coordinates = [x, y, z];
          coordinates[axis] = Math.max(
            0,
            Math.min(dimensions[axis] - 1, coordinates[axis] + offset),
          );
          value = Math.max(value, source[indexOf(...coordinates)]);
        }
        target[indexOf(x, y, z)] = value;
      }
    }
  }
  return target;
}

function minFilterAxis(source, dimensions, indexOf, axis, radius) {
  const [nx, ny, nz] = dimensions;
  const target = new Float32Array(source.length);
  for (let z = 0; z < nz; z += 1) {
    for (let y = 0; y < ny; y += 1) {
      for (let x = 0; x < nx; x += 1) {
        let value = 1;
        for (let offset = -radius; offset <= radius; offset += 1) {
          const coordinates = [x, y, z];
          coordinates[axis] = Math.max(
            0,
            Math.min(dimensions[axis] - 1, coordinates[axis] + offset),
          );
          value = Math.min(value, source[indexOf(...coordinates)]);
        }
        target[indexOf(x, y, z)] = value;
      }
    }
  }
  return target;
}

function relaxPositionsInward(positions, normals, iterations, strength) {
  if (iterations <= 0 || strength <= 0) return;
  const vertexCount = positions.length / 3;
  const sourceToUnique = new Uint32Array(vertexCount);
  const uniquePositions = [];
  const uniqueNormals = [];
  const keyToUnique = new Map();
  for (let vertex = 0; vertex < vertexCount; vertex += 1) {
    const offset = vertex * 3;
    const key = [
      Math.round(positions[offset] * 1000),
      Math.round(positions[offset + 1] * 1000),
      Math.round(positions[offset + 2] * 1000),
    ].join(',');
    let unique = keyToUnique.get(key);
    if (unique === undefined) {
      unique = uniquePositions.length / 3;
      keyToUnique.set(key, unique);
      uniquePositions.push(
        positions[offset],
        positions[offset + 1],
        positions[offset + 2],
      );
      uniqueNormals.push(0, 0, 0);
    }
    sourceToUnique[vertex] = unique;
    uniqueNormals[unique * 3] += normals[offset];
    uniqueNormals[unique * 3 + 1] += normals[offset + 1];
    uniqueNormals[unique * 3 + 2] += normals[offset + 2];
  }
  const uniqueCount = uniquePositions.length / 3;
  const neighbors = Array.from({ length: uniqueCount }, () => new Set());
  for (let vertex = 0; vertex < vertexCount; vertex += 3) {
    const triangle = [
      sourceToUnique[vertex],
      sourceToUnique[vertex + 1],
      sourceToUnique[vertex + 2],
    ];
    for (let corner = 0; corner < 3; corner += 1) {
      const left = triangle[corner];
      const right = triangle[(corner + 1) % 3];
      if (left === right) continue;
      neighbors[left].add(right);
      neighbors[right].add(left);
    }
  }
  for (let unique = 0; unique < uniqueCount; unique += 1) {
    const offset = unique * 3;
    const magnitude = Math.hypot(
      uniqueNormals[offset],
      uniqueNormals[offset + 1],
      uniqueNormals[offset + 2],
    ) || 1;
    uniqueNormals[offset] /= magnitude;
    uniqueNormals[offset + 1] /= magnitude;
    uniqueNormals[offset + 2] /= magnitude;
  }
  let current = Float64Array.from(uniquePositions);
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const next = current.slice();
    for (let unique = 0; unique < uniqueCount; unique += 1) {
      if (!neighbors[unique].size) continue;
      const offset = unique * 3;
      const average = [0, 0, 0];
      for (const neighbor of neighbors[unique]) {
        average[0] += current[neighbor * 3];
        average[1] += current[neighbor * 3 + 1];
        average[2] += current[neighbor * 3 + 2];
      }
      average[0] /= neighbors[unique].size;
      average[1] /= neighbors[unique].size;
      average[2] /= neighbors[unique].size;
      const delta = average.map((value, axis) => (
        (value - current[offset + axis]) * strength
      ));
      const outward = (
        delta[0] * uniqueNormals[offset]
        + delta[1] * uniqueNormals[offset + 1]
        + delta[2] * uniqueNormals[offset + 2]
      );
      if (outward > 0) {
        delta[0] -= uniqueNormals[offset] * outward;
        delta[1] -= uniqueNormals[offset + 1] * outward;
        delta[2] -= uniqueNormals[offset + 2] * outward;
      }
      next[offset] += delta[0];
      next[offset + 1] += delta[1];
      next[offset + 2] += delta[2];
    }
    current = next;
  }
  for (let vertex = 0; vertex < vertexCount; vertex += 1) {
    const sourceOffset = vertex * 3;
    const uniqueOffset = sourceToUnique[vertex] * 3;
    positions[sourceOffset] = current[uniqueOffset];
    positions[sourceOffset + 1] = current[uniqueOffset + 1];
    positions[sourceOffset + 2] = current[uniqueOffset + 2];
  }
}

/**
 * Build a smooth display-only envelope from discrete FK evidence.
 *
 * Evidence is rasterized on a regular grid, morphologically closed to remove
 * sampling tunnels, expanded by a smaller bounded dilation, smoothed with a
 * separable Gaussian kernel, then triangulated with marching tetrahedra.
 * Normals come from the scalar-field gradient, so the surface is visually
 * continuous rather than an axis-aligned staircase.
 */
export function createSmoothImplicitSurfaceGeometry(rows, options = {}) {
  const spacing = Number(options.spacingMm ?? 100);
  const isoLevel = Number(options.isoLevel ?? 0.16);
  const blurPasses = Number(options.blurPasses ?? 2);
  const closingRadius = Number(options.closingRadius ?? 0);
  const dilationRadius = Number(options.dilationRadius ?? 1);
  const relaxIterations = Number(options.relaxIterations ?? 0);
  const relaxStrength = Number(options.relaxStrength ?? 0.32);
  const insetMm = Number(options.insetMm ?? 0);
  if (!Array.isArray(rows) || !rows.length) {
    throw new TypeError('Smooth envelope requires non-empty point rows');
  }
  const paddingCells = Math.max(2, closingRadius + dilationRadius + 2);
  const { minimum, maximum } = inclusiveBounds(rows, spacing, paddingCells);
  const dimensions = minimum.map((value, axis) => (
    Math.round((maximum[axis] - value) / spacing) + 1
  ));
  const [nx, ny, nz] = dimensions;
  const nodeCount = nx * ny * nz;
  const indexOf = (x, y, z) => x + nx * (y + ny * z);
  let field = new Float32Array(nodeCount);
  const evidenceCells = new Set();

  for (const row of rows) {
    const coordinates = row.slice(0, 3).map((value, axis) => (
      Math.max(0, Math.min(
        dimensions[axis] - 1,
        Math.round((value - minimum[axis]) / spacing),
      ))
    ));
    evidenceCells.add(coordinates.join(','));
    field[indexOf(...coordinates)] = 1;
  }

  if (closingRadius > 0) {
    field = maxFilterAxis(field, dimensions, indexOf, 0, closingRadius);
    field = maxFilterAxis(field, dimensions, indexOf, 1, closingRadius);
    field = maxFilterAxis(field, dimensions, indexOf, 2, closingRadius);
    field = minFilterAxis(field, dimensions, indexOf, 0, closingRadius);
    field = minFilterAxis(field, dimensions, indexOf, 1, closingRadius);
    field = minFilterAxis(field, dimensions, indexOf, 2, closingRadius);
  }
  if (dilationRadius > 0) {
    field = maxFilterAxis(field, dimensions, indexOf, 0, dilationRadius);
    field = maxFilterAxis(field, dimensions, indexOf, 1, dilationRadius);
    field = maxFilterAxis(field, dimensions, indexOf, 2, dilationRadius);
  }
  for (let pass = 0; pass < blurPasses; pass += 1) {
    field = blurAxis(field, dimensions, indexOf, 0);
    field = blurAxis(field, dimensions, indexOf, 1);
    field = blurAxis(field, dimensions, indexOf, 2);
  }

  const gradients = new Float32Array(nodeCount * 3);
  const sample = (x, y, z) => field[indexOf(
    Math.max(0, Math.min(nx - 1, x)),
    Math.max(0, Math.min(ny - 1, y)),
    Math.max(0, Math.min(nz - 1, z)),
  )];
  for (let z = 0; z < nz; z += 1) {
    for (let y = 0; y < ny; y += 1) {
      for (let x = 0; x < nx; x += 1) {
        const node = indexOf(x, y, z);
        gradients[node * 3] = -(sample(x + 1, y, z) - sample(x - 1, y, z));
        gradients[node * 3 + 1] = -(sample(x, y + 1, z) - sample(x, y - 1, z));
        gradients[node * 3 + 2] = -(sample(x, y, z + 1) - sample(x, y, z - 1));
      }
    }
  }

  const positions = [];
  const normals = [];
  for (let z = 0; z < nz - 1; z += 1) {
    for (let y = 0; y < ny - 1; y += 1) {
      for (let x = 0; x < nx - 1; x += 1) {
        const corners = CUBE_CORNERS.map(([dx, dy, dz]) => {
          const node = indexOf(x + dx, y + dy, z + dz);
          return {
            value: field[node],
            position: [
              minimum[0] + (x + dx) * spacing,
              minimum[1] + (y + dy) * spacing,
              minimum[2] + (z + dz) * spacing,
            ],
            gradient: [
              gradients[node * 3],
              gradients[node * 3 + 1],
              gradients[node * 3 + 2],
            ],
          };
        });
        for (const tetrahedron of TETRAHEDRA) {
          const vertices = tetrahedron.map((corner) => corners[corner]);
          let caseIndex = 0;
          vertices.forEach((vertex, index) => {
            if (vertex.value >= isoLevel) caseIndex |= 1 << index;
          });
          const table = TRIANGLE_TABLE[caseIndex];
          if (!table.length) continue;
          const intersections = TETRA_EDGES.map(([leftIndex, rightIndex]) => {
            const left = vertices[leftIndex];
            const right = vertices[rightIndex];
            const denominator = right.value - left.value;
            const t = Math.abs(denominator) < 1e-9
              ? 0.5
              : Math.max(0, Math.min(
                1,
                (isoLevel - left.value) / denominator,
              ));
            const position = left.position.map((
              value,
              axis,
            ) => value + (right.position[axis] - value) * t);
            const normal = left.gradient.map((
              value,
              axis,
            ) => value + (right.gradient[axis] - value) * t);
            const magnitude = Math.hypot(...normal) || 1;
            return {
              position,
              normal: normal.map((value) => value / magnitude),
            };
          });
          for (const edgeIndex of table) {
            positions.push(...intersections[edgeIndex].position);
            normals.push(...intersections[edgeIndex].normal);
          }
        }
      }
    }
  }

  relaxPositionsInward(positions, normals, relaxIterations, relaxStrength);
  const geometry = new THREE.BufferGeometry();
  if (insetMm > 0) {
    for (let index = 0; index < positions.length; index += 3) {
      positions[index] -= normals[index] * insetMm;
      positions[index + 1] -= normals[index + 1] * insetMm;
      positions[index + 2] -= normals[index + 2] * insetMm;
    }
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.computeBoundingBox();
  const sampleValue = (x, y, z) => {
    const coordinates = [x, y, z].map((value, axis) => (
      (value - minimum[axis]) / spacing
    ));
    if (coordinates.some((value, axis) => (
      value < 0 || value > dimensions[axis] - 1
    ))) return 0;
    const lower = coordinates.map((value, axis) => (
      Math.max(0, Math.min(dimensions[axis] - 1, Math.floor(value)))
    ));
    const upper = lower.map((value, axis) => (
      Math.min(dimensions[axis] - 1, value + 1)
    ));
    const fraction = coordinates.map((value, axis) => (
      upper[axis] === lower[axis] ? 0 : value - lower[axis]
    ));
    let value = 0;
    for (let dz = 0; dz <= 1; dz += 1) {
      for (let dy = 0; dy <= 1; dy += 1) {
        for (let dx = 0; dx <= 1; dx += 1) {
          const weight = (
            (dx ? fraction[0] : 1 - fraction[0])
            * (dy ? fraction[1] : 1 - fraction[1])
            * (dz ? fraction[2] : 1 - fraction[2])
          );
          value += field[indexOf(
            dx ? upper[0] : lower[0],
            dy ? upper[1] : lower[1],
            dz ? upper[2] : lower[2],
          )] * weight;
        }
      }
    }
    return value;
  };
  return {
    geometry,
    sampleValue,
    minimum: [...minimum],
    maximum: [...maximum],
    dimensions: [...dimensions],
    evidenceGridCellCount: evidenceCells.size,
    triangleCount: positions.length / 9,
    spacingMm: spacing,
    isoLevel,
    blurPasses,
    closingRadius,
    dilationRadius,
    relaxIterations,
    relaxStrength,
    insetMm,
  };
}
