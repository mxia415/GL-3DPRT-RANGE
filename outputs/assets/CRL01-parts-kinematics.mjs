const sourceToWorldRows = [
  [0.330408063815, -0.332889924374, -999.999890007399, 256.600269184514],
  [-999.971093845115, 7.596093316665, -0.332927212538, 2069.305133659494],
  [7.596203309266, 999.971093857529, -0.330370491321, 1377.604586493214],
  [0, 0, 0, 1],
];

/**
 * Common source-CAD (metres) to CRL01 world (millimetres) transform.
 *
 * The matrix was fitted only from the tracked chassis reference plates. It is
 * deliberately shared by every part: moving parts must never be centred or
 * scaled independently.
 */
export const CAD_SOURCE_TO_WORLD_ROWS = Object.freeze(
  sourceToWorldRows.map((row) => Object.freeze([...row])),
);

export const CAD_GLOBAL_ALIGNMENT = Object.freeze({
  authority: 'crl01_00_fx_chassis.glb reference-plate OBB',
  sourceUnits: 'm',
  worldUnits: 'mm',
  positionMm: Object.freeze([
    256.600269184514,
    2069.305133659494,
    1377.604586493214,
  ]),
  quaternion: Object.freeze([
    0.498263155,
    -0.501895421,
    -0.497931503,
    0.501895440,
  ]),
  scale: 1000,
  chassisCadBoundsMm: Object.freeze({
    minimum: Object.freeze([-800.00009, -500.000549, -4.227051]),
    maximum: Object.freeze([800.00017, 500.000212, 1128.000144]),
  }),
  referencePlateSizeMm: Object.freeze([1600, 1000]),
  nominalVehicleBodySizeMm: Object.freeze([1569, 996, 391]),
  installationPlaneZMm: 391,
});

const cadDatumDefinitions = {
  a1: {
    sourcePointM: [2.061848, -1.002392, -0.292385],
    sourceAxis: [0.007596203309, 0.999971093858, -0.000330370491],
    fittedWorldPointMm: [550, 0, 391],
    fittedWorldAxis: [0, 0, 1],
  },
  a2: {
    sourcePointM: [2.065489, -0.529853, -0.447541],
    sourceAxis: [-0.999971093845, 0.007596093317, -0.000332927213],
    fittedWorldPointMm: [705, 0, 863.6],
    fittedWorldAxis: [0, 1, 0],
  },
  a3: {
    sourcePointM: [2.071946, 0.320088, -0.447812],
    sourceAxis: [-0.999971093845, 0.007596093317, -0.000332927213],
    fittedWorldPointMm: [705, 0, 1713.6],
    fittedWorldAxis: [0, 1, 0],
  },
  a4: {
    sourcePointM: [2.104444, 0.479601, -1.277559],
    sourceAxis: [0.000330408064, -0.000332889924, -0.999999890007],
    fittedWorldPointMm: [1534.7, -31, 1873.6],
    fittedWorldAxis: [1, 0, 0],
  },
  a5: {
    sourcePointM: [2.104444, 0.479601, -1.277559],
    sourceAxis: [-0.999971093845, 0.007596093317, -0.000332927213],
    fittedWorldPointMm: [1534.7, -31, 1873.6],
    fittedWorldAxis: [0, 1, 0],
  },
  a6: {
    sourcePointM: [2.106481, 0.47954, -1.417314],
    sourceAxis: [0.000330408064, -0.000332889924, -0.999999890007],
    fittedWorldPointMm: [1674.5, -33, 1873.6],
    fittedWorldAxis: [1, 0, 0],
  },
};

export const CAD_REFERENCE_DATUMS = Object.freeze(
  Object.fromEntries(Object.entries(cadDatumDefinitions).map(([key, datum]) => [
    key,
    Object.freeze({
      sourcePointM: Object.freeze([...datum.sourcePointM]),
      sourceAxis: Object.freeze([...datum.sourceAxis]),
      fittedWorldPointMm: Object.freeze([...datum.fittedWorldPointMm]),
      fittedWorldAxis: Object.freeze([...datum.fittedWorldAxis]),
    }),
  ])),
);

const slotDefinitions = [
  {
    id: 'chassis',
    sequence: '00',
    axis: 'FX',
    label: '履带、底盘、顶板、电控柜',
    fileName: 'crl01_00_fx_chassis.glb',
    anchor: 'world',
    frame: 'world',
    follows: ['WORLD'],
  },
  {
    id: 'robotBase',
    sequence: '20',
    axis: 'A1',
    label: 'ER25 固定底座与 A1 回转座',
    fileName: 'crl01_20_a1_robot_base.glb',
    anchor: 'a1',
    frame: 'a1',
    follows: ['A1'],
  },
  {
    id: 'a2UpperArm',
    sequence: '40',
    axis: 'A2',
    label: 'A2 大臂',
    fileName: 'crl01_40_a2_upper_arm.glb',
    anchor: 'a2',
    frame: 'a2',
    follows: ['A1', 'A2'],
  },
  {
    id: 'a3Forearm',
    sequence: '50',
    axis: 'A3',
    label: 'A3 小臂',
    fileName: 'crl01_50_a3_forearm.glb',
    anchor: 'a3',
    frame: 'a3',
    follows: ['A1', 'A2', 'A3'],
  },
  {
    id: 'a4WristRoll',
    sequence: '60',
    axis: 'A4',
    label: 'A4 腕部滚转',
    fileName: 'crl01_60_a4_wrist_roll.glb',
    anchor: 'a4',
    frame: 'a4',
    follows: ['A1', 'A2', 'A3', 'A4'],
  },
  {
    id: 'a5WristBend',
    sequence: '70',
    axis: 'A5',
    label: 'A5 腕部俯仰',
    fileName: 'crl01_70_a5_wrist_bend.glb',
    anchor: 'a5',
    frame: 'a5',
    follows: ['A1', 'A2', 'A3', 'A4', 'A5'],
  },
  {
    id: 'a6Flange',
    sequence: '80',
    axis: 'A6',
    label: 'A6 法兰',
    fileName: 'crl01_80_a6_flange.glb',
    anchor: 'a6',
    frame: 'a6',
    follows: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6'],
  },
  {
    id: 'toolTcpAssembly',
    sequence: '90',
    axis: 'TOOL',
    label: '末端执行器与 TCP',
    fileName: 'crl01_90_tool_tcp_assembly.glb',
    anchor: 'a6',
    frame: 'a6',
    follows: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6'],
  },
];

export const PART_SLOTS = Object.freeze(slotDefinitions.map((slot) => (
  Object.freeze({
    ...slot,
    follows: Object.freeze([...slot.follows]),
  })
)));

const slotsById = new Map(PART_SLOTS.map((slot) => [slot.id, slot]));
const slotsByFileName = new Map(
  PART_SLOTS.map((slot) => [slot.fileName.toLowerCase(), slot]),
);

export function findPartSlotById(id) {
  return slotsById.get(String(id ?? '')) ?? null;
}

export function findPartSlotByFileName(fileName) {
  const baseName = String(fileName ?? '')
    .trim()
    .replaceAll('\\', '/')
    .split('/')
    .at(-1)
    .toLowerCase();
  return slotsByFileName.get(baseName) ?? null;
}

export function transformCadPoint(sourcePointM) {
  if (!Array.isArray(sourcePointM) || sourcePointM.length !== 3) {
    throw new TypeError('CAD point must be a three-number array');
  }
  const point = sourcePointM.map(Number);
  if (!point.every(Number.isFinite)) {
    throw new TypeError('CAD point must contain finite numbers');
  }
  return sourceToWorldRows.slice(0, 3).map((row) => (
    row[0] * point[0]
    + row[1] * point[1]
    + row[2] * point[2]
    + row[3]
  ));
}

export function transformCadDirection(sourceDirection) {
  if (!Array.isArray(sourceDirection) || sourceDirection.length !== 3) {
    throw new TypeError('CAD direction must be a three-number array');
  }
  const direction = sourceDirection.map(Number);
  if (!direction.every(Number.isFinite)) {
    throw new TypeError('CAD direction must contain finite numbers');
  }
  const transformed = sourceToWorldRows.slice(0, 3).map((row) => (
    row[0] * direction[0]
    + row[1] * direction[1]
    + row[2] * direction[2]
  ));
  const magnitude = Math.hypot(...transformed);
  return transformed.map((value) => value / magnitude);
}

export function normalizePartManifest(source = {}) {
  const errors = [];
  const referencePose = source?.referencePose;
  const parts = Array.isArray(source?.parts) ? source.parts : [];
  const entries = [];
  const seen = new Set();

  for (const item of parts) {
    const slot = findPartSlotById(item?.slot);
    if (!slot) {
      errors.push(`未知槽位：${String(item?.slot ?? '')}`);
      continue;
    }
    if (seen.has(slot.id)) {
      errors.push(`重复槽位：${slot.id}`);
      continue;
    }
    if (findPartSlotByFileName(item?.file)?.id !== slot.id) {
      errors.push(`槽位 ${slot.id} 文件名不匹配`);
      continue;
    }
    seen.add(slot.id);
    entries.push({
      slot,
      fileName: slot.fileName,
      visible: item.visible !== false,
      sha256: String(item.sha256 ?? ''),
    });
  }

  if (entries.length !== PART_SLOTS.length) {
    errors.push(`分件数量应为 ${PART_SLOTS.length}，实际为 ${entries.length}`);
  }

  const poseKeys = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'];
  const normalizedReferencePose = {};
  for (const key of poseKeys) {
    const value = Number(referencePose?.[key]);
    if (!Number.isFinite(value)) errors.push(`参考姿态缺少 ${key}`);
    normalizedReferencePose[key] = value;
  }

  return {
    version: Number(source?.version ?? 0),
    referencePose: normalizedReferencePose,
    entries,
    errors,
  };
}
