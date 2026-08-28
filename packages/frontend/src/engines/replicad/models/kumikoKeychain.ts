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

/**
 * Creates a 2D rectangular strut drawing between two 2D points with given thickness
 */
function createStrutDrawing(
  p1: [number, number],
  p2: [number, number],
  thickness: number
): Drawing | null {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const length = Math.hypot(dx, dy);
  if (length < 0.001) return null;

  // Normal unit vector
  const nx = (-dy / length) * (thickness / 2);
  const ny = (dx / length) * (thickness / 2);

  return draw([p1[0] + nx, p1[1] + ny])
    .lineTo([p2[0] + nx, p2[1] + ny])
    .lineTo([p2[0] - nx, p2[1] - ny])
    .lineTo([p1[0] - nx, p1[1] - ny])
    .close();
}

/**
 * Generates the authentic 2D Asa-no-ha lattice pattern drawings for a 60° Kumiko wedge sector.
 * Directly constructed between the two sector vertices v1 and v2 for flawless geometric alignment.
 */
function createSectorPattern(
  patternType: string | number,
  v1: [number, number],
  v2: [number, number],
  designThick: number
): Drawing[] {
  const pType = String(patternType);
  if (pType === '0') return []; // Empty sector

  // Midpoints of boundary geometry
  const midSpoke1: [number, number] = [v1[0] / 2, v1[1] / 2];
  const midSpoke2: [number, number] = [v2[0] / 2, v2[1] / 2];
  const midOuter: [number, number] = [(v1[0] + v2[0]) / 2, (v1[1] + v2[1]) / 2];

  // Centroid Y-junction apex C of the equilateral wedge sub-triangle
  const C: [number, number] = getCentroid(midSpoke1, midSpoke2, midOuter);
  const struts: Drawing[] = [];

  // 1. Classic Asa-no-ha Y-junction (Tripod branching from apex C):
  // - Branch to center
  const branchCenter = createStrutDrawing(C, [0, 0], designThick);
  // - Branch to upper spoke vertex
  const branchSpoke1 = createStrutDrawing(C, v1, designThick);
  // - Branch to lower spoke vertex
  const branchSpoke2 = createStrutDrawing(C, v2, designThick);

  if (branchCenter) struts.push(branchCenter);
  if (branchSpoke1) struts.push(branchSpoke1);
  if (branchSpoke2) struts.push(branchSpoke2);

  // 2. Secondary sub-struts for Ryuso Asa-no-ha (Type '2')
  if (pType === '2') {
    const diag1 = createStrutDrawing(midSpoke1, midOuter, designThick);
    const diag2 = createStrutDrawing(midSpoke2, midOuter, designThick);
    const diag3 = createStrutDrawing(v1, C, designThick);
    const diag4 = createStrutDrawing(v2, C, designThick);

    if (diag1) struts.push(diag1);
    if (diag2) struts.push(diag2);
    if (diag3) struts.push(diag3);
    if (diag4) struts.push(diag4);
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

  let pattern2D: Drawing | null = null;

  for (let i = 0; i < 6; i++) {
    const patternType = sections[i];
    const v1 = spokeVertices[i];
    const v2 = spokeVertices[(i + 1) % 6];

    const sectorStruts = createSectorPattern(patternType, v1, v2, tDesign);
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
    // Cut the ring with outerHex so there is zero volume overlap with the frame
    const ring2D = ringOuter.cut(ringInner).cut(outerHex);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ringSketch = ring2D.sketchOnPlane('XY') as any;
    let ringSolid = ringSketch.extrude(h);

    if (fRing > 0 && fRing < 0.6) {
      try {
        // Fillet the outer ring loop edges, but preserve sharp mating faces where it touches the hex frame
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ringSolid = ringSolid.fillet(fRing, (ef: any) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ef.when(({ center, element }: any) => {
            const pt = center || element?.center || element?.startPoint;
            const x = pt?.x ?? pt?.[0] ?? 0;
            const y = pt?.y ?? pt?.[1] ?? 0;
            const distToCenter = Math.hypot(x, y);
            return distToCenter > rOuter + 0.1;
          })
        );
      } catch {
        // Keep unfilleted if geometry is non-manifold
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
