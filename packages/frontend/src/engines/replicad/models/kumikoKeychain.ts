import { draw, drawCircle, drawPolysides, Drawing, AnyShape, makeCompound } from 'replicad';

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
  section_1?: string | number;
  section_2?: string | number;
  section_3?: string | number;
  section_4?: string | number;
  section_5?: string | number;
  section_6?: string | number;
  [key: string]: unknown;
}

export interface ReplicadPart {
  shape: AnyShape;
  name: string;
  color?: string;
  alpha?: number;
}

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
 * Generates the authentic 2D Asa-no-ha lattice pattern drawings for a 60° Kumiko wedge sector.
 * @param patternType Infill pattern type ('0' = empty, '1' = classic Asa-no-ha, '2' = Ryuso Asa-no-ha)
 * @param spokeTriangle [center, spoke1, spoke2] - Vertices of the outer spoke wedge triangle
 * @param innerTriangle [center, inner1, inner2] - Vertices of the inner hex frame wedge triangle
 * @param designThick Infill strut thickness
 */
function createSectorPattern(
  patternType: string | number,
  spokeTriangle: Triangle2D,
  innerTriangle: Triangle2D,
  designThick: number
): Drawing[] {
  const pType = String(patternType);
  const struts: Drawing[] = [];

  const [center, v1, v2] = spokeTriangle;
  const [innerCenter, inner1, inner2] = innerTriangle;

  // Midpoints of spoke boundary geometry
  const midSpoke1: Point2D = [(center[0] + v1[0]) / 2, (center[1] + v1[1]) / 2];
  const midSpoke2: Point2D = [(center[0] + v2[0]) / 2, (center[1] + v2[1]) / 2];
  const midOuter: Point2D = [(v1[0] + v2[0]) / 2, (v1[1] + v2[1]) / 2];

  // Midpoints of inner boundary geometry (relative to innerCenter)
  const midInner1: Point2D = [(innerCenter[0] + inner1[0]) / 2, (innerCenter[1] + inner1[1]) / 2];
  const midInner2: Point2D = [(innerCenter[0] + inner2[0]) / 2, (innerCenter[1] + inner2[1]) / 2];
  const midInnerOuter: Point2D = [(inner1[0] + inner2[0]) / 2, (inner1[1] + inner2[1]) / 2];

  // Centroid Y-junction apex C of the equilateral wedge sub-triangle
  const C: Point2D = getCentroid(midSpoke1, midSpoke2, midOuter);

  switch (pType) {
    case '0':
      // 0: Empty sector
      return [];

    case '1': {
      // 1: Classic Asa-no-ha (Tripod branching from apex C)
      const branchCenter = createStrutDrawing(C, center, designThick);
      const branchSpoke1 = createStrutDrawing(C, v1, designThick);
      const branchSpoke2 = createStrutDrawing(C, v2, designThick);

      if (branchCenter) struts.push(branchCenter);
      if (branchSpoke1) struts.push(branchSpoke1);
      if (branchSpoke2) struts.push(branchSpoke2);
      break;
    }

    case '2': {
      // 2: Ryuso Asa-no-ha (Classic tripod + secondary framing struts)
      const branchCenter = createStrutDrawing(C, center, designThick);
      const branchSpoke1 = createStrutDrawing(C, v1, designThick);
      const branchSpoke2 = createStrutDrawing(C, v2, designThick);

      if (branchCenter) struts.push(branchCenter);
      if (branchSpoke1) struts.push(branchSpoke1);
      if (branchSpoke2) struts.push(branchSpoke2);

      const diag1 = createStrutDrawing(midInner1, midInnerOuter, designThick, 'inner');
      const diag2 = createStrutDrawing(midInner2, midInnerOuter, designThick, 'inner');
      const diag3 = createStrutDrawing(midInner1, midInner2, designThick, 'inner');

      if (diag1) struts.push(diag1);
      if (diag2) struts.push(diag2);
      if (diag3) struts.push(diag3);
      break;
    }

    default:
      break;
  }

  return struts;
}

/**
 * Builds the 3D Kumiko Keychain assembly with 4 distinct, non-overlapping parts:
 * 1. Kumiko_Hex_Frame (outer perimeter border)
 * 2. Kumiko_Hex_Spokes (6 radial spokes to hex corners, cut by hex frame)
 * 3. Kumiko_Lattice_Pattern (Asa-no-ha Y-lattice, cut by frame and spokes)
 * 4. Keychain_Ring_Attachment (keychain ring loop, cut by outer hex)
 */
export function buildKumikoKeychainParts(params: KumikoParameters): ReplicadPart[] {
  const rMidpoint = Number(params.hex_radius ?? 20);
  const tHex = Number(params.hex_thickness ?? 2);
  const tSpoke = Number(params.hex_spoke_thickness ?? 2);
  const tDesign = Number(params.hex_design_thickness ?? 1);
  const h = Number(params.height ?? 2);
  const hasRing = Boolean(params.include_keychain_ring ?? true);
  const tRing = Number(params.ring_thickness ?? 2);
  const fHex = Number(params.hex_fillet ?? 0.2);
  const fRing = Number(params.ring_fillet ?? 0.2);

  const deltaCorner = tHex / Math.sqrt(3);
  const rOuter = rMidpoint + deltaCorner;
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
  const innerSpokeVertices: [number, number][] = [];

  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 + Math.PI / 6;
    const vertex: [number, number] = [
      rMidpoint * Math.cos(angle),
      rMidpoint * Math.sin(angle)
    ];
    const innerVertex: [number, number] = [
      rInner * Math.cos(angle),
      rInner * Math.sin(angle)
    ];
    spokeVertices.push(vertex);
    innerSpokeVertices.push(innerVertex);

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

  let pattern2D: Drawing | null = null;

  const center: Point2D = [0, 0];
  const rInnerCenter = tSpoke; // Offset distance (tSpoke / 2) / sin(30°) = tSpoke

  for (let i = 0; i < 6; i++) {
    const patternType = sections[i];
    const angle1 = (i * Math.PI) / 3 + Math.PI / 6;
    const angle2 = ((i + 1) * Math.PI) / 3 + Math.PI / 6;
    const midAngle = (angle1 + angle2) / 2;

    // Vertex of the inner triangle closest to the center where adjacent spoke inner edges meet
    const innerCenter: Point2D = [
      rInnerCenter * Math.cos(midAngle),
      rInnerCenter * Math.sin(midAngle)
    ];

    const spokeTriangle: Triangle2D = [center, spokeVertices[i], spokeVertices[(i + 1) % 6]];
    const innerTriangle: Triangle2D = [innerCenter, innerSpokeVertices[i], innerSpokeVertices[(i + 1) % 6]];

    const sectorStruts = createSectorPattern(patternType, spokeTriangle, innerTriangle, tDesign);
    for (const strut of sectorStruts) {
      pattern2D = pattern2D ? pattern2D.fuse(strut) : strut;
    }
  }

  // 3D Boolean Cut: Extrude pattern solid first, then cut with hex frame and spokes solids
  if (pattern2D) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patternSketch = pattern2D.sketchOnPlane('XY') as any;
    let patternSolid = patternSketch.extrude(h);

    if (hexSolid) {
      try {
        patternSolid = patternSolid.cut(hexSolid);
      } catch {
        // Keep uncut if disjoint
      }
    }

    if (spokesSolid) {
      try {
        patternSolid = patternSolid.cut(spokesSolid);
      } catch {
        // Keep uncut if disjoint
      }
    }

    parts.push({
      shape: patternSolid,
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
