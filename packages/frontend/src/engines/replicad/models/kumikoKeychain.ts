import { draw, drawCircle, drawPolysides, Drawing, AnyShape, makeCompound } from 'replicad';
import { ParameterDefinition, ParameterOption } from '../../../types/model';
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

export type Point2D = [number, number];
export type Triangle2D = [Point2D, Point2D, Point2D];
export type StrutAlignment = 'symmetrical' | 'inner' | 'outer';

export function getCentroid(
  p1: [number, number],
  p2: [number, number],
  p3: [number, number]
): [number, number] {
  return [(p1[0] + p2[0] + p3[0]) / 3, (p1[1] + p2[1] + p3[1]) / 3];
}

export function getMidpoint(p1: Point2D, p2: Point2D): Point2D {
  return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
}

/**
 * Calculates the point located at a fractional distance (t) from p1 towards p2
 */
export function getPointAtFraction(p1: Point2D, p2: Point2D, fraction: number): Point2D {
  return [p1[0] + (p2[0] - p1[0]) * fraction, p1[1] + (p2[1] - p1[1]) * fraction];
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
  return [center[0] + dx * cosA - dy * sinA, center[1] + dx * sinA + dy * cosA];
}

/**
 * Calculates the 2D intersection point between two lines (p1 -> p2) and (p3 -> p4).
 * @param p1 Start point of first line
 * @param p2 End point of first line
 * @param p3 Start point of second line
 * @param p4 End point of second line
 * @param segmentOnly If true, only returns intersection if it falls within both line segments
 * @returns Intersection Point2D or null if lines are parallel or do not intersect
 */
export function getLineIntersection(
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  p4: Point2D,
  segmentOnly: boolean = false
): Point2D | null {
  const dx12 = p2[0] - p1[0];
  const dy12 = p2[1] - p1[1];
  const dx34 = p4[0] - p3[0];
  const dy34 = p4[1] - p3[1];

  const denom = dx12 * dy34 - dy12 * dx34;
  if (Math.abs(denom) < 1e-9) {
    return null; // Lines are parallel or collinear
  }

  const dx13 = p1[0] - p3[0];
  const dy13 = p1[1] - p3[1];

  const t = (dy13 * dx34 - dx13 * dy34) / denom;
  const u = (dx12 * dy13 - dy12 * dx13) / denom;

  if (segmentOnly) {
    if (t < -1e-6 || t > 1 + 1e-6 || u < -1e-6 || u > 1 + 1e-6) {
      return null;
    }
  }

  return [p1[0] + t * dx12, p1[1] + t * dy12];
}

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

  return draw(p1a).lineTo(p2a).lineTo(p2b).lineTo(p1b).close();
}

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
export const generateAsaNoHaPattern: PatternGenerator = (
  ctx: SectorGeometryContext
): Drawing | null => {
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
export const generateRyusoAsaNoHaPattern: PatternGenerator = (
  ctx: SectorGeometryContext
): Drawing | null => {
  const tripod = generateAsaNoHaPattern(ctx);
  const triFrame = createTriangleFrame(
    ctx.midInner1,
    ctx.midInner2,
    ctx.midInnerOuter,
    ctx.designThick
  );

  if (tripod && triFrame) return (tripod as Drawing).fuse(triFrame);
  return (tripod as Drawing) || triFrame || null;
};

/**
 * 3. Asa-no-ha Variant
 */
export const generateAsaNoHaVariantPattern: PatternGenerator = (
  ctx: SectorGeometryContext
): Drawing | null => {
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
export const generateRindoAsaNoHaPattern: PatternGenerator = (
  ctx: SectorGeometryContext
): Drawing | null => {
  const branch0 = createStrutDrawing(ctx.spokeCenter, ctx.midSpokeOuter, ctx.designThick);
  const branch1 = createStrutDrawing(
    ctx.innerCenter,
    getMidpoint(ctx.spoke1, ctx.midSpokeOuter),
    ctx.designThick
  );
  const branch2 = createStrutDrawing(
    ctx.innerCenter,
    getMidpoint(ctx.spoke2, ctx.midSpokeOuter),
    ctx.designThick
  );

  let drawing: Drawing | null = null;
  for (const strut of [branch0, branch1, branch2]) {
    if (strut) drawing = drawing ? drawing.fuse(strut) : strut;
  }
  return drawing;
};

/**
 * 5. Kasane Rindo
 */
export const generateKasaneRindoPattern: PatternGenerator = (
  ctx: SectorGeometryContext
): Drawing | null => {
  const branch0 = createStrutDrawing(
    ctx.spoke1,
    getOneThirdPoint(ctx.spokeCenter, ctx.spoke2),
    ctx.designThick
  );
  const branch1 = createStrutDrawing(
    ctx.spoke2,
    getOneThirdPoint(ctx.spokeCenter, ctx.spoke1),
    ctx.designThick
  );

  let drawing: Drawing | null = null;
  for (const strut of [branch0, branch1]) {
    if (strut) drawing = drawing ? drawing.fuse(strut) : strut;
  }
  return drawing;
};

/**
 * 6. Kasane Rindo Variant
 */
export const generateKasaneRindoVariantPattern: PatternGenerator = (
  ctx: SectorGeometryContext
): Drawing | null => {
  const branch0 = createStrutDrawing(
    ctx.spoke1,
    getOneThirdPoint(ctx.spokeCenter, ctx.spoke2),
    ctx.designThick
  );
  const branch1 = createStrutDrawing(
    ctx.spoke2,
    getOneThirdPoint(ctx.spokeCenter, ctx.spoke1),
    ctx.designThick
  );
  const intersection = getLineIntersection(
    ctx.spoke1,
    getOneThirdPoint(ctx.spokeCenter, ctx.spoke2),
    ctx.spoke2,
    getOneThirdPoint(ctx.spokeCenter, ctx.spoke1)
  );
  if (!intersection) return null;

  const midpoint = getMidpoint(intersection, ctx.midSpokeOuter);
  const branch2 = createStrutDrawing(midpoint, intersection, ctx.designThick);
  const branch3 = createStrutDrawing(midpoint, ctx.spoke1, ctx.designThick);
  const branch4 = createStrutDrawing(midpoint, ctx.spoke2, ctx.designThick);

  let drawing: Drawing | null = null;
  for (const strut of [branch0, branch1, branch2, branch3, branch4]) {
    if (strut) drawing = drawing ? drawing.fuse(strut) : strut;
  }
  return drawing;
};

/**
 * 7. Tsumi-ishi Kikko
 */
export const generateTsumiIshiKikkoPattern: PatternGenerator = (
  ctx: SectorGeometryContext
): Drawing | null => {
  const branch0 = createStrutDrawing(ctx.C_spoke, ctx.midSpoke1, ctx.designThick);
  const branch1 = createStrutDrawing(ctx.C_spoke, ctx.midSpoke2, ctx.designThick);
  const branch2 = createStrutDrawing(ctx.C_spoke, ctx.midSpokeOuter, ctx.designThick);

  let drawing: Drawing | null = null;
  for (const strut of [branch0, branch1, branch2]) {
    if (strut) drawing = drawing ? drawing.fuse(strut) : strut;
  }
  return drawing;
};

/**
 * 8. Bishamon Kikko
 */
export const generateBishamonKikkoPattern: PatternGenerator = (
  ctx: SectorGeometryContext
): Drawing | null => {
  const branch0 = createStrutDrawing(
    ctx.C_spoke,
    getOneThirdPoint(ctx.spokeCenter, ctx.spoke1),
    ctx.designThick
  );
  const branch1 = createStrutDrawing(
    ctx.C_spoke,
    getOneThirdPoint(ctx.spoke2, ctx.spokeCenter),
    ctx.designThick
  );
  const branch2 = createStrutDrawing(
    ctx.C_spoke,
    getOneThirdPoint(ctx.spoke1, ctx.spoke2),
    ctx.designThick
  );

  let drawing: Drawing | null = null;
  for (const strut of [branch0, branch1, branch2]) {
    if (strut) drawing = drawing ? drawing.fuse(strut) : strut;
  }
  return drawing;
};

/**
 * 9. Goma-gara
 */
export const generateGomaGaraPattern: PatternGenerator = (
  ctx: SectorGeometryContext
): Drawing | null => {
  const pCenter1_14 = getPointAtFraction(ctx.spokeCenter, ctx.spoke1, 1 / 4);
  const pCenter1_34 = getPointAtFraction(ctx.spokeCenter, ctx.spoke1, 3 / 4);
  const pCenter2_14 = getPointAtFraction(ctx.spokeCenter, ctx.spoke2, 1 / 4);
  const pCenter2_34 = getPointAtFraction(ctx.spokeCenter, ctx.spoke2, 3 / 4);
  const p12_14 = getPointAtFraction(ctx.spoke1, ctx.spoke2, 1 / 4);
  const p12_34 = getPointAtFraction(ctx.spoke1, ctx.spoke2, 3 / 4);

  const intersection = getLineIntersection(pCenter1_34, pCenter2_34, pCenter2_14, p12_14);

  const branch0 = createStrutDrawing(pCenter1_14, p12_34, ctx.designThick);
  const branch1 = createStrutDrawing(pCenter2_14, p12_14, ctx.designThick);
  const branch2 = intersection
    ? createStrutDrawing(pCenter1_34, intersection, ctx.designThick)
    : null;
  const branch3 = intersection
    ? createStrutDrawing(pCenter2_34, intersection, ctx.designThick)
    : null;

  let drawing: Drawing | null = null;
  for (const strut of [branch0, branch1, branch2, branch3]) {
    if (strut) drawing = drawing ? drawing.fuse(strut) : strut;
  }
  return drawing;
};

/**
 * 10. Mikado
 */
export const generateMikadoPattern: PatternGenerator = (
  ctx: SectorGeometryContext
): Drawing | null => {
  const branch0 = createStrutDrawing(
    ctx.C_inner,
    getPointAtFraction(ctx.spokeCenter, ctx.spoke1, 1 / 3),
    ctx.designThick
  );
  const branch1 = createStrutDrawing(
    ctx.C_inner,
    getPointAtFraction(ctx.spokeCenter, ctx.spoke1, 2 / 3),
    ctx.designThick
  );
  const branch2 = createStrutDrawing(
    ctx.C_inner,
    getPointAtFraction(ctx.spokeCenter, ctx.spoke2, 1 / 3),
    ctx.designThick
  );
  const branch3 = createStrutDrawing(
    ctx.C_inner,
    getPointAtFraction(ctx.spokeCenter, ctx.spoke2, 2 / 3),
    ctx.designThick
  );
  const branch4 = createStrutDrawing(
    ctx.C_inner,
    getPointAtFraction(ctx.spoke1, ctx.spoke2, 1 / 3),
    ctx.designThick
  );
  const branch5 = createStrutDrawing(
    ctx.C_inner,
    getPointAtFraction(ctx.spoke1, ctx.spoke2, 2 / 3),
    ctx.designThick
  );

  let drawing: Drawing | null = null;
  for (const strut of [branch0, branch1, branch2, branch3, branch4, branch5]) {
    if (strut) drawing = drawing ? drawing.fuse(strut) : strut;
  }
  return drawing;
};

/**
 * 11. Kuruma kikko
 */
export const generateKurumaKikkoPattern: PatternGenerator = (
  ctx: SectorGeometryContext
): Drawing | null => {
  const pCenter1_25 = getPointAtFraction(ctx.spokeCenter, ctx.spoke1, 2 / 5);
  const pCenter1_35 = getPointAtFraction(ctx.spokeCenter, ctx.spoke1, 3 / 5);
  const pCenter2_25 = getPointAtFraction(ctx.spokeCenter, ctx.spoke2, 2 / 5);
  const pCenter2_35 = getPointAtFraction(ctx.spokeCenter, ctx.spoke2, 3 / 5);
  const p12_25 = getPointAtFraction(ctx.spoke1, ctx.spoke2, 2 / 5);
  const p12_35 = getPointAtFraction(ctx.spoke1, ctx.spoke2, 3 / 5);

  const intersection = getLineIntersection(pCenter1_35, pCenter2_35, pCenter2_25, p12_25);

  const branch0 = createStrutDrawing(pCenter1_25, p12_35, ctx.designThick);
  const branch1 = createStrutDrawing(pCenter2_25, p12_25, ctx.designThick);
  const branch2 = intersection
    ? createStrutDrawing(pCenter1_35, intersection, ctx.designThick)
    : null;
  const branch3 = intersection
    ? createStrutDrawing(pCenter2_35, intersection, ctx.designThick)
    : null;

  let drawing: Drawing | null = null;
  for (const strut of [branch0, branch1, branch2, branch3]) {
    if (strut) drawing = drawing ? drawing.fuse(strut) : strut;
  }
  return drawing;
};

/**
 * 12. Warigiku
 */
export const generateWarigikuPattern: PatternGenerator = (
  ctx: SectorGeometryContext
): Drawing | null => {
  const pattern1 = generateMikadoPattern(ctx);
  const pattern2 = generateAsaNoHaPattern(ctx);

  if (!pattern1 || !pattern2) return null;
  return (pattern1 as Drawing).fuse(pattern2 as Drawing);
};

/**
 * 13. Futae Asa-no-ha
 */
export const generateFutaeAsaNoHaPattern: PatternGenerator = (
  ctx: SectorGeometryContext
): Drawing | null => {
  const point1 = getMidpoint(ctx.C_inner, ctx.midInner1);
  const point2 = getMidpoint(ctx.C_inner, ctx.midInner2);
  const point3 = getMidpoint(ctx.C_inner, ctx.midInnerOuter);

  const branch0 = createStrutDrawing(ctx.C_inner, point1, ctx.designThick);
  const branch1 = createStrutDrawing(ctx.C_inner, point2, ctx.designThick);
  const branch2 = createStrutDrawing(ctx.C_inner, point3, ctx.designThick);

  const branch3 = createStrutDrawing(point1, ctx.spokeCenter, ctx.designThick);
  const branch4 = createStrutDrawing(point1, ctx.spoke1, ctx.designThick);

  const branch5 = createStrutDrawing(point2, ctx.spokeCenter, ctx.designThick);
  const branch6 = createStrutDrawing(point2, ctx.spoke2, ctx.designThick);

  const branch7 = createStrutDrawing(point3, ctx.spoke1, ctx.designThick);
  const branch8 = createStrutDrawing(point3, ctx.spoke2, ctx.designThick);

  let drawing: Drawing | null = null;
  for (const strut of [
    branch0,
    branch1,
    branch2,
    branch3,
    branch4,
    branch5,
    branch6,
    branch7,
    branch8
  ]) {
    if (strut) drawing = drawing ? drawing.fuse(strut) : strut;
  }
  return drawing;
};

/**
 * 13. Yae Asa-no-ha
 */
export const generateYaeAsaNoHaPattern: PatternGenerator = (
  ctx: SectorGeometryContext
): Drawing | null => {
  const pattern1 = generateFutaeAsaNoHaPattern(ctx);
  const pattern2 = generateAsaNoHaPattern(ctx);

  if (!pattern1 || !pattern2) return null;
  return (pattern1 as Drawing).fuse(pattern2 as Drawing);
};

/**
 * 15. Kawari Asa-no-ha
 */
export const generateKawariAsaNoHaPattern: PatternGenerator = (
  ctx: SectorGeometryContext
): Drawing | null => {
  const point1 = getMidpoint(ctx.C_inner, ctx.midInner1);
  const point2 = getMidpoint(ctx.C_inner, ctx.midInner2);
  const point3 = getMidpoint(ctx.C_inner, ctx.midInnerOuter);

  const branch0 = createStrutDrawing(point3, point1, ctx.designThick);
  const branch1 = createStrutDrawing(point1, point2, ctx.designThick);
  const branch2 = createStrutDrawing(point2, point3, ctx.designThick);

  const branch3 = createStrutDrawing(point1, ctx.spokeCenter, ctx.designThick);
  const branch4 = createStrutDrawing(point1, ctx.spoke1, ctx.designThick);

  const branch5 = createStrutDrawing(point2, ctx.spokeCenter, ctx.designThick);
  const branch6 = createStrutDrawing(point2, ctx.spoke2, ctx.designThick);

  const branch7 = createStrutDrawing(point3, ctx.spoke1, ctx.designThick);
  const branch8 = createStrutDrawing(point3, ctx.spoke2, ctx.designThick);

  let drawing: Drawing | null = null;
  for (const strut of [
    branch0,
    branch1,
    branch2,
    branch3,
    branch4,
    branch5,
    branch6,
    branch7,
    branch8
  ]) {
    if (strut) drawing = drawing ? drawing.fuse(strut) : strut;
  }
  return drawing;
};

/**
 * 16. Ryuso Kikko
 */
export const generateRyusoKikkoPattern: PatternGenerator = (
  ctx: SectorGeometryContext
): Drawing | null => {
  const point1 = getLineIntersection(
    ctx.spokeCenter,
    getOneThirdPoint(ctx.spoke2, ctx.spoke1),
    ctx.spoke1,
    getOneThirdPoint(ctx.spokeCenter, ctx.spoke2)
  );
  const point2 = getLineIntersection(
    ctx.spoke1,
    getOneThirdPoint(ctx.spokeCenter, ctx.spoke2),
    ctx.spoke2,
    getOneThirdPoint(ctx.spoke1, ctx.spokeCenter)
  );
  const point3 = getLineIntersection(
    ctx.spoke2,
    getOneThirdPoint(ctx.spoke1, ctx.spokeCenter),
    ctx.spokeCenter,
    getOneThirdPoint(ctx.spoke2, ctx.spoke1)
  );

  if (!point1 || !point2 || !point3) {
    return null;
  }

  const branch0 = createStrutDrawing(point1, point2, ctx.designThick);
  const branch1 = createStrutDrawing(point2, point3, ctx.designThick);
  const branch2 = createStrutDrawing(point3, point1, ctx.designThick);

  const branch3 = createStrutDrawing(point1, ctx.spoke1, ctx.designThick);
  const branch4 = createStrutDrawing(point2, ctx.spoke2, ctx.designThick);
  const branch5 = createStrutDrawing(point3, ctx.spokeCenter, ctx.designThick);

  let drawing: Drawing | null = null;
  for (const strut of [branch0, branch1, branch2, branch3, branch4, branch5]) {
    if (strut) drawing = drawing ? drawing.fuse(strut) : strut;
  }
  return drawing;
};

/**
 * 17. Kikyo Asa-no-ha
 */
export const generateKikyoAsaNoHaPattern: PatternGenerator = (
  ctx: SectorGeometryContext
): Drawing | null => {
  const point1 = getMidpoint(ctx.spokeCenter, ctx.midSpokeOuter);
  const point2 = getMidpoint(ctx.spoke1, ctx.midSpoke2);
  const point3 = getMidpoint(ctx.spoke2, ctx.midSpoke1);

  if (!point1 || !point2 || !point3) {
    return null;
  }

  const branch0 = createStrutDrawing(point1, point2, ctx.designThick);
  const branch1 = createStrutDrawing(point2, point3, ctx.designThick);
  const branch2 = createStrutDrawing(point3, point1, ctx.designThick);

  const branch3 = createStrutDrawing(point1, ctx.spokeCenter, ctx.designThick);
  const branch4 = createStrutDrawing(point2, ctx.spoke1, ctx.designThick);
  const branch5 = createStrutDrawing(point3, ctx.spoke2, ctx.designThick);

  let drawing: Drawing | null = null;
  for (const strut of [branch0, branch1, branch2, branch3, branch4, branch5]) {
    if (strut) drawing = drawing ? drawing.fuse(strut) : strut;
  }
  return drawing;
};

/**
 * 25. Kikyo Asa-no-ha Variant
 */
export const generateKikyoAsaNoHaVariantPattern: PatternGenerator = (
  ctx: SectorGeometryContext
): Drawing | null => {
  const point1 = getOneThirdPoint(ctx.spokeCenter, ctx.midSpokeOuter);
  const point2 = getOneThirdPoint(ctx.spoke1, ctx.midSpoke2);
  const point3 = getOneThirdPoint(ctx.spoke2, ctx.midSpoke1);

  if (!point1 || !point2 || !point3) {
    return null;
  }

  const branch0 = createStrutDrawing(point1, point2, ctx.designThick);
  const branch1 = createStrutDrawing(point2, point3, ctx.designThick);
  const branch2 = createStrutDrawing(point3, point1, ctx.designThick);

  const branch3 = createStrutDrawing(point1, ctx.spokeCenter, ctx.designThick);
  const branch4 = createStrutDrawing(point2, ctx.spoke1, ctx.designThick);
  const branch5 = createStrutDrawing(point3, ctx.spoke2, ctx.designThick);

  let drawing: Drawing | null = null;
  for (const strut of [branch0, branch1, branch2, branch3, branch4, branch5]) {
    if (strut) drawing = drawing ? drawing.fuse(strut) : strut;
  }
  return drawing;
};

/**
 * 18. Kikyo Kikko
 */
export const generateKikyoKikkoPattern: PatternGenerator = (
  ctx: SectorGeometryContext
): Drawing | null => {
  const pattern = generateKikyoAsaNoHaVariantPattern(ctx);

  const branch0 = createStrutDrawing(ctx.C_spoke, ctx.spokeCenter, ctx.designThick);
  const branch1 = createStrutDrawing(ctx.C_spoke, ctx.spoke1, ctx.designThick);
  const branch2 = createStrutDrawing(ctx.C_spoke, ctx.spoke2, ctx.designThick);

  let drawing: Drawing | null = null;
  for (const strut of [branch0, branch1, branch2]) {
    if (strut) drawing = drawing ? drawing.fuse(strut) : strut;
  }

  if (pattern && drawing) return (pattern as Drawing).fuse(drawing);
  return (pattern as Drawing) || drawing || null;
};

/**
 * 19. Yae Kikyo Kikko
 */
export const generateYaeKikyoKikkoPattern: PatternGenerator = (
  ctx: SectorGeometryContext
): Drawing | null => {
  const pattern = generateKikyoAsaNoHaVariantPattern(ctx);

  const branch0 = createStrutDrawing(ctx.spokeCenter, ctx.midSpokeOuter, ctx.designThick);
  const branch1 = createStrutDrawing(ctx.spoke1, ctx.midSpoke2, ctx.designThick);
  const branch2 = createStrutDrawing(ctx.spoke2, ctx.midSpoke1, ctx.designThick);

  let drawing: Drawing | null = null;
  for (const strut of [branch0, branch1, branch2]) {
    if (strut) drawing = drawing ? drawing.fuse(strut) : strut;
  }

  if (pattern && drawing) return (pattern as Drawing).fuse(drawing);
  return (pattern as Drawing) || drawing || null;
};

/**
 * 20. Tawara Kikko
 */
export const generateTawaraKikkoPattern: PatternGenerator = (
  ctx: SectorGeometryContext
): Drawing | null => {
  const point1 = getOneThirdPoint(ctx.C_spoke, ctx.spokeCenter);
  const point2 = getOneThirdPoint(ctx.C_spoke, ctx.spoke1);
  const point3 = getOneThirdPoint(ctx.C_spoke, ctx.spoke2);

  if (!point1 || !point2 || !point3) {
    return null;
  }

  const branch0 = createStrutDrawing(point1, ctx.C_spoke, ctx.designThick);
  const branch1 = createStrutDrawing(point2, ctx.C_spoke, ctx.designThick);
  const branch2 = createStrutDrawing(point3, ctx.C_spoke, ctx.designThick);

  const branch3 = createStrutDrawing(
    point1,
    getOneThirdPoint(ctx.spokeCenter, ctx.spoke1),
    ctx.designThick
  );
  const branch4 = createStrutDrawing(
    point1,
    getOneThirdPoint(ctx.spokeCenter, ctx.spoke2),
    ctx.designThick
  );
  const branch5 = createStrutDrawing(
    point2,
    getOneThirdPoint(ctx.spoke1, ctx.spokeCenter),
    ctx.designThick
  );
  const branch6 = createStrutDrawing(
    point2,
    getOneThirdPoint(ctx.spoke1, ctx.spoke2),
    ctx.designThick
  );
  const branch7 = createStrutDrawing(
    point3,
    getOneThirdPoint(ctx.spoke2, ctx.spokeCenter),
    ctx.designThick
  );
  const branch8 = createStrutDrawing(
    point3,
    getOneThirdPoint(ctx.spoke2, ctx.spoke1),
    ctx.designThick
  );

  let drawing: Drawing | null = null;
  for (const strut of [
    branch0,
    branch1,
    branch2,
    branch3,
    branch4,
    branch5,
    branch6,
    branch7,
    branch8
  ]) {
    if (strut) drawing = drawing ? drawing.fuse(strut) : strut;
  }
  return drawing;
};

/**
 * 21. Urahana Kikko
 */
export const generateUrahanaKikkoPattern: PatternGenerator = (
  ctx: SectorGeometryContext
): Drawing | null => {
  const point1 = getMidpoint(ctx.C_spoke, ctx.spokeCenter);
  const point2 = getMidpoint(ctx.C_spoke, ctx.spoke1);
  const point3 = getMidpoint(ctx.C_spoke, ctx.spoke2);

  if (!point1 || !point2 || !point3) {
    return null;
  }

  const branch0 = createStrutDrawing(point1, ctx.C_spoke, ctx.designThick);
  const branch1 = createStrutDrawing(point2, ctx.C_spoke, ctx.designThick);
  const branch2 = createStrutDrawing(point3, ctx.C_spoke, ctx.designThick);

  const branch3 = createStrutDrawing(
    point1,
    getPointAtFraction(ctx.spokeCenter, ctx.spoke1, 1 / 4),
    ctx.designThick
  );
  const branch4 = createStrutDrawing(
    point1,
    getPointAtFraction(ctx.spokeCenter, ctx.spoke2, 1 / 4),
    ctx.designThick
  );
  const branch5 = createStrutDrawing(
    point2,
    getPointAtFraction(ctx.spoke1, ctx.spokeCenter, 1 / 4),
    ctx.designThick
  );
  const branch6 = createStrutDrawing(
    point2,
    getPointAtFraction(ctx.spoke1, ctx.spoke2, 1 / 4),
    ctx.designThick
  );
  const branch7 = createStrutDrawing(
    point3,
    getPointAtFraction(ctx.spoke2, ctx.spokeCenter, 1 / 4),
    ctx.designThick
  );
  const branch8 = createStrutDrawing(
    point3,
    getPointAtFraction(ctx.spoke2, ctx.spoke1, 1 / 4),
    ctx.designThick
  );

  let drawing: Drawing | null = null;
  for (const strut of [
    branch0,
    branch1,
    branch2,
    branch3,
    branch4,
    branch5,
    branch6,
    branch7,
    branch8
  ]) {
    if (strut) drawing = drawing ? drawing.fuse(strut) : strut;
  }
  return drawing;
};

/**
 * 22. Yae Kikko
 */
export const generateYaeKikkoPattern: PatternGenerator = (
  ctx: SectorGeometryContext
): Drawing | null => {
  const pattern = generateTawaraKikkoPattern(ctx);

  const branch1 = createStrutDrawing(ctx.midSpoke1, ctx.C_spoke, ctx.designThick);
  const branch2 = createStrutDrawing(ctx.midSpoke2, ctx.C_spoke, ctx.designThick);
  const branch3 = createStrutDrawing(ctx.midSpokeOuter, ctx.C_spoke, ctx.designThick);

  let drawing: Drawing | null = null;
  for (const strut of [branch1, branch2, branch3]) {
    if (strut) drawing = drawing ? drawing.fuse(strut) : strut;
  }

  if (pattern && drawing) return (pattern as Drawing).fuse(drawing);
  return (pattern as Drawing) || drawing || null;
};

/**
 * 23. Wa-tsunagi
 */
export const generateWaTsunagiPattern: PatternGenerator = (
  ctx: SectorGeometryContext
): Drawing | null => {
  const point1 = getOneThirdPoint(ctx.C_spoke, ctx.spokeCenter);
  const point2 = getOneThirdPoint(ctx.C_spoke, ctx.spoke1);
  const point3 = getOneThirdPoint(ctx.C_spoke, ctx.spoke2);

  if (!point1 || !point2 || !point3) {
    return null;
  }

  const branch0 = createStrutDrawing(point1, point2, ctx.designThick);
  const branch1 = createStrutDrawing(point2, point3, ctx.designThick);
  const branch2 = createStrutDrawing(point3, point1, ctx.designThick);

  const branch3 = createStrutDrawing(
    point1,
    getOneThirdPoint(ctx.spokeCenter, ctx.spoke1),
    ctx.designThick
  );
  const branch4 = createStrutDrawing(
    point1,
    getOneThirdPoint(ctx.spokeCenter, ctx.spoke2),
    ctx.designThick
  );
  const branch5 = createStrutDrawing(
    point2,
    getOneThirdPoint(ctx.spoke1, ctx.spokeCenter),
    ctx.designThick
  );
  const branch6 = createStrutDrawing(
    point2,
    getOneThirdPoint(ctx.spoke1, ctx.spoke2),
    ctx.designThick
  );
  const branch7 = createStrutDrawing(
    point3,
    getOneThirdPoint(ctx.spoke2, ctx.spokeCenter),
    ctx.designThick
  );
  const branch8 = createStrutDrawing(
    point3,
    getOneThirdPoint(ctx.spoke2, ctx.spoke1),
    ctx.designThick
  );

  let drawing: Drawing | null = null;
  for (const strut of [
    branch0,
    branch1,
    branch2,
    branch3,
    branch4,
    branch5,
    branch6,
    branch7,
    branch8
  ]) {
    if (strut) drawing = drawing ? drawing.fuse(strut) : strut;
  }
  return drawing;
};

/**
 * 24. Yae Wa-tsunagi
 */
export const generateYaeWaTsunagiPattern: PatternGenerator = (
  ctx: SectorGeometryContext
): Drawing | null => {
  const pattern = generateWaTsunagiPattern(ctx);
  const triFrame = createTriangleFrame(
    ctx.midInner1,
    ctx.midInner2,
    ctx.midInnerOuter,
    ctx.designThick
  );

  if (pattern && triFrame) return (pattern as Drawing).fuse(triFrame);
  return (pattern as Drawing) || triFrame || null;
};

/**
 * Kumiko Pattern Definition interface for metadata and generators.
 */
export interface KumikoPatternDefinition {
  id: string;
  name: string;
  generator: PatternGenerator;
  aliases?: string[];
  description?: string;
}

/**
 * Built-in Kumiko pattern definitions.
 */
export const KUMIKO_PATTERNS: KumikoPatternDefinition[] = [
  {
    id: '0',
    name: 'Empty',
    generator: generateEmptyPattern,
    aliases: ['empty'],
    description: 'No infill lattice'
  },
  {
    id: '1',
    name: 'Asa-no-ha',
    generator: generateAsaNoHaPattern,
    aliases: ['asa-no-ha'],
    description: 'Classic Asa-no-ha hemp leaf tripod lattice'
  },
  {
    id: '2',
    name: 'Ryuso Asa-no-ha',
    generator: generateRyusoAsaNoHaPattern,
    aliases: ['ryuso-asa-no-ha'],
    description: 'Classic tripod with inward triangular frame'
  },
  {
    id: '3',
    name: 'Asa-no-ha Variant',
    generator: generateAsaNoHaVariantPattern,
    aliases: ['asa-no-ha-variant'],
    description: 'Asa-no-ha variant with offset branch points'
  },
  {
    id: '4',
    name: 'Rindo Asa-no-ha',
    generator: generateRindoAsaNoHaPattern,
    aliases: ['rindo-asa-no-ha'],
    description: 'Bellflower with outer midpoint spokes'
  },
  {
    id: '5',
    name: 'Kasane Rindo',
    generator: generateKasaneRindoPattern,
    aliases: ['kasane-rindo'],
    description: 'Stacked bellflower with outer midpoint spokes'
  },
  {
    id: '6',
    name: 'Kasane Rindo Variant',
    generator: generateKasaneRindoVariantPattern,
    aliases: ['kasane-rindo-variant'],
    description: 'Kasane Rindo with additional strut from intersection to outer midpoint'
  },
  {
    id: '7',
    name: 'Tsumi-ishi Kikko',
    generator: generateTsumiIshiKikkoPattern,
    aliases: ['tsumi-ishi-kikko'],
    description: 'Tortoise shell pattern with outer midpoint struts'
  },
  {
    id: '8',
    name: 'Bishamon Kikko',
    generator: generateBishamonKikkoPattern,
    aliases: ['bishamon-kikko'],
    description: 'Tortoise shell armour pattern with outer midpoint struts'
  },
  {
    id: '9',
    name: 'Goma-gara',
    generator: generateGomaGaraPattern,
    aliases: ['goma-gara'],
    description: 'Sesame pattern'
  },
  {
    id: '10',
    name: 'Mikado',
    generator: generateMikadoPattern,
    aliases: ['mikado'],
    description: 'Mikado pattern'
  },
  {
    id: '11',
    name: 'Kuruma kikko',
    generator: generateKurumaKikkoPattern,
    aliases: ['kuruma-kikko'],
    description: 'Wheel armour pattern'
  },
  {
    id: '12',
    name: 'Warigiku kikko',
    generator: generateWarigikuPattern,
    aliases: ['warigiku-kikko'],
    description: 'Split chrysanthemum pattern'
  },
  {
    id: '13',
    name: 'Futae Asa-no-ha',
    generator: generateFutaeAsaNoHaPattern,
    aliases: ['futae-asa-no-ha'],
    description: 'Double hemp leaf pattern'
  },
  {
    id: '14',
    name: 'Yae Asa-no-ha',
    generator: generateYaeAsaNoHaPattern,
    aliases: ['yae-asa-no-ha'],
    description: 'Eight-layered hemp leaf pattern'
  },
  {
    id: '15',
    name: 'Kawari Asa-no-ha',
    generator: generateKawariAsaNoHaPattern,
    aliases: ['kawari-asa-no-ha'],
    description: 'Varied hemp leaf pattern'
  },
  {
    id: '16',
    name: 'Ryuso Kikko',
    generator: generateRyusoKikkoPattern,
    aliases: ['ryuso-kikko'],
    description: 'Dragon claw pattern'
  },
  {
    id: '17',
    name: 'Kikyo Asa-no-ha',
    generator: generateKikyoAsaNoHaPattern,
    aliases: ['kikyo-asa-no-ha'],
    description: 'Chinese bellflower pattern'
  },
  {
    id: '25',
    name: 'Kikyo Asa-no-ha Variant',
    generator: generateKikyoAsaNoHaVariantPattern,
    aliases: ['kikyo-asa-no-ha-variant'],
    description: 'Chinese bellflower variant pattern'
  },
  {
    id: '18',
    name: 'Kikyo Kikko',
    generator: generateKikyoKikkoPattern,
    aliases: ['kikyo-kikko'],
    description: 'Chinese bellflower armour pattern'
  },
  {
    id: '19',
    name: 'Yae Kikyo Kikko',
    generator: generateYaeKikyoKikkoPattern,
    aliases: ['yae-kikyo-kikko'],
    description: 'Double-layered Chinese bellflower armour pattern'
  },
  {
    id: '20',
    name: 'Tawara Kikko',
    generator: generateTawaraKikkoPattern,
    aliases: ['tawara-kikko'],
    description: 'Rice bale armour pattern'
  },
  {
    id: '21',
    name: 'Urahana Kikko',
    generator: generateUrahanaKikkoPattern,
    aliases: ['urahana-kikko'],
    description: 'Back-facing flower armour pattern'
  },
  {
    id: '22',
    name: 'Yae Kikko',
    generator: generateYaeKikkoPattern,
    aliases: ['yae-kikko'],
    description: 'Eight-layered flower armour pattern'
  },
  {
    id: '23',
    name: 'Wa-tsunagi',
    generator: generateWaTsunagiPattern,
    aliases: ['wa-tsunagi'],
    description: 'Interconnected knots pattern'
  },
  {
    id: '24',
    name: 'Yae Wa-tsunagi',
    generator: generateYaeWaTsunagiPattern,
    aliases: ['yae-wa-tsunagi'],
    description: 'Eight-layered interconnected knots pattern'
  }
];

/**
 * Central registry mapping pattern identifiers to generator implementations.
 * New patterns can be registered dynamically using registerKumikoPattern().
 */
export const KUMIKO_PATTERN_REGISTRY: Map<string, PatternGenerator> = new Map();

// Populate initial registry with built-in patterns
for (const pattern of KUMIKO_PATTERNS) {
  KUMIKO_PATTERN_REGISTRY.set(pattern.id.toLowerCase().trim(), pattern.generator);
  if (pattern.aliases) {
    for (const alias of pattern.aliases) {
      KUMIKO_PATTERN_REGISTRY.set(alias.toLowerCase().trim(), pattern.generator);
    }
  }
}

/**
 * Returns parameter dropdown options derived directly from the registered Kumiko patterns.
 */
export function getKumikoPatternOptions(): ParameterOption[] {
  return KUMIKO_PATTERNS.map((p) => ({
    value: p.id,
    label: p.name,
    description: p.description
  }));
}

/**
 * Default dropdown parameter options for Kumiko section patterns.
 */
export const KUMIKO_PATTERN_OPTIONS: ParameterOption[] = getKumikoPatternOptions();

/**
 * Segmented angle rotation options for Kumiko wedge sections.
 */
export const KUMIKO_ROTATION_OPTIONS: ParameterOption[] = [
  { value: '0', label: '0°' },
  { value: '120', label: '120°' },
  { value: '240', label: '240°' }
];

/**
 * Register a new custom Kumiko pattern generator or full pattern definition.
 */
export function registerKumikoPattern(
  idOrPattern: string | KumikoPatternDefinition,
  generator?: PatternGenerator,
  name?: string,
  description?: string
): void {
  if (typeof idOrPattern === 'object') {
    const pattern = idOrPattern;
    const existingIndex = KUMIKO_PATTERNS.findIndex((p) => p.id === pattern.id);
    if (existingIndex >= 0) {
      KUMIKO_PATTERNS[existingIndex] = pattern;
    } else {
      KUMIKO_PATTERNS.push(pattern);
    }
    KUMIKO_PATTERN_REGISTRY.set(pattern.id.toLowerCase().trim(), pattern.generator);
    if (pattern.aliases) {
      for (const alias of pattern.aliases) {
        KUMIKO_PATTERN_REGISTRY.set(alias.toLowerCase().trim(), pattern.generator);
      }
    }
  } else if (typeof idOrPattern === 'string' && generator) {
    const id = idOrPattern.trim();
    KUMIKO_PATTERN_REGISTRY.set(id.toLowerCase(), generator);
    const existing = KUMIKO_PATTERNS.find((p) => p.id.toLowerCase() === id.toLowerCase());
    if (existing) {
      existing.generator = generator;
      if (name) existing.name = name;
      if (description) existing.description = description;
    } else {
      KUMIKO_PATTERNS.push({
        id,
        name: name || id,
        description,
        generator
      });
    }
  }
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
    options: KUMIKO_PATTERN_OPTIONS,
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
    options: KUMIKO_ROTATION_OPTIONS,
    description: 'Pattern rotation angle for section 1'
  },
  {
    id: 'section_2',
    name: 'Section 2 (60°–120°)',
    type: 'enum',
    default: '1',
    group: 'Section Patterns',
    layout: 'half',
    options: KUMIKO_PATTERN_OPTIONS,
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
    options: KUMIKO_ROTATION_OPTIONS,
    description: 'Pattern rotation angle for section 2'
  },
  {
    id: 'section_3',
    name: 'Section 3 (120°–180°)',
    type: 'enum',
    default: '1',
    group: 'Section Patterns',
    layout: 'half',
    options: KUMIKO_PATTERN_OPTIONS,
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
    options: KUMIKO_ROTATION_OPTIONS,
    description: 'Pattern rotation angle for section 3'
  },
  {
    id: 'section_4',
    name: 'Section 4 (180°–240°)',
    type: 'enum',
    default: '1',
    group: 'Section Patterns',
    layout: 'half',
    options: KUMIKO_PATTERN_OPTIONS,
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
    options: KUMIKO_ROTATION_OPTIONS,
    description: 'Pattern rotation angle for section 4'
  },
  {
    id: 'section_5',
    name: 'Section 5 (240°–300°)',
    type: 'enum',
    default: '1',
    group: 'Section Patterns',
    layout: 'half',
    options: KUMIKO_PATTERN_OPTIONS,
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
    options: KUMIKO_ROTATION_OPTIONS,
    description: 'Pattern rotation angle for section 5'
  },
  {
    id: 'section_6',
    name: 'Section 6 (300°–360°)',
    type: 'enum',
    default: '1',
    group: 'Section Patterns',
    layout: 'half',
    options: KUMIKO_PATTERN_OPTIONS,
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
    options: KUMIKO_ROTATION_OPTIONS,
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
    description:
      'Fuse all solid components into a single unified part at the end (uncheck to keep separate multi-color parts)'
  }
];

export const defaultKumikoParameters: KumikoParameters =
  extractDefaultParameters<KumikoParameters>(kumikoParameters);

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
    const vertex: [number, number] = [rMidpoint * Math.cos(angle), rMidpoint * Math.sin(angle)];
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
  const hasRing =
    params.include_keychain_ring !== false && String(params.include_keychain_ring) !== 'false';
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
  const totalLength = hasRing ? 2 * rOuter + 2 * ringOuterR - 1.5 : vertexToVertex;

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
  description:
    'Customisable Simple Kumiko Inspired Keychain powered by Replicad & OpenCASCADE.js (zero API limits).',
  tags: ['Kumiko', '3D Print', 'Keychain', 'Replicad', 'Instant CAD'],
  links: [
    {
      label: 'Blog Post',
      url: 'https://vincentteo.com/blog/2026/09/05/kumiko-keychain-customizer/',
      site: 'blog'
    },
    {
      label: 'Printables',
      url: 'https://www.printables.com/model/1826573-simple-kumiko-inspired-keychain-customisable',
      site: 'printables'
    },
    {
      label: 'QIDI Maker',
      url: 'https://www.qidimaker.com/en/models/detail/2093595266801807362',
      site: 'qidimaker'
    }
  ],
  parameters: kumikoParameters,
  calculateDimensions: (params: KumikoParameters) => calculateKumikoDimensions(params),
  buildParts: (params: KumikoParameters) => buildKumikoKeychainParts(params),
  buildShape: (params: KumikoParameters) => buildKumikoKeychain(params)
};
