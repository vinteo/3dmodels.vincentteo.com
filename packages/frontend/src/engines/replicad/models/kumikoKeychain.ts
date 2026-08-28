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
 * Generates the 2D lattice pattern drawings for a single 60° Kumiko wedge
 */
function createWedgePattern(
  patternType: string | number,
  rInner: number,
  designThick: number
): Drawing[] {
  const pType = String(patternType);
  if (pType === '0') return []; // Empty sector

  const angle1 = 0;
  const angle2 = Math.PI / 3; // 60 deg

  const v0: [number, number] = [0, 0];
  const v1: [number, number] = [rInner * Math.cos(angle1), rInner * Math.sin(angle1)];
  const v2: [number, number] = [rInner * Math.cos(angle2), rInner * Math.sin(angle2)];

  // Midpoint of the outer edge
  const midOuter: [number, number] = [(v1[0] + v2[0]) / 2, (v1[1] + v2[1]) / 2];

  // Midpoints of radial spokes
  const midSpoke1: [number, number] = [v1[0] / 2, v1[1] / 2];
  const midSpoke2: [number, number] = [v2[0] / 2, v2[1] / 2];

  const struts: Drawing[] = [];

  // Central bisecting line from center to outer midpoint
  const centralBisector = createStrutDrawing(v0, midOuter, designThick);
  if (centralBisector) struts.push(centralBisector);

  // Asa-no-ha diagonal ribs
  const rib1 = createStrutDrawing(midOuter, midSpoke1, designThick);
  const rib2 = createStrutDrawing(midOuter, midSpoke2, designThick);
  if (rib1) struts.push(rib1);
  if (rib2) struts.push(rib2);

  // Additional struts for Ryuso Asa-no-ha (Type '2')
  if (pType === '2') {
    const centerInner: [number, number] = [midOuter[0] / 2, midOuter[1] / 2];
    const diamond1 = createStrutDrawing(centerInner, midSpoke1, designThick);
    const diamond2 = createStrutDrawing(centerInner, midSpoke2, designThick);
    const diamond3 = createStrutDrawing(v1, centerInner, designThick);
    const diamond4 = createStrutDrawing(v2, centerInner, designThick);

    if (diamond1) struts.push(diamond1);
    if (diamond2) struts.push(diamond2);
    if (diamond3) struts.push(diamond3);
    if (diamond4) struts.push(diamond4);
  }

  return struts;
}

/**
 * Builds the 3D Kumiko Keychain parts as distinct named components for STEP assemblies
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

  // 1. Outer & Inner Hexagonal Perimeter Frame
  const outerHex = drawPolysides(rOuter, 6);
  const innerHex = drawPolysides(rInner, 6);
  let internal2D: Drawing | null = null;

  // 2. 6 Radial Spokes (rotated 30 degrees)
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 + Math.PI / 6;
    const spokeEnd: [number, number] = [
      rOuter * Math.cos(angle),
      rOuter * Math.sin(angle)
    ];
    const spoke = createStrutDrawing([0, 0], spokeEnd, tSpoke);
    if (spoke) {
      internal2D = internal2D ? internal2D.fuse(spoke) : spoke;
    }
  }

  // 3. 6 Wedge Lattice Patterns (aligned with 30-degree spokes)
  const sections = [
    params.section_1 ?? '1',
    params.section_2 ?? '1',
    params.section_3 ?? '1',
    params.section_4 ?? '1',
    params.section_5 ?? '1',
    params.section_6 ?? '1'
  ];

  for (let i = 0; i < 6; i++) {
    const patternType = sections[i];
    const wedgeStruts = createWedgePattern(patternType, rInner, tDesign);
    for (const strut of wedgeStruts) {
      const rotatedStrut = strut.rotate(i * 60 + 30, [0, 0]);
      internal2D = internal2D ? internal2D.fuse(rotatedStrut) : rotatedStrut;
    }
  }

  // 4. Clip all internal geometry strictly to outerHex so spokes never protrude outside the frame
  const frame2D = outerHex.cut(innerHex);
  const composite2D = internal2D ? frame2D.fuse(internal2D.intersect(outerHex)) : frame2D;

  // 5. Extrude Kumiko Hexagon Part
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hexSketch = composite2D.sketchOnPlane('XY') as any;
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
      name: 'Kumiko_Hexagon_Body',
      color: '#475569'
    }
  ];

  // 6. Keychain Ring Loop Attachment (modeled as a separate part)
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

    parts.push({
      shape: ringSolid,
      name: 'Keychain_Ring_Attachment',
      color: '#a855f7'
    });
  }

  return parts;
}

/**
 * Builds the composite 3D Kumiko Keychain solid model for meshing
 */
export function buildKumikoKeychain(params: KumikoParameters): AnyShape {
  const parts = buildKumikoKeychainParts(params);
  if (parts.length === 1) return parts[0].shape;
  return makeCompound(parts.map((p) => p.shape));
}
