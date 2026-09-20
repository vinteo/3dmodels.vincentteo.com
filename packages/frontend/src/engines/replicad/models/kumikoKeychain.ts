import { drawCircle, AnyShape, makeCompound } from 'replicad';
import {
  type ReplicadPart,
  type ReplicadModelDefinition,
  type ModelDimensionItem,
  extractDefaultParameters
} from '../types';
import { KumikoParameters, kumikoParameters, buildKumikoHexCellParts } from './kumikoPatterns';

export const defaultKumikoParameters: KumikoParameters =
  extractDefaultParameters<KumikoParameters>(kumikoParameters);

export function buildKumikoKeychainParts(params: KumikoParameters): ReplicadPart[] {
  // Generate the core hexagon
  const parts = buildKumikoHexCellParts(params, false); // Don't fuse yet

  const rOuter = Number(params.hex_radius ?? 20);
  const h = Number(params.height ?? 2);
  const hasRing = Boolean(params.include_keychain_ring ?? true);
  const tRing = Number(params.ring_thickness ?? 2);
  const fRing = Number(params.ring_fillet ?? 0.2);

  // We need hexSolid to cut the ring properly. It should be the first part.
  const hexFramePart = parts.find((p) => p.name === 'Kumiko_Hex_Frame');
  const hexSolid = hexFramePart ? hexFramePart.shape : null;

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ringSolid = (ringSolid as any).fillet(fRing);
      } catch {
        // Keep unfilleted if geometry is non-manifold
      }
    }

    // 3D Boolean cut with hexSolid to ensure flush mating with zero gap or ledge overhang
    if (hexSolid) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ringSolid = (ringSolid as any).cut(hexSolid);
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  project: 'Hex Keychain',
  partName: 'Kumiko',
  description:
    'Customisable Simple Kumiko Inspired Keychain powered by Replicad & OpenCASCADE.js (zero API limits).',
  tags: ['Kumiko', '3D Print', 'Keychain', 'Replicad', 'Instant CAD'],
  sources: [
    {
      title: 'Kumiko Designer',
      url: 'https://www.kumikodesigner.com/',
      description:
        'An interactive design application for traditional Japanese kumiko woodworking patterns and panel arrangements.'
    }
  ],
  parameters: kumikoParameters,
  calculateDimensions: (params: KumikoParameters) => calculateKumikoDimensions(params),
  buildParts: (params: KumikoParameters) => buildKumikoKeychainParts(params),
  buildShape: (params: KumikoParameters) => buildKumikoKeychain(params)
};
