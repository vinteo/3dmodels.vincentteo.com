import { draw, AnyShape, makeCompound, sketchText } from 'replicad';
import { ParameterDefinition } from '../../../types/model';
import { type ReplicadPart, type ReplicadModelDefinition, type ModelDimensionItem } from '../types';

export interface ChineseLatticeBookmarkParameters {
  width?: number;
  height?: number;
  depth?: number;
  corner_radius?: number;
  frame_thickness?: number;
  pattern?:
    | 'zhouzhuang'
    | 'grid_fret'
    | 'peano'
    | 'cross_fret'
    | 'gou_lian'
    | 'ba_jiao'
    | 'ya_zi'
    | 'deng_long'
    | 'shu_tiao'
    | 'hai_tang'
    | 'feng_che'
    | 'fang_sheng'
    | 'shuang_qian';
  cell_size?: number;
  strut_thickness?: number;
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
  single_part?: boolean | string;
  fuse_all_parts?: boolean | string;
  [key: string]: unknown;
}

export type Point2D = [number, number];
export type Segment2D = [Point2D, Point2D];

/**
 * Helper to efficiently fuse an array of solids using a binary tree reduction.
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

// -----------------------------------------------------------------------------
// Mathematical Chinese Lattice Pattern Algorithms
// Reference: "An Algorithmic Approach to Chinese Lattice Design" (Majewski & Wang)
// -----------------------------------------------------------------------------

/**
 * Rotates a 2D point by angle (in radians) around origin (0, 0)
 */
function rotatePoint(p: Point2D, rad: number): Point2D {
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return [
    Math.round((p[0] * cos - p[1] * sin) * 1e4) / 1e4,
    Math.round((p[0] * sin + p[1] * cos) * 1e4) / 1e4
  ];
}

/**
 * Generates the Zhouzhuang (Wan-zi / Swastika Meander) block segments.
 * Reference: Appendix 2, pages 92-94, 99-100.
 * Base tile size is 7 x 7 units, centered at (0, 0).
 */
export function getZhouzhuangBlockSegments(): Segment2D[] {
  const baseZigzag: Segment2D[] = [
    [
      [0, 0],
      [1, 0]
    ],
    [
      [1, 0],
      [1, 1]
    ],
    [
      [1, 1],
      [1, 2]
    ],
    [
      [1, 1],
      [2, 1]
    ]
  ];

  const cross1: Segment2D[] = [];
  const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
  for (const angle of angles) {
    for (const seg of baseZigzag) {
      cross1.push([rotatePoint(seg[0], angle), rotatePoint(seg[1], angle)]);
    }
  }

  const cross2: Segment2D[] = cross1.map((seg) => [
    [-seg[0][0], seg[0][1]],
    [-seg[1][0], seg[1][1]]
  ]);

  const blockSegments: Segment2D[] = [];

  // TL: Cross 2 translated by (-1.5, 1.5)
  for (const [p1, p2] of cross2) {
    blockSegments.push([
      [p1[0] - 1.5, p1[1] + 1.5],
      [p2[0] - 1.5, p2[1] + 1.5]
    ]);
  }
  // TR: Cross 1 translated by (1.5, 1.5)
  for (const [p1, p2] of cross1) {
    blockSegments.push([
      [p1[0] + 1.5, p1[1] + 1.5],
      [p2[0] + 1.5, p2[1] + 1.5]
    ]);
  }
  // BL: Cross 1 translated by (-1.5, -1.5)
  for (const [p1, p2] of cross1) {
    blockSegments.push([
      [p1[0] - 1.5, p1[1] - 1.5],
      [p2[0] - 1.5, p2[1] - 1.5]
    ]);
  }
  // BR: Cross 2 translated by (1.5, -1.5)
  for (const [p1, p2] of cross2) {
    blockSegments.push([
      [p1[0] + 1.5, p1[1] - 1.5],
      [p2[0] + 1.5, p2[1] - 1.5]
    ]);
  }

  // Surrounding 7x7 block frame
  blockSegments.push([
    [-3.5, -3.5],
    [3.5, -3.5]
  ]);
  blockSegments.push([
    [3.5, -3.5],
    [3.5, 3.5]
  ]);
  blockSegments.push([
    [3.5, 3.5],
    [-3.5, 3.5]
  ]);
  blockSegments.push([
    [-3.5, 3.5],
    [-3.5, -3.5]
  ]);

  return blockSegments;
}

/**
 * Generates the Grid-Based Stepped Fret segments.
 * Reference: Appendix 1, pages 88-91, 98-99.
 * Grid cell is 6 x 4 units, centered at (0, 0).
 */
export function getGridFretCellSegments(isEven: boolean): Segment2D[] {
  const rightSide: Segment2D[] = [
    [
      [0, 0],
      [1, 0]
    ],
    [
      [1, 0],
      [1, 2]
    ],
    [
      [1, 0],
      [1, -1]
    ],
    [
      [1, -1],
      [3, -1]
    ]
  ];

  const leftSide: Segment2D[] = rightSide.map((seg) => [
    rotatePoint(seg[0], Math.PI),
    rotatePoint(seg[1], Math.PI)
  ]);

  const p1 = [...rightSide, ...leftSide];
  const p2: Segment2D[] = p1.map((seg) => [
    [-seg[0][0], seg[0][1]],
    [-seg[1][0], seg[1][1]]
  ]);

  const motif = isEven ? p1 : p2;
  const segments = [...motif];

  segments.push([
    [-3, -2],
    [3, -2]
  ]);
  segments.push([
    [3, -2],
    [3, 2]
  ]);
  segments.push([
    [3, 2],
    [-3, 2]
  ]);
  segments.push([
    [-3, 2],
    [-3, -2]
  ]);

  return segments;
}

/**
 * Generates the Peano Curve Fractal segments (Generation 2).
 * Reference: Appendix 3, pages 95-97, 100-101.
 * Axiom: F
 * Rule: F -> F+F-F-F-F+F+F+F-F
 */
export function getPeanoCurveSegments(): Segment2D[] {
  let instructions = 'F';
  const rule = 'F+F-F-F-F+F+F+F-F';

  for (let gen = 0; gen < 2; gen++) {
    let next = '';
    for (const ch of instructions) {
      if (ch === 'F') next += rule;
      else next += ch;
    }
    instructions = next;
  }

  const segments: Segment2D[] = [];
  let x = 0;
  let y = 0;
  let dir = 1; // 0 = East, 1 = North, 2 = West, 3 = South

  for (const ch of instructions) {
    if (ch === 'F') {
      let nx = x;
      let ny = y;
      if (dir === 0) nx += 1;
      else if (dir === 1) ny += 1;
      else if (dir === 2) nx -= 1;
      else if (dir === 3) ny -= 1;

      segments.push([
        [x, y],
        [nx, ny]
      ]);
      x = nx;
      y = ny;
    } else if (ch === '+') {
      dir = (dir + 3) % 4;
    } else if (ch === '-') {
      dir = (dir + 1) % 4;
    }
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [p1, p2] of segments) {
    minX = Math.min(minX, p1[0], p2[0]);
    maxX = Math.max(maxX, p1[0], p2[0]);
    minY = Math.min(minY, p1[1], p2[1]);
    maxY = Math.max(maxY, p1[1], p2[1]);
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const halfW = (maxX - minX) / 2 + 0.5;
  const halfH = (maxY - minY) / 2 + 0.5;

  const normalizedSegments: Segment2D[] = segments.map((seg) => [
    [seg[0][0] - cx, seg[0][1] - cy],
    [seg[1][0] - cx, seg[1][1] - cy]
  ]);

  normalizedSegments.push([
    [-halfW, -halfH],
    [halfW, -halfH]
  ]);
  normalizedSegments.push([
    [halfW, -halfH],
    [halfW, halfH]
  ]);
  normalizedSegments.push([
    [halfW, halfH],
    [-halfW, halfH]
  ]);
  normalizedSegments.push([
    [-halfW, halfH],
    [-halfW, -halfH]
  ]);

  return normalizedSegments;
}

/**
 * Generates the Shi-Zi Jin (Interlocking Greek Cross Fret / 十字锦) segments.
 * Reference: Daniel Sheets Dye, Chinese Lattice Designs (Classic Song/Ming openwork window).
 * 6 x 6 unit cell with central Greek cross, stepped corners, and radiating arms.
 */
export function getCrossFretSegments(): Segment2D[] {
  return [
    // Outer boundary 6x6
    [
      [-3, -3],
      [3, -3]
    ],
    [
      [3, -3],
      [3, 3]
    ],
    [
      [3, 3],
      [-3, 3]
    ],
    [
      [-3, 3],
      [-3, -3]
    ],
    // Central Greek cross square
    [
      [-1, -1],
      [1, -1]
    ],
    [
      [1, -1],
      [1, 1]
    ],
    [
      [1, 1],
      [-1, 1]
    ],
    [
      [-1, 1],
      [-1, -1]
    ],
    // Radiating arms to outer boundary
    [
      [0, 1],
      [0, 3]
    ],
    [
      [0, -1],
      [0, -3]
    ],
    [
      [1, 0],
      [3, 0]
    ],
    [
      [-1, 0],
      [-3, 0]
    ],
    // Stepped corner L-brackets
    [
      [-2, 3],
      [-2, 2]
    ],
    [
      [-2, 2],
      [-3, 2]
    ],
    [
      [2, 3],
      [2, 2]
    ],
    [
      [2, 2],
      [3, 2]
    ],
    [
      [-2, -3],
      [-2, -2]
    ],
    [
      [-2, -2],
      [-3, -2]
    ],
    [
      [2, -3],
      [2, -2]
    ],
    [
      [2, -2],
      [3, -2]
    ],
    // Inner links
    [
      [-1, 2],
      [-2, 2]
    ],
    [
      [1, 2],
      [2, 2]
    ],
    [
      [-1, -2],
      [-2, -2]
    ],
    [
      [1, -2],
      [2, -2]
    ]
  ];
}

/**
 * Generates the Si-Fang Gou-Lian Hui-Wen (Interlocking Key Meander / 四方勾连回纹) segments.
 * Reference: Daniel Sheets Dye, Chinese Lattice Designs, Chapter 3 ("The Fret", Plates F2–F8).
 * 6 x 6 unit cell where spiral hooks interlock across cells without dead-ends.
 */
export function getGouLianHuiWenSegments(): Segment2D[] {
  return [
    // Outer boundary 6x6
    [
      [-3, -3],
      [3, -3]
    ],
    [
      [3, -3],
      [3, 3]
    ],
    [
      [3, 3],
      [-3, 3]
    ],
    [
      [-3, 3],
      [-3, -3]
    ],
    // Center cross
    [
      [-1, 0],
      [1, 0]
    ],
    [
      [0, -1],
      [0, 1]
    ],
    // Top-Right hook:
    [
      [0, 1],
      [2, 1]
    ],
    [
      [2, 1],
      [2, 2]
    ],
    [
      [2, 2],
      [1, 2]
    ],
    [
      [1, 2],
      [1, 3]
    ],
    // Top-Left hook:
    [
      [-1, 0],
      [-1, 2]
    ],
    [
      [-1, 2],
      [-2, 2]
    ],
    [
      [-2, 2],
      [-2, 1]
    ],
    [
      [-2, 1],
      [-3, 1]
    ],
    // Bottom-Left hook:
    [
      [0, -1],
      [-2, -1]
    ],
    [
      [-2, -1],
      [-2, -2]
    ],
    [
      [-2, -2],
      [-1, -2]
    ],
    [
      [-1, -2],
      [-1, -3]
    ],
    // Bottom-Right hook:
    [
      [1, 0],
      [1, -2]
    ],
    [
      [1, -2],
      [2, -2]
    ],
    [
      [2, -2],
      [2, -1]
    ],
    [
      [2, -1],
      [3, -1]
    ]
  ];
}

/**
 * Generates the Ba-Jiao Jin (Octagon & Square Fret / 八角锦) segments.
 * Reference: Daniel Sheets Dye, Chinese Lattice Designs, Chapter 10 ("The Octagon and Square", Plates O1–O6).
 * 8 x 8 unit cell with stepped octagonal window light, central square pane, and radiating anchors.
 */
export function getBaJiaoJinSegments(): Segment2D[] {
  return [
    // Outer boundary 8x8
    [
      [-4, -4],
      [4, -4]
    ],
    [
      [4, -4],
      [4, 4]
    ],
    [
      [4, 4],
      [-4, 4]
    ],
    [
      [-4, 4],
      [-4, -4]
    ],
    // Stepped octagonal inner ring
    [
      [-2, 3],
      [2, 3]
    ],
    [
      [-2, -3],
      [2, -3]
    ],
    [
      [-3, -2],
      [-3, 2]
    ],
    [
      [3, -2],
      [3, 2]
    ],
    // Corner steps connecting edges
    [
      [-2, 3],
      [-3, 3]
    ],
    [
      [-3, 3],
      [-3, 2]
    ],
    [
      [2, 3],
      [3, 3]
    ],
    [
      [3, 3],
      [3, 2]
    ],
    [
      [-2, -3],
      [-3, -3]
    ],
    [
      [-3, -3],
      [-3, -2]
    ],
    [
      [2, -3],
      [3, -3]
    ],
    [
      [3, -3],
      [3, -2]
    ],
    // Spokes connecting octagonal ring to outer frame
    [
      [0, 3],
      [0, 4]
    ],
    [
      [0, -3],
      [0, -4]
    ],
    [
      [-3, 0],
      [-4, 0]
    ],
    [
      [3, 0],
      [4, 0]
    ],
    // Central square pane
    [
      [-1, -1],
      [1, -1]
    ],
    [
      [1, -1],
      [1, 1]
    ],
    [
      [1, 1],
      [-1, 1]
    ],
    [
      [-1, 1],
      [-1, -1]
    ],
    // Spokes connecting central square to octagonal ring
    [
      [0, 1],
      [0, 3]
    ],
    [
      [0, -1],
      [0, -3]
    ],
    [
      [-1, 0],
      [-3, 0]
    ],
    [
      [1, 0],
      [3, 0]
    ]
  ];
}

/**
 * Generates the Ya-Zi Wen (Character "Ya" Indented Cruciform Fret / 亚字纹) segments.
 * Reference: Daniel Sheets Dye, Chinese Lattice Designs, Chapter 9 ("The 'Ya' (亚)", Plates Y1–Y12).
 * 8 x 8 unit cell representing the ancient bronze-age character 亞 with braced outer arms.
 */
export function getYaZiWenSegments(): Segment2D[] {
  return [
    // Outer boundary 8x8
    [
      [-4, -4],
      [4, -4]
    ],
    [
      [4, -4],
      [4, 4]
    ],
    [
      [4, 4],
      [-4, 4]
    ],
    [
      [-4, 4],
      [-4, -4]
    ],
    // Ya figure stepped contour
    // Top edge with central reentrant notch:
    [
      [-2, 3],
      [-1, 3]
    ],
    [
      [-1, 3],
      [-1, 2]
    ],
    [
      [-1, 2],
      [1, 2]
    ],
    [
      [1, 2],
      [1, 3]
    ],
    [
      [1, 3],
      [2, 3]
    ],
    // Bottom edge with central reentrant notch:
    [
      [-2, -3],
      [-1, -3]
    ],
    [
      [-1, -3],
      [-1, -2]
    ],
    [
      [-1, -2],
      [1, -2]
    ],
    [
      [1, -2],
      [1, -3]
    ],
    [
      [1, -3],
      [2, -3]
    ],
    // Left edge with central reentrant notch:
    [
      [-2, 3],
      [-2, 1]
    ],
    [
      [-2, 1],
      [-1, 1]
    ],
    [
      [-1, 1],
      [-1, -1]
    ],
    [
      [-1, -1],
      [-2, -1]
    ],
    [
      [-2, -1],
      [-2, -3]
    ],
    // Right edge with central reentrant notch:
    [
      [2, 3],
      [2, 1]
    ],
    [
      [2, 1],
      [1, 1]
    ],
    [
      [1, 1],
      [1, -1]
    ],
    [
      [1, -1],
      [2, -1]
    ],
    [
      [2, -1],
      [2, -3]
    ],
    // Radial spokes and corner braces connecting Ya figure to outer boundary:
    [
      [-2, 3],
      [-4, 3]
    ],
    [
      [-2, 3],
      [-2, 4]
    ],
    [
      [2, 3],
      [4, 3]
    ],
    [
      [2, 3],
      [2, 4]
    ],
    [
      [-2, -3],
      [-4, -3]
    ],
    [
      [-2, -3],
      [-2, -4]
    ],
    [
      [2, -3],
      [4, -3]
    ],
    [
      [2, -3],
      [2, -4]
    ],
    [
      [0, 2],
      [0, 4]
    ],
    [
      [0, -2],
      [0, -4]
    ],
    [
      [-1, 0],
      [-4, 0]
    ],
    [
      [1, 0],
      [4, 0]
    ]
  ];
}

/**
 * Generates the Deng-Long Jin (Lantern Fret / 灯笼锦) segments.
 * Reference: Traditional Suzhou and Palace Architectural Woodwork (Dye Chapter 11).
 * 8 x 8 unit cell with lantern body, suspension/pedestal ties, and corner brackets.
 */
export function getDengLongJinSegments(): Segment2D[] {
  return [
    // Outer boundary 8x8
    [
      [-4, -4],
      [4, -4]
    ],
    [
      [4, -4],
      [4, 4]
    ],
    [
      [4, 4],
      [-4, 4]
    ],
    [
      [-4, 4],
      [-4, -4]
    ],
    // Central Lantern Body
    [
      [-2, 2],
      [2, 2]
    ],
    [
      [-2, -2],
      [2, -2]
    ],
    [
      [-3, -1],
      [-3, 1]
    ],
    [
      [3, -1],
      [3, 1]
    ],
    [
      [-2, 2],
      [-3, 2]
    ],
    [
      [-3, 2],
      [-3, 1]
    ],
    [
      [2, 2],
      [3, 2]
    ],
    [
      [3, 2],
      [3, 1]
    ],
    [
      [-2, -2],
      [-3, -2]
    ],
    [
      [-3, -2],
      [-3, -1]
    ],
    [
      [2, -2],
      [3, -2]
    ],
    [
      [3, -2],
      [3, -1]
    ],
    // Interior lantern pane core
    [
      [-1, -1],
      [1, -1]
    ],
    [
      [1, -1],
      [1, 1]
    ],
    [
      [1, 1],
      [-1, 1]
    ],
    [
      [-1, 1],
      [-1, -1]
    ],
    // Spokes connecting inner core to lantern body
    [
      [0, 1],
      [0, 2]
    ],
    [
      [0, -1],
      [0, -2]
    ],
    [
      [-1, 0],
      [-3, 0]
    ],
    [
      [1, 0],
      [3, 0]
    ],
    // Lantern suspension cord (top) & tassel base (bottom)
    [
      [0, 2],
      [0, 4]
    ],
    [
      [0, -2],
      [0, -4]
    ],
    // Side supports
    [
      [-3, 0],
      [-4, 0]
    ],
    [
      [3, 0],
      [4, 0]
    ],
    // Corner braces to outer cell frame
    [
      [-3, 2],
      [-3, 4]
    ],
    [
      [-3, 2],
      [-4, 2]
    ],
    [
      [3, 2],
      [3, 4]
    ],
    [
      [3, 2],
      [4, 2]
    ],
    [
      [-3, -2],
      [-3, -4]
    ],
    [
      [-3, -2],
      [-4, -2]
    ],
    [
      [3, -2],
      [3, -4]
    ],
    [
      [3, -2],
      [4, -2]
    ]
  ];
}

/**
 * Generates the Shu-Tiao Wen (Scholar's Book Ribbon Fret / 书条纹 / 柳条锦) segments.
 * Reference: Daniel Sheets Dye, Chinese Lattice Designs, Chapter 2 ("The Parallel Line Grille", Plates P1–P10).
 * 6 x 6 unit cell with alternating blocks of 3 parallel slats (basket-weave lattice).
 */
export function getShuTiaoWenSegments(): Segment2D[] {
  return [
    // Outer boundary 6x6
    [
      [-3, -3],
      [3, -3]
    ],
    [
      [3, -3],
      [3, 3]
    ],
    [
      [3, 3],
      [-3, 3]
    ],
    [
      [-3, 3],
      [-3, -3]
    ],
    // Central dividing cross:
    [
      [-3, 0],
      [3, 0]
    ],
    [
      [0, -3],
      [0, 3]
    ],
    // Top-Left quadrant (vertical slats):
    [
      [-2, 0],
      [-2, 3]
    ],
    [
      [-1, 0],
      [-1, 3]
    ],
    // Top-Right quadrant (horizontal slats):
    [
      [0, 1],
      [3, 1]
    ],
    [
      [0, 2],
      [3, 2]
    ],
    // Bottom-Left quadrant (horizontal slats):
    [
      [-3, -1],
      [0, -1]
    ],
    [
      [-3, -2],
      [0, -2]
    ],
    // Bottom-Right quadrant (vertical slats):
    [
      [1, -3],
      [1, 0]
    ],
    [
      [2, -3],
      [2, 0]
    ]
  ];
}

/**
 * Generates the Hai-Tang Jin (Begonia Blossom Fret / 海棠锦) segments.
 * Reference: Daniel Sheets Dye, Chinese Lattice Designs, Chapter 14 ("Floral and Organic", Plates F20–F28).
 * 8 x 8 unit cell with 4 stepped petals forming a flowering crabapple blossom framed by corner brackets.
 */
export function getHaiTangJinSegments(): Segment2D[] {
  return [
    // Outer boundary 8x8
    [
      [-4, -4],
      [4, -4]
    ],
    [
      [4, -4],
      [4, 4]
    ],
    [
      [4, 4],
      [-4, 4]
    ],
    [
      [-4, 4],
      [-4, -4]
    ],
    // Central square pistil:
    [
      [-1, -1],
      [1, -1]
    ],
    [
      [1, -1],
      [1, 1]
    ],
    [
      [1, 1],
      [-1, 1]
    ],
    [
      [-1, 1],
      [-1, -1]
    ],
    // Top petal:
    [
      [-1, 1],
      [-2, 1]
    ],
    [
      [-2, 1],
      [-2, 3]
    ],
    [
      [-2, 3],
      [2, 3]
    ],
    [
      [2, 3],
      [2, 1]
    ],
    [
      [2, 1],
      [1, 1]
    ],
    // Bottom petal:
    [
      [-1, -1],
      [-2, -1]
    ],
    [
      [-2, -1],
      [-2, -3]
    ],
    [
      [-2, -3],
      [2, -3]
    ],
    [
      [2, -3],
      [2, -1]
    ],
    [
      [2, -1],
      [1, -1]
    ],
    // Left petal:
    [
      [-1, 1],
      [-1, 2]
    ],
    [
      [-1, 2],
      [-3, 2]
    ],
    [
      [-3, 2],
      [-3, -2]
    ],
    [
      [-3, -2],
      [-1, -2]
    ],
    [
      [-1, -2],
      [-1, -1]
    ],
    // Right petal:
    [
      [1, 1],
      [1, 2]
    ],
    [
      [1, 2],
      [3, 2]
    ],
    [
      [3, 2],
      [3, -2]
    ],
    [
      [3, -2],
      [1, -2]
    ],
    [
      [1, -2],
      [1, -1]
    ],
    // Cardinal anchors:
    [
      [0, 3],
      [0, 4]
    ],
    [
      [0, -3],
      [0, -4]
    ],
    [
      [-3, 0],
      [-4, 0]
    ],
    [
      [3, 0],
      [4, 0]
    ],
    // Corner braces:
    [
      [-2, 3],
      [-4, 3]
    ],
    [
      [-2, 3],
      [-2, 4]
    ],
    [
      [2, 3],
      [4, 3]
    ],
    [
      [2, 3],
      [2, 4]
    ],
    [
      [-2, -3],
      [-4, -3]
    ],
    [
      [-2, -3],
      [-2, -4]
    ],
    [
      [2, -3],
      [4, -3]
    ],
    [
      [2, -3],
      [2, -4]
    ]
  ];
}

/**
 * Generates the Feng-Che Wen (Windmill Pinwheel Fret / 风车纹 / 回风锦) segments.
 * Reference: Daniel Sheets Dye, Chinese Lattice Designs, Chapter 5 ("The Wheel and Windmill", Plates W1–W8).
 * 6 x 6 unit cell with 4 rotating spiral blades around a central square window hub.
 */
export function getFengCheWenSegments(): Segment2D[] {
  return [
    // Outer boundary 6x6
    [
      [-3, -3],
      [3, -3]
    ],
    [
      [3, -3],
      [3, 3]
    ],
    [
      [3, 3],
      [-3, 3]
    ],
    [
      [-3, 3],
      [-3, -3]
    ],
    // Center square hub:
    [
      [-1, -1],
      [1, -1]
    ],
    [
      [1, -1],
      [1, 1]
    ],
    [
      [1, 1],
      [-1, 1]
    ],
    [
      [-1, 1],
      [-1, -1]
    ],
    // Blade 1 (Top-Right):
    [
      [1, 1],
      [1, 3]
    ],
    [
      [1, 3],
      [3, 3]
    ],
    [
      [3, 3],
      [3, 1]
    ],
    [
      [3, 1],
      [2, 1]
    ],
    // Blade 2 (Top-Left):
    [
      [-1, 1],
      [-3, 1]
    ],
    [
      [-3, 1],
      [-3, 3]
    ],
    [
      [-3, 3],
      [-1, 3]
    ],
    [
      [-1, 3],
      [-1, 2]
    ],
    // Blade 3 (Bottom-Left):
    [
      [-1, -1],
      [-1, -3]
    ],
    [
      [-1, -3],
      [-3, -3]
    ],
    [
      [-3, -3],
      [-3, -1]
    ],
    [
      [-3, -1],
      [-2, -1]
    ],
    // Blade 4 (Bottom-Right):
    [
      [1, -1],
      [3, -1]
    ],
    [
      [3, -1],
      [3, -3]
    ],
    [
      [3, -3],
      [1, -3]
    ],
    [
      [1, -3],
      [1, -2]
    ],
    // Spokes from blades to frame or hub:
    [
      [2, 1],
      [2, 0]
    ],
    [
      [2, 0],
      [1, 0]
    ],
    [
      [-1, 2],
      [0, 2]
    ],
    [
      [0, 2],
      [0, 1]
    ],
    [
      [-2, -1],
      [-2, 0]
    ],
    [
      [-2, 0],
      [-1, 0]
    ],
    [
      [1, -2],
      [0, -2]
    ],
    [
      [0, -2],
      [0, -1]
    ]
  ];
}

/**
 * Generates the Fang-Sheng Wen (Interlocking Lozenge Fret / 方胜纹) segments.
 * Reference: Daniel Sheets Dye, Chinese Lattice Designs, Chapter 6 ("The Lozenge", Plates L1–L10).
 * 8 x 8 unit cell with stepped diamond lozenge and cruciform ties.
 */
export function getFangShengWenSegments(): Segment2D[] {
  return [
    // Outer boundary 8x8
    [
      [-4, -4],
      [4, -4]
    ],
    [
      [4, -4],
      [4, 4]
    ],
    [
      [4, 4],
      [-4, 4]
    ],
    [
      [-4, 4],
      [-4, -4]
    ],
    // Stepped outer diamond:
    [
      [0, 3],
      [1, 3]
    ],
    [
      [1, 3],
      [1, 2]
    ],
    [
      [1, 2],
      [2, 2]
    ],
    [
      [2, 2],
      [2, 1]
    ],
    [
      [2, 1],
      [3, 1]
    ],
    [
      [3, 1],
      [3, 0]
    ],
    [
      [3, 0],
      [3, -1]
    ],
    [
      [3, -1],
      [2, -1]
    ],
    [
      [2, -1],
      [2, -2]
    ],
    [
      [2, -2],
      [1, -2]
    ],
    [
      [1, -2],
      [1, -3]
    ],
    [
      [1, -3],
      [0, -3]
    ],
    [
      [0, -3],
      [-1, -3]
    ],
    [
      [-1, -3],
      [-1, -2]
    ],
    [
      [-1, -2],
      [-2, -2]
    ],
    [
      [-2, -2],
      [-2, -1]
    ],
    [
      [-2, -1],
      [-3, -1]
    ],
    [
      [-3, -1],
      [-3, 0]
    ],
    [
      [-3, 0],
      [-3, 1]
    ],
    [
      [-3, 1],
      [-2, 1]
    ],
    [
      [-2, 1],
      [-2, 2]
    ],
    [
      [-2, 2],
      [-1, 2]
    ],
    [
      [-1, 2],
      [-1, 3]
    ],
    [
      [-1, 3],
      [0, 3]
    ],
    // Inner cross extending to diamond:
    [
      [-3, 0],
      [3, 0]
    ],
    [
      [0, -3],
      [0, 3]
    ],
    // Ties to cell border:
    [
      [0, 3],
      [0, 4]
    ],
    [
      [0, -3],
      [0, -4]
    ],
    [
      [-3, 0],
      [-4, 0]
    ],
    [
      [3, 0],
      [4, 0]
    ],
    // Corner braces:
    [
      [2, 2],
      [4, 2]
    ],
    [
      [2, 2],
      [2, 4]
    ],
    [
      [-2, 2],
      [-4, 2]
    ],
    [
      [-2, 2],
      [-2, 4]
    ],
    [
      [2, -2],
      [4, -2]
    ],
    [
      [2, -2],
      [2, -4]
    ],
    [
      [-2, -2],
      [-4, -2]
    ],
    [
      [-2, -2],
      [-2, -4]
    ]
  ];
}

/**
 * Generates the Shuang-Qian Wen (Interlocking Double Cash Fret / 双钱纹 / 金钱锦) segments.
 * Reference: Daniel Sheets Dye, Chinese Lattice Designs, Chapter 13 ("The Double Cash", Plates C1–C12).
 * 8 x 8 unit cell with stepped coin rims and square cash apertures.
 */
export function getShuangQianWenSegments(): Segment2D[] {
  return [
    // Outer boundary 8x8
    [
      [-4, -4],
      [4, -4]
    ],
    [
      [4, -4],
      [4, 4]
    ],
    [
      [4, 4],
      [-4, 4]
    ],
    [
      [-4, 4],
      [-4, -4]
    ],
    // Central Cash Eye (square aperture of coin):
    [
      [-1, -1],
      [1, -1]
    ],
    [
      [1, -1],
      [1, 1]
    ],
    [
      [1, 1],
      [-1, 1]
    ],
    [
      [-1, 1],
      [-1, -1]
    ],
    // Stepped coin rim:
    [
      [-2, 3],
      [2, 3]
    ],
    [
      [-2, -3],
      [2, -3]
    ],
    [
      [-3, -2],
      [-3, 2]
    ],
    [
      [3, -2],
      [3, 2]
    ],
    // Corner steps:
    [
      [-2, 3],
      [-3, 3]
    ],
    [
      [-3, 3],
      [-3, 2]
    ],
    [
      [2, 3],
      [3, 3]
    ],
    [
      [3, 3],
      [3, 2]
    ],
    [
      [-2, -3],
      [-3, -3]
    ],
    [
      [-3, -3],
      [-3, -2]
    ],
    [
      [2, -3],
      [3, -3]
    ],
    [
      [3, -3],
      [3, -2]
    ],
    // Spokes between cash eye and rim:
    [
      [-1, 1],
      [-1, 3]
    ],
    [
      [1, 1],
      [1, 3]
    ],
    [
      [-1, -1],
      [-1, -3]
    ],
    [
      [1, -1],
      [1, -3]
    ],
    [
      [-1, 1],
      [-3, 1]
    ],
    [
      [-1, -1],
      [-3, -1]
    ],
    [
      [1, 1],
      [3, 1]
    ],
    [
      [1, -1],
      [3, -1]
    ],
    // Radial ties across boundary:
    [
      [0, 3],
      [0, 4]
    ],
    [
      [0, -3],
      [0, -4]
    ],
    [
      [-3, 0],
      [-4, 0]
    ],
    [
      [3, 0],
      [4, 0]
    ],
    // Corner ties:
    [
      [-3, 3],
      [-4, 3]
    ],
    [
      [-3, 3],
      [-3, 4]
    ],
    [
      [3, 3],
      [4, 3]
    ],
    [
      [3, 3],
      [3, 4]
    ],
    [
      [-3, -3],
      [-4, -3]
    ],
    [
      [-3, -3],
      [-3, -4]
    ],
    [
      [3, -3],
      [4, -3]
    ],
    [
      [3, -3],
      [3, -4]
    ]
  ];
}

/**
 * Robust 2D segment clipping and collinear strut merging
 */
export function clipAndMergeSegments(
  segments: Segment2D[],
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  barYRanges: [number, number][]
): Segment2D[] {
  const horizontalSegments: { y: number; x1: number; x2: number }[] = [];
  const verticalSegments: { x: number; y1: number; y2: number }[] = [];

  for (const [p1, p2] of segments) {
    const isHorizontal = Math.abs(p1[1] - p2[1]) < 1e-4;
    const isVertical = Math.abs(p1[0] - p2[0]) < 1e-4;

    if (isHorizontal) {
      const y = p1[1];
      if (y < yMin - 1e-4 || y > yMax + 1e-4) continue;
      const inBar = barYRanges.some(([b1, b2]) => y >= b1 - 1e-4 && y <= b2 + 1e-4);
      if (inBar) continue;

      const x1 = Math.max(xMin, Math.min(p1[0], p2[0]));
      const x2 = Math.min(xMax, Math.max(p1[0], p2[0]));
      if (x2 - x1 > 0.05) {
        horizontalSegments.push({ y, x1, x2 });
      }
    } else if (isVertical) {
      const x = p1[0];
      if (x < xMin - 1e-4 || x > xMax + 1e-4) continue;

      const yStart = Math.max(yMin, Math.min(p1[1], p2[1]));
      const yEnd = Math.min(yMax, Math.max(p1[1], p2[1]));
      if (yEnd - yStart <= 0.05) continue;

      let intervals: [number, number][] = [[yStart, yEnd]];
      for (const [b1, b2] of barYRanges) {
        const nextIntervals: [number, number][] = [];
        for (const [s, e] of intervals) {
          if (e <= b1 || s >= b2) {
            nextIntervals.push([s, e]);
          } else {
            if (s < b1) nextIntervals.push([s, b1]);
            if (e > b2) nextIntervals.push([b2, e]);
          }
        }
        intervals = nextIntervals;
      }

      for (const [s, e] of intervals) {
        if (e - s > 0.05) {
          verticalSegments.push({ x, y1: s, y2: e });
        }
      }
    }
  }

  // Merge collinear horizontal segments
  const mergedHoriz: Segment2D[] = [];
  const horizByY = new Map<number, [number, number][]>();
  for (const seg of horizontalSegments) {
    const key = Math.round(seg.y * 100) / 100;
    if (!horizByY.has(key)) horizByY.set(key, []);
    horizByY.get(key)!.push([seg.x1, seg.x2]);
  }

  for (const [y, intervals] of horizByY.entries()) {
    intervals.sort((a, b) => a[0] - b[0]);
    const merged: [number, number][] = [];
    let cur = [...intervals[0]] as [number, number];
    for (let i = 1; i < intervals.length; i++) {
      const next = intervals[i];
      if (next[0] <= cur[1] + 0.1) {
        cur[1] = Math.max(cur[1], next[1]);
      } else {
        merged.push(cur);
        cur = [...next];
      }
    }
    merged.push(cur);

    for (const [x1, x2] of merged) {
      mergedHoriz.push([
        [x1, y],
        [x2, y]
      ]);
    }
  }

  // Merge collinear vertical segments
  const mergedVert: Segment2D[] = [];
  const vertByX = new Map<number, [number, number][]>();
  for (const seg of verticalSegments) {
    const key = Math.round(seg.x * 100) / 100;
    if (!vertByX.has(key)) vertByX.set(key, []);
    vertByX.get(key)!.push([seg.y1, seg.y2]);
  }

  for (const [x, intervals] of vertByX.entries()) {
    intervals.sort((a, b) => a[0] - b[0]);
    const merged: [number, number][] = [];
    let cur = [...intervals[0]] as [number, number];
    for (let i = 1; i < intervals.length; i++) {
      const next = intervals[i];
      if (next[0] <= cur[1] + 0.1) {
        cur[1] = Math.max(cur[1], next[1]);
      } else {
        merged.push(cur);
        cur = [...next];
      }
    }
    merged.push(cur);

    for (const [y1, y2] of merged) {
      mergedVert.push([
        [x, y1],
        [x, y2]
      ]);
    }
  }

  return [...mergedHoriz, ...mergedVert];
}

// -----------------------------------------------------------------------------
// Parameters Schema
// -----------------------------------------------------------------------------

export const chineseLatticeBookmarkParameters: ParameterDefinition[] = [
  {
    id: 'width',
    type: 'quantity',
    name: 'Bookmark Width',
    unit: 'millimeter',
    default: 50,
    min: 25,
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
    min: 50,
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
  {
    id: 'pattern',
    type: 'enum',
    name: 'Lattice Pattern',
    default: 'zhouzhuang',
    options: [
      {
        value: 'zhouzhuang',
        label: '周庄万字纹 (Zhouzhuang Wan-Zi)',
        description:
          'Traditional Jiangnan swastika meander from Zhouzhuang window lattices (万字纹)'
      },
      {
        value: 'grid_fret',
        label: '步步锦 (Bu-Bu Jin / Stepped Fret)',
        description: 'Alternating stepped rectilinear motif in an orthogonal grid (步步锦)'
      },
      {
        value: 'peano',
        label: '皮亚诺曲折纹 (Peano Fractal)',
        description: 'Continuous space-filling fractal curve from classical maze fretwork (曲折纹)'
      },
      {
        value: 'cross_fret',
        label: '十字锦 (Shi-Zi Jin / Interlocking Cross)',
        description:
          'Traditional Song and Ming dynasty interlocking Greek cross and window pane lattice (十字锦)'
      },
      {
        value: 'gou_lian',
        label: '四方勾连回纹 (Gou-Lian Hui-Wen / Interlocking Key Meander)',
        description:
          'Continuous interlocking hook-and-spiral meander symbolizing eternal vitality (四方勾连回纹)'
      },
      {
        value: 'ba_jiao',
        label: '八角锦 (Ba-Jiao Jin / Octagon & Square Fret)',
        description:
          'Stepped octagonal lights with central panes and radial anchors from Suzhou gardens (八角锦)'
      },
      {
        value: 'ya_zi',
        label: '亚字纹 (Ya-Zi Wen / Character "Ya" Fret)',
        description:
          'Classical cruciform motif modeled on the ancient character 亞 symbolizing dignity and stability (亚字纹)'
      },
      {
        value: 'deng_long',
        label: '灯笼锦 (Deng-Long Jin / Lantern Fret)',
        description:
          'Lantern-shaped window grille motif with stepped corner brackets symbolizing celebration and light (灯笼锦)'
      },
      {
        value: 'shu_tiao',
        label: "书条纹 (Shu-Tiao Wen / Scholar's Ribbon Fret)",
        description:
          'Interlocking woven parallel slats favored in classical study pavilions and libraries (书条纹)'
      },
      {
        value: 'hai_tang',
        label: '海棠锦 (Hai-Tang Jin / Begonia Blossom Fret)',
        description:
          'Four-petaled Chinese begonia blossom motif framed by corner brackets from Suzhou gardens (海棠锦)'
      },
      {
        value: 'feng_che',
        label: '风车纹 (Feng-Che Wen / Windmill Pinwheel Fret)',
        description:
          'Dynamic rotating spiral wind-blades orbiting square hubs symbolizing favorable fortune (风车纹)'
      },
      {
        value: 'fang_sheng',
        label: '方胜纹 (Fang-Sheng Wen / Interlocking Lozenge Fret)',
        description:
          'Interlocking diamond lozenges symbolizing harmony, fidelity, and good fortune (方胜纹)'
      },
      {
        value: 'shuang_qian',
        label: '双钱纹 (Shuang-Qian Wen / Interlocking Double Cash Fret)',
        description:
          'Overlapping ancient coins with square apertures symbolizing continuous prosperity (双钱纹)'
      }
    ],
    group: 'Lattice Design',
    description: 'Algorithmic Chinese lattice pattern based on traditional window architecture'
  },
  {
    id: 'cell_size',
    type: 'quantity',
    name: 'Pattern Cell Size',
    unit: 'millimeter',
    default: 20,
    min: 10,
    max: 40,
    step: 1,
    description: 'Size of repeating lattice blocks',
    group: 'Lattice Design'
  },
  {
    id: 'strut_thickness',
    type: 'quantity',
    name: 'Strut Thickness',
    unit: 'millimeter',
    default: 1.2,
    min: 0.6,
    max: 2.5,
    step: 0.1,
    description: 'Width of internal lattice bars',
    group: 'Lattice Design'
  },
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
    dependsOn: 'enable_bar_3'
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

// -----------------------------------------------------------------------------
// Dynamic Constraints & Dimensions
// -----------------------------------------------------------------------------

export function calculateChineseLatticeBookmarkDynamicConstraints(
  params: Record<string, any>
): Record<string, { min?: number; max?: number }> {
  const rules: Record<string, { min?: number; max?: number }> = {};
  const h = Number(params['height'] ?? 150);
  const tFrame = Number(params['frame_thickness'] ?? 3);

  for (let i = 1; i <= 3; i++) {
    const thick = Number(params[`bar_${i}_thickness`] ?? 15);
    rules[`bar_${i}_text_size`] = { max: Math.max(1, thick - 2) };
    const maxY = Math.max(0, (h - 2 * tFrame - thick) / 2);
    rules[`bar_${i}_y_pos`] = { min: -maxY, max: maxY };
  }

  return rules;
}

export function calculateChineseLatticeBookmarkDimensions(
  params: ChineseLatticeBookmarkParameters
): ModelDimensionItem[] {
  const w = Number(params.width ?? 50);
  const h = Number(params.height ?? 150);
  const depth = Number(params.depth ?? 0.6);

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

// -----------------------------------------------------------------------------
// 3D Geometry Part Generation
// -----------------------------------------------------------------------------

export function buildChineseLatticeBookmarkParts(
  params: ChineseLatticeBookmarkParameters
): ReplicadPart[] {
  const w = Number(params.width ?? 50);
  const h = Number(params.height ?? 150);
  const depth = Number(params.depth ?? 0.6);
  const r = Math.min(Number(params.corner_radius ?? 3), w / 2, h / 2);
  const tFrame = Number(params.frame_thickness ?? 3);
  const pattern = params.pattern || 'zhouzhuang';
  const cellSize = Math.max(8, Number(params.cell_size ?? 20));
  const strutThickness = Math.max(0.4, Number(params.strut_thickness ?? 1.2));

  // 1. Outer & Inner Frame
  let frameOuter2D;
  if (r > 0) {
    const segments = 8;
    const points: [number, number][] = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * (Math.PI / 2);
      points.push([w / 2 - r + r * Math.cos(angle), h / 2 - r + r * Math.sin(angle)]);
    }
    for (let i = 0; i <= segments; i++) {
      const angle = Math.PI / 2 + (i / segments) * (Math.PI / 2);
      points.push([-w / 2 + r + r * Math.cos(angle), h / 2 - r + r * Math.sin(angle)]);
    }
    for (let i = 0; i <= segments; i++) {
      const angle = Math.PI + (i / segments) * (Math.PI / 2);
      points.push([-w / 2 + r + r * Math.cos(angle), -h / 2 + r + r * Math.sin(angle)]);
    }
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
  const frameOuterSolid = (frameOuter2D.sketchOnPlane('XY') as any).extrude(depth);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const frameInnerSolid = (frameInner2D.sketchOnPlane('XY') as any).extrude(depth);
  let frameSolid = frameOuterSolid.cut(frameInnerSolid);

  // 2. Horizontal Text Cutout Bars
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

  const processedBars: any[] = [];
  const barYRanges: [number, number][] = [];

  for (const b of barsConfig) {
    const thick = Number(b.thick ?? 15);
    const size = Math.min(Number(b.size ?? 10), Math.max(1, thick - 2));
    const maxY = Math.max(0, (h - 2 * tFrame - thick) / 2);
    const yPos = Math.max(-maxY, Math.min(maxY, Number(b.yPos ?? 0)));

    barYRanges.push([yPos - thick / 2, yPos + thick / 2]);

    const barWidth = w - 2 * tFrame + 1;
    const bar2D = draw([barWidth / 2, thick / 2])
      .lineTo([-barWidth / 2, thick / 2])
      .lineTo([-barWidth / 2, -thick / 2])
      .lineTo([barWidth / 2, -thick / 2])
      .close();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let barSolid = (bar2D.sketchOnPlane('XY') as any).extrude(depth).translate([0, yPos, 0]);

    if (b.text && b.text.trim().length > 0) {
      try {
        const textSketches = sketchText(
          b.text.trim(),
          { fontSize: size, fontFamily: 'Stencil' as any },
          { plane: 'XY' }
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const text3D = (textSketches as any).extrude(depth + 2);
        const bb = text3D.boundingBox;
        const boundsMin = bb.bounds ? bb.bounds[0] : [0, 0, 0];
        const boundsMax = bb.bounds ? bb.bounds[1] : [0, 0, 0];

        const cx = (boundsMax[0] + boundsMin[0]) / 2;
        const cy = (boundsMax[1] + boundsMin[1]) / 2;

        const centeredText3D = text3D.translate([-cx, -cy + yPos, -1]);
        barSolid = barSolid.cut(centeredText3D);
      } catch (err) {
        console.warn('Failed to cut text for bar', err);
      }
    }
    processedBars.push(barSolid);
  }

  // 3. Generate and Clip Chinese Lattice Segments in 2D
  const innerW = w - 2 * tFrame;
  const innerH = h - 2 * tFrame;
  const minX = -innerW / 2;
  const maxX = innerW / 2;
  const minY = -innerH / 2;
  const maxY = innerH / 2;

  const rawAllSegments: Segment2D[] = [];

  if (pattern === 'zhouzhuang') {
    const rawSegments = getZhouzhuangBlockSegments();
    const scale = cellSize / 7;
    const step = cellSize;
    const startCol = Math.floor(minX / step) - 1;
    const endCol = Math.ceil(maxX / step) + 1;
    const startRow = Math.floor(minY / step) - 1;
    const endRow = Math.ceil(maxY / step) + 1;

    for (let rIdx = startRow; rIdx <= endRow; rIdx++) {
      for (let cIdx = startCol; cIdx <= endCol; cIdx++) {
        const cx = cIdx * step;
        const cy = rIdx * step;

        if (
          cx + step / 2 < minX ||
          cx - step / 2 > maxX ||
          cy + step / 2 < minY ||
          cy - step / 2 > maxY
        ) {
          continue;
        }

        for (const [p1, p2] of rawSegments) {
          rawAllSegments.push([
            [cx + p1[0] * scale, cy + p1[1] * scale],
            [cx + p2[0] * scale, cy + p2[1] * scale]
          ]);
        }
      }
    }
  } else if (pattern === 'grid_fret') {
    const stepX = cellSize;
    const stepY = cellSize * (4 / 6);
    const scale = cellSize / 6;

    const rawEven = getGridFretCellSegments(true);
    const rawOdd = getGridFretCellSegments(false);

    const startCol = Math.floor(minX / stepX) - 1;
    const endCol = Math.ceil(maxX / stepX) + 1;
    const startRow = Math.floor(minY / stepY) - 1;
    const endRow = Math.ceil(maxY / stepY) + 1;

    for (let rIdx = startRow; rIdx <= endRow; rIdx++) {
      for (let cIdx = startCol; cIdx <= endCol; cIdx++) {
        const cx = cIdx * stepX;
        const cy = rIdx * stepY;

        if (
          cx + stepX / 2 < minX ||
          cx - stepX / 2 > maxX ||
          cy + stepY / 2 < minY ||
          cy - stepY / 2 > maxY
        ) {
          continue;
        }

        const isEven = (Math.abs(cIdx) + Math.abs(rIdx)) % 2 === 0;
        const base = isEven ? rawEven : rawOdd;
        for (const [p1, p2] of base) {
          rawAllSegments.push([
            [cx + p1[0] * scale, cy + p1[1] * scale],
            [cx + p2[0] * scale, cy + p2[1] * scale]
          ]);
        }
      }
    }
  } else if (pattern === 'peano') {
    const rawPeano = getPeanoCurveSegments();
    let pMinX = Infinity;
    let pMaxX = -Infinity;
    for (const [p1, p2] of rawPeano) {
      pMinX = Math.min(pMinX, p1[0], p2[0]);
      pMaxX = Math.max(pMaxX, p1[0], p2[0]);
    }
    const baseW = Math.max(1, pMaxX - pMinX);
    const scale = cellSize / baseW;
    const step = cellSize;

    const startCol = Math.floor(minX / step) - 1;
    const endCol = Math.ceil(maxX / step) + 1;
    const startRow = Math.floor(minY / step) - 1;
    const endRow = Math.ceil(maxY / step) + 1;

    for (let rIdx = startRow; rIdx <= endRow; rIdx++) {
      for (let cIdx = startCol; cIdx <= endCol; cIdx++) {
        const cx = cIdx * step;
        const cy = rIdx * step;

        if (
          cx + step / 2 < minX ||
          cx - step / 2 > maxX ||
          cy + step / 2 < minY ||
          cy - step / 2 > maxY
        ) {
          continue;
        }

        for (const [p1, p2] of rawPeano) {
          rawAllSegments.push([
            [cx + p1[0] * scale, cy + p1[1] * scale],
            [cx + p2[0] * scale, cy + p2[1] * scale]
          ]);
        }
      }
    }
  } else if (pattern === 'cross_fret') {
    const rawCrossFret = getCrossFretSegments();
    const scale = cellSize / 6;
    const step = cellSize;

    const startCol = Math.floor(minX / step) - 1;
    const endCol = Math.ceil(maxX / step) + 1;
    const startRow = Math.floor(minY / step) - 1;
    const endRow = Math.ceil(maxY / step) + 1;

    for (let rIdx = startRow; rIdx <= endRow; rIdx++) {
      for (let cIdx = startCol; cIdx <= endCol; cIdx++) {
        const cx = cIdx * step;
        const cy = rIdx * step;

        if (
          cx + step / 2 < minX ||
          cx - step / 2 > maxX ||
          cy + step / 2 < minY ||
          cy - step / 2 > maxY
        ) {
          continue;
        }

        for (const [p1, p2] of rawCrossFret) {
          rawAllSegments.push([
            [cx + p1[0] * scale, cy + p1[1] * scale],
            [cx + p2[0] * scale, cy + p2[1] * scale]
          ]);
        }
      }
    }
  } else if (pattern === 'gou_lian') {
    const rawGouLian = getGouLianHuiWenSegments();
    const scale = cellSize / 6;
    const step = cellSize;

    const startCol = Math.floor(minX / step) - 1;
    const endCol = Math.ceil(maxX / step) + 1;
    const startRow = Math.floor(minY / step) - 1;
    const endRow = Math.ceil(maxY / step) + 1;

    for (let rIdx = startRow; rIdx <= endRow; rIdx++) {
      for (let cIdx = startCol; cIdx <= endCol; cIdx++) {
        const cx = cIdx * step;
        const cy = rIdx * step;

        if (
          cx + step / 2 < minX ||
          cx - step / 2 > maxX ||
          cy + step / 2 < minY ||
          cy - step / 2 > maxY
        ) {
          continue;
        }

        for (const [p1, p2] of rawGouLian) {
          rawAllSegments.push([
            [cx + p1[0] * scale, cy + p1[1] * scale],
            [cx + p2[0] * scale, cy + p2[1] * scale]
          ]);
        }
      }
    }
  } else if (pattern === 'ba_jiao') {
    const rawBaJiao = getBaJiaoJinSegments();
    const scale = cellSize / 8;
    const step = cellSize;

    const startCol = Math.floor(minX / step) - 1;
    const endCol = Math.ceil(maxX / step) + 1;
    const startRow = Math.floor(minY / step) - 1;
    const endRow = Math.ceil(maxY / step) + 1;

    for (let rIdx = startRow; rIdx <= endRow; rIdx++) {
      for (let cIdx = startCol; cIdx <= endCol; cIdx++) {
        const cx = cIdx * step;
        const cy = rIdx * step;

        if (
          cx + step / 2 < minX ||
          cx - step / 2 > maxX ||
          cy + step / 2 < minY ||
          cy - step / 2 > maxY
        ) {
          continue;
        }

        for (const [p1, p2] of rawBaJiao) {
          rawAllSegments.push([
            [cx + p1[0] * scale, cy + p1[1] * scale],
            [cx + p2[0] * scale, cy + p2[1] * scale]
          ]);
        }
      }
    }
  } else if (pattern === 'ya_zi') {
    const rawYaZi = getYaZiWenSegments();
    const scale = cellSize / 8;
    const step = cellSize;

    const startCol = Math.floor(minX / step) - 1;
    const endCol = Math.ceil(maxX / step) + 1;
    const startRow = Math.floor(minY / step) - 1;
    const endRow = Math.ceil(maxY / step) + 1;

    for (let rIdx = startRow; rIdx <= endRow; rIdx++) {
      for (let cIdx = startCol; cIdx <= endCol; cIdx++) {
        const cx = cIdx * step;
        const cy = rIdx * step;

        if (
          cx + step / 2 < minX ||
          cx - step / 2 > maxX ||
          cy + step / 2 < minY ||
          cy - step / 2 > maxY
        ) {
          continue;
        }

        for (const [p1, p2] of rawYaZi) {
          rawAllSegments.push([
            [cx + p1[0] * scale, cy + p1[1] * scale],
            [cx + p2[0] * scale, cy + p2[1] * scale]
          ]);
        }
      }
    }
  } else if (pattern === 'deng_long') {
    const rawDengLong = getDengLongJinSegments();
    const scale = cellSize / 8;
    const step = cellSize;

    const startCol = Math.floor(minX / step) - 1;
    const endCol = Math.ceil(maxX / step) + 1;
    const startRow = Math.floor(minY / step) - 1;
    const endRow = Math.ceil(maxY / step) + 1;

    for (let rIdx = startRow; rIdx <= endRow; rIdx++) {
      for (let cIdx = startCol; cIdx <= endCol; cIdx++) {
        const cx = cIdx * step;
        const cy = rIdx * step;

        if (
          cx + step / 2 < minX ||
          cx - step / 2 > maxX ||
          cy + step / 2 < minY ||
          cy - step / 2 > maxY
        ) {
          continue;
        }

        for (const [p1, p2] of rawDengLong) {
          rawAllSegments.push([
            [cx + p1[0] * scale, cy + p1[1] * scale],
            [cx + p2[0] * scale, cy + p2[1] * scale]
          ]);
        }
      }
    }
  } else if (pattern === 'shu_tiao') {
    const rawShuTiao = getShuTiaoWenSegments();
    const scale = cellSize / 6;
    const step = cellSize;

    const startCol = Math.floor(minX / step) - 1;
    const endCol = Math.ceil(maxX / step) + 1;
    const startRow = Math.floor(minY / step) - 1;
    const endRow = Math.ceil(maxY / step) + 1;

    for (let rIdx = startRow; rIdx <= endRow; rIdx++) {
      for (let cIdx = startCol; cIdx <= endCol; cIdx++) {
        const cx = cIdx * step;
        const cy = rIdx * step;

        if (
          cx + step / 2 < minX ||
          cx - step / 2 > maxX ||
          cy + step / 2 < minY ||
          cy - step / 2 > maxY
        ) {
          continue;
        }

        for (const [p1, p2] of rawShuTiao) {
          rawAllSegments.push([
            [cx + p1[0] * scale, cy + p1[1] * scale],
            [cx + p2[0] * scale, cy + p2[1] * scale]
          ]);
        }
      }
    }
  } else if (pattern === 'hai_tang') {
    const rawHaiTang = getHaiTangJinSegments();
    const scale = cellSize / 8;
    const step = cellSize;

    const startCol = Math.floor(minX / step) - 1;
    const endCol = Math.ceil(maxX / step) + 1;
    const startRow = Math.floor(minY / step) - 1;
    const endRow = Math.ceil(maxY / step) + 1;

    for (let rIdx = startRow; rIdx <= endRow; rIdx++) {
      for (let cIdx = startCol; cIdx <= endCol; cIdx++) {
        const cx = cIdx * step;
        const cy = rIdx * step;

        if (
          cx + step / 2 < minX ||
          cx - step / 2 > maxX ||
          cy + step / 2 < minY ||
          cy - step / 2 > maxY
        ) {
          continue;
        }

        for (const [p1, p2] of rawHaiTang) {
          rawAllSegments.push([
            [cx + p1[0] * scale, cy + p1[1] * scale],
            [cx + p2[0] * scale, cy + p2[1] * scale]
          ]);
        }
      }
    }
  } else if (pattern === 'feng_che') {
    const rawFengChe = getFengCheWenSegments();
    const scale = cellSize / 6;
    const step = cellSize;

    const startCol = Math.floor(minX / step) - 1;
    const endCol = Math.ceil(maxX / step) + 1;
    const startRow = Math.floor(minY / step) - 1;
    const endRow = Math.ceil(maxY / step) + 1;

    for (let rIdx = startRow; rIdx <= endRow; rIdx++) {
      for (let cIdx = startCol; cIdx <= endCol; cIdx++) {
        const cx = cIdx * step;
        const cy = rIdx * step;

        if (
          cx + step / 2 < minX ||
          cx - step / 2 > maxX ||
          cy + step / 2 < minY ||
          cy - step / 2 > maxY
        ) {
          continue;
        }

        for (const [p1, p2] of rawFengChe) {
          rawAllSegments.push([
            [cx + p1[0] * scale, cy + p1[1] * scale],
            [cx + p2[0] * scale, cy + p2[1] * scale]
          ]);
        }
      }
    }
  } else if (pattern === 'fang_sheng') {
    const rawFangSheng = getFangShengWenSegments();
    const scale = cellSize / 8;
    const step = cellSize;

    const startCol = Math.floor(minX / step) - 1;
    const endCol = Math.ceil(maxX / step) + 1;
    const startRow = Math.floor(minY / step) - 1;
    const endRow = Math.ceil(maxY / step) + 1;

    for (let rIdx = startRow; rIdx <= endRow; rIdx++) {
      for (let cIdx = startCol; cIdx <= endCol; cIdx++) {
        const cx = cIdx * step;
        const cy = rIdx * step;

        if (
          cx + step / 2 < minX ||
          cx - step / 2 > maxX ||
          cy + step / 2 < minY ||
          cy - step / 2 > maxY
        ) {
          continue;
        }

        for (const [p1, p2] of rawFangSheng) {
          rawAllSegments.push([
            [cx + p1[0] * scale, cy + p1[1] * scale],
            [cx + p2[0] * scale, cy + p2[1] * scale]
          ]);
        }
      }
    }
  } else if (pattern === 'shuang_qian') {
    const rawShuangQian = getShuangQianWenSegments();
    const scale = cellSize / 8;
    const step = cellSize;

    const startCol = Math.floor(minX / step) - 1;
    const endCol = Math.ceil(maxX / step) + 1;
    const startRow = Math.floor(minY / step) - 1;
    const endRow = Math.ceil(maxY / step) + 1;

    for (let rIdx = startRow; rIdx <= endRow; rIdx++) {
      for (let cIdx = startCol; cIdx <= endCol; cIdx++) {
        const cx = cIdx * step;
        const cy = rIdx * step;

        if (
          cx + step / 2 < minX ||
          cx - step / 2 > maxX ||
          cy + step / 2 < minY ||
          cy - step / 2 > maxY
        ) {
          continue;
        }

        for (const [p1, p2] of rawShuangQian) {
          rawAllSegments.push([
            [cx + p1[0] * scale, cy + p1[1] * scale],
            [cx + p2[0] * scale, cy + p2[1] * scale]
          ]);
        }
      }
    }
  }

  // Clip segments to inner frame bounds and subtract bar zones
  const clippedSegments = clipAndMergeSegments(rawAllSegments, minX, maxX, minY, maxY, barYRanges);

  // 4. Assembly / Output logic matching Kumiko Bookmark
  const shouldFuse = Boolean(params.single_part) || Boolean(params.fuse_all_parts);

  // Extrude struts to 3D solids
  const strutSolids: any[] = [];
  const halfT = strutThickness / 2;
  const frameOverlap = shouldFuse ? halfT : 0;

  for (const [p1, p2] of clippedSegments) {
    const isHorizontal = Math.abs(p1[1] - p2[1]) < 1e-4;
    const isVertical = Math.abs(p1[0] - p2[0]) < 1e-4;

    if (isHorizontal) {
      const minXSeg = Math.min(p1[0], p2[0]);
      const maxXSeg = Math.max(p1[0], p2[0]);
      const isAtLeftFrame = minXSeg <= minX + 0.1;
      const isAtRightFrame = maxXSeg >= maxX - 0.1;

      const x0 = isAtLeftFrame
        ? Math.max(minX - frameOverlap, minXSeg)
        : Math.max(minX, minXSeg - halfT);
      const x1 = isAtRightFrame
        ? Math.min(maxX + frameOverlap, maxXSeg)
        : Math.min(maxX, maxXSeg + halfT);
      let y0 = Math.max(minY, p1[1] - halfT);
      let y1 = Math.min(maxY, p1[1] + halfT);

      if (!shouldFuse && barYRanges.length > 0) {
        for (const [b1, b2] of barYRanges) {
          if (p1[1] <= b1 + 1e-4) {
            y1 = Math.min(y1, b1);
          } else if (p1[1] >= b2 - 1e-4) {
            y0 = Math.max(y0, b2);
          }
        }
      }

      const strutW = x1 - x0;
      const strutH = y1 - y0;
      if (strutW > 0.05 && strutH > 0.05) {
        const cx = (x0 + x1) / 2;
        const cy = (y0 + y1) / 2;
        const rect2D = draw([cx + strutW / 2, cy + strutH / 2])
          .lineTo([cx - strutW / 2, cy + strutH / 2])
          .lineTo([cx - strutW / 2, cy - strutH / 2])
          .lineTo([cx + strutW / 2, cy - strutH / 2])
          .close();
        strutSolids.push((rect2D.sketchOnPlane('XY') as any).extrude(depth));
      }
    } else if (isVertical) {
      const minYSeg = Math.min(p1[1], p2[1]);
      const maxYSeg = Math.max(p1[1], p2[1]);
      const isAtBottomFrame = minYSeg <= minY + 0.1;
      const isAtTopFrame = maxYSeg >= maxY - 0.1;

      const touchesBarBottom = barYRanges.some(([, b2]) => Math.abs(minYSeg - b2) < 0.1);
      const touchesBarTop = barYRanges.some(([b1]) => Math.abs(maxYSeg - b1) < 0.1);

      const x0 = Math.max(minX, p1[0] - halfT);
      const x1 = Math.min(maxX, p1[0] + halfT);

      let y0 = minYSeg - halfT;
      if (isAtBottomFrame) {
        y0 = shouldFuse ? minY - frameOverlap : minY;
      } else if (touchesBarBottom) {
        const bar = barYRanges.find(([, b2]) => Math.abs(minYSeg - b2) < 0.1);
        y0 = bar ? (shouldFuse ? bar[1] - frameOverlap : bar[1]) : minYSeg;
      } else {
        y0 = Math.max(minY, y0);
      }

      let y1 = maxYSeg + halfT;
      if (isAtTopFrame) {
        y1 = shouldFuse ? maxY + frameOverlap : maxY;
      } else if (touchesBarTop) {
        const bar = barYRanges.find(([b1]) => Math.abs(maxYSeg - b1) < 0.1);
        y1 = bar ? (shouldFuse ? bar[0] + frameOverlap : bar[0]) : maxYSeg;
      } else {
        y1 = Math.min(maxY, y1);
      }

      if (!shouldFuse && barYRanges.length > 0) {
        for (const [b1, b2] of barYRanges) {
          if (maxYSeg <= b1 + 0.1) {
            y1 = Math.min(y1, b1);
          }
          if (minYSeg >= b2 - 0.1) {
            y0 = Math.max(y0, b2);
          }
        }
      }

      const strutW = x1 - x0;
      const strutH = y1 - y0;
      if (strutW > 0.05 && strutH > 0.05) {
        const cx = (x0 + x1) / 2;
        const cy = (y0 + y1) / 2;
        const rect2D = draw([cx + strutW / 2, cy + strutH / 2])
          .lineTo([cx - strutW / 2, cy + strutH / 2])
          .lineTo([cx - strutW / 2, cy - strutH / 2])
          .lineTo([cx + strutW / 2, cy - strutH / 2])
          .close();
        strutSolids.push((rect2D.sketchOnPlane('XY') as any).extrude(depth));
      }
    }
  }

  let latticeSolid: any = null;

  if (strutSolids.length > 0) {
    if (shouldFuse) {
      latticeSolid = fuseArrayBinary(strutSolids);
      if (latticeSolid) {
        try {
          frameSolid = frameSolid.fuse(latticeSolid);
        } catch {
          // fallback
        }
      }
    } else {
      latticeSolid = makeCompound(strutSolids);
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
        name: 'Chinese_Lattice_Bookmark_Fused',
        color: '#dc2626' // Traditional Chinese cinnabar / vermilion red
      }
    ];
  }

  return [
    {
      shape: frameSolid,
      name: 'Chinese_Lattice_Bookmark_Frame',
      color: '#1f2937' // Sleek dark ebony frame
    },
    {
      shape: latticeSolid,
      name: 'Chinese_Lattice_Bookmark_Pattern',
      color: '#dc2626' // Vermilion red lattice
    }
  ];
}

export function buildChineseLatticeBookmark(params: ChineseLatticeBookmarkParameters): AnyShape {
  const parts = buildChineseLatticeBookmarkParts(params);
  if (parts.length === 1) return parts[0].shape;
  return makeCompound(parts.map((p) => p.shape));
}

type CLBParameters = ChineseLatticeBookmarkParameters;

export const chineseLatticeBookmarkModel: ReplicadModelDefinition<CLBParameters> = {
  id: 'chinese-lattice-bookmark',
  name: 'Chinese Lattice Bookmark',
  project: 'Bookmarks',
  partName: 'Chinese Lattice Bookmark',
  description:
    'Customizable rectangular bookmark featuring algorithmic Chinese lattice designs based on traditional architectural window patterns.',
  tags: ['Chinese Lattice', '3D Print', 'Bookmark', 'Replicad', 'Architecture'],
  sources: [
    {
      title: 'An Algorithmic Approach to Chinese Lattice Design',
      authors: 'Miroslaw Majewski, Chuan-Kuan Wang',
      publication: 'The Electronic Journal of Mathematics and Technology (eJMT), Vol. 3, No. 1',
      year: 2009,
      url: 'https://ejmt.mathandtech.org/Contents/eJMT_v3n1n4.pdf',
      description:
        'Mathematical algorithms and generative geometric rules for classical Chinese window lattice designs based on traditional architectural window patterns.'
    },
    {
      title: 'Chinese Lattice Designs',
      authors: 'Daniel Sheets Dye',
      publication: 'Dover Publications (Originally Harvard-Yenching Institute Monograph Series)',
      year: 1974,
      url: 'https://archive.org/details/chineselatticede0000dyed',
      description:
        'Comprehensive visual and structural catalog of classical Chinese window grilles, frets, and interlocking geometric woodwork.'
    }
  ],
  aiDisclosure: {
    modelingAiAssisted: true,
    modelNotice:
      'The 3D model generation code, parametric geometry definitions, and CAD algorithms for this model were created with AI assistance.'
  },
  parameters: chineseLatticeBookmarkParameters,
  calculateDimensions: calculateChineseLatticeBookmarkDimensions,
  calculateDynamicConstraints: calculateChineseLatticeBookmarkDynamicConstraints,
  buildParts: buildChineseLatticeBookmarkParts,
  buildShape: buildChineseLatticeBookmark
};
