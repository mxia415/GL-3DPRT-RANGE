const EPSILON = 1e-10;
const DEG_TO_RAD = Math.PI / 180;

const CHASSIS_LENGTH = 1569;
const CHASSIS_WIDTH = 996;
const CHASSIS_HEIGHT = 391;
const ROBOT_MOUNT = Object.freeze({
  x: 550,
  y: 0,
  z: CHASSIS_HEIGHT,
});

const RATED_REACH = 1850;
const NOMINAL_SHOULDER_HEIGHT_PDF = 483.6;
const CAD_SHOULDER_HEIGHT = 472.6;
const SHOULDER_FORWARD_OFFSET = 155;
const UPPER_ARM_LENGTH = 850;
const A3_AXIS_PLANE_OFFSET = -31;
const WRIST_AXIAL_LENGTH = 829.5;
const P_SECTION_LENGTH = 141;

const TOOL_AXIS_OFFSET = Object.freeze({
  x: 0,
  y: -1.221,
  z: 238.997,
});
const TOOL_AXIAL_LENGTH = 694;
const TOOL_OFFSET_LENGTH = Math.hypot(
  TOOL_AXIS_OFFSET.x,
  TOOL_AXIS_OFFSET.y,
  TOOL_AXIS_OFFSET.z,
);
const TOOL_DIRECT_LENGTH = Math.hypot(
  TOOL_AXIS_OFFSET.x + TOOL_AXIAL_LENGTH,
  TOOL_AXIS_OFFSET.y,
  TOOL_AXIS_OFFSET.z,
);

/**
 * CRL01 + ER25-1800 ball-stick dimensions.
 *
 * World coordinates are millimetres:
 *   +X = vehicle longitudinal forward
 *   +Y = vehicle left
 *   +Z = upward
 *
 * The world origin is the ground projection of the chassis centre.
 */
export const MACHINE = Object.freeze({
  units: 'mm',
  angleUnits: 'deg',
  worldGroundZ: 0,
  chassisLength: CHASSIS_LENGTH,
  chassisWidth: CHASSIS_WIDTH,
  chassisHeight: CHASSIS_HEIGHT,
  robotMount: ROBOT_MOUNT,
  robotMountX: ROBOT_MOUNT.x,
  robotMountY: ROBOT_MOUNT.y,
  robotMountZ: ROBOT_MOUNT.z,
  shoulderHeight: CAD_SHOULDER_HEIGHT,
  nominalShoulderHeightPdf: NOMINAL_SHOULDER_HEIGHT_PDF,
  shoulderForwardOffset: SHOULDER_FORWARD_OFFSET,
  upperArmLength: UPPER_ARM_LENGTH,
  a2ToA3Length: UPPER_ARM_LENGTH,
  a3LocalYOffset: A3_AXIS_PLANE_OFFSET,
  a3LocalZOffset: 160,
  wristAxialLength: WRIST_AXIAL_LENGTH,
  a3ToA4AxialLength: WRIST_AXIAL_LENGTH,
  pSectionLength: P_SECTION_LENGTH,
  a4ToA5Length: 0,
  a5ToA6Length: P_SECTION_LENGTH,
  ratedReach: RATED_REACH,
  toolAxisOffset: TOOL_AXIS_OFFSET,
  toolOffsetLength: TOOL_OFFSET_LENGTH,
  toolAxialLength: TOOL_AXIAL_LENGTH,
  toolDirectLength: TOOL_DIRECT_LENGTH,
});

export const LIMITS = Object.freeze({
  a1: Object.freeze([-170, 170]),
  a2: Object.freeze([-160, 77]),
  a3: Object.freeze([-85, 165]),
  a4: Object.freeze([-190, 190]),
  a5: Object.freeze([-130, 130]),
  a6: Object.freeze([-360, 360]),
});

export const AXIS_SPEEDS = Object.freeze({
  a1: 220,
  a2: 180,
  a3: 200,
  a4: 360,
  a5: 360,
  a6: 410,
});

/**
 * CAD files were exported in this assembly pose. Keep it independent from the
 * runtime/default pose so changing the first-load experience cannot invalidate
 * the shared GLB reference frames.
 */
export const CAD_REFERENCE_PARAMS = Object.freeze({
  a1: 0,
  a2: -90,
  a3: 90,
  a4: 0,
  a5: 0,
  a6: 0,
});

/**
 * User-supplied posture before enforcing the printing constraint.
 */
export const PRINT_REFERENCE_PARAMS = Object.freeze({
  a1: 0,
  a2: -81.1,
  a3: 151.1,
  a4: 0,
  a5: 19.1,
  a6: 0,
});

/**
 * Initial printing posture.
 *
 * The tool axis is frameA6.x. With A4=0 its downward-pitch contract is
 * A2 + A3 + A5 = 90°. A2/A3/A5 are jointly adjusted so the supplied TCP
 * position is preserved while the 0.9° orientation error is removed.
 */
export const PRINT_POSE_PARAMS = Object.freeze({
  a1: 0,
  a2: -80.73678336628728,
  a3: 150.12090132909867,
  a4: 0,
  a5: 20.615882037188612,
  a6: 0,
});

export const DEFAULT_PARAMS = CAD_REFERENCE_PARAMS;

export const POSE_PRESETS = Object.freeze({
  display: Object.freeze({
    label: '垂直姿态',
    description: '上臂竖直，前臂沿车体 +X 方向',
    values: CAD_REFERENCE_PARAMS,
  }),
  print: Object.freeze({
    label: '打印姿态',
    description: 'A6=0，保持截图 TCP，微调 A2/A3/A5 后打印轴竖直向下',
    values: PRINT_POSE_PARAMS,
  }),
});

const AXIS_KEYS = Object.freeze(Object.keys(DEFAULT_PARAMS));

export function vector(x = 0, y = 0, z = 0) {
  return {
    x: Number(x),
    y: Number(y),
    z: Number(z),
  };
}

export function add(a, b) {
  return vector(a.x + b.x, a.y + b.y, a.z + b.z);
}

export function subtract(a, b) {
  return vector(a.x - b.x, a.y - b.y, a.z - b.z);
}

export function scale(value, scalar) {
  return vector(
    value.x * scalar,
    value.y * scalar,
    value.z * scalar,
  );
}

export function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function cross(a, b) {
  return vector(
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x,
  );
}

export function length(value) {
  return Math.hypot(value.x, value.y, value.z);
}

export function distance(a, b) {
  return length(subtract(a, b));
}

export function normalize(value) {
  const magnitude = length(value);
  if (magnitude < EPSILON) return vector();
  return scale(value, 1 / magnitude);
}

/**
 * Rotate a vector around an arbitrary world-space axis with Rodrigues' formula.
 */
export function rotateAroundAxis(value, axisSource, degrees) {
  const axis = normalize(axisSource);
  const angle = Number(degrees) * DEG_TO_RAD;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return add(
    add(
      scale(value, cosine),
      scale(cross(axis, value), sine),
    ),
    scale(axis, dot(axis, value) * (1 - cosine)),
  );
}

/**
 * Rotate an orthonormal frame around one of its current local axes.
 */
export function rotateFrame(frame, axisName, degrees) {
  const axis = frame[axisName];
  if (!axis) {
    throw new RangeError(`Unknown frame axis: ${axisName}`);
  }
  return {
    x: normalize(rotateAroundAxis(frame.x, axis, degrees)),
    y: normalize(rotateAroundAxis(frame.y, axis, degrees)),
    z: normalize(rotateAroundAxis(frame.z, axis, degrees)),
  };
}

/**
 * Transform a local vector into world coordinates using a frame basis.
 */
export function localVector(frame, value) {
  return add(
    add(
      scale(frame.x, value.x),
      scale(frame.y, value.y),
    ),
    scale(frame.z, value.z),
  );
}

export function clamp(value, minimum, maximum) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return Number.NaN;
  return Math.min(maximum, Math.max(minimum, numeric));
}

export function normalizeParams(source = {}) {
  const input = source && typeof source === 'object' ? source : {};
  const params = {};

  for (const key of AXIS_KEYS) {
    const supplied = Number(input[key] ?? DEFAULT_PARAMS[key]);
    const value = Number.isFinite(supplied)
      ? supplied
      : DEFAULT_PARAMS[key];
    params[key] = clamp(value, ...LIMITS[key]);
  }

  return params;
}

function paramsWithoutLimitClamping(source = {}) {
  const input = source && typeof source === 'object' ? source : {};
  const params = {};

  for (const key of AXIS_KEYS) {
    const supplied = Number(input[key] ?? DEFAULT_PARAMS[key]);
    params[key] = Number.isFinite(supplied)
      ? supplied
      : DEFAULT_PARAMS[key];
  }

  return params;
}

function along(point, direction, amount) {
  return add(point, scale(direction, amount));
}

function segment(name, start, end, dimension, group) {
  const actualLength = distance(start, end);
  return Object.freeze({
    name,
    start,
    end,
    dimension,
    fixedLength: dimension,
    actualLength,
    lengthError: Math.abs(actualLength - dimension),
    group,
  });
}

const WORLD_FRAME = Object.freeze({
  x: Object.freeze(vector(1, 0, 0)),
  y: Object.freeze(vector(0, 1, 0)),
  z: Object.freeze(vector(0, 0, 1)),
});

/**
 * Compute the six-axis ER25-1800 forward kinematics.
 *
 * Joint sequence:
 *   A1 local Z, A2 local Y, A3 local Y,
 *   A4 local X, A5 local Y, A6 local X.
 *
 * A2/A3 controller zero is represented directly. Therefore the default
 * A2=-90°, A3=+90° produces a vertical upper arm followed by a +X forearm.
 */
export function computePose(source = DEFAULT_PARAMS, options = {}) {
  const params = options.clampLimits === false
    ? paramsWithoutLimitClamping(source)
    : normalizeParams(source);

  const frameA1 = rotateFrame(WORLD_FRAME, 'z', params.a1);
  const frameA2 = rotateFrame(frameA1, 'y', params.a2);
  const frameA3 = rotateFrame(frameA2, 'y', params.a3);
  const frameA4 = rotateFrame(frameA3, 'x', params.a4);
  const frameA5 = rotateFrame(frameA4, 'y', params.a5);
  const frameA6 = rotateFrame(frameA5, 'x', params.a6);

  const mount = vector(
    MACHINE.robotMount.x,
    MACHINE.robotMount.y,
    MACHINE.robotMount.z,
  );
  const a1 = mount;
  const shoulderHeightPoint = along(
    mount,
    frameA1.z,
    MACHINE.shoulderHeight,
  );
  const a2 = along(
    shoulderHeightPoint,
    frameA1.x,
    MACHINE.shoulderForwardOffset,
  );
  const a3 = along(a2, frameA2.x, MACHINE.upperArmLength);
  const a3AxisPlanePoint = along(
    a3,
    frameA3.y,
    MACHINE.a3LocalYOffset,
  );
  const a3OffsetPoint = along(
    a3AxisPlanePoint,
    frameA3.z,
    MACHINE.a3LocalZOffset,
  );
  const a4 = along(
    a3OffsetPoint,
    frameA3.x,
    MACHINE.wristAxialLength,
  );
  const a5 = along(a4, frameA4.x, MACHINE.a4ToA5Length);
  const a6 = along(a5, frameA5.x, MACHINE.a5ToA6Length);
  const toolAxisPoint = add(
    a6,
    localVector(frameA6, MACHINE.toolAxisOffset),
  );
  const tip = along(
    toolAxisPoint,
    frameA6.x,
    MACHINE.toolAxialLength,
  );

  const points = {
    mount,
    a1,
    shoulderHeightPoint,
    a2,
    a3,
    a3AxisPlanePoint,
    a3OffsetPoint,
    // Alias retained for renderer/debug labels that describe this datum by use.
    a3WristAxisPoint: a3OffsetPoint,
    a4,
    a5,
    a6,
    toolAxisPoint,
    tip,
  };

  const frames = {
    a1: frameA1,
    a2: frameA2,
    a3: frameA3,
    a4: frameA4,
    a5: frameA5,
    a6: frameA6,
  };

  const axes = [
    Object.freeze({
      key: 'a1',
      name: 'A1',
      point: a1,
      direction: frameA1.z,
    }),
    Object.freeze({
      key: 'a2',
      name: 'A2',
      point: a2,
      direction: frameA1.y,
    }),
    Object.freeze({
      key: 'a3',
      name: 'A3',
      point: a3,
      direction: frameA2.y,
    }),
    Object.freeze({
      key: 'a4',
      name: 'A4',
      point: a4,
      direction: frameA3.x,
    }),
    Object.freeze({
      key: 'a5',
      name: 'A5',
      point: a5,
      direction: frameA4.y,
    }),
    Object.freeze({
      key: 'a6',
      name: 'A6',
      point: a6,
      direction: frameA5.x,
    }),
  ];

  const segments = [
    segment(
      'Mount-A2 vertical',
      mount,
      shoulderHeightPoint,
      MACHINE.shoulderHeight,
      'base',
    ),
    segment(
      'A2 forward offset',
      shoulderHeightPoint,
      a2,
      MACHINE.shoulderForwardOffset,
      'base',
    ),
    segment(
      'A2-A3 upper arm',
      a2,
      a3,
      MACHINE.upperArmLength,
      'arm',
    ),
    segment(
      'A3 axis-plane datum',
      a3,
      a3AxisPlanePoint,
      Math.abs(MACHINE.a3LocalYOffset),
      'datum',
    ),
    segment(
      'A3 local +Z offset',
      a3AxisPlanePoint,
      a3OffsetPoint,
      MACHINE.a3LocalZOffset,
      'arm',
    ),
    segment(
      'A3-A4 wrist axial',
      a3OffsetPoint,
      a4,
      MACHINE.wristAxialLength,
      'arm',
    ),
    segment(
      'A4-A5 P section',
      a4,
      a5,
      MACHINE.a4ToA5Length,
      'wrist',
    ),
    segment(
      'A5-A6 P section',
      a5,
      a6,
      MACHINE.a5ToA6Length,
      'wrist',
    ),
    segment(
      'A6-tool axis offset',
      a6,
      toolAxisPoint,
      MACHINE.toolOffsetLength,
      'tool',
    ),
    segment(
      'Tool axial',
      toolAxisPoint,
      tip,
      MACHINE.toolAxialLength,
      'tool',
    ),
  ];

  const chassis = Object.freeze({
    center: vector(0, 0, MACHINE.chassisHeight / 2),
    size: Object.freeze([
      MACHINE.chassisLength,
      MACHINE.chassisWidth,
      MACHINE.chassisHeight,
    ]),
    minimum: vector(
      -MACHINE.chassisLength / 2,
      -MACHINE.chassisWidth / 2,
      0,
    ),
    maximum: vector(
      MACHINE.chassisLength / 2,
      MACHINE.chassisWidth / 2,
      MACHINE.chassisHeight,
    ),
  });

  return {
    params,
    chassis,
    points,
    frames,
    axes,
    segments,
    toolDirectLength: distance(a6, tip),
    radialReach: Math.hypot(
      tip.x - a1.x,
      tip.y - a1.y,
    ),
    tcpHeight: tip.z,
  };
}

export function axisUsage(axisName, value) {
  const limit = LIMITS[axisName];
  if (!limit) {
    throw new RangeError(`Unknown machine axis: ${axisName}`);
  }
  const [minimum, maximum] = limit;
  const span = maximum - minimum;
  if (span < EPSILON) return 0;
  const clamped = clamp(value, minimum, maximum);
  if (!Number.isFinite(clamped)) return 0;
  return (clamped - minimum) / span;
}

export function validatePose(pose = computePose()) {
  const checks = pose.segments.map((entry) => ({
    name: entry.name,
    expected: entry.dimension,
    actual: entry.actualLength,
    error: Math.abs(entry.actualLength - entry.dimension),
  }));
  const maximumSegmentError = checks.length
    ? Math.max(...checks.map((entry) => entry.error))
    : 0;
  const axesAreUnitLength = pose.axes.every((axis) => (
    Math.abs(length(axis.direction) - 1) < 1e-9
  ));
  const framesAreOrthonormal = Object.values(pose.frames).every((frame) => (
    Math.abs(length(frame.x) - 1) < 1e-9
    && Math.abs(length(frame.y) - 1) < 1e-9
    && Math.abs(length(frame.z) - 1) < 1e-9
    && Math.abs(dot(frame.x, frame.y)) < 1e-9
    && Math.abs(dot(frame.y, frame.z)) < 1e-9
    && Math.abs(dot(frame.z, frame.x)) < 1e-9
    && distance(cross(frame.x, frame.y), frame.z) < 1e-9
  ));
  const paramsAreWithinLimits = Object.entries(LIMITS).every((
    [key, [minimum, maximum]],
  ) => (
    Number.isFinite(pose.params[key])
    && pose.params[key] >= minimum
    && pose.params[key] <= maximum
  ));
  const pointsAreFinite = Object.values(pose.points).every((point) => (
    Number.isFinite(point.x)
    && Number.isFinite(point.y)
    && Number.isFinite(point.z)
  ));

  return {
    checks,
    maximumSegmentError,
    axesAreUnitLength,
    framesAreOrthonormal,
    paramsAreWithinLimits,
    pointsAreFinite,
    valid: (
      maximumSegmentError < 1e-9
      && axesAreUnitLength
      && framesAreOrthonormal
      && paramsAreWithinLimits
      && pointsAreFinite
    ),
  };
}
