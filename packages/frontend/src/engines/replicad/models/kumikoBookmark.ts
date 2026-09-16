import { draw, AnyShape, makeCompound, sketchText } from 'replicad';
import { ParameterDefinition } from '../../../types/model';
import { type ReplicadPart, type ReplicadModelDefinition, type ModelDimensionItem } from '../types';
import { KumikoParameters, kumikoParameters, buildKumikoHexCellParts } from './kumikoPatterns';

export interface KumikoBookmarkParameters extends KumikoParameters {
  width?: number;
  height?: number;
  depth?: number;
  corner_radius?: number;
  frame_thickness?: number;
  enable_bar_1?: boolean;
  bar_1_y_pos?: number;
  bar_1_thickness?: number;
  bar_1_text?: string;
  bar_1_text_size?: number;
  enable_bar_2?: boolean;
  bar_2_y_pos?: number;
  bar_2_thickness?: number;
  bar_2_text?: string;
  bar_2_text_size?: number;
  enable_bar_3?: boolean;
  bar_3_y_pos?: number;
  bar_3_thickness?: number;
  bar_3_text?: string;
  bar_3_text_size?: number;
}

/**
 * Helper to efficiently fuse an array of solids using a binary tree reduction.
 * Fusing sequentially O(N^2) is very slow for large arrays.
 * This divide-and-conquer approach runs in O(N log N).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fuseArrayBinary(shapes: any[]): any {
  if (shapes.length === 0) return null;
  if (shapes.length === 1) return shapes[0];

  let currentLayer = [...shapes];
  while (currentLayer.length > 1) {
    const nextLayer = [];
    for (let i = 0; i < currentLayer.length; i += 2) {
      if (i + 1 < currentLayer.length) {
        try {
          nextLayer.push(currentLayer[i].fuse(currentLayer[i + 1]));
        } catch {
          // If fusion fails (e.g. non-manifold), just keep the first shape to prevent crashing
          nextLayer.push(currentLayer[i]);
        }
      } else {
        nextLayer.push(currentLayer[i]);
      }
    }
    currentLayer = nextLayer;
  }
  return currentLayer[0];
}

export const kumikoBookmarkParameters: ParameterDefinition[] = [
  {
    id: 'width',
    type: 'quantity',
    name: 'Bookmark Width',
    unit: 'millimeter',
    default: 50,
    min: 20,
    max: 100,
    step: 1,
    description: 'Width of the bookmark',
    group: 'Frame Dimensions'
  },
  {
    id: 'height',
    type: 'quantity',
    name: 'Bookmark Height',
    unit: 'millimeter',
    default: 150,
    min: 40,
    max: 200,
    step: 1,
    description: 'Height of the bookmark',
    group: 'Frame Dimensions'
  },
  {
    id: 'depth',
    type: 'quantity',
    name: 'Bookmark Depth (Thickness)',
    unit: 'millimeter',
    default: 0.6,
    min: 0.6,
    max: 1,
    step: 0.1,
    description: 'Extruded solid thickness / depth',
    group: 'Frame Dimensions'
  },
  {
    id: 'corner_radius',
    type: 'quantity',
    name: 'Corner Radius',
    unit: 'millimeter',
    default: 3,
    min: 0,
    max: 10,
    step: 0.5,
    description: 'Fillet radius for the outer corners of the frame',
    group: 'Frame Dimensions'
  },
  {
    id: 'frame_thickness',
    type: 'quantity',
    name: 'Frame Thickness',
    unit: 'millimeter',
    default: 3,
    min: 1,
    max: 10,
    step: 0.5,
    description: 'Thickness of the rectangular border frame',
    group: 'Frame Dimensions'
  },
  ...kumikoParameters
    .filter(
      (p) =>
        ![
          'include_keychain_ring',
          'ring_thickness',
          'ring_fillet',
          'height',
          'hex_fillet',
          'single_part',
          'fuse_all_parts'
        ].includes(p.id)
    )
    .map((p) => {
      // Override default values specifically for the Bookmark model
      if (p.id === 'hex_radius') return { ...p, default: 15 }; // Smaller hexagons look better on bookmarks
      if (p.id === 'hex_thickness') return { ...p, default: 1 };
      if (p.id === 'hex_spoke_thickness') return { ...p, default: 1 };
      return p;
    }),
  {
    id: 'enable_bar_1',
    type: 'boolean',
    name: 'Enable Text Bar 1',
    default: false,
    group: 'Text Bar 1'
  },
  {
    id: 'bar_1_text',
    type: 'string',
    name: 'Text (Bar 1)',
    default: 'READ',
    group: 'Text Bar 1',
    dependsOn: 'enable_bar_1'
  },
  {
    id: 'bar_1_y_pos',
    type: 'quantity',
    name: 'Y Position (Bar 1)',
    unit: 'millimeter',
    default: 0,
    min: -100,
    max: 100,
    step: 1,
    group: 'Text Bar 1',
    dependsOn: 'enable_bar_1'
  },
  {
    id: 'bar_1_thickness',
    type: 'quantity',
    name: 'Bar Thickness (Bar 1)',
    unit: 'millimeter',
    default: 15,
    min: 5,
    max: 40,
    step: 1,
    group: 'Text Bar 1',
    dependsOn: 'enable_bar_1'
  },
  {
    id: 'bar_1_text_size',
    type: 'quantity',
    name: 'Text Size (Bar 1)',
    unit: 'millimeter',
    default: 10,
    min: 3,
    max: 30,
    step: 0.5,
    group: 'Text Bar 1',
    dependsOn: 'enable_bar_1'
  },
  {
    id: 'enable_bar_2',
    type: 'boolean',
    name: 'Enable Text Bar 2',
    default: false,
    group: 'Text Bar 2'
  },
  {
    id: 'bar_2_text',
    type: 'string',
    name: 'Text (Bar 2)',
    default: '',
    group: 'Text Bar 2',
    dependsOn: 'enable_bar_2'
  },
  {
    id: 'bar_2_y_pos',
    type: 'quantity',
    name: 'Y Position (Bar 2)',
    unit: 'millimeter',
    default: 40,
    min: -100,
    max: 100,
    step: 1,
    group: 'Text Bar 2',
    dependsOn: 'enable_bar_2'
  },
  {
    id: 'bar_2_thickness',
    type: 'quantity',
    name: 'Bar Thickness (Bar 2)',
    unit: 'millimeter',
    default: 15,
    min: 5,
    max: 40,
    step: 1,
    group: 'Text Bar 2',
    dependsOn: 'enable_bar_2'
  },
  {
    id: 'bar_2_text_size',
    type: 'quantity',
    name: 'Text Size (Bar 2)',
    unit: 'millimeter',
    default: 10,
    min: 3,
    max: 30,
    step: 0.5,
    group: 'Text Bar 2',
    dependsOn: 'enable_bar_2'
  },
  {
    id: 'enable_bar_3',
    type: 'boolean',
    name: 'Enable Text Bar 3',
    default: false,
    group: 'Text Bar 3'
  },
  {
    id: 'bar_3_text',
    type: 'string',
    name: 'Text (Bar 3)',
    default: '',
    group: 'Text Bar 3',
    dependsOn: 'enable_bar_3'
  },
  {
    id: 'bar_3_y_pos',
    type: 'quantity',
    name: 'Y Position (Bar 3)',
    unit: 'millimeter',
    default: -40,
    min: -100,
    max: 100,
    step: 1,
    group: 'Text Bar 3',
    dependsOn: 'enable_bar_3'
  },
  {
    id: 'bar_3_thickness',
    type: 'quantity',
    name: 'Bar Thickness (Bar 3)',
    unit: 'millimeter',
    default: 15,
    min: 5,
    max: 40,
    step: 1,
    group: 'Text Bar 3',
    dependsOn: 'enable_bar_3'
  },
  {
    id: 'bar_3_text_size',
    type: 'quantity',
    name: 'Text Size (Bar 3)',
    unit: 'millimeter',
    default: 10,
    min: 3,
    max: 30,
    step: 0.5,
    group: 'Text Bar 3',
    dependsOn: 'enable_bar_3',
    description: 'Will be clamped to 2mm less than the bar thickness'
  },
  ...kumikoParameters.filter((p) => ['fuse_all_parts', 'single_part'].includes(p.id))
];

export function buildKumikoBookmarkParts(params: KumikoBookmarkParameters): ReplicadPart[] {
  const w = Number(params.width ?? 40);
  const h = Number(params.height ?? 120);
  const depth = Number(params.depth ?? 2);
  const cornerRadius = Number(params.corner_radius ?? 3);
  const tFrame = Number(params.frame_thickness ?? 2);

  // 1. Build the frame
  let frameOuter2D: any;
  if (cornerRadius > 0 && cornerRadius < Math.min(w / 2, h / 2)) {
    const r = cornerRadius;
    const segments = 16;
    const points: [number, number][] = [];

    // Top-Right corner (0 to pi/2)
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * (Math.PI / 2);
      points.push([w / 2 - r + r * Math.cos(angle), h / 2 - r + r * Math.sin(angle)]);
    }
    // Top-Left corner (pi/2 to pi)
    for (let i = 0; i <= segments; i++) {
      const angle = Math.PI / 2 + (i / segments) * (Math.PI / 2);
      points.push([-w / 2 + r + r * Math.cos(angle), h / 2 - r + r * Math.sin(angle)]);
    }
    // Bottom-Left corner (pi to 3pi/2)
    for (let i = 0; i <= segments; i++) {
      const angle = Math.PI + (i / segments) * (Math.PI / 2);
      points.push([-w / 2 + r + r * Math.cos(angle), -h / 2 + r + r * Math.sin(angle)]);
    }
    // Bottom-Right corner (3pi/2 to 2pi)
    for (let i = 0; i <= segments; i++) {
      const angle = Math.PI * 1.5 + (i / segments) * (Math.PI / 2);
      points.push([w / 2 - r + r * Math.cos(angle), -h / 2 + r + r * Math.sin(angle)]);
    }

    frameOuter2D = draw(points[0]);
    for (let i = 1; i < points.length; i++) {
      frameOuter2D = frameOuter2D.lineTo(points[i]);
    }
    frameOuter2D = frameOuter2D.close();
  } else {
    frameOuter2D = draw([w / 2, h / 2])
      .lineTo([-w / 2, h / 2])
      .lineTo([-w / 2, -h / 2])
      .lineTo([w / 2, -h / 2])
      .close();
  }

  const frameInner2D = draw([w / 2 - tFrame, h / 2 - tFrame])
    .lineTo([-w / 2 + tFrame, h / 2 - tFrame])
    .lineTo([-w / 2 + tFrame, -h / 2 + tFrame])
    .lineTo([w / 2 - tFrame, -h / 2 + tFrame])
    .close();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let frameOuterSolid = (frameOuter2D.sketchOnPlane('XY') as any).extrude(depth);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const frameInnerSolid = (frameInner2D.sketchOnPlane('XY') as any).extrude(depth);
  let frameSolid = frameOuterSolid.cut(frameInnerSolid);

  const barsConfig = [
    {
      enable: params.enable_bar_1,
      text: params.bar_1_text,
      yPos: Number(params.bar_1_y_pos ?? 0),
      thick: Number(params.bar_1_thickness ?? 15),
      size: Number(params.bar_1_text_size ?? 10)
    },
    {
      enable: params.enable_bar_2,
      text: params.bar_2_text,
      yPos: Number(params.bar_2_y_pos ?? 40),
      thick: Number(params.bar_2_thickness ?? 15),
      size: Number(params.bar_2_text_size ?? 10)
    },
    {
      enable: params.enable_bar_3,
      text: params.bar_3_text,
      yPos: Number(params.bar_3_y_pos ?? -40),
      thick: Number(params.bar_3_thickness ?? 15),
      size: Number(params.bar_3_text_size ?? 10)
    }
  ].filter((b) => b.enable);

  let frameInnerMinusBarsSolid = frameInnerSolid;
  const processedBars: any[] = [];

  for (const b of barsConfig) {
    const thick = Number(b.thick ?? 15);
    const size = Math.min(Number(b.size ?? 10), Math.max(1, thick - 2));
    const maxY = Math.max(0, (h - 2 * tFrame - thick) / 2);
    const yPos = Math.max(-maxY, Math.min(maxY, Number(b.yPos ?? 0)));

    const barWidth = w - 2 * tFrame + 1; // +1 for overlap safety
    const bar2D = draw([barWidth / 2, thick / 2])
      .lineTo([-barWidth / 2, thick / 2])
      .lineTo([-barWidth / 2, -thick / 2])
      .lineTo([barWidth / 2, -thick / 2])
      .close();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let barSolid = (bar2D.sketchOnPlane('XY') as any).extrude(depth).translate([0, yPos, 0]);
    frameInnerMinusBarsSolid = frameInnerMinusBarsSolid.cut(barSolid);

    if (b.text && b.text.trim().length > 0) {
      try {
        const textSketches = sketchText(
          b.text.trim(),
          { fontSize: size, fontFamily: 'Stencil' as any },
          { plane: 'XY' }
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const text3D = (textSketches as any).extrude(depth + 2);

        // Center text via bounding box
        const bb = text3D.boundingBox;
        const boundsMin = bb.bounds ? bb.bounds[0] : [0, 0, 0];
        const boundsMax = bb.bounds ? bb.bounds[1] : [0, 0, 0];

        const cx = (boundsMax[0] + boundsMin[0]) / 2;
        const cy = (boundsMax[1] + boundsMin[1]) / 2;

        // Translate text to center it at [0, yPos]
        const centeredText3D = text3D.translate([-cx, -cy + yPos, -1]);
        barSolid = barSolid.cut(centeredText3D);
      } catch (err) {
        console.warn('Failed to cut text for bar', err);
      }
    }
    processedBars.push(barSolid);
  }

  // 2. Generate a single hexagon cell
  const hexParams: KumikoParameters = {
    ...params,
    height: depth,
    include_keychain_ring: false,
    single_part: true
  };
  const cellParts = buildKumikoHexCellParts(hexParams);
  if (cellParts.length === 0) {
    return [{ shape: frameSolid, name: 'Kumiko_Bookmark_Frame', color: '#1e3a8a' }];
  }
  const cellSolid = cellParts[0].shape;

  // 3. Tile the hexagon
  const rOuter = Number(params.hex_radius ?? 20);
  const tHex = Number(params.hex_thickness ?? 2);
  const Dx = Math.sqrt(3) * rOuter - tHex;
  const Dy = (Dx * Math.sqrt(3)) / 2;

  const minX = -w / 2;
  const maxX = w / 2;
  const minY = -h / 2;
  const maxY = h / 2;

  const startCol = Math.floor(minX / Dx) - 1;
  const endCol = Math.ceil(maxX / Dx) + 1;
  const startRow = Math.floor(minY / Dy) - 1;
  const endRow = Math.ceil(maxY / Dy) + 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cells: any[] = [];

  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const cx = col * Dx + (row % 2 !== 0 ? Dx / 2 : 0);
      const cy = row * Dy;

      if (cx < minX - rOuter || cx > maxX + rOuter || cy < minY - rOuter || cy > maxY + rOuter) {
        continue;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const translatedCell = (cellSolid as any).clone().translate([cx, cy, 0]);
      cells.push(translatedCell);
    }
  }

  // 4. Trim individually and then fuse
  const shouldFuse = Boolean(params.single_part) || Boolean(params.fuse_all_parts);

  let latticeSolid: any = null;

  if (cells.length > 0) {
    // Intersect each cell independently with the inner frame (excluding bars area)
    const trimmedCells = cells
      .map((cell) => {
        try {
          return cell.intersect(frameInnerMinusBarsSolid);
        } catch {
          return null;
        }
      })
      .filter((cell) => cell !== null);

    if (shouldFuse) {
      latticeSolid = fuseArrayBinary(trimmedCells);
      if (latticeSolid) {
        try {
          frameSolid = frameSolid.fuse(latticeSolid);
        } catch {
          // fallback
        }
      }
    } else {
      // If not fusing to frame, we still want the lattice to be one unified part
      latticeSolid = fuseArrayBinary(trimmedCells);
    }
  }

  if (processedBars.length > 0) {
    const fusedBars = fuseArrayBinary(processedBars);
    if (fusedBars) {
      try {
        frameSolid = frameSolid.fuse(fusedBars);
      } catch {
        // fallback
      }
    }
  }

  if (shouldFuse || !latticeSolid) {
    return [
      {
        shape: frameSolid,
        name: 'Kumiko_Bookmark_Fused',
        color: '#f59e0b'
      }
    ];
  }

  return [
    {
      shape: frameSolid,
      name: 'Kumiko_Bookmark_Frame',
      color: '#1e3a8a'
    },
    {
      shape: latticeSolid,
      name: 'Kumiko_Bookmark_Lattice',
      color: '#f59e0b'
    }
  ];
}

export function buildKumikoBookmark(params: KumikoBookmarkParameters): AnyShape {
  const parts = buildKumikoBookmarkParts(params);
  if (parts.length === 1) return parts[0].shape;
  return makeCompound(parts.map((p) => p.shape));
}

export function calculateKumikoBookmarkDimensions(
  params: KumikoBookmarkParameters
): ModelDimensionItem[] {
  const w = Number(params.width ?? 40);
  const h = Number(params.height ?? 120);
  const depth = Number(params.depth ?? 2);

  return [
    {
      id: 'width',
      label: 'Overall Width',
      value: w,
      unit: 'mm',
      formatted: `${w.toFixed(1)} mm`,
      description: 'Total width of the bookmark'
    },
    {
      id: 'height',
      label: 'Overall Height',
      value: h,
      unit: 'mm',
      formatted: `${h.toFixed(1)} mm`,
      description: 'Total height of the bookmark'
    },
    {
      id: 'depth',
      label: 'Depth / Thickness',
      value: depth,
      unit: 'mm',
      formatted: `${depth.toFixed(1)} mm`,
      description: 'Extruded solid thickness'
    }
  ];
}

export const kumikoBookmarkModel: ReplicadModelDefinition<KumikoBookmarkParameters> = {
  id: 'kumiko-bookmark',
  name: 'Kumiko Bookmark',
  project: 'Bookmarks',
  partName: 'Kumiko Bookmark',
  description: 'Customizable rectangular bookmark filled with geometric Kumiko lattice patterns.',
  tags: ['Kumiko', '3D Print', 'Bookmark', 'Replicad'],
  parameters: kumikoBookmarkParameters,
  calculateDimensions: calculateKumikoBookmarkDimensions,
  buildParts: buildKumikoBookmarkParts,
  buildShape: buildKumikoBookmark
};
