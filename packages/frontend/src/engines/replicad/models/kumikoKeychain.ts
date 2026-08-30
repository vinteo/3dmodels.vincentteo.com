import { draw, drawCircle, drawPolysides, Drawing, AnyShape, makeCompound } from 'replicad';
import { ParameterDefinition } from '../../../types/model';
import {
  extractDefaultParameters,
  type ReplicadPart,
  type ReplicadModelDefinition,
  type ModelDimensionItem
} from '../types';

export type { ReplicadPart };

export interface KumikoParameters {
  hex_radius?: number;
  hex_thickness?: number;
  hex_fillet?: number;
  hex_spoke_thickness?: number;
  hex_design_thickness?: number;
  height?: number;
  include_keychain_ring?: boolean;
  ring_thickness?: number;
  ring_fillet?: number;
  single_part?: boolean | string;
  fuse_all_parts?: boolean | string;
  section_1?: string | number;
  section_2?: string | number;
  section_3?: string | number;
  section_4?: string | number;
  section_5?: string | number;
  section_6?: string | number;
  section_1_rotation?: string | number;
  section_2_rotation?: string | number;
  section_3_rotation?: string | number;
  section_4_rotation?: string | number;
  section_5_rotation?: string | number;
  section_6_rotation?: string | number;
  [key: string]: unknown;
}

export const kumikoParameters: ParameterDefinition[] = [
  {
    id: 'include_keychain_ring',
    name: 'Keychain Ring Attachment',
    type: 'boolean',
    default: true,
    group: 'Keychain Ring',
    description: 'Include top mounting loop for keychain hardware'
  },
  {
    id: 'ring_thickness',
    name: 'Keychain Ring Thickness',
    type: 'quantity',
    unit: 'millimeter',
    default: 2,
    min: 1,
    max: 10,
    step: 0.5,
    group: 'Keychain Ring',
    dependsOn: 'include_keychain_ring',
    description: 'Thickness of the keychain ring'
  },
  {
    id: 'ring_fillet',
    name: 'Keychain Ring Fillet',
    type: 'quantity',
    unit: 'millimeter',
    default: 0.2,
    min: 0,
    max: 1,
    step: 0.05,
    group: 'Keychain Ring',
    dependsOn: 'include_keychain_ring',
    description: 'Fillet radius on the keychain ring attachment'
  },
  {
    id: 'section_1',
    name: 'Section 1 (0°–60°)',
    type: 'enum',
    default: '1',
    group: 'Section Patterns',
    layout: 'half',
    options: [
      { value: '0', label: 'Empty' },
      { value: '1', label: 'Asa-no-ha (Hemp Leaf)' },
      { value: '2', label: 'Ryuso Asa-no-ha' },
      { value: '3', label: 'Asa-no-ha Variant' },
      { value: '4', label: 'Rindo Asa-no-ha (Bellflower)' }
    ],
    description: 'Geometric Kumiko pattern for wedge section 1'
  },
  {
    id: 'section_1_rotation',
    name: 'Section 1 Rotation',
    type: 'enum',
    default: '0',
    group: 'Section Patterns',
    widget: 'segmented',
    layout: 'half',
    options: [
      { value: '0', label: '0°' },
      { value: '120', label: '120°' },
      { value: '240', label: '240°' }
    ],
    description: 'Pattern rotation angle for section 1'
  },
  {
    id: 'section_2',
    name: 'Section 2 (60°–120°)',
    type: 'enum',
    default: '1',
    group: 'Section Patterns',
    layout: 'half',
    options: [
      { value: '0', label: 'Empty' },
      { value: '1', label: 'Asa-no-ha (Hemp Leaf)' },
      { value: '2', label: 'Ryuso Asa-no-ha' },
      { value: '3', label: 'Asa-no-ha Variant' },
      { value: '4', label: 'Rindo Asa-no-ha (Bellflower)' }
    ],
    description: 'Geometric Kumiko pattern for wedge section 2'
  },
  {
    id: 'section_2_rotation',
    name: 'Section 2 Rotation',
    type: 'enum',
    default: '0',
    group: 'Section Patterns',
    widget: 'segmented',
    layout: 'half',
    options: [
      { value: '0', label: '0°' },
      { value: '120', label: '120°' },
      { value: '240', label: '240°' }
    ],
    description: 'Pattern rotation angle for section 2'
  },
  {
    id: 'section_3',
    name: 'Section 3 (120°–180°)',
    type: 'enum',
    default: '1',
    group: 'Section Patterns',
    layout: 'half',
    options: [
      { value: '0', label: 'Empty' },
      { value: '1', label: 'Asa-no-ha (Hemp Leaf)' },
      { value: '2', label: 'Ryuso Asa-no-ha' },
      { value: '3', label: 'Asa-no-ha Variant' },
      { value: '4', label: 'Rindo Asa-no-ha (Bellflower)' }
    ],
    description: 'Geometric Kumiko pattern for wedge section 3'
  },
  {
    id: 'section_3_rotation',
    name: 'Section 3 Rotation',
    type: 'enum',
    default: '0',
    group: 'Section Patterns',
    widget: 'segmented',
    layout: 'half',
    options: [
      { value: '0', label: '0°' },
      { value: '120', label: '120°' },
      { value: '240', label: '240°' }
    ],
    description: 'Pattern rotation angle for section 3'
  },
  {
    id: 'section_4',
    name: 'Section 4 (180°–240°)',
    type: 'enum',
    default: '1',
    group: 'Section Patterns',
    layout: 'half',
    options: [
      { value: '0', label: 'Empty' },
      { value: '1', label: 'Asa-no-ha (Hemp Leaf)' },
      { value: '2', label: 'Ryuso Asa-no-ha' },
      { value: '3', label: 'Asa-no-ha Variant' },
      { value: '4', label: 'Rindo Asa-no-ha (Bellflower)' }
    ],
    description: 'Geometric Kumiko pattern for wedge section 4'
  },
  {
    id: 'section_4_rotation',
    name: 'Section 4 Rotation',
    type: 'enum',
    default: '0',
    group: 'Section Patterns',
    widget: 'segmented',
    layout: 'half',
    options: [
      { value: '0', label: '0°' },
      { value: '120', label: '120°' },
      { value: '240', label: '240°' }
    ],
    description: 'Pattern rotation angle for section 4'
  },
  {
    id: 'section_5',
    name: 'Section 5 (240°–300°)',
    type: 'enum',
    default: '1',
    group: 'Section Patterns',
    layout: 'half',
    options: [
      { value: '0', label: 'Empty' },
      { value: '1', label: 'Asa-no-ha (Hemp Leaf)' },
      { value: '2', label: 'Ryuso Asa-no-ha' },
      { value: '3', label: 'Asa-no-ha Variant' },
      { value: '4', label: 'Rindo Asa-no-ha (Bellflower)' }
    ],
    description: 'Geometric Kumiko pattern for wedge section 5'
  },
  {
    id: 'section_5_rotation',
    name: 'Section 5 Rotation',
    type: 'enum',
    default: '0',
    group: 'Section Patterns',
    widget: 'segmented',
    layout: 'half',
    options: [
      { value: '0', label: '0°' },
      { value: '120', label: '120°' },
      { value: '240', label: '240°' }
    ],
    description: 'Pattern rotation angle for section 5'
  },
  {
    id: 'section_6',
    name: 'Section 6 (300°–360°)',
    type: 'enum',
    default: '1',
    group: 'Section Patterns',
    layout: 'half',
    options: [
      { value: '0', label: 'Empty' },
      { value: '1', label: 'Asa-no-ha (Hemp Leaf)' },
      { value: '2', label: 'Ryuso Asa-no-ha' },
      { value: '3', label: 'Asa-no-ha Variant' },
      { value: '4', label: 'Rindo Asa-no-ha (Bellflower)' }
    ],
    description: 'Geometric Kumiko pattern for wedge section 6'
  },
  {
    id: 'section_6_rotation',
    name: 'Section 6 Rotation',
    type: 'enum',
    default: '0',
    group: 'Section Patterns',
    widget: 'segmented',
    layout: 'half',
    options: [
      { value: '0', label: '0°' },
      { value: '120', label: '120°' },
      { value: '240', label: '240°' }
    ],
    description: 'Pattern rotation angle for section 6'
  },
  {
    id: 'hex_design_thickness',
    name: 'Design Lattice Thickness',
    type: 'quantity',
    unit: 'millimeter',
    default: 1,
    min: 0.5,
    max: 10,
    step: 0.1,
    group: 'Section Patterns',
    description: 'Thickness of the delicate inner kumiko lattice design lines'
  },
  {
    id: 'hex_radius',
    name: 'Hexagon Radius',
    type: 'quantity',
    unit: 'millimeter',
    default: 20,
    min: 10,
    max: 45,
    step: 1,
    group: 'Hexagon Lattice',
    description: 'Outer radius of the hexagonal Kumiko boundary'
  },
  {
    id: 'hex_thickness',
    name: 'Hex Frame Thickness',
    type: 'quantity',
    unit: 'millimeter',
    default: 2,
    min: 1,
    max: 10,
    step: 0.5,
    group: 'Hexagon Lattice',
    description: 'Outer perimeter border frame thickness'
  },
  {
    id: 'hex_fillet',
    name: 'Hex Corner Fillet',
    type: 'quantity',
    unit: 'millimeter',
    default: 0.2,
    min: 0,
    max: 1,
    step: 0.05,
    group: 'Hexagon Lattice',
    description: 'Corner fillet radius on the outer hexagon'
  },
  {
    id: 'hex_spoke_thickness',
    name: 'Spoke Thickness',
    type: 'quantity',
    unit: 'millimeter',
    default: 2,
    min: 1,
    max: 10,
    step: 0.2,
    group: 'Hexagon Lattice',
    description: 'Internal spoke lattice strip thickness'
  },
  {
    id: 'height',
    name: 'Pattern Height / Depth',
    type: 'quantity',
    unit: 'millimeter',
    default: 3,
    min: 1,
    max: 5,
    step: 0.5,
    group: 'Hexagon Lattice',
    description: 'Total extruded depth of the item'
  },
  {
    id: 'single_part',
    name: 'Single Part (Fuse Solids)',
    type: 'boolean',
    default: false,
    group: 'Assembly & Output',
    description: 'Fuse all solid components into a single unified part at the end (uncheck to keep separate multi-color parts)'
  }
];

export const defaultKumikoParameters: KumikoParameters = extractDefaultParameters<KumikoParameters>(kumikoParameters);

export function getCentroid(
  p1: [number, number],
  p2: [number, number],
  p3: [number, number]
): [number, number] {
  return [
    (p1[0] + p2[0] + p3[0]) / 3,
    (p1[1] + p2[1] + p3[1]) / 3
  ];
}

export function getMidpoint(p1: Point2D, p2: Point2D): Point2D {
  return [
    (p1[0] + p2[0]) / 2,
    (p1[1] + p2[1]) / 2
  ];
}

/**
 * Calculates the point located at a fractional distance (t) from p1 towards p2
 */
export function getPointAtFraction(p1: Point2D, p2: Point2D, fraction: number): Point2D {
  return [
    p1[0] + (p2[0] - p1[0]) * fraction,
    p1[1] + (p2[1] - p1[1]) * fraction
  ];
}

/**
 * Calculates the point located at 1/3 the distance from p1 towards p2
 */
export function getOneThirdPoint(p1: Point2D, p2: Point2D): Point2D {
  return getPointAtFraction(p1, p2, 1 / 3);
}

export function getIncenter(
  A: [number, number],
  B: [number, number],
  C: [number, number]
): [number, number] {
  // Side lengths opposite to A, B, C
  const a = Math.hypot(B[0] - C[0], B[1] - C[1]);
  const b = Math.hypot(A[0] - C[0], A[1] - C[1]);
  const c = Math.hypot(A[0] - B[0], A[1] - B[1]);
  const perimeter = a + b + c;
  return [
    (a * A[0] + b * B[0] + c * C[0]) / perimeter,
    (a * A[1] + b * B[1] + c * C[1]) / perimeter
  ];
}

export function rotatePoint2D(p: Point2D, center: Point2D, angleRad: number): Point2D {
  if (Math.abs(angleRad) < 1e-5) return p;
  const cosA = Math.cos(angleRad);
  const sinA = Math.sin(angleRad);
  const dx = p[0] - center[0];
  const dy = p[1] - center[1];
  return [
    center[0] + dx * cosA - dy * sinA,
    center[1] + dx * sinA + dy * cosA
  ];
}

export type StrutAlignment = 'symmetrical' | 'inner' | 'outer';

/**
 * Creates a 2D rectangular strut drawing between two 2D points with given thickness and alignment direction
 * - 'symmetrical' (default): Strut thickness is evenly centered along the centerline p1 -> p2 (+t/2, -t/2)
 * - 'outer': Strut thickness is offset entirely in the positive normal direction (0 to +t)
 * - 'inner': Strut thickness is offset entirely in the negative normal direction (0 to -t)
 */
export function createStrutDrawing(
  p1: [number, number],
  p2: [number, number],
  thickness: number,
  alignment: StrutAlignment = 'symmetrical'
): Drawing | null {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const length = Math.hypot(dx, dy);
  if (length < 0.001) return null;

  // Perpendicular unit normal vector (points 90° CCW / left of p1 -> p2)
  const unx = -dy / length;
  const uny = dx / length;

  let o1 = -thickness / 2;
  let o2 = thickness / 2;

  if (alignment === 'outer') {
    o1 = 0;
    o2 = thickness;
  } else if (alignment === 'inner') {
    o1 = -thickness;
    o2 = 0;
  }

  const p1a: [number, number] = [p1[0] + unx * o2, p1[1] + uny * o2];
  const p2a: [number, number] = [p2[0] + unx * o2, p2[1] + uny * o2];
  const p2b: [number, number] = [p2[0] + unx * o1, p2[1] + uny * o1];
  const p1b: [number, number] = [p1[0] + unx * o1, p1[1] + uny * o1];

  return draw(p1a)
    .lineTo(p2a)
    .lineTo(p2b)
    .lineTo(p1b)
    .close();
}

export type Point2D = [number, number];
export type Triangle2D = [Point2D, Point2D, Point2D];

/**
 * Creates a 2D hollow triangular frame from 3 outer vertices, with wall thickness offsetting inward
 */
export function createTriangleFrame(
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  thickness: number
): Drawing | null {
  const outerTriangle = draw(p1).lineTo(p2).lineTo(p3).close();

  // Incenter of the triangle
  const I = getIncenter(p1, p2, p3);

  // Computes inward offset vertex along the angle bisector towards incenter I
  function getInwardVertex(V: Point2D, Vprev: Point2D, Vnext: Point2D): Point2D {
    const v1: Point2D = [Vprev[0] - V[0], Vprev[1] - V[1]];
    const v2: Point2D = [Vnext[0] - V[0], Vnext[1] - V[1]];
    const l1 = Math.hypot(v1[0], v1[1]);
    const l2 = Math.hypot(v2[0], v2[1]);
    if (l1 < 1e-4 || l2 < 1e-4) return V;

    const dot = (v1[0] * v2[0] + v1[1] * v2[1]) / (l1 * l2);
    const clampedDot = Math.max(-1, Math.min(1, dot));
    const halfAngle = Math.acos(clampedDot) / 2;
    const sinHalf = Math.sin(halfAngle);
    if (sinHalf < 1e-3) return V;

    const offsetDist = thickness / sinHalf;
    const toI: Point2D = [I[0] - V[0], I[1] - V[1]];
    const distI = Math.hypot(toI[0], toI[1]);
    if (distI <= offsetDist) {
      return I;
    }

    const scale = offsetDist / distI;
    return [V[0] + toI[0] * scale, V[1] + toI[1] * scale];
  }

  const p1Inner = getInwardVertex(p1, p3, p2);
  const p2Inner = getInwardVertex(p2, p1, p3);
  const p3Inner = getInwardVertex(p3, p2, p1);

  const innerTriangle = draw(p1Inner).lineTo(p2Inner).lineTo(p3Inner).close();

  try {
    return outerTriangle.cut(innerTriangle);
  } catch {
    return outerTriangle;
  }
}

/**
 * Geometric context provided to pattern generator functions.
 * Contains both raw wedge boundary triangles and precalculated reference points.
 */
export interface SectorGeometryContext {
  spokeTriangle: Triangle2D;
  innerTriangle: Triangle2D;
  designThick: number;
  height: number;
  C_inner: Point2D;
  C_spoke: Point2D;
  innerCenter: Point2D;
  inner1: Point2D;
  inner2: Point2D;
  spokeCenter: Point2D;
  spoke1: Point2D;
  spoke2: Point2D;
  midInner1: Point2D;
  midInner2: Point2D;
  midInnerOuter: Point2D;
  midSpoke1: Point2D;
  midSpoke2: Point2D;
  midSpokeOuter: Point2D;
}

/**
 * A PatternGenerator produces a 2D Drawing or 3D AnyShape for a wedge sector.
 */
export type PatternGenerator = (ctx: SectorGeometryContext) => Drawing | AnyShape | null;

/**
 * 0. Empty Pattern (no infill)
 */
export const generateEmptyPattern: PatternGenerator = () => null;

/**
 * 1. Classic Asa-no-ha (Hemp Leaf tripod lattice)
 */
export const generateAsaNoHaPattern: PatternGenerator = (ctx: SectorGeometryContext): Drawing | null => {
  const branch0 = createStrutDrawing(ctx.C_spoke, ctx.spokeCenter, ctx.designThick);
  const branch1 = createStrutDrawing(ctx.C_spoke, ctx.spoke1, ctx.designThick);
  const branch2 = createStrutDrawing(ctx.C_spoke, ctx.spoke2, ctx.designThick);

  let drawing: Drawing | null = null;
  for (const strut of [branch0, branch1, branch2]) {
    if (strut) drawing = drawing ? drawing.fuse(strut) : strut;
  }
  return drawing;
};

/**
 * 2. Ryuso Asa-no-ha (Classic tripod + inward triangular frame)
 */
export const generateRyusoAsaNoHaPattern: PatternGenerator = (ctx: SectorGeometryContext): Drawing | null => {
  const tripod = generateAsaNoHaPattern(ctx);
  const triFrame = createTriangleFrame(ctx.midInner1, ctx.midInner2, ctx.midInnerOuter, ctx.designThick);

  if (tripod && triFrame) return (tripod as Drawing).fuse(triFrame);
  return (tripod as Drawing) || triFrame || null;
};

/**
 * 3. Asa-no-ha Variant
 */
export const generateAsaNoHaVariantPattern: PatternGenerator = (ctx: SectorGeometryContext): Drawing | null => {
  const center = getOneThirdPoint(ctx.C_spoke, ctx.midSpokeOuter);
  const branch0 = createStrutDrawing(center, ctx.spokeCenter, ctx.designThick);
  const branch1 = createStrutDrawing(center, ctx.spoke1, ctx.designThick);
  const branch2 = createStrutDrawing(center, ctx.spoke2, ctx.designThick);

  let drawing: Drawing | null = null;
  for (const strut of [branch0, branch1, branch2]) {
    if (strut) drawing = drawing ? drawing.fuse(strut) : strut;
  }
  return drawing;
};

/**
 * 4. Rindo Asa-no-ha (Bellflower)
 */
export const generateRindoAsaNoHaPattern: PatternGenerator = (ctx: SectorGeometryContext): Drawing | null => {
  const branch0 = createStrutDrawing(ctx.spokeCenter, ctx.midSpokeOuter, ctx.designThick);
  const branch1 = createStrutDrawing(ctx.innerCenter, getMidpoint(ctx.spoke1, ctx.midSpokeOuter), ctx.designThick);
  const branch2 = createStrutDrawing(ctx.innerCenter, getMidpoint(ctx.spoke2, ctx.midSpokeOuter), ctx.designThick);

  let drawing: Drawing | null = null;
  for (const strut of [branch0, branch1, branch2]) {
    if (strut) drawing = drawing ? drawing.fuse(strut) : strut;
  }
  return drawing;
};

/**
 * Central registry mapping pattern identifiers to generator implementations.
 * New patterns can be registered dynamically using registerKumikoPattern().
 */
export const KUMIKO_PATTERN_REGISTRY: Map<string, PatternGenerator> = new Map([
  ['0', generateEmptyPattern],
  ['empty', generateEmptyPattern],
  ['1', generateAsaNoHaPattern],
  ['asa-no-ha', generateAsaNoHaPattern],
  ['2', generateRyusoAsaNoHaPattern],
  ['ryuso-asa-no-ha', generateRyusoAsaNoHaPattern],
  ['3', generateAsaNoHaVariantPattern],
  ['asa-no-ha-variant', generateAsaNoHaVariantPattern],
  ['4', generateRindoAsaNoHaPattern],
  ['rindo-asa-no-ha', generateRindoAsaNoHaPattern]
]);

/**
 * Register a new custom Kumiko pattern generator.
 */
export function registerKumikoPattern(id: string, generator: PatternGenerator): void {
  KUMIKO_PATTERN_REGISTRY.set(id.toLowerCase().trim(), generator);
}

/**
 * Generates the 3D lattice/motif pattern solid for a 60° Kumiko wedge sector.
 * Resolves the pattern generator from KUMIKO_PATTERN_REGISTRY, extrudes to 3D, and rotates around C_inner.
 *
 * @param patternType Pattern identifier ('0' = empty, '1' = classic Asa-no-ha, '2' = Ryuso Asa-no-ha, etc.)
 * @param spokeTriangle [center, spoke1, spoke2] - Vertices of the outer spoke wedge triangle
 * @param innerTriangle [innerCenter, inner1, inner2] - Vertices of the inner hex frame wedge triangle
 * @param designThick Infill strut thickness
 * @param height Extrusion height / thickness in Z
 * @param rotation Rotation in degrees (0, 120, 240) around the center of the inner triangle
 */
export function createSectorPattern(
  patternType: string | number,
  spokeTriangle: Triangle2D,
  innerTriangle: Triangle2D,
  designThick: number,
  height: number,
  rotation: string | number = 0
): AnyShape | null {
  const pKey = String(patternType).toLowerCase().trim();
  if (!KUMIKO_PATTERN_REGISTRY.has(pKey)) {
    return null;
  }
  const generator = KUMIKO_PATTERN_REGISTRY.get(pKey);
  if (typeof generator !== 'function') {
    return null;
  }

  const [innerCenter, inner1, inner2] = innerTriangle;
  const [spokeCenter, spoke1, spoke2] = spokeTriangle;

  const ctx: SectorGeometryContext = {
    spokeTriangle,
    innerTriangle,
    designThick,
    height,
    C_inner: getCentroid(innerCenter, inner1, inner2),
    C_spoke: getCentroid(spokeCenter, spoke1, spoke2),
    innerCenter,
    inner1,
    inner2,
    spokeCenter,
    spoke1,
    spoke2,
    midInner1: getMidpoint(innerCenter, inner1),
    midInner2: getMidpoint(innerCenter, inner2),
    midInnerOuter: getMidpoint(inner1, inner2),
    midSpoke1: getMidpoint(spokeCenter, spoke1),
    midSpoke2: getMidpoint(spokeCenter, spoke2),
    midSpokeOuter: getMidpoint(spoke1, spoke2)
  };

  const pattern2Dor3D = generator(ctx);
  if (!pattern2Dor3D) return null;

  // 1. Extrude 2D Drawing to 3D Solid if needed
  let sectorSolid: AnyShape;
  if ('sketchOnPlane' in pattern2Dor3D) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sketch = (pattern2Dor3D as Drawing).sketchOnPlane('XY') as any;
    sectorSolid = sketch.extrude(height);
  } else {
    sectorSolid = pattern2Dor3D as AnyShape;
  }

  // 2. Rotate the entire pattern solid around the center of the inner triangle (Z axis)
  let rotDeg = typeof rotation === 'number' ? rotation : parseFloat(String(rotation)) || 0;
  if (rotDeg === 1 || rotDeg === 2) {
    rotDeg = rotDeg * 120;
  }
  if (Math.abs(rotDeg) > 1e-4) {
    sectorSolid = sectorSolid.rotate(rotDeg, [ctx.C_inner[0], ctx.C_inner[1], 0], [0, 0, 1]);
  }

  return sectorSolid;
}

/**
 * Builds the 3D Kumiko Keychain assembly with 4 distinct, non-overlapping parts:
 * 1. Kumiko_Hex_Frame (outer perimeter border)
 * 2. Kumiko_Hex_Spokes (6 radial spokes to hex corners, cut by hex frame)
 * 3. Kumiko_Lattice_Pattern (Asa-no-ha Y-lattice, cut by frame and spokes)
 * 4. Keychain_Ring_Attachment (keychain ring loop, cut by outer hex)
 */
export function buildKumikoKeychainParts(params: KumikoParameters): ReplicadPart[] {
  const rOuter = Number(params.hex_radius ?? 20);
  const tHex = Number(params.hex_thickness ?? 2);
  const tSpoke = Number(params.hex_spoke_thickness ?? 2);
  const tDesign = Number(params.hex_design_thickness ?? 1);
  const h = Number(params.height ?? 2);
  const hasRing = Boolean(params.include_keychain_ring ?? true);
  const tRing = Number(params.ring_thickness ?? 2);
  const fHex = Number(params.hex_fillet ?? 0.2);
  const fRing = Number(params.ring_fillet ?? 0.2);

  const deltaCorner = tHex / Math.sqrt(3);
  const rMidpoint = rOuter - deltaCorner;
  const rInner = Math.max(2, rMidpoint - deltaCorner);

  // ==========================================
  // Part 1: Hexagonal Perimeter Frame
  // ==========================================
  const outerHex = drawPolysides(rOuter, 6);
  const innerHex = drawPolysides(rInner, 6);
  const frame2D = outerHex.cut(innerHex);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hexSketch = frame2D.sketchOnPlane('XY') as any;
  let hexSolid = hexSketch.extrude(h);

  if (fHex > 0 && fHex < 0.6) {
    try {
      // Fillet outer perimeter edges of the hex frame, keeping inner frame walls sharp
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hexSolid = hexSolid.fillet(fHex, (ef: any) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ef.when(({ center, element }: any) => {
          const pt = center || element?.center || element?.startPoint;
          const x = pt?.x ?? pt?.[0] ?? 0;
          const y = pt?.y ?? pt?.[1] ?? 0;
          const dist = Math.hypot(x, y);
          return dist >= rMidpoint - 0.1;
        })
      );
    } catch {
      // Keep unfilleted if geometry is non-manifold
    }
  }

  const parts: ReplicadPart[] = [
    {
      shape: hexSolid,
      name: 'Kumiko_Hex_Frame',
      color: '#1e3a8a'
    }
  ];

  // ==========================================
  // Part 2: 6 Radial Spokes (to Hex Vertices)
  // ==========================================
  let spokes2D: Drawing | null = null;
  let spokesSolid: AnyShape | null = null;
  const spokeVertices: [number, number][] = [];

  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 + Math.PI / 6;
    const vertex: [number, number] = [
      rMidpoint * Math.cos(angle),
      rMidpoint * Math.sin(angle)
    ];
    spokeVertices.push(vertex);

    const spoke = createStrutDrawing([0, 0], vertex, tSpoke);
    if (spoke) {
      spokes2D = spokes2D ? spokes2D.fuse(spoke) : spoke;
    }
  }

  // Cut spokes with innerHex so they stop flush against the inner frame wall with zero overlap
  if (spokes2D) {
    const trimmedSpokes2D = spokes2D.intersect(innerHex);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spokesSketch = trimmedSpokes2D.sketchOnPlane('XY') as any;
    spokesSolid = spokesSketch.extrude(h);

    if (spokesSolid) {
      parts.push({
        shape: spokesSolid,
        name: 'Kumiko_Hex_Spokes',
        color: '#2563eb'
      });
    }
  }

  // ==========================================
  // Part 3: Kumiko Lattice Infill Pattern
  // ==========================================
  const sections = [
    params.section_1 ?? '1',
    params.section_2 ?? '1',
    params.section_3 ?? '1',
    params.section_4 ?? '1',
    params.section_5 ?? '1',
    params.section_6 ?? '1'
  ];

  const rotations = [
    params.section_1_rotation ?? '0',
    params.section_2_rotation ?? '0',
    params.section_3_rotation ?? '0',
    params.section_4_rotation ?? '0',
    params.section_5_rotation ?? '0',
    params.section_6_rotation ?? '0'
  ];

  let patternSolid: AnyShape | null = null;

  const center: Point2D = [0, 0];
  const rInnerCenter = tSpoke; // Offset distance (tSpoke / 2) / sin(30°) = tSpoke
  const sSpokeWall = rInner - tSpoke / (2 * Math.sqrt(3)); // Distance along spoke axis to inner hex wall intersection

  for (let i = 0; i < 6; i++) {
    const patternType = sections[i];
    const angle1 = (i * Math.PI) / 3 + Math.PI / 6;
    const angle2 = ((i + 1) * Math.PI) / 3 + Math.PI / 6;
    const midAngle = (angle1 + angle2) / 2;

    // 1. Apex vertex closest to center where adjacent spoke inner edges intersect
    const innerCenter: Point2D = [
      rInnerCenter * Math.cos(midAngle),
      rInnerCenter * Math.sin(midAngle)
    ];

    // 2. Inner corner 1: intersection of spoke 1 inner edge with inner hex wall
    const innerCorner1: Point2D = [
      sSpokeWall * Math.cos(angle1) - (tSpoke / 2) * Math.sin(angle1),
      sSpokeWall * Math.sin(angle1) + (tSpoke / 2) * Math.cos(angle1)
    ];

    // 3. Inner corner 2: intersection of spoke 2 inner edge with inner hex wall
    const innerCorner2: Point2D = [
      sSpokeWall * Math.cos(angle2) + (tSpoke / 2) * Math.sin(angle2),
      sSpokeWall * Math.sin(angle2) - (tSpoke / 2) * Math.cos(angle2)
    ];

    const spokeTriangle: Triangle2D = [center, spokeVertices[i], spokeVertices[(i + 1) % 6]];
    const innerTriangle: Triangle2D = [innerCenter, innerCorner1, innerCorner2];

    const sectorSolid = createSectorPattern(
      patternType,
      spokeTriangle,
      innerTriangle,
      tDesign,
      h,
      rotations[i]
    );
    if (sectorSolid) {
      patternSolid = patternSolid ? (patternSolid as any).fuse(sectorSolid) : sectorSolid;
    }
  }

  // 3D Boolean Cut: Cut pattern solid with hex frame and spokes solids
  if (patternSolid) {
    let finalSolid: AnyShape = patternSolid;

    if (hexSolid) {
      try {
        finalSolid = (finalSolid as any).cut(hexSolid);
      } catch {
        // Keep uncut if disjoint
      }
    }

    if (spokesSolid) {
      try {
        finalSolid = (finalSolid as any).cut(spokesSolid);
      } catch {
        // Keep uncut if disjoint
      }
    }

    parts.push({
      shape: finalSolid,
      name: 'Kumiko_Lattice_Pattern',
      color: '#f59e0b'
    });
  }

  // ==========================================
  // Part 4: Keychain Ring Attachment
  // ==========================================
  if (hasRing) {
    const ringInnerR = 3;
    const ringOuterR = ringInnerR + tRing;
    const ringCenterY = rOuter + ringOuterR - 1.5;

    const ringOuter = drawCircle(ringOuterR).translate(0, ringCenterY);
    const ringInner = drawCircle(ringInnerR).translate(0, ringCenterY);
    const ring2D = ringOuter.cut(ringInner);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ringSketch = ring2D.sketchOnPlane('XY') as any;
    let ringSolid = ringSketch.extrude(h);

    if (fRing > 0 && fRing < 0.6) {
      try {
        ringSolid = ringSolid.fillet(fRing);
      } catch {
        // Keep unfilleted if geometry is non-manifold
      }
    }

    // 3D Boolean cut with hexSolid to ensure flush mating with zero gap or ledge overhang
    if (hexSolid) {
      try {
        ringSolid = ringSolid.cut(hexSolid);
      } catch {
        // Fallback
      }
    }

    parts.push({
      shape: ringSolid,
      name: 'Keychain_Ring_Attachment',
      color: '#a855f7'
    });
  }

  // ==========================================
  // Part 5: Single Part Fusion (if enabled)
  // ==========================================
  const shouldFuse =
    params.single_part === true ||
    params.single_part === 'true' ||
    params.fuse_all_parts === true ||
    params.fuse_all_parts === 'true';

  if (shouldFuse && parts.length > 0) {
    let fusedSolid = parts[0].shape;
    for (let i = 1; i < parts.length; i++) {
      try {
        fusedSolid = (fusedSolid as any).fuse(parts[i].shape);
      } catch {
        // Keep existing solid if boolean fusion fails
      }
    }
    return [
      {
        shape: fusedSolid,
        name: 'Kumiko_Keychain_Fused',
        color: '#6366f1'
      }
    ];
  }

  return parts;
}

/**
 * Builds the composite 3D Kumiko Keychain solid model for Three.js meshing & STL export
 */
export function buildKumikoKeychain(params: KumikoParameters): AnyShape {
  const parts = buildKumikoKeychainParts(params);
  if (parts.length === 1) return parts[0].shape;
  return makeCompound(parts.map((p) => p.shape));
}

/**
 * Computes exact geometric model dimensions for the Kumiko Keychain
 */
export function calculateKumikoDimensions(params: KumikoParameters): ModelDimensionItem[] {
  const rOuter = params.hex_radius ?? 20;
  const h = params.height ?? 3;
  const hasRing = params.include_keychain_ring !== false && String(params.include_keychain_ring) !== 'false';
  const tRing = params.ring_thickness ?? 2;
  const ringInnerR = 3;
  const ringOuterR = ringInnerR + tRing;

  // 1. Vertex to Vertex (Point-to-point regular hexagon major diameter: 2 * R)
  const vertexToVertex = 2 * rOuter;

  // 2. Side to Side (Flat-to-flat regular hexagon minor diameter: 2 * R * cos(30°) = sqrt(3) * R)
  const sideToSide = Math.sqrt(3) * rOuter;

  // 3. Height / Depth
  const heightDepth = h;

  // 4. Full Length including Ring (from bottom hex vertex to top of ring loop)
  const totalLength = hasRing
    ? 2 * rOuter + 2 * ringOuterR - 1.5
    : vertexToVertex;

  return [
    {
      id: 'vertex_to_vertex',
      label: 'Vertex to Vertex',
      value: Number(vertexToVertex.toFixed(2)),
      unit: 'mm',
      formatted: `${vertexToVertex.toFixed(1)} mm`,
      description: 'Point-to-point regular hexagon major diameter'
    },
    {
      id: 'side_to_side',
      label: 'Side to Side',
      value: Number(sideToSide.toFixed(2)),
      unit: 'mm',
      formatted: `${sideToSide.toFixed(1)} mm`,
      description: 'Flat-to-flat regular hexagon minor diameter across opposite edges'
    },
    {
      id: 'height',
      label: 'Height / Depth',
      value: Number(heightDepth.toFixed(2)),
      unit: 'mm',
      formatted: `${heightDepth.toFixed(1)} mm`,
      description: 'Extruded solid thickness / depth'
    },
    {
      id: 'full_length',
      label: 'Full Length (inc. Ring)',
      value: Number(totalLength.toFixed(2)),
      unit: 'mm',
      formatted: `${totalLength.toFixed(1)} mm`,
      description: hasRing
        ? 'Total length from bottom apex to top of keychain ring loop'
        : 'Full length from bottom apex to top apex'
    }
  ];
}

/**
 * Replicad Model Definition bundle for Kumiko Keychain
 */
export const kumikoKeychainModel: ReplicadModelDefinition<KumikoParameters> = {
  id: 'kumiko-keychain',
  name: 'Kumiko Keychain',
  description: 'Customisable Simple Kumiko Inspired Keychain powered by Replicad & OpenCASCADE.js (zero API limits).',
  tags: ['Kumiko', '3D Print', 'Keychain', 'Replicad', 'Instant CAD'],
  parameters: kumikoParameters,
  calculateDimensions: (params: KumikoParameters) => calculateKumikoDimensions(params),
  buildParts: (params: KumikoParameters) => buildKumikoKeychainParts(params),
  buildShape: (params: KumikoParameters) => buildKumikoKeychain(params)
};

