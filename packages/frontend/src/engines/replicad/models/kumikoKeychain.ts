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
 * Generates the 2D Asa-no-ha lattice pattern drawings for a 60° Kumiko wedge.
 * Sector is centered along the X-axis (spanning -30° to +30° between adjacent spokes).
 */
function createWedgePattern(
  patternType: string | number,
  rOuter: number,
  designThick: number
): Drawing[] {
  const pType = String(patternType);
  if (pType === '0') return []; // Empty sector

  // Vertices of the sector triangle (spokes at +30° and -30°)
  const angle = Math.PI / 6; // 30 deg
  const v1: [number, number] = [rOuter * Math.cos(angle), rOuter * Math.sin(angle)];
  const v2: [number, number] = [rOuter * Math.cos(-angle), rOuter * Math.sin(-angle)];

  // Midpoint of the outer flat frame side
  const midOuter: [number, number] = [(v1[0] + v2[0]) / 2, 0];

  // Midpoints of the two radial spokes
  const midSpoke1: [number, number] = [v1[0] / 2, v1[1] / 2];
  const midSpoke2: [number, number] = [v2[0] / 2, v2[1] / 2];

  // Centroid / 3-way Y-junction point of the equilateral triangle: C = (2/3) * midOuter
  const C: [number, number] = [(2 / 3) * midOuter[0], 0];

  const struts: Drawing[] = [];

  // 1. Three-legged Y-tripod branching from centroid C at 120° angles:
  // - Branch 1: Centroid C to outer flat frame midpoint
  const branchOuter = createStrutDrawing(C, midOuter, designThick);
  // - Branch 2: Centroid C to upper spoke midpoint
  const branchSpoke1 = createStrutDrawing(C, midSpoke1, designThick);
  // - Branch 3: Centroid C to lower spoke midpoint
  const branchSpoke2 = createStrutDrawing(C, midSpoke2, designThick);

  if (branchOuter) struts.push(branchOuter);
  if (branchSpoke1) struts.push(branchSpoke1);
  if (branchSpoke2) struts.push(branchSpoke2);

  // 2. Additional struts for Ryuso Asa-no-ha (Type '2')
  if (pType === '2') {
    const diag1 = createStrutDrawing(midOuter, midSpoke1, designThick);
    const diag2 = createStrutDrawing(midOuter, midSpoke2, designThick);
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
  const rOuter = Number(params.hex_radius ?? 20);
  const tHex = Number(params.hex_thickness ?? 2);
  const tSpoke = Number(params.hex_spoke_thickness ?? 2);
  const tDesign = Number(params.hex_design_thickness ?? 1);
  const h = Number(params.height ?? 2);
  const hasRing = Boolean(params.include_keychain_ring ?? true);
  const tRing = Number(params.ring_thickness ?? 2);
  const fHex = Number(params.hex_fillet ?? 0.2);
  const fRing = Number(params.ring_fillet ?? 0.2);

  const rInner = Math.max(2, rOuter - tHex);

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
      hexSolid = hexSolid.fillet(fHex);
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

  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 + Math.PI / 6;
    const spokeEnd: [number, number] = [
      rOuter * Math.cos(angle),
      rOuter * Math.sin(angle)
    ];
    const spoke = createStrutDrawing([0, 0], spokeEnd, tSpoke);
    if (spoke) {
      spokes2D = spokes2D ? spokes2D.fuse(spoke) : spoke;
    }
  }

  // Cut spokes with innerHex so they stop flush against the inner frame wall with zero overlap
  if (spokes2D) {
    const trimmedSpokes2D = spokes2D.intersect(innerHex);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spokesSketch = trimmedSpokes2D.sketchOnPlane('XY') as any;
    const spokesSolid = spokesSketch.extrude(h);

    parts.push({
      shape: spokesSolid,
      name: 'Kumiko_Hex_Spokes',
      color: '#2563eb'
    });
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
    const wedgeStruts = createWedgePattern(patternType, rOuter, tDesign);
    for (const strut of wedgeStruts) {
      const rotatedStrut = strut.rotate(i * 60, [0, 0]);
      pattern2D = pattern2D ? pattern2D.fuse(rotatedStrut) : rotatedStrut;
    }
  }

  // Cut the pattern with innerHex (frame) AND cut with spokes2D (spokes) for zero overlap
  if (pattern2D) {
    let trimmedPattern2D = pattern2D.intersect(innerHex);
    if (spokes2D) {
      trimmedPattern2D = trimmedPattern2D.cut(spokes2D);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patternSketch = trimmedPattern2D.sketchOnPlane('XY') as any;
    const patternSolid = patternSketch.extrude(h);

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
        ringSolid = ringSolid.fillet(fRing);
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
