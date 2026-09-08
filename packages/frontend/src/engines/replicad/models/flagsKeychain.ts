import { draw, drawCircle, drawPolysides, AnyShape, makeCompound, Drawing } from 'replicad';
import { ParameterDefinition } from '../../../types/model';
import {
  extractDefaultParameters,
  type ReplicadPart,
  type ReplicadModelDefinition,
  type ModelDimensionItem
} from '../types';

export type { ReplicadPart };

export interface FlagsParameters {
  flag_type?: string;
  flag_orientation?: string;
  flag_depth?: number;
  flag_thickness?: number;
  flag_height?: number;
  flag_fillet?: number;
  hex_radius?: number;
  hex_thickness?: number;
  hex_fillet?: number;
  height?: number;
  include_backplate?: boolean;
  backplate_thickness?: number;
  backplate_fillet?: number;
  include_keychain_ring?: boolean;
  ring_thickness?: number;
  ring_fillet?: number;
  single_part?: boolean | string;
  fuse_all_parts?: boolean | string;
  [key: string]: unknown;
}

export interface FlagBuildContext {
  innerHex: Drawing;
  rInner: number;
  hFlag: number;
  zOffset: number;
  fFlag: number;
  orientation: string;
  params: FlagsParameters;
}

export type FlagGeneratorFn = (ctx: FlagBuildContext) => ReplicadPart[];

export interface FlagRegistryEntry {
  name: string;
  generate: FlagGeneratorFn;
}

/**
 * Extrudes a 2D Drawing sketch at zOffset with optional fillet
 */
export function extrudeAndFillet2D(
  sketch2D: Drawing,
  zOffset: number,
  hFlag: number,
  fFlag: number
): AnyShape | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sketch = (sketch2D as any).sketchOnPlane('XY', zOffset) as any;
    let solid = sketch.extrude(hFlag);

    if (fFlag > 0 && fFlag < 0.6) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        solid = (solid as any).fillet(fFlag);
      } catch {
        // Fallback
      }
    }
    return solid;
  } catch {
    return null;
  }
}

/**
 * Splits the inner hexagon into two halves fitting perfectly inside the hex frame:
 * - 'horizontal': Top half (Y >= 0) and Bottom half (Y <= 0)
 * - 'vertical': Left half (X <= 0) and Right half (X >= 0)
 */
export function createBicolorSections2D(
  innerHex: Drawing,
  rInner: number,
  orientation: string = 'horizontal'
): { section1: Drawing; section2: Drawing } {
  const span = rInner * 4;
  const isVertical = orientation === 'vertical' || orientation === '90';

  if (isVertical) {
    const leftBox = draw([-span, -span])
      .lineTo([0, -span])
      .lineTo([0, span])
      .lineTo([-span, span])
      .close();

    const rightBox = draw([0, -span])
      .lineTo([span, -span])
      .lineTo([span, span])
      .lineTo([0, span])
      .close();

    return {
      section1: innerHex.intersect(leftBox), // Left section
      section2: innerHex.intersect(rightBox) // Right section
    };
  }

  const topBox = draw([-span, 0])
    .lineTo([span, 0])
    .lineTo([span, span])
    .lineTo([-span, span])
    .close();

  const bottomBox = draw([-span, -span])
    .lineTo([span, -span])
    .lineTo([span, 0])
    .lineTo([-span, 0])
    .close();

  return {
    section1: innerHex.intersect(topBox), // Top section
    section2: innerHex.intersect(bottomBox) // Bottom section
  };
}

/**
 * Splits the inner hexagon into N bands (equal or custom proportional ratios)
 * fitting perfectly inside the hex frame:
 * - ratios: array of N numbers (e.g. [1, 1, 1, 1] for 4 equal stripes, [1, 1, 2, 1, 1] for Thailand)
 */
export function createMultiStripeSections2D(
  innerHex: Drawing,
  rInner: number,
  ratios: number[],
  orientation: string = 'horizontal',
  nativeOrientation: 'horizontal' | 'vertical' = 'horizontal'
): Drawing[] {
  const n = ratios.length;
  if (n === 0) return [];
  if (n === 1) return [innerHex];

  const span = rInner * 4;
  const isVertical =
    orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
  const sum = ratios.reduce((acc, r) => acc + r, 0);

  const cumSums: number[] = [0];
  for (let i = 0; i < n; i++) {
    cumSums.push(cumSums[i] + ratios[i]);
  }

  const sections: Drawing[] = [];

  if (isVertical) {
    const w = (rInner * Math.sqrt(3)) / 2;
    // For native horizontal flags rotated 90 deg CW to vertical:
    // Stripe 0 (top) goes to Right (+X), Stripe N-1 (bottom) goes to Left (-X).
    // For native vertical flags (e.g. France) in standard vertical mode:
    // Stripe 0 (left) is on Left (-X), Stripe N-1 (right) is on Right (+X).
    if (nativeOrientation === 'horizontal') {
      const splitX: number[] = [span];
      for (let i = 1; i < n; i++) {
        splitX.push(w * (1 - (2 * cumSums[i]) / sum));
      }
      splitX.push(-span);

      for (let i = 0; i < n; i++) {
        const box = draw([splitX[i + 1], -span])
          .lineTo([splitX[i], -span])
          .lineTo([splitX[i], span])
          .lineTo([splitX[i + 1], span])
          .close();
        sections.push(innerHex.intersect(box));
      }
    } else {
      const splitX: number[] = [-span];
      for (let i = 1; i < n; i++) {
        splitX.push(w * ((2 * cumSums[i]) / sum - 1));
      }
      splitX.push(span);

      for (let i = 0; i < n; i++) {
        const box = draw([splitX[i], -span])
          .lineTo([splitX[i + 1], -span])
          .lineTo([splitX[i + 1], span])
          .lineTo([splitX[i], span])
          .close();
        sections.push(innerHex.intersect(box));
      }
    }
    return sections;
  }

  // Horizontal orientation:
  // Both standard horizontal (top to bottom) and vertical rotated 90 deg CW (left->top to right->bottom):
  // Stripe 0 is Top (+Y), Stripe N-1 is Bottom (-Y).
  const splitY: number[] = [span];
  for (let i = 1; i < n; i++) {
    splitY.push(rInner * (1 - (2 * cumSums[i]) / sum));
  }
  splitY.push(-span);

  for (let i = 0; i < n; i++) {
    const box = draw([-span, splitY[i + 1]])
      .lineTo([span, splitY[i + 1]])
      .lineTo([span, splitY[i]])
      .lineTo([-span, splitY[i]])
      .close();
    sections.push(innerHex.intersect(box));
  }
  return sections;
}

/**
 * Splits the inner hexagon into three bands (equal or custom proportional ratios)
 * fitting perfectly inside the hex frame:
 * - ratios: [r1, r2, r3] proportions (e.g. [1, 1, 1] equal, [2, 1, 1] Colombia, [2, 1, 2] Latvia)
 */
export function createUnevenTricolorSections2D(
  innerHex: Drawing,
  rInner: number,
  ratios: [number, number, number] = [1, 1, 1],
  orientation: string = 'horizontal'
): { section1: Drawing; section2: Drawing; section3: Drawing } {
  const sections = createMultiStripeSections2D(innerHex, rInner, ratios, orientation);
  return {
    section1: sections[0],
    section2: sections[1],
    section3: sections[2]
  };
}

/**
 * Splits the inner hexagon into three equal bands (legacy alias)
 */
export function createTricolorSections2D(
  innerHex: Drawing,
  rInner: number,
  orientation: string = 'vertical'
): { section1: Drawing; section2: Drawing; section3: Drawing } {
  return createUnevenTricolorSections2D(innerHex, rInner, [1, 1, 1], orientation);
}

/**
 * Resolves the effective drawing orientation given a requested setting and the flag's native layout
 */
export function resolveEffectiveOrientation(
  requestedOrientation: string | undefined,
  nativeOrientation: 'horizontal' | 'vertical'
): 'horizontal' | 'vertical' {
  const req = String(requestedOrientation || 'standard')
    .toLowerCase()
    .trim();

  if (req === 'vertical') return 'vertical';
  if (req === 'horizontal') return 'horizontal';
  if (req === 'rotated' || req === 'opposite' || req === '90') {
    return nativeOrientation === 'vertical' ? 'horizontal' : 'vertical';
  }
  // 'standard' / 'default' or unset
  return nativeOrientation;
}

/**
 * Generator factory for multi-stripe flag designs (N stripes with optional proportional ratios)
 */
export function createMultiStripeFlagGenerator(
  colors: string[],
  nativeOrientation: 'horizontal' | 'vertical' = 'horizontal',
  ratios?: number[]
): FlagGeneratorFn {
  const effectiveRatios = ratios && ratios.length === colors.length ? ratios : colors.map(() => 1);

  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const effectiveOrientation = resolveEffectiveOrientation(orientation, nativeOrientation);
    const isVertical = effectiveOrientation === 'vertical';
    const sections = createMultiStripeSections2D(
      innerHex,
      rInner,
      effectiveRatios,
      effectiveOrientation,
      nativeOrientation
    );

    const parts: ReplicadPart[] = [];
    for (let i = 0; i < sections.length; i++) {
      const solid = extrudeAndFillet2D(sections[i], zOffset, hFlag, fFlag);
      if (solid) {
        let name: string;
        if (sections.length === 2) {
          name = isVertical
            ? nativeOrientation === 'horizontal'
              ? i === 0
                ? 'Flag_Right'
                : 'Flag_Left'
              : i === 0
                ? 'Flag_Left'
                : 'Flag_Right'
            : i === 0
              ? 'Flag_Top'
              : 'Flag_Bottom';
        } else if (sections.length === 3) {
          name = isVertical
            ? nativeOrientation === 'horizontal'
              ? i === 0
                ? 'Flag_Right'
                : i === 1
                  ? 'Flag_Middle'
                  : 'Flag_Left'
              : i === 0
                ? 'Flag_Left'
                : i === 1
                  ? 'Flag_Middle'
                  : 'Flag_Right'
            : i === 0
              ? 'Flag_Top'
              : i === 1
                ? 'Flag_Middle'
                : 'Flag_Bottom';
        } else {
          name = `Flag_Stripe_${i + 1}`;
        }

        parts.push({
          shape: solid,
          name,
          color: colors[i]
        });
      }
    }
    return parts;
  };
}

/**
 * Splits the inner hexagon into a hoist band (vertical stripe on one side)
 * and N horizontal bands on the opposite side (e.g. Benin, Madagascar, UAE):
 * - hoistFraction: fraction of width/height taken by the hoist band (e.g. 0.4 Benin, 1/3 Madagascar, 0.3 UAE)
 * - ratios: array of N numbers for the fly bands (e.g. [1, 1] for 2 bands, [1, 1, 1] for 3 bands)
 * - orientation: 'standard' / 'horizontal' (hoist on left, fly bands on right)
 *                or 'vertical' / 'rotated' (hoist on top, fly bands on bottom)
 */
export function createHoistMultiBandsSections2D(
  innerHex: Drawing,
  rInner: number,
  hoistFraction: number = 1 / 3,
  ratios: number[] = [1, 1],
  orientation: string = 'horizontal'
): { hoistSection: Drawing; flySections: Drawing[] } {
  const span = rInner * 4;
  const isVertical =
    orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
  const n = ratios.length;
  const sum = ratios.reduce((acc, r) => acc + r, 0);

  const cumSums: number[] = [0];
  for (let i = 0; i < n; i++) {
    cumSums.push(cumSums[i] + ratios[i]);
  }

  if (isVertical) {
    // Hoist on top (Y >= splitY), fly bands on bottom (Y <= splitY) partitioned horizontally
    const splitY = rInner * (1 - 2 * hoistFraction);

    const hoistBox = draw([-span, splitY])
      .lineTo([span, splitY])
      .lineTo([span, span])
      .lineTo([-span, span])
      .close();

    const w = (rInner * Math.sqrt(3)) / 2;
    const splitX: number[] = [span];
    for (let i = 1; i < n; i++) {
      splitX.push(w * (1 - (2 * cumSums[i]) / sum));
    }
    splitX.push(-span);

    const flySections: Drawing[] = [];
    for (let i = 0; i < n; i++) {
      const box = draw([splitX[i + 1], -span])
        .lineTo([splitX[i], -span])
        .lineTo([splitX[i], splitY])
        .lineTo([splitX[i + 1], splitY])
        .close();
      flySections.push(innerHex.intersect(box));
    }

    return {
      hoistSection: innerHex.intersect(hoistBox),
      flySections
    };
  }

  // Standard: Hoist on left (X <= splitX), fly bands on right (X >= splitX) partitioned vertically
  const w = (rInner * Math.sqrt(3)) / 2;
  const splitX = w * (2 * hoistFraction - 1);

  const hoistBox = draw([-span, -span])
    .lineTo([splitX, -span])
    .lineTo([splitX, span])
    .lineTo([-span, span])
    .close();

  const splitY: number[] = [span];
  for (let i = 1; i < n; i++) {
    splitY.push(rInner * (1 - (2 * cumSums[i]) / sum));
  }
  splitY.push(-span);

  const flySections: Drawing[] = [];
  for (let i = 0; i < n; i++) {
    const box = draw([splitX, splitY[i + 1]])
      .lineTo([span, splitY[i + 1]])
      .lineTo([span, splitY[i]])
      .lineTo([splitX, splitY[i]])
      .close();
    flySections.push(innerHex.intersect(box));
  }

  return {
    hoistSection: innerHex.intersect(hoistBox),
    flySections
  };
}

/**
 * Splits the inner hexagon into a hoist band and two horizontal bands (legacy alias)
 */
export function createHoistTwoBandsSections2D(
  innerHex: Drawing,
  rInner: number,
  hoistFraction: number = 1 / 3,
  orientation: string = 'horizontal'
): { hoistSection: Drawing; topFlySection: Drawing; bottomFlySection: Drawing } {
  const { hoistSection, flySections } = createHoistMultiBandsSections2D(
    innerHex,
    rInner,
    hoistFraction,
    [1, 1],
    orientation
  );
  return {
    hoistSection,
    topFlySection: flySections[0],
    bottomFlySection: flySections[1]
  };
}

/**
 * Generator factory for flags with a hoist band and N horizontal fly bands (e.g. Benin, Madagascar, UAE)
 */
export function createHoistMultiBandsFlagGenerator(
  hoistColor: string,
  flyColors: string[],
  hoistFraction: number = 1 / 3,
  nativeOrientation: 'horizontal' | 'vertical' = 'horizontal',
  ratios?: number[]
): FlagGeneratorFn {
  const effectiveRatios =
    ratios && ratios.length === flyColors.length ? ratios : flyColors.map(() => 1);

  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const effectiveOrientation = resolveEffectiveOrientation(orientation, nativeOrientation);
    const isVertical = effectiveOrientation === 'vertical';
    const { hoistSection, flySections } = createHoistMultiBandsSections2D(
      innerHex,
      rInner,
      hoistFraction,
      effectiveRatios,
      effectiveOrientation
    );

    const parts: ReplicadPart[] = [];
    const sHoist = extrudeAndFillet2D(hoistSection, zOffset, hFlag, fFlag);
    if (sHoist) {
      parts.push({
        shape: sHoist,
        name: isVertical ? 'Flag_Top' : 'Flag_Left',
        color: hoistColor
      });
    }

    for (let i = 0; i < flySections.length; i++) {
      const sFly = extrudeAndFillet2D(flySections[i], zOffset, hFlag, fFlag);
      if (sFly) {
        let name: string;
        if (flySections.length === 2) {
          name = isVertical
            ? i === 0
              ? 'Flag_Bottom_Left'
              : 'Flag_Bottom_Right'
            : i === 0
              ? 'Flag_Top_Right'
              : 'Flag_Bottom_Right';
        } else if (flySections.length === 3) {
          name = isVertical
            ? i === 0
              ? 'Flag_Bottom_Left'
              : i === 1
                ? 'Flag_Bottom_Middle'
                : 'Flag_Bottom_Right'
            : i === 0
              ? 'Flag_Top'
              : i === 1
                ? 'Flag_Middle'
                : 'Flag_Bottom';
        } else {
          name = `Flag_Fly_${i + 1}`;
        }

        parts.push({
          shape: sFly,
          name,
          color: flyColors[i]
        });
      }
    }
    return parts;
  };
}

/**
 * Generator factory for flags with a hoist band and two horizontal fly bands (legacy alias)
 */
export function createHoistTwoBandsFlagGenerator(
  hoistColor: string,
  topFlyColor: string,
  bottomFlyColor: string,
  hoistFraction: number = 1 / 3,
  nativeOrientation: 'horizontal' | 'vertical' = 'horizontal'
): FlagGeneratorFn {
  return createHoistMultiBandsFlagGenerator(
    hoistColor,
    [topFlyColor, bottomFlyColor],
    hoistFraction,
    nativeOrientation,
    [1, 1]
  );
}

/**
 * Splits the inner hexagon into a triangular hoist pile (chevron)
 * and N horizontal bands on the opposite side (e.g. Czechia, Martinique, Bahamas, Palestine):
 * - apexFraction: how far the triangle apex reaches into the flag width (0.5 = midpoint)
 * - ratios: array of N numbers for the fly bands
 * - orientation: 'standard' / 'horizontal' (triangle on left pointing right)
 *                or 'vertical' / 'rotated' (triangle on top pointing down)
 */
export function createTrianglePileMultiBandsSections2D(
  innerHex: Drawing,
  rInner: number,
  apexFraction: number = 0.5,
  ratios: number[] = [1, 1],
  orientation: string = 'horizontal'
): { triangleSection: Drawing; flySections: Drawing[] } {
  const span = rInner * 4;
  const isVertical =
    orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
  const n = ratios.length;
  const sum = ratios.reduce((acc, r) => acc + r, 0);

  const cumSums: number[] = [0];
  for (let i = 0; i < n; i++) {
    cumSums.push(cumSums[i] + ratios[i]);
  }

  if (isVertical) {
    const splitY = rInner * (1 - 2 * apexFraction);

    const triangleBox = draw([-span, span]).lineTo([0, splitY]).lineTo([span, span]).close();

    const w = (rInner * Math.sqrt(3)) / 2;
    const splitX: number[] = [span];
    for (let i = 1; i < n; i++) {
      splitX.push(w * (1 - (2 * cumSums[i]) / sum));
    }
    splitX.push(-span);

    // Edge function: Y of triangle boundary for given X
    const edgeY = (x: number) => {
      const t = Math.abs(x) / span;
      return splitY + (span - splitY) * t;
    };

    const flySections: Drawing[] = [];
    for (let i = 0; i < n; i++) {
      const x0 = splitX[i + 1]; // Left boundary
      const x1 = splitX[i]; // Right boundary

      // Check if band spans across X=0
      if (x0 < 0 && x1 > 0) {
        const box = draw([x0, -span])
          .lineTo([x1, -span])
          .lineTo([x1, edgeY(x1)])
          .lineTo([0, splitY])
          .lineTo([x0, edgeY(x0)])
          .close();
        flySections.push(innerHex.intersect(box));
      } else {
        const box = draw([x0, -span])
          .lineTo([x1, -span])
          .lineTo([x1, edgeY(x1)])
          .lineTo([x0, edgeY(x0)])
          .close();
        flySections.push(innerHex.intersect(box));
      }
    }

    return {
      triangleSection: innerHex.intersect(triangleBox),
      flySections
    };
  }

  // Standard: Triangle at left pointing right to (splitX, 0)
  const w = (rInner * Math.sqrt(3)) / 2;
  const splitX = w * (2 * apexFraction - 1);

  const triangleBox = draw([-span, -span]).lineTo([splitX, 0]).lineTo([-span, span]).close();

  const splitY: number[] = [span];
  for (let i = 1; i < n; i++) {
    splitY.push(rInner * (1 - (2 * cumSums[i]) / sum));
  }
  splitY.push(-span);

  // Edge function: X of triangle boundary for given Y
  const edgeX = (y: number) => {
    const t = Math.abs(y) / span;
    return splitX - (splitX + span) * t;
  };

  const flySections: Drawing[] = [];
  for (let i = 0; i < n; i++) {
    const yTop = splitY[i];
    const yBot = splitY[i + 1];

    // Check if band spans across Y=0
    if (yTop > 0 && yBot < 0) {
      const box = draw([edgeX(yBot), yBot])
        .lineTo([span, yBot])
        .lineTo([span, yTop])
        .lineTo([edgeX(yTop), yTop])
        .lineTo([splitX, 0])
        .close();
      flySections.push(innerHex.intersect(box));
    } else {
      const box = draw([edgeX(yBot), yBot])
        .lineTo([span, yBot])
        .lineTo([span, yTop])
        .lineTo([edgeX(yTop), yTop])
        .close();
      flySections.push(innerHex.intersect(box));
    }
  }

  return {
    triangleSection: innerHex.intersect(triangleBox),
    flySections
  };
}

/**
 * Splits the inner hexagon into a triangular hoist pile and two horizontal bands (legacy alias)
 */
export function createTrianglePileTwoBandsSections2D(
  innerHex: Drawing,
  rInner: number,
  apexFraction: number = 0.5,
  orientation: string = 'horizontal'
): { triangleSection: Drawing; topSection: Drawing; bottomSection: Drawing } {
  const { triangleSection, flySections } = createTrianglePileMultiBandsSections2D(
    innerHex,
    rInner,
    apexFraction,
    [1, 1],
    orientation
  );
  return {
    triangleSection,
    topSection: flySections[0],
    bottomSection: flySections[1]
  };
}

/**
 * Generator factory for flags with a triangular pile (chevron) and N bands (e.g. Czechia, Martinique, Bahamas, Palestine)
 */
export function createTrianglePileMultiBandsFlagGenerator(
  triangleColor: string,
  flyColors: string[],
  apexFraction: number = 0.5,
  nativeOrientation: 'horizontal' | 'vertical' = 'horizontal',
  ratios?: number[]
): FlagGeneratorFn {
  const effectiveRatios =
    ratios && ratios.length === flyColors.length ? ratios : flyColors.map(() => 1);

  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const effectiveOrientation = resolveEffectiveOrientation(orientation, nativeOrientation);
    const isVertical = effectiveOrientation === 'vertical';
    const { triangleSection, flySections } = createTrianglePileMultiBandsSections2D(
      innerHex,
      rInner,
      apexFraction,
      effectiveRatios,
      effectiveOrientation
    );

    const parts: ReplicadPart[] = [];
    const sTriangle = extrudeAndFillet2D(triangleSection, zOffset, hFlag, fFlag);
    if (sTriangle) {
      parts.push({
        shape: sTriangle,
        name: isVertical ? 'Flag_Top' : 'Flag_Left',
        color: triangleColor
      });
    }

    for (let i = 0; i < flySections.length; i++) {
      const sFly = extrudeAndFillet2D(flySections[i], zOffset, hFlag, fFlag);
      if (sFly) {
        let name: string;
        if (flySections.length === 2) {
          name = isVertical
            ? i === 0
              ? 'Flag_Bottom_Left'
              : 'Flag_Bottom_Right'
            : i === 0
              ? 'Flag_Top'
              : 'Flag_Bottom';
        } else if (flySections.length === 3) {
          name = isVertical
            ? i === 0
              ? 'Flag_Bottom_Left'
              : i === 1
                ? 'Flag_Bottom_Middle'
                : 'Flag_Bottom_Right'
            : i === 0
              ? 'Flag_Top'
              : i === 1
                ? 'Flag_Middle'
                : 'Flag_Bottom';
        } else {
          name = `Flag_Fly_${i + 1}`;
        }

        parts.push({
          shape: sFly,
          name,
          color: flyColors[i]
        });
      }
    }
    return parts;
  };
}

/**
 * Generator factory for flags with a triangular pile (chevron) and two bands (legacy alias)
 */
export function createTrianglePileTwoBandsFlagGenerator(
  triangleColor: string,
  topColor: string,
  bottomColor: string,
  apexFraction: number = 0.5,
  nativeOrientation: 'horizontal' | 'vertical' = 'horizontal'
): FlagGeneratorFn {
  return createTrianglePileMultiBandsFlagGenerator(
    triangleColor,
    [topColor, bottomColor],
    apexFraction,
    nativeOrientation,
    [1, 1]
  );
}

/**
 * Splits the inner hexagon into a background field and a single circular disc
 * (e.g. Japan, Bangladesh, Palau):
 * - radiusRatio: radius of circle relative to rInner (default 0.55)
 * - offsetFraction: horizontal shift towards hoist as fraction of hex half-width (0 for Japan, -0.1 for Bangladesh, -0.125 for Palau)
 * - orientation: 'horizontal' / 'standard' or 'vertical' / 'rotated'
 */
export function createCircleFlagSections2D(
  innerHex: Drawing,
  rInner: number,
  radiusRatio: number = 0.55,
  offsetFraction: number = 0,
  orientation: string = 'horizontal'
): { fieldSection: Drawing; circleSection: Drawing } {
  const isVertical =
    orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
  const rDisc = rInner * radiusRatio;
  const w = (rInner * Math.sqrt(3)) / 2;

  let cx = 0;
  let cy = 0;
  if (offsetFraction !== 0) {
    if (isVertical) {
      cy = rInner * -offsetFraction;
    } else {
      cx = w * offsetFraction;
    }
  }

  const circle2D = drawCircle(rDisc).translate([cx, cy]);
  const circleSection = innerHex.intersect(circle2D);
  const fieldSection = innerHex.cut(circle2D);

  return { fieldSection, circleSection };
}

/**
 * Generator factory for single circle flags (e.g. Japan, Bangladesh, Palau)
 */
export function createCircleFlagGenerator(
  fieldColor: string,
  circleColor: string,
  radiusRatio: number = 0.55,
  offsetFraction: number = 0,
  nativeOrientation: 'horizontal' | 'vertical' = 'horizontal'
): FlagGeneratorFn {
  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const effectiveOrientation = resolveEffectiveOrientation(orientation, nativeOrientation);
    const { fieldSection, circleSection } = createCircleFlagSections2D(
      innerHex,
      rInner,
      radiusRatio,
      offsetFraction,
      effectiveOrientation
    );

    const sField = extrudeAndFillet2D(fieldSection, zOffset, hFlag, fFlag);
    const sCircle = extrudeAndFillet2D(circleSection, zOffset, hFlag, fFlag);

    const parts: ReplicadPart[] = [];
    if (sField) {
      parts.push({
        shape: sField,
        name: 'Flag_Field',
        color: fieldColor
      });
    }
    if (sCircle) {
      parts.push({
        shape: sCircle,
        name: 'Flag_Circle',
        color: circleColor
      });
    }
    return parts;
  };
}

/**
 * Helper to create a 2D regular N-pointed star Drawing
 */
export function drawStar(
  outerRadius: number,
  innerRadius?: number,
  center: [number, number] = [0, 0],
  rotationAngle: number = 0,
  numPoints: number = 5
): Drawing {
  const [cx, cy] = center;
  const effectiveInnerRadius =
    innerRadius ??
    (numPoints === 5
      ? outerRadius * 0.381966
      : numPoints === 7
        ? outerRadius * 0.45
        : numPoints === 12
          ? outerRadius * 0.58
          : outerRadius * 0.4);
  const points: [number, number][] = [];

  for (let i = 0; i < numPoints * 2; i++) {
    const isOuter = i % 2 === 0;
    const r = isOuter ? outerRadius : effectiveInnerRadius;
    const angle = Math.PI / 2 + (i * Math.PI) / numPoints + rotationAngle;
    points.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }

  let star = draw(points[0]);
  for (let i = 1; i < points.length; i++) {
    star = star.lineTo(points[i]);
  }
  return star.close();
}

/**
 * Helper to create a 2D Crescent Drawing
 * outerRadius: radius of outer circle
 * innerRadius: radius of cutout circle
 * center: center of the outer circle [cx, cy]
 * offsetDistance: distance the inner circle center is shifted from outer circle center
 * angle: angle in radians along which the inner circle is shifted (and crescent opens)
 * segments: number of segments per arc for smooth curvature (default 32)
 */
export function drawCrescent(
  outerRadius: number,
  innerRadius: number,
  center: [number, number] = [0, 0],
  offsetDistance: number = outerRadius * 0.25,
  angle: number = 0,
  segments: number = 32
): Drawing {
  const [cx, cy] = center;
  const R1 = outerRadius;
  const R2 = innerRadius;
  const d = Math.max(0.001, offsetDistance);

  // Intersection of two circles in local frame where inner circle is at [d, 0]
  const xInt = (R1 * R1 - R2 * R2 + d * d) / (2 * d);
  const ySq = R1 * R1 - xInt * xInt;
  const yInt = ySq > 0 ? Math.sqrt(ySq) : 0;

  const thetaInt = Math.atan2(yInt, xInt);
  const phiInt = Math.atan2(yInt, xInt - d);

  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  const rotateAndTranslate = (x: number, y: number): [number, number] => {
    return [cx + (x * cosA - y * sinA), cy + (x * sinA + y * cosA)];
  };

  const points: [number, number][] = [];

  // 1. Outer arc: from +thetaInt through Math.PI to 2*Math.PI - thetaInt (inclusive of both cusps)
  const outerStart = thetaInt;
  const outerEnd = 2 * Math.PI - thetaInt;
  for (let i = 0; i <= segments; i++) {
    const t = outerStart + (i / segments) * (outerEnd - outerStart);
    const x = R1 * Math.cos(t);
    const y = R1 * Math.sin(t);
    points.push(rotateAndTranslate(x, y));
  }

  // 2. Inner arc: from 2*Math.PI - phiInt through Math.PI down to phiInt (interior points only, omitting duplicate cusp tips)
  const innerStart = 2 * Math.PI - phiInt;
  const innerEnd = phiInt;
  for (let j = 1; j < segments; j++) {
    const t = innerStart + (j / segments) * (innerEnd - innerStart);
    const x = d + R2 * Math.cos(t);
    const y = R2 * Math.sin(t);
    points.push(rotateAndTranslate(x, y));
  }

  let crescent = draw(points[0]);
  for (let i = 1; i < points.length; i++) {
    crescent = crescent.lineTo(points[i]);
  }
  return crescent.close();
}

/**
 * Helper to create a 2D Korean Taegeuk (Yin-Yang) Drawing (Red upper/right half)
 */
export function drawTaegeukRed(
  radius: number,
  center: [number, number] = [0, 0],
  angle: number = 0,
  segments: number = 32
): Drawing {
  const [cx, cy] = center;
  const R = radius;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  const rotateAndTranslate = (x: number, y: number): [number, number] => {
    return [cx + (x * cosA - y * sinA), cy + (x * sinA + y * cosA)];
  };

  const points: [number, number][] = [];

  // 1. Top outer semicircle from (-R, 0) to (+R, 0) through (0, R)
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI;
    const x = -R * Math.cos(t);
    const y = R * Math.sin(t);
    points.push(rotateAndTranslate(x, y));
  }

  // 2. Right inner semicircle from (+R, 0) to (0, 0) in +Y (center R/2, 0)
  for (let i = 1; i <= segments; i++) {
    const t = (i / segments) * Math.PI;
    const x = R / 2 + (R / 2) * Math.cos(t);
    const y = (R / 2) * Math.sin(t);
    points.push(rotateAndTranslate(x, y));
  }

  // 3. Left inner semicircle from (0, 0) to (-R, 0) in -Y (center -R/2, 0)
  for (let i = 1; i < segments; i++) {
    const t = (i / segments) * Math.PI;
    const x = -R / 2 + (R / 2) * Math.cos(t);
    const y = -(R / 2) * Math.sin(t);
    points.push(rotateAndTranslate(x, y));
  }

  let taegeuk = draw(points[0]);
  for (let i = 1; i < points.length; i++) {
    taegeuk = taegeuk.lineTo(points[i]);
  }
  return taegeuk.close();
}

export function drawTaegeukBlue(
  radius: number,
  center: [number, number] = [0, 0],
  angle: number = 0,
  segments: number = 32
): Drawing {
  const [cx, cy] = center;
  const R = radius;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  const rotateAndTranslate = (x: number, y: number): [number, number] => {
    return [cx + (x * cosA - y * sinA), cy + (x * sinA + y * cosA)];
  };

  const points: [number, number][] = [];

  // 1. Bottom outer semicircle from (+R, 0) to (-R, 0) through (0, -R)
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI;
    const x = R * Math.cos(t);
    const y = -R * Math.sin(t);
    points.push(rotateAndTranslate(x, y));
  }

  // 2. Left inner semicircle from (-R, 0) to (0, 0) in -Y (center -R/2, 0)
  for (let i = 1; i <= segments; i++) {
    const t = (1 - i / segments) * Math.PI;
    const x = -R / 2 + (R / 2) * Math.cos(t);
    const y = -(R / 2) * Math.sin(t);
    points.push(rotateAndTranslate(x, y));
  }

  // 3. Right inner semicircle from (0, 0) to (+R, 0) in +Y (center R/2, 0)
  for (let i = 1; i < segments; i++) {
    const t = (1 - i / segments) * Math.PI;
    const x = R / 2 + (R / 2) * Math.cos(t);
    const y = (R / 2) * Math.sin(t);
    points.push(rotateAndTranslate(x, y));
  }

  let taegeuk = draw(points[0]);
  for (let i = 1; i < points.length; i++) {
    taegeuk = taegeuk.lineTo(points[i]);
  }
  return taegeuk.close();
}

/**
 * Helper to create Trigram Drawings for South Korea flag
 */
export function drawTrigram(
  center: [number, number],
  angle: number,
  bars: [boolean, boolean, boolean],
  barLength: number,
  barWidth: number,
  barSpacing: number,
  gap: number
): Drawing[] {
  const [cx, cy] = center;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  const rotateAndTranslate = (x: number, y: number): [number, number] => {
    return [cx + (x * cosA - y * sinA), cy + (x * sinA + y * cosA)];
  };

  const makeRotatedRect = (x0: number, y0: number, w: number, h: number): Drawing => {
    const p1 = rotateAndTranslate(x0 - w / 2, y0 - h / 2);
    const p2 = rotateAndTranslate(x0 + w / 2, y0 - h / 2);
    const p3 = rotateAndTranslate(x0 + w / 2, y0 + h / 2);
    const p4 = rotateAndTranslate(x0 - w / 2, y0 + h / 2);
    return draw(p1).lineTo(p2).lineTo(p3).lineTo(p4).close();
  };

  const drawings: Drawing[] = [];
  for (let j = 0; j < 3; j++) {
    const yLocal = (j - 1) * (barWidth + barSpacing);
    const isSolid = bars[j];

    if (isSolid) {
      drawings.push(makeRotatedRect(0, yLocal, barLength, barWidth));
    } else {
      const halfLen = (barLength - gap) / 2;
      const xOffset = (halfLen + gap) / 2;
      drawings.push(makeRotatedRect(-xOffset, yLocal, halfLen, barWidth));
      drawings.push(makeRotatedRect(xOffset, yLocal, halfLen, barWidth));
    }
  }

  return drawings;
}

/**
 * Helper to create a 2D Drawing of the official 11-pointed National Flag of Canada Maple Leaf
 * Features the precise 11-point geometry (Jacques Saint-Cyr 1965 design):
 * - Central top lobe: 3 points (top apex + 2 side points)
 * - Left lateral lobe: 3 points (top, main apex, bottom)
 * - Right lateral lobe: 3 points (top, main apex, bottom)
 * - Base: 2 basal points (left + right)
 * - Petiole / stem extending downwards
 */
export function drawMapleLeaf(
  scale: number,
  center: [number, number] = [0, 0],
  rotationAngle: number = 0
): Drawing {
  const [cx, cy] = center;
  const cos = Math.cos(rotationAngle);
  const sin = Math.sin(rotationAngle);

  // Exact official Canadian National Flag maple leaf coordinates (centered at 0, 0)
  // Extracted directly from official Government of Canada / Wikimedia Flag_of_Canada.svg:
  // 1. Top Apex: (0, 0.8333)
  // 2. Top notch: (0.1383, 0.5617)
  // 3. Top lobe side tip: (0.3125, 0.6292)
  // 4. Major upper sinus: (0.2275, 0.1908)
  // 5. Lateral top tip: (0.4500, 0.3563)
  // 6. Lateral upper notch: (0.4938, 0.2533)
  // 7. Lateral main tip: (0.7500, 0.2854)
  // 8. Lateral lower notch: (0.6725, 0.0471)
  // 9. Lateral bottom tip: (0.7750, -0.0271)
  // 10. Major lower sinus: (0.3829, -0.3446)
  // 11. Basal tip: (0.4229, -0.5083)
  // 12. Basal inner notch: (0.0650, -0.4454)
  // 13. Stem top right: (0.0188, -0.4863)
  // 14. Stem bottom right: (0.0375, -0.8458)
  const rightHalfRaw: [number, number][] = [
    [0.0, 0.8333], // 1. Top Apex
    [0.1383, 0.5617], // Top notch
    [0.3125, 0.6292], // 2. Top lobe right tip
    [0.2275, 0.1908], // Major upper sinus
    [0.45, 0.3563], // 3. Lateral top tip
    [0.4938, 0.2533], // Lateral upper notch
    [0.75, 0.2854], // 4. Lateral main tip
    [0.6725, 0.0471], // Lateral lower notch
    [0.775, -0.0271], // 5. Lateral bottom tip
    [0.3829, -0.3446], // Major lower sinus
    [0.4229, -0.5083], // 6. Basal tip
    [0.065, -0.4454], // Basal inner notch
    [0.0188, -0.4863], // Stem top right
    [0.0375, -0.8458] // Stem bottom right
  ];

  // Construct full symmetrical polygon vertices
  const rawPoints: [number, number][] = [];

  // Right half (from apex down to stem bottom right)
  for (const [x, y] of rightHalfRaw) {
    rawPoints.push([x, y]);
  }

  // Left half (from stem bottom left back up to Upper Left Top Notch)
  for (let i = rightHalfRaw.length - 1; i >= 1; i--) {
    const [x, y] = rightHalfRaw[i];
    rawPoints.push([-x, y]);
  }

  // Normalization factor mapping apex (0.8458) to 1.0
  const normFactor = 1 / 0.8458;

  // Transform to center, scale, and rotate
  const points: [number, number][] = rawPoints.map(([x, y]) => {
    const sx = x * normFactor * scale;
    const sy = y * normFactor * scale;
    const rx = sx * cos - sy * sin;
    const ry = sx * sin + sy * cos;
    return [cx + rx, cy + ry];
  });

  let leaf = draw(points[0]);
  for (let i = 1; i < points.length; i++) {
    leaf = leaf.lineTo(points[i]);
  }
  return leaf.close();
}

/**
 * Splits the inner hexagon into a single 5-pointed star and the surrounding field
 * (e.g. Vietnam, Somalia):
 * - radiusRatio: outer radius of the star relative to rInner (default 0.6)
 * - offsetFraction: horizontal shift towards hoist (0 for centered)
 * - orientation: 'horizontal' / 'standard' or 'vertical' / 'rotated'
 */
export function createStarFlagSections2D(
  innerHex: Drawing,
  rInner: number,
  radiusRatio: number = 0.6,
  offsetFraction: number = 0,
  orientation: string = 'horizontal'
): { fieldSection: Drawing; starSection: Drawing } {
  const isVertical =
    orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
  const rStar = rInner * radiusRatio;
  const w = (rInner * Math.sqrt(3)) / 2;

  let cx = 0;
  let cy = 0;
  if (offsetFraction !== 0) {
    if (isVertical) {
      cy = rInner * -offsetFraction;
    } else {
      cx = w * offsetFraction;
    }
  }

  const rot = isVertical ? -Math.PI / 2 : 0;
  const star2D = drawStar(rStar, rStar * 0.381966, [cx, cy], rot);
  const starSection = innerHex.intersect(star2D);
  const fieldSection = innerHex.cut(star2D);

  return { fieldSection, starSection };
}

/**
 * Generator factory for single 5-pointed star flags (e.g. Vietnam, Somalia)
 */
export function createStarFlagGenerator(
  fieldColor: string,
  starColor: string,
  radiusRatio: number = 0.6,
  offsetFraction: number = 0,
  nativeOrientation: 'horizontal' | 'vertical' = 'horizontal'
): FlagGeneratorFn {
  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const effectiveOrientation = resolveEffectiveOrientation(orientation, nativeOrientation);
    const { fieldSection, starSection } = createStarFlagSections2D(
      innerHex,
      rInner,
      radiusRatio,
      offsetFraction,
      effectiveOrientation
    );

    const sField = extrudeAndFillet2D(fieldSection, zOffset, hFlag, fFlag);
    const sStar = extrudeAndFillet2D(starSection, zOffset, hFlag, 0);

    const parts: ReplicadPart[] = [];
    if (sField) {
      parts.push({
        shape: sField,
        name: 'Flag_Field',
        color: fieldColor
      });
    }
    if (sStar) {
      parts.push({
        shape: sStar,
        name: 'Flag_Star',
        color: starColor
      });
    }
    return parts;
  };
}

export interface StarConfig {
  color: string;
  outerRadiusRatio?: number;
  innerRadiusRatio?: number;
  centerRatio?: [number, number];
  rotationAngle?: number;
  numPoints?: number;
  name?: string;
}

export function transformStarPositionAndRotation(
  centerRatio: [number, number],
  rotationAngle: number,
  nativeOrientation: 'horizontal' | 'vertical',
  effectiveOrientation: 'horizontal' | 'vertical',
  w: number,
  rInner: number
): { cx: number; cy: number; rot: number } {
  const [xf, yf] = centerRatio;
  if (effectiveOrientation === nativeOrientation) {
    return {
      cx: w * xf,
      cy: rInner * yf,
      rot: rotationAngle
    };
  }

  // When rotating 90 deg CW between horizontal and vertical:
  // Top (+Y) -> Right (+X): cx = yf * w
  // Hoist (-X) -> Top (+Y): cy = -xf * rInner
  // Star orientation rotates by -90 deg (-Math.PI / 2)
  return {
    cx: yf * w,
    cy: -xf * rInner,
    rot: rotationAngle - Math.PI / 2
  };
}

/**
 * Generator factory for multi-stripe flags with overlay star(s)
 * (e.g. Burkina Faso, Cameroon, Myanmar, Ghana, Senegal, Suriname, Syria, Honduras, Venezuela)
 */
export function createMultiStripeWithStarsFlagGenerator(
  stripeColors: string[],
  stars: StarConfig | StarConfig[],
  nativeOrientation: 'horizontal' | 'vertical' = 'horizontal',
  ratios?: number[]
): FlagGeneratorFn {
  const starConfigs = Array.isArray(stars) ? stars : [stars];
  const effectiveRatios =
    ratios && ratios.length === stripeColors.length ? ratios : stripeColors.map(() => 1);

  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const effectiveOrientation = resolveEffectiveOrientation(orientation, nativeOrientation);
    const isVertical = effectiveOrientation === 'vertical';
    const w = (rInner * Math.sqrt(3)) / 2;

    const baseSections = createMultiStripeSections2D(
      innerHex,
      rInner,
      effectiveRatios,
      effectiveOrientation,
      nativeOrientation
    );

    const starDrawings: Drawing[] = [];
    for (const sc of starConfigs) {
      const outerR = rInner * (sc.outerRadiusRatio ?? 0.35);
      const innerR = sc.innerRadiusRatio !== undefined ? rInner * sc.innerRadiusRatio : undefined;
      const centerRatio = sc.centerRatio ?? [0, 0];
      const baseRot = sc.rotationAngle ?? 0;
      const { cx, cy, rot } = transformStarPositionAndRotation(
        centerRatio,
        baseRot,
        nativeOrientation,
        effectiveOrientation,
        w,
        rInner
      );
      starDrawings.push(drawStar(outerR, innerR, [cx, cy], rot, sc.numPoints ?? 5));
    }

    const cutSections = baseSections.map((section) => {
      let s = section;
      for (const sd of starDrawings) {
        try {
          s = s.cut(sd);
        } catch {
          // Disjoint non-intersecting section remains unchanged
        }
      }
      return s;
    });

    const parts: ReplicadPart[] = [];
    const n = stripeColors.length;
    for (let i = 0; i < n; i++) {
      const sShape = extrudeAndFillet2D(cutSections[i], zOffset, hFlag, fFlag);
      if (sShape) {
        let name: string;
        if (n === 1) {
          name = 'Flag_Field';
        } else if (n === 2) {
          name = isVertical
            ? nativeOrientation === 'horizontal'
              ? i === 0
                ? 'Flag_Right'
                : 'Flag_Left'
              : i === 0
                ? 'Flag_Left'
                : 'Flag_Right'
            : i === 0
              ? 'Flag_Top'
              : 'Flag_Bottom';
        } else if (n === 3) {
          name = isVertical
            ? nativeOrientation === 'horizontal'
              ? i === 0
                ? 'Flag_Right'
                : i === 1
                  ? 'Flag_Middle'
                  : 'Flag_Left'
              : i === 0
                ? 'Flag_Left'
                : i === 1
                  ? 'Flag_Middle'
                  : 'Flag_Right'
            : i === 0
              ? 'Flag_Top'
              : i === 1
                ? 'Flag_Middle'
                : 'Flag_Bottom';
        } else {
          name = `Flag_Stripe_${i + 1}`;
        }
        parts.push({
          shape: sShape,
          name,
          color: stripeColors[i]
        });
      }
    }

    for (let i = 0; i < starConfigs.length; i++) {
      const starSection = innerHex.intersect(starDrawings[i]);
      const sStar = extrudeAndFillet2D(starSection, zOffset, hFlag, 0);
      if (sStar) {
        const starName =
          starConfigs[i].name ?? (starConfigs.length === 1 ? 'Flag_Star' : `Flag_Star_${i + 1}`);
        parts.push({
          shape: sStar,
          name: starName,
          color: starConfigs[i].color
        });
      }
    }

    return parts;
  };
}

/**
 * Generator factory for triangular pile + fly bands with overlay star(s)
 * (e.g. Cuba, Djibouti, Puerto Rico, South Sudan, São Tomé and Príncipe)
 */
export function createTrianglePileMultiBandsWithStarsFlagGenerator(
  triangleColor: string,
  flyColors: string[],
  stars: StarConfig | StarConfig[],
  apexFraction: number = 0.5,
  nativeOrientation: 'horizontal' | 'vertical' = 'horizontal',
  ratios?: number[]
): FlagGeneratorFn {
  const starConfigs = Array.isArray(stars) ? stars : [stars];
  const effectiveRatios =
    ratios && ratios.length === flyColors.length ? ratios : flyColors.map(() => 1);

  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const effectiveOrientation = resolveEffectiveOrientation(orientation, nativeOrientation);
    const isVertical = effectiveOrientation === 'vertical';
    const w = (rInner * Math.sqrt(3)) / 2;

    const { triangleSection, flySections } = createTrianglePileMultiBandsSections2D(
      innerHex,
      rInner,
      apexFraction,
      effectiveRatios,
      effectiveOrientation
    );

    const starDrawings: Drawing[] = [];
    for (const sc of starConfigs) {
      const outerR = rInner * (sc.outerRadiusRatio ?? 0.35);
      const innerR = sc.innerRadiusRatio !== undefined ? rInner * sc.innerRadiusRatio : undefined;
      const centerRatio = sc.centerRatio ?? [-0.48, 0];
      const baseRot = sc.rotationAngle ?? 0;
      const { cx, cy, rot } = transformStarPositionAndRotation(
        centerRatio,
        baseRot,
        nativeOrientation,
        effectiveOrientation,
        w,
        rInner
      );
      starDrawings.push(drawStar(outerR, innerR, [cx, cy], rot, sc.numPoints ?? 5));
    }

    let cutTriangle = triangleSection;
    for (const sd of starDrawings) {
      try {
        cutTriangle = cutTriangle.cut(sd);
      } catch {
        // Disjoint
      }
    }

    const cutFlySections = flySections.map((section) => {
      let s = section;
      for (const sd of starDrawings) {
        try {
          s = s.cut(sd);
        } catch {
          // Disjoint
        }
      }
      return s;
    });

    const parts: ReplicadPart[] = [];
    const sTriangle = extrudeAndFillet2D(cutTriangle, zOffset, hFlag, fFlag);
    if (sTriangle) {
      parts.push({
        shape: sTriangle,
        name: isVertical ? 'Flag_Top' : 'Flag_Left',
        color: triangleColor
      });
    }

    for (let i = 0; i < cutFlySections.length; i++) {
      const sFly = extrudeAndFillet2D(cutFlySections[i], zOffset, hFlag, fFlag);
      if (sFly) {
        let name: string;
        if (cutFlySections.length === 2) {
          name = isVertical
            ? i === 0
              ? 'Flag_Bottom_Left'
              : 'Flag_Bottom_Right'
            : i === 0
              ? 'Flag_Top'
              : 'Flag_Bottom';
        } else if (cutFlySections.length === 3) {
          name = isVertical
            ? i === 0
              ? 'Flag_Bottom_Left'
              : i === 1
                ? 'Flag_Bottom_Middle'
                : 'Flag_Bottom_Right'
            : i === 0
              ? 'Flag_Top'
              : i === 1
                ? 'Flag_Middle'
                : 'Flag_Bottom';
        } else {
          name = `Flag_Fly_${i + 1}`;
        }
        parts.push({
          shape: sFly,
          name,
          color: flyColors[i]
        });
      }
    }

    for (let i = 0; i < starConfigs.length; i++) {
      const starSection = innerHex.intersect(starDrawings[i]);
      const sStar = extrudeAndFillet2D(starSection, zOffset, hFlag, 0);
      if (sStar) {
        const starName =
          starConfigs[i].name ?? (starConfigs.length === 1 ? 'Flag_Star' : `Flag_Star_${i + 1}`);
        parts.push({
          shape: sStar,
          name: starName,
          color: starConfigs[i].color
        });
      }
    }

    return parts;
  };
}

/**
 * Generator factory for rectangular hoist band + fly bands with overlay star(s)
 * (e.g. Guinea-Bissau)
 */
export function createHoistMultiBandsWithStarsFlagGenerator(
  hoistColor: string,
  flyColors: string[],
  stars: StarConfig | StarConfig[],
  hoistFraction: number = 1 / 3,
  nativeOrientation: 'horizontal' | 'vertical' = 'horizontal',
  ratios?: number[]
): FlagGeneratorFn {
  const starConfigs = Array.isArray(stars) ? stars : [stars];
  const effectiveRatios =
    ratios && ratios.length === flyColors.length ? ratios : flyColors.map(() => 1);

  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const effectiveOrientation = resolveEffectiveOrientation(orientation, nativeOrientation);
    const isVertical = effectiveOrientation === 'vertical';
    const w = (rInner * Math.sqrt(3)) / 2;

    const { hoistSection, flySections } = createHoistMultiBandsSections2D(
      innerHex,
      rInner,
      hoistFraction,
      effectiveRatios,
      effectiveOrientation
    );

    const starDrawings: Drawing[] = [];
    for (const sc of starConfigs) {
      const outerR = rInner * (sc.outerRadiusRatio ?? 0.35);
      const innerR = sc.innerRadiusRatio !== undefined ? rInner * sc.innerRadiusRatio : undefined;
      const centerRatio = sc.centerRatio ?? [-0.65, 0];
      const baseRot = sc.rotationAngle ?? 0;
      const { cx, cy, rot } = transformStarPositionAndRotation(
        centerRatio,
        baseRot,
        nativeOrientation,
        effectiveOrientation,
        w,
        rInner
      );
      starDrawings.push(drawStar(outerR, innerR, [cx, cy], rot, sc.numPoints ?? 5));
    }

    let cutHoist = hoistSection;
    for (const sd of starDrawings) {
      try {
        cutHoist = cutHoist.cut(sd);
      } catch {
        // Disjoint
      }
    }

    const cutFlySections = flySections.map((section) => {
      let s = section;
      for (const sd of starDrawings) {
        try {
          s = s.cut(sd);
        } catch {
          // Disjoint
        }
      }
      return s;
    });

    const parts: ReplicadPart[] = [];
    const sHoist = extrudeAndFillet2D(cutHoist, zOffset, hFlag, fFlag);
    if (sHoist) {
      parts.push({
        shape: sHoist,
        name: isVertical ? 'Flag_Top' : 'Flag_Left',
        color: hoistColor
      });
    }

    for (let i = 0; i < cutFlySections.length; i++) {
      const sFly = extrudeAndFillet2D(cutFlySections[i], zOffset, hFlag, fFlag);
      if (sFly) {
        let name: string;
        if (cutFlySections.length === 2) {
          name = isVertical
            ? i === 0
              ? 'Flag_Bottom_Left'
              : 'Flag_Bottom_Right'
            : i === 0
              ? 'Flag_Top'
              : 'Flag_Bottom';
        } else if (cutFlySections.length === 3) {
          name = isVertical
            ? i === 0
              ? 'Flag_Bottom_Left'
              : i === 1
                ? 'Flag_Bottom_Middle'
                : 'Flag_Bottom_Right'
            : i === 0
              ? 'Flag_Top'
              : i === 1
                ? 'Flag_Middle'
                : 'Flag_Bottom';
        } else {
          name = `Flag_Fly_${i + 1}`;
        }
        parts.push({
          shape: sFly,
          name,
          color: flyColors[i]
        });
      }
    }

    for (let i = 0; i < starConfigs.length; i++) {
      const starSection = innerHex.intersect(starDrawings[i]);
      const sStar = extrudeAndFillet2D(starSection, zOffset, hFlag, 0);
      if (sStar) {
        const starName =
          starConfigs[i].name ?? (starConfigs.length === 1 ? 'Flag_Star' : `Flag_Star_${i + 1}`);
        parts.push({
          shape: sStar,
          name: starName,
          color: starConfigs[i].color
        });
      }
    }

    return parts;
  };
}

/**
 * Splits the inner hexagon into a cross (centered or Nordic hoist-offset)
 * and four corner cantons (e.g. England, Denmark, Finland, Sweden, Dominican Republic):
 * - thicknessRatio: thickness of the cross arms relative to rInner (default 0.35)
 * - offsetFraction: horizontal shift of vertical cross bar towards hoist (0 for centered, -0.2 for Nordic)
 * - orientation: 'horizontal' / 'standard' or 'vertical' / 'rotated'
 */
export function createCrossFlagSections2D(
  innerHex: Drawing,
  rInner: number,
  thicknessRatio: number = 0.35,
  offsetFraction: number = 0,
  orientation: string = 'horizontal'
): {
  crossSection: Drawing;
  topLeftSection: Drawing;
  topRightSection: Drawing;
  bottomLeftSection: Drawing;
  bottomRightSection: Drawing;
} {
  const span = rInner * 4;
  const isVertical =
    orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
  const armT = rInner * thicknessRatio;
  const halfT = armT / 2;
  const w = (rInner * Math.sqrt(3)) / 2;

  let cx = 0;
  let cy = 0;
  if (offsetFraction !== 0) {
    if (isVertical) {
      cy = rInner * -offsetFraction;
    } else {
      cx = w * offsetFraction;
    }
  }

  // 4 corner canton bounding boxes
  const topLeftBox = draw([-span, cy + halfT])
    .lineTo([cx - halfT, cy + halfT])
    .lineTo([cx - halfT, span])
    .lineTo([-span, span])
    .close();

  const topRightBox = draw([cx + halfT, cy + halfT])
    .lineTo([span, cy + halfT])
    .lineTo([span, span])
    .lineTo([cx + halfT, span])
    .close();

  const bottomLeftBox = draw([-span, -span])
    .lineTo([cx - halfT, -span])
    .lineTo([cx - halfT, cy - halfT])
    .lineTo([-span, cy - halfT])
    .close();

  const bottomRightBox = draw([cx + halfT, -span])
    .lineTo([span, -span])
    .lineTo([span, cy - halfT])
    .lineTo([cx + halfT, cy - halfT])
    .close();

  const topLeftSection = innerHex.intersect(topLeftBox);
  const topRightSection = innerHex.intersect(topRightBox);
  const bottomLeftSection = innerHex.intersect(bottomLeftBox);
  const bottomRightSection = innerHex.intersect(bottomRightBox);

  const crossSection = innerHex
    .cut(topLeftBox)
    .cut(topRightBox)
    .cut(bottomLeftBox)
    .cut(bottomRightBox);

  return {
    crossSection,
    topLeftSection,
    topRightSection,
    bottomLeftSection,
    bottomRightSection
  };
}

/**
 * Generator factory for cross flags (e.g. England, Denmark, Finland, Sweden, Dominican Republic)
 */
export function createCrossFlagGenerator(
  crossColor: string,
  cantonColors: string | [string, string, string, string],
  thicknessRatio: number = 0.35,
  offsetFraction: number = 0,
  nativeOrientation: 'horizontal' | 'vertical' = 'horizontal'
): FlagGeneratorFn {
  const [tlColor, trColor, blColor, brColor] =
    typeof cantonColors === 'string'
      ? [cantonColors, cantonColors, cantonColors, cantonColors]
      : cantonColors;

  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const effectiveOrientation = resolveEffectiveOrientation(orientation, nativeOrientation);
    const { crossSection, topLeftSection, topRightSection, bottomLeftSection, bottomRightSection } =
      createCrossFlagSections2D(
        innerHex,
        rInner,
        thicknessRatio,
        offsetFraction,
        effectiveOrientation
      );

    const sCross = extrudeAndFillet2D(crossSection, zOffset, hFlag, fFlag);
    const sTL = extrudeAndFillet2D(topLeftSection, zOffset, hFlag, fFlag);
    const sTR = extrudeAndFillet2D(topRightSection, zOffset, hFlag, fFlag);
    const sBL = extrudeAndFillet2D(bottomLeftSection, zOffset, hFlag, fFlag);
    const sBR = extrudeAndFillet2D(bottomRightSection, zOffset, hFlag, fFlag);

    const parts: ReplicadPart[] = [];
    if (sCross) {
      parts.push({
        shape: sCross,
        name: 'Flag_Cross',
        color: crossColor
      });
    }
    if (sTL) {
      parts.push({
        shape: sTL,
        name: 'Flag_Canton_Top_Left',
        color: tlColor
      });
    }
    if (sTR) {
      parts.push({
        shape: sTR,
        name: 'Flag_Canton_Top_Right',
        color: trColor
      });
    }
    if (sBL) {
      parts.push({
        shape: sBL,
        name: 'Flag_Canton_Bottom_Left',
        color: blColor
      });
    }
    if (sBR) {
      parts.push({
        shape: sBR,
        name: 'Flag_Canton_Bottom_Right',
        color: brColor
      });
    }
    return parts;
  };
}

/**
 * Splits the inner hexagon into a double cross (outer fimbriation border + inner cross)
 * and four corner cantons (e.g. Norway, Iceland):
 * - outerThicknessRatio: thickness of the outer cross relative to rInner (default 0.36)
 * - innerThicknessRatio: thickness of the inner cross relative to rInner (default 0.18)
 * - offsetFraction: horizontal shift of vertical cross bar towards hoist (-0.2 for Nordic)
 * - orientation: 'horizontal' / 'standard' or 'vertical' / 'rotated'
 */
export function createDoubleCrossFlagSections2D(
  innerHex: Drawing,
  rInner: number,
  outerThicknessRatio: number = 0.36,
  innerThicknessRatio: number = 0.18,
  offsetFraction: number = 0,
  orientation: string = 'horizontal'
): {
  innerCrossSection: Drawing;
  outerCrossSection: Drawing;
  topLeftSection: Drawing;
  topRightSection: Drawing;
  bottomLeftSection: Drawing;
  bottomRightSection: Drawing;
} {
  const outerSections = createCrossFlagSections2D(
    innerHex,
    rInner,
    outerThicknessRatio,
    offsetFraction,
    orientation
  );

  const innerSections = createCrossFlagSections2D(
    innerHex,
    rInner,
    innerThicknessRatio,
    offsetFraction,
    orientation
  );

  const innerCrossSection = innerSections.crossSection;
  const outerCrossSection = outerSections.crossSection.cut(innerCrossSection);

  return {
    innerCrossSection,
    outerCrossSection,
    topLeftSection: outerSections.topLeftSection,
    topRightSection: outerSections.topRightSection,
    bottomLeftSection: outerSections.bottomLeftSection,
    bottomRightSection: outerSections.bottomRightSection
  };
}

/**
 * Generator factory for double cross flags (e.g. Norway, Iceland)
 */
export function createDoubleCrossFlagGenerator(
  innerCrossColor: string,
  outerCrossColor: string,
  cantonColors: string | [string, string, string, string],
  outerThicknessRatio: number = 0.36,
  innerThicknessRatio: number = 0.18,
  offsetFraction: number = -0.2,
  nativeOrientation: 'horizontal' | 'vertical' = 'horizontal'
): FlagGeneratorFn {
  const [tlColor, trColor, blColor, brColor] =
    typeof cantonColors === 'string'
      ? [cantonColors, cantonColors, cantonColors, cantonColors]
      : cantonColors;

  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const effectiveOrientation = resolveEffectiveOrientation(orientation, nativeOrientation);
    const {
      innerCrossSection,
      outerCrossSection,
      topLeftSection,
      topRightSection,
      bottomLeftSection,
      bottomRightSection
    } = createDoubleCrossFlagSections2D(
      innerHex,
      rInner,
      outerThicknessRatio,
      innerThicknessRatio,
      offsetFraction,
      effectiveOrientation
    );

    const sInnerCross = extrudeAndFillet2D(innerCrossSection, zOffset, hFlag, fFlag);
    const sOuterCross = extrudeAndFillet2D(outerCrossSection, zOffset, hFlag, fFlag);
    const sTL = extrudeAndFillet2D(topLeftSection, zOffset, hFlag, fFlag);
    const sTR = extrudeAndFillet2D(topRightSection, zOffset, hFlag, fFlag);
    const sBL = extrudeAndFillet2D(bottomLeftSection, zOffset, hFlag, fFlag);
    const sBR = extrudeAndFillet2D(bottomRightSection, zOffset, hFlag, fFlag);

    const parts: ReplicadPart[] = [];
    if (sInnerCross) {
      parts.push({
        shape: sInnerCross,
        name: 'Flag_Inner_Cross',
        color: innerCrossColor
      });
    }
    if (sOuterCross) {
      parts.push({
        shape: sOuterCross,
        name: 'Flag_Outer_Cross',
        color: outerCrossColor
      });
    }
    if (sTL) {
      parts.push({
        shape: sTL,
        name: 'Flag_Canton_Top_Left',
        color: tlColor
      });
    }
    if (sTR) {
      parts.push({
        shape: sTR,
        name: 'Flag_Canton_Top_Right',
        color: trColor
      });
    }
    if (sBL) {
      parts.push({
        shape: sBL,
        name: 'Flag_Canton_Bottom_Left',
        color: blColor
      });
    }
    if (sBR) {
      parts.push({
        shape: sBR,
        name: 'Flag_Canton_Bottom_Right',
        color: brColor
      });
    }
    return parts;
  };
}

/**
 * Splits the inner hexagon into a diagonal cross (saltire) and 4 triangular regions
 * (Top, Bottom, Left, Right) (e.g. Scotland, Jamaica):
 * - thicknessRatio: thickness of diagonal cross arms relative to rInner (default 0.3)
 * - orientation: 'horizontal' / 'standard' or 'vertical' / 'rotated'
 */
export function createSaltireFlagSections2D(
  innerHex: Drawing,
  rInner: number,
  thicknessRatio: number = 0.3,
  orientation: string = 'horizontal'
): {
  saltireSection: Drawing;
  topSection: Drawing;
  bottomSection: Drawing;
  leftSection: Drawing;
  rightSection: Drawing;
} {
  const span = rInner * 4;
  const isVertical =
    orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
  const armT = rInner * thicknessRatio;
  const halfT = armT / 2;
  const d = halfT * Math.SQRT2;

  // 4 non-overlapping triangular outer boxes outside the saltire cross
  const topBox = draw([0, d])
    .lineTo([span, span + d])
    .lineTo([span, span * 2])
    .lineTo([-span, span * 2])
    .lineTo([-span, span + d])
    .close();

  const bottomBox = draw([0, -d])
    .lineTo([span, -span - d])
    .lineTo([span, -span * 2])
    .lineTo([-span, -span * 2])
    .lineTo([-span, -span - d])
    .close();

  const leftBox = draw([-d, 0])
    .lineTo([-span - d, span])
    .lineTo([-span * 2, span])
    .lineTo([-span * 2, -span])
    .lineTo([-span - d, -span])
    .close();

  const rightBox = draw([d, 0])
    .lineTo([span + d, span])
    .lineTo([span * 2, span])
    .lineTo([span * 2, -span])
    .lineTo([span + d, -span])
    .close();

  const topSection = innerHex.intersect(isVertical ? leftBox : topBox);
  const bottomSection = innerHex.intersect(isVertical ? rightBox : bottomBox);
  const leftSection = innerHex.intersect(isVertical ? topBox : leftBox);
  const rightSection = innerHex.intersect(isVertical ? bottomBox : rightBox);

  const saltireSection = innerHex.cut(topBox).cut(bottomBox).cut(leftBox).cut(rightBox);

  return {
    saltireSection,
    topSection,
    bottomSection,
    leftSection,
    rightSection
  };
}

/**
 * Generator factory for diagonal cross / saltire flags (e.g. Scotland, Jamaica)
 */
export function createSaltireFlagGenerator(
  saltireColor: string,
  fieldColors: string | [string, string, string, string],
  thicknessRatio: number = 0.3,
  nativeOrientation: 'horizontal' | 'vertical' = 'horizontal'
): FlagGeneratorFn {
  const [topColor, bottomColor, leftColor, rightColor] =
    typeof fieldColors === 'string'
      ? [fieldColors, fieldColors, fieldColors, fieldColors]
      : fieldColors;

  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const effectiveOrientation = resolveEffectiveOrientation(orientation, nativeOrientation);
    const { saltireSection, topSection, bottomSection, leftSection, rightSection } =
      createSaltireFlagSections2D(innerHex, rInner, thicknessRatio, effectiveOrientation);

    const sSaltire = extrudeAndFillet2D(saltireSection, zOffset, hFlag, fFlag);
    const sTop = extrudeAndFillet2D(topSection, zOffset, hFlag, fFlag);
    const sBottom = extrudeAndFillet2D(bottomSection, zOffset, hFlag, fFlag);
    const sLeft = extrudeAndFillet2D(leftSection, zOffset, hFlag, fFlag);
    const sRight = extrudeAndFillet2D(rightSection, zOffset, hFlag, fFlag);

    const parts: ReplicadPart[] = [];
    if (sSaltire) {
      parts.push({
        shape: sSaltire,
        name: 'Flag_Saltire',
        color: saltireColor
      });
    }
    if (sTop) {
      parts.push({
        shape: sTop,
        name: 'Flag_Top',
        color: topColor
      });
    }
    if (sBottom) {
      parts.push({
        shape: sBottom,
        name: 'Flag_Bottom',
        color: bottomColor
      });
    }
    if (sLeft) {
      parts.push({
        shape: sLeft,
        name: 'Flag_Left',
        color: leftColor
      });
    }
    if (sRight) {
      parts.push({
        shape: sRight,
        name: 'Flag_Right',
        color: rightColor
      });
    }
    return parts;
  };
}

/**
 * Generator factory for bicolor flag designs (2 halves)
 */
export function createBicolorFlagGenerator(
  color1: string,
  color2: string,
  nativeOrientation: 'horizontal' | 'vertical' = 'horizontal'
): FlagGeneratorFn {
  return createMultiStripeFlagGenerator([color1, color2], nativeOrientation);
}

/**
 * Generator factory for tricolor flag designs (equal or uneven proportional ratios)
 */
export function createTricolorFlagGenerator(
  color1: string,
  color2: string,
  color3: string,
  nativeOrientation: 'horizontal' | 'vertical' = 'vertical',
  ratios: [number, number, number] = [1, 1, 1]
): FlagGeneratorFn {
  return createMultiStripeFlagGenerator([color1, color2, color3], nativeOrientation, ratios);
}

/**
 * Generator factory for flags with a canton box and horizontal stripes with overlay star(s)
 * (e.g. Chile, Togo, Liberia)
 */
export function createCantonStripesWithStarFlagGenerator(
  cantonColor: string,
  stripeColors: string[],
  stars: StarConfig | StarConfig[],
  cantonWidthRatio: number = 0.5,
  cantonHeightRatio: number = 0.5,
  stripeRatios?: number[],
  nativeOrientation: 'horizontal' | 'vertical' = 'horizontal'
): FlagGeneratorFn {
  const starConfigs = Array.isArray(stars) ? stars : [stars];
  const effectiveRatios =
    stripeRatios && stripeRatios.length === stripeColors.length
      ? stripeRatios
      : stripeColors.map(() => 1);

  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const effectiveOrientation = resolveEffectiveOrientation(orientation, nativeOrientation);
    const isVertical = effectiveOrientation === 'vertical';
    const span = rInner * 4;
    const w = (rInner * Math.sqrt(3)) / 2;

    // Horizontal: Canton in Top-Left (x in [-span, splitX], y in [splitY, span])
    // Vertical (90 deg CW): Canton in Top-Right (x in [splitX, span], y in [splitY, span])
    const splitX = isVertical ? w * (1 - 2 * cantonHeightRatio) : w * (2 * cantonWidthRatio - 1);
    const splitY = isVertical
      ? rInner * (1 - 2 * cantonWidthRatio)
      : rInner * (1 - 2 * cantonHeightRatio);

    const cantonBox = isVertical
      ? draw([splitX, splitY])
          .lineTo([span, splitY])
          .lineTo([span, span])
          .lineTo([splitX, span])
          .close()
      : draw([-span, splitY])
          .lineTo([splitX, splitY])
          .lineTo([splitX, span])
          .lineTo([-span, span])
          .close();

    const sum = effectiveRatios.reduce((acc, r) => acc + r, 0);
    const cumSums: number[] = [0];
    for (let i = 0; i < effectiveRatios.length; i++) {
      cumSums.push(cumSums[i] + effectiveRatios[i]);
    }

    let baseStripes: Drawing[] = [];
    if (isVertical) {
      // 90 deg CW rotation: Stripe 0 is at Right (+X), Stripe N-1 is at Left (-X)
      const splitXStripes: number[] = [span];
      for (let i = 1; i < effectiveRatios.length; i++) {
        splitXStripes.push(w * (1 - (2 * cumSums[i]) / sum));
      }
      splitXStripes.push(-span);

      for (let i = 0; i < effectiveRatios.length; i++) {
        const box = draw([splitXStripes[i + 1], -span])
          .lineTo([splitXStripes[i], -span])
          .lineTo([splitXStripes[i], span])
          .lineTo([splitXStripes[i + 1], span])
          .close();
        baseStripes.push(innerHex.intersect(box));
      }
    } else {
      baseStripes = createMultiStripeSections2D(
        innerHex,
        rInner,
        effectiveRatios,
        effectiveOrientation
      );
    }

    const starDrawings: Drawing[] = [];
    for (const sc of starConfigs) {
      const outerR = rInner * (sc.outerRadiusRatio ?? 0.22);
      const innerR = sc.innerRadiusRatio !== undefined ? rInner * sc.innerRadiusRatio : undefined;
      const baseRot = sc.rotationAngle ?? 0;

      // In vertical (90 deg CW), canton is at Top-Right with geometric center at:
      // cx = w * (1 - cantonHeightRatio), cy = rInner * (1 - cantonWidthRatio)
      // In horizontal, canton center is:
      // cx = w * (sc.centerRatio ? sc.centerRatio[0] : (cantonWidthRatio - 1))
      // cy = rInner * (sc.centerRatio ? sc.centerRatio[1] : (1 - cantonHeightRatio))
      const cx = isVertical
        ? w * (1 - cantonHeightRatio)
        : sc.centerRatio
          ? w * sc.centerRatio[0]
          : w * (cantonWidthRatio - 1);
      const cy = isVertical
        ? rInner * (1 - cantonWidthRatio)
        : sc.centerRatio
          ? rInner * sc.centerRatio[1]
          : rInner * (1 - cantonHeightRatio);
      const rot = baseRot + (isVertical ? -Math.PI / 2 : 0);
      starDrawings.push(drawStar(outerR, innerR, [cx, cy], rot, sc.numPoints ?? 5));
    }

    let cantonSection = innerHex.intersect(cantonBox);
    for (const sd of starDrawings) {
      try {
        cantonSection = cantonSection.cut(sd);
      } catch {}
    }

    const cutStripes = baseStripes.map((stripe) => {
      let s = stripe;
      try {
        s = s.cut(cantonBox);
      } catch {}
      for (const sd of starDrawings) {
        try {
          s = s.cut(sd);
        } catch {}
      }
      return s;
    });

    const parts: ReplicadPart[] = [];
    const sCanton = extrudeAndFillet2D(cantonSection, zOffset, hFlag, fFlag);
    if (sCanton) {
      parts.push({
        shape: sCanton,
        name: 'Flag_Canton',
        color: cantonColor
      });
    }

    for (let i = 0; i < stripeColors.length; i++) {
      const sStripe = extrudeAndFillet2D(cutStripes[i], zOffset, hFlag, fFlag);
      if (sStripe) {
        parts.push({
          shape: sStripe,
          name: `Flag_Stripe_${i + 1}`,
          color: stripeColors[i]
        });
      }
    }

    for (let i = 0; i < starConfigs.length; i++) {
      const starSection = innerHex.intersect(starDrawings[i]);
      const sStar = extrudeAndFillet2D(starSection, zOffset, hFlag, 0);
      if (sStar) {
        const starName =
          starConfigs[i].name ?? (starConfigs.length === 1 ? 'Flag_Star' : `Flag_Star_${i + 1}`);
        parts.push({
          shape: sStar,
          name: starName,
          color: starConfigs[i].color
        });
      }
    }

    return parts;
  };
}

/**
 * Generator factory for Panama flag (4 quarters with 2 stars)
 */
export function createPanamaFlagGenerator(): FlagGeneratorFn {
  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const isVertical =
      orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
    const span = rInner * 4;
    const w = (rInner * Math.sqrt(3)) / 2;

    const tlBox = draw([-span, 0]).lineTo([0, 0]).lineTo([0, span]).lineTo([-span, span]).close();
    const trBox = draw([0, 0]).lineTo([span, 0]).lineTo([span, span]).lineTo([0, span]).close();
    const blBox = draw([-span, -span]).lineTo([0, -span]).lineTo([0, 0]).lineTo([-span, 0]).close();
    const brBox = draw([0, -span]).lineTo([span, -span]).lineTo([span, 0]).lineTo([0, 0]).close();

    const starRadius = rInner * 0.26;
    const innerStarRadius = starRadius * 0.381966;
    const rot = isVertical ? -Math.PI / 2 : 0;

    // Horizontal:
    // TL: White + Blue Star (-0.45w, +0.45rInner)
    // TR: Red
    // BL: Blue
    // BR: White + Red Star (+0.45w, -0.45rInner)
    //
    // Vertical (90 deg CW rotation):
    // TL: Blue
    // TR: White + Blue Star (+0.45w, +0.45rInner)
    // BL: White + Red Star (-0.45w, -0.45rInner)
    // BR: Red
    const blueCenter: [number, number] = isVertical
      ? [0.45 * w, 0.45 * rInner]
      : [-0.45 * w, 0.45 * rInner];
    const redCenter: [number, number] = isVertical
      ? [-0.45 * w, -0.45 * rInner]
      : [0.45 * w, -0.45 * rInner];

    const blueStarDrawing = drawStar(starRadius, innerStarRadius, blueCenter, rot);
    const redStarDrawing = drawStar(starRadius, innerStarRadius, redCenter, rot);

    // Box with blue star: TL in horiz, TR in vert
    let secBlueStar = innerHex.intersect(isVertical ? trBox : tlBox);
    try {
      secBlueStar = secBlueStar.cut(blueStarDrawing);
    } catch {}

    // Box with red star: BR in horiz, BL in vert
    let secRedStar = innerHex.intersect(isVertical ? blBox : brBox);
    try {
      secRedStar = secRedStar.cut(redStarDrawing);
    } catch {}

    // Solid red box: TR in horiz, BR in vert
    const secSolidRed = innerHex.intersect(isVertical ? brBox : trBox);

    // Solid blue box: BL in horiz, TL in vert
    const secSolidBlue = innerHex.intersect(isVertical ? tlBox : blBox);

    const parts: ReplicadPart[] = [];
    const sWhite1 = extrudeAndFillet2D(secBlueStar, zOffset, hFlag, fFlag);
    if (sWhite1)
      parts.push({
        shape: sWhite1,
        name: isVertical ? 'Flag_Top_Right_White' : 'Flag_Top_Left_White',
        color: '#f8fafc'
      });

    const sWhite2 = extrudeAndFillet2D(secRedStar, zOffset, hFlag, fFlag);
    if (sWhite2)
      parts.push({
        shape: sWhite2,
        name: isVertical ? 'Flag_Bottom_Left_White' : 'Flag_Bottom_Right_White',
        color: '#f8fafc'
      });

    const sRed = extrudeAndFillet2D(secSolidRed, zOffset, hFlag, fFlag);
    if (sRed)
      parts.push({
        shape: sRed,
        name: isVertical ? 'Flag_Bottom_Right_Red' : 'Flag_Top_Right_Red',
        color: '#ef4444'
      });

    const sBlue = extrudeAndFillet2D(secSolidBlue, zOffset, hFlag, fFlag);
    if (sBlue)
      parts.push({
        shape: sBlue,
        name: isVertical ? 'Flag_Top_Left_Blue' : 'Flag_Bottom_Left_Blue',
        color: '#1d4ed8'
      });

    const sBlueStar = extrudeAndFillet2D(innerHex.intersect(blueStarDrawing), zOffset, hFlag, 0);
    if (sBlueStar) parts.push({ shape: sBlueStar, name: 'Flag_Star_Blue', color: '#1d4ed8' });

    const sRedStar = extrudeAndFillet2D(innerHex.intersect(redStarDrawing), zOffset, hFlag, 0);
    if (sRedStar) parts.push({ shape: sRedStar, name: 'Flag_Star_Red', color: '#ef4444' });

    return parts;
  };
}

/**
 * Generator factory for China flag (5 stars in canton, oriented towards large star)
 */
export function createChinaFlagGenerator(): FlagGeneratorFn {
  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const isVertical =
      orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
    const w = (rInner * Math.sqrt(3)) / 2;

    const bigCenter: [number, number] = isVertical
      ? [0.46 * w, 0.46 * rInner]
      : [-0.46 * w, 0.46 * rInner];
    const bigRot = isVertical ? -Math.PI / 2 : 0;

    const smallCenters: Array<[number, number]> = isVertical
      ? [
          [0.72 * w, 0.16 * rInner],
          [0.52 * w, 0.06 * rInner],
          [0.3 * w, 0.06 * rInner],
          [0.1 * w, 0.16 * rInner]
        ]
      : [
          [-0.16 * w, 0.72 * rInner],
          [-0.06 * w, 0.52 * rInner],
          [-0.06 * w, 0.3 * rInner],
          [-0.16 * w, 0.1 * rInner]
        ];

    const bigStarDrawing = drawStar(rInner * 0.22, rInner * 0.22 * 0.381966, bigCenter, bigRot);

    const smallStarDrawings: Drawing[] = smallCenters.map((sc) => {
      const dx = bigCenter[0] - sc[0];
      const dy = bigCenter[1] - sc[1];
      const rot = Math.atan2(dy, dx) - Math.PI / 2;
      return drawStar(rInner * 0.075, rInner * 0.075 * 0.381966, sc, rot);
    });

    let redField = innerHex.cut(bigStarDrawing);
    for (const sd of smallStarDrawings) {
      try {
        redField = redField.cut(sd);
      } catch {}
    }

    const parts: ReplicadPart[] = [];
    const sField = extrudeAndFillet2D(redField, zOffset, hFlag, fFlag);
    if (sField) {
      parts.push({ shape: sField, name: 'Flag_Field', color: '#ef4444' });
    }

    const sBig = extrudeAndFillet2D(innerHex.intersect(bigStarDrawing), zOffset, hFlag, 0);
    if (sBig) {
      parts.push({ shape: sBig, name: 'Flag_Star_Large', color: '#eab308' });
    }

    for (let i = 0; i < smallStarDrawings.length; i++) {
      const sSmall = extrudeAndFillet2D(
        innerHex.intersect(smallStarDrawings[i]),
        zOffset,
        hFlag,
        0
      );
      if (sSmall) {
        parts.push({ shape: sSmall, name: `Flag_Star_Small_${i + 1}`, color: '#eab308' });
      }
    }

    return parts;
  };
}

/**
 * Generator factory for North Korea flag (stripes, circle disc, star)
 */
export function createNorthKoreaFlagGenerator(): FlagGeneratorFn {
  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const isVertical =
      orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
    const w = (rInner * Math.sqrt(3)) / 2;
    const baseStripes = createMultiStripeSections2D(
      innerHex,
      rInner,
      [3, 0.5, 9, 0.5, 3],
      isVertical ? 'vertical' : 'horizontal'
    );

    const discRadius = rInner * 0.33;
    const starRadius = discRadius * 0.85; // Slightly smaller than disc
    const offsetFrac = -0.32;
    const cx = isVertical ? 0 : w * offsetFrac;
    const cy = isVertical ? rInner * -offsetFrac : 0;

    const discDrawing = drawCircle(discRadius).translate([cx, cy]);
    const starDrawing = drawStar(
      starRadius,
      starRadius * 0.381966,
      [cx, cy],
      isVertical ? -Math.PI / 2 : 0
    );

    let discSection = innerHex.intersect(discDrawing);
    try {
      discSection = discSection.cut(starDrawing);
    } catch {}

    const cutStripes = baseStripes.map((s) => {
      try {
        return s.cut(discDrawing);
      } catch {
        return s;
      }
    });

    const colors = ['#1d4ed8', '#f8fafc', '#ef4444', '#f8fafc', '#1d4ed8'];
    const parts: ReplicadPart[] = [];
    for (let i = 0; i < 5; i++) {
      const solid = extrudeAndFillet2D(cutStripes[i], zOffset, hFlag, fFlag);
      if (solid) parts.push({ shape: solid, name: `Flag_Stripe_${i + 1}`, color: colors[i] });
    }

    const sDisc = extrudeAndFillet2D(discSection, zOffset, hFlag, fFlag);
    if (sDisc) parts.push({ shape: sDisc, name: 'Flag_Circle', color: '#f8fafc' });

    const sStar = extrudeAndFillet2D(innerHex.intersect(starDrawing), zOffset, hFlag, 0);
    if (sStar) parts.push({ shape: sStar, name: 'Flag_Star', color: '#ef4444' });

    return parts;
  };
}

/**
 * Generator factory for Central African Republic flag (4 stripes, vertical red band, star)
 */
export function createCentralAfricanRepublicFlagGenerator(): FlagGeneratorFn {
  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const isVertical =
      orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
    const span = rInner * 4;
    const w = (rInner * Math.sqrt(3)) / 2;
    let baseStripes: Drawing[] = [];
    if (isVertical) {
      const splitXStripes = [span, w * 0.5, 0, -w * 0.5, -span];
      for (let i = 0; i < 4; i++) {
        const box = draw([splitXStripes[i + 1], -span])
          .lineTo([splitXStripes[i], -span])
          .lineTo([splitXStripes[i], span])
          .lineTo([splitXStripes[i + 1], span])
          .close();
        baseStripes.push(innerHex.intersect(box));
      }
    } else {
      baseStripes = createMultiStripeSections2D(innerHex, rInner, [1, 1, 1, 1], 'horizontal');
    }

    const vertWidth = w * 0.32;
    const vertBox = isVertical
      ? draw([-span, -vertWidth / 2])
          .lineTo([span, -vertWidth / 2])
          .lineTo([span, vertWidth / 2])
          .lineTo([-span, vertWidth / 2])
          .close()
      : draw([-vertWidth / 2, -span])
          .lineTo([vertWidth / 2, -span])
          .lineTo([vertWidth / 2, span])
          .lineTo([-vertWidth / 2, span])
          .close();

    const starRadius = rInner * 0.16;
    const starCenter: [number, number] = isVertical
      ? [0.72 * w, 0.52 * rInner]
      : [-0.52 * w, 0.72 * rInner];
    const starRot = isVertical ? -Math.PI / 2 : 0;
    const starDrawing = drawStar(starRadius, starRadius * 0.381966, starCenter, starRot);

    const cutStripes = baseStripes.map((s) => {
      let res = s;
      try {
        res = res.cut(vertBox);
      } catch {}
      try {
        res = res.cut(starDrawing);
      } catch {}
      return res;
    });

    const colors = ['#1d4ed8', '#f8fafc', '#16a34a', '#eab308'];
    const parts: ReplicadPart[] = [];
    for (let i = 0; i < 4; i++) {
      const solid = extrudeAndFillet2D(cutStripes[i], zOffset, hFlag, fFlag);
      if (solid) parts.push({ shape: solid, name: `Flag_Stripe_${i + 1}`, color: colors[i] });
    }

    const sVert = extrudeAndFillet2D(innerHex.intersect(vertBox), zOffset, hFlag, fFlag);
    if (sVert) parts.push({ shape: sVert, name: 'Flag_Vertical_Stripe', color: '#ef4444' });

    const sStar = extrudeAndFillet2D(innerHex.intersect(starDrawing), zOffset, hFlag, 0);
    if (sStar) parts.push({ shape: sStar, name: 'Flag_Star', color: '#eab308' });

    return parts;
  };
}

/**
 * Generator factory for Timor-Leste flag (double chevron anchored at hoist corners + rotated star)
 */
export function createTimorLesteFlagGenerator(): FlagGeneratorFn {
  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const isVertical =
      orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
    const span = rInner * 4;
    const w = (rInner * Math.sqrt(3)) / 2;

    const yellowBox = isVertical
      ? draw([-span, (span * rInner) / w])
          .lineTo([0, 0])
          .lineTo([span, (span * rInner) / w])
          .close()
      : draw([-span, (span * rInner) / w])
          .lineTo([0, 0])
          .lineTo([-span, (-span * rInner) / w])
          .close();

    const blackBox = isVertical
      ? draw([-span, rInner / 3 + (span * 2 * rInner) / (3 * w)])
          .lineTo([0, rInner / 3])
          .lineTo([span, rInner / 3 + (span * 2 * rInner) / (3 * w)])
          .close()
      : draw([-span, -((1.5 * rInner) / w) * (-span + w / 3)])
          .lineTo([-w / 3, 0])
          .lineTo([-span, ((1.5 * rInner) / w) * (-span + w / 3)])
          .close();

    // Centered star with generous margin from all chevron edges
    const starRadius = rInner * 0.16;
    const starCenter: [number, number] = isVertical ? [0, 0.64 * rInner] : [-0.64 * w, 0];
    const baseRot = Math.atan2(rInner, -0.32 * w) - Math.PI / 2;
    const rot = isVertical ? baseRot - Math.PI / 2 : baseRot;
    const starDrawing = drawStar(starRadius, starRadius * 0.381966, starCenter, rot);

    let redSection = innerHex;
    try {
      redSection = redSection.cut(yellowBox);
    } catch {}

    let yellowSection = innerHex.intersect(yellowBox);
    try {
      yellowSection = yellowSection.cut(blackBox);
    } catch {}

    let blackSection = innerHex.intersect(blackBox);
    try {
      blackSection = blackSection.cut(starDrawing);
    } catch {}

    const starSection = innerHex.intersect(starDrawing);

    const parts: ReplicadPart[] = [];
    const sRed = extrudeAndFillet2D(redSection, zOffset, hFlag, fFlag);
    if (sRed) parts.push({ shape: sRed, name: 'Flag_Field', color: '#ef4444' });

    const sYellow = extrudeAndFillet2D(yellowSection, zOffset, hFlag, fFlag);
    if (sYellow) parts.push({ shape: sYellow, name: 'Flag_Yellow_Chevron', color: '#eab308' });

    const sBlack = extrudeAndFillet2D(blackSection, zOffset, hFlag, fFlag);
    if (sBlack) parts.push({ shape: sBlack, name: 'Flag_Black_Chevron', color: '#0f172a' });

    const sStar = extrudeAndFillet2D(starSection, zOffset, hFlag, 0);
    if (sStar) parts.push({ shape: sStar, name: 'Flag_Star', color: '#f8fafc' });

    return parts;
  };
}

/**
 * Generator factory for Türkiye (Turkey) flag (red field, white crescent and tilted star)
 */
export function createTurkeyFlagGenerator(): FlagGeneratorFn {
  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const isVertical =
      orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
    const w = (rInner * Math.sqrt(3)) / 2;

    const outerR = rInner * 0.44;
    const innerR = outerR * 0.8;
    const offsetDist = rInner * 0.11;

    const crescentCenter: [number, number] = isVertical ? [0, 0.16 * rInner] : [-0.16 * w, 0];
    const crescentAngle = isVertical ? -Math.PI / 2 : 0;
    const crescentDrawing = drawCrescent(outerR, innerR, crescentCenter, offsetDist, crescentAngle);

    const starR = rInner * 0.18;
    const starCenter: [number, number] = isVertical ? [0, -0.1 * rInner] : [0.1 * w, 0];
    const starRot = isVertical ? 0 : Math.PI / 2;
    const starDrawing = drawStar(starR, starR * 0.381966, starCenter, starRot);

    let fieldSection = innerHex;
    try {
      fieldSection = fieldSection.cut(crescentDrawing);
    } catch {}
    try {
      fieldSection = fieldSection.cut(starDrawing);
    } catch {}

    const parts: ReplicadPart[] = [];
    const sField = extrudeAndFillet2D(fieldSection, zOffset, hFlag, fFlag);
    if (sField) parts.push({ shape: sField, name: 'Flag_Field', color: '#ef4444' });

    const sCrescent = extrudeAndFillet2D(innerHex.intersect(crescentDrawing), zOffset, hFlag, 0);
    if (sCrescent) parts.push({ shape: sCrescent, name: 'Flag_Crescent', color: '#f8fafc' });

    const sStar = extrudeAndFillet2D(innerHex.intersect(starDrawing), zOffset, hFlag, 0);
    if (sStar) parts.push({ shape: sStar, name: 'Flag_Star', color: '#f8fafc' });

    return parts;
  };
}

/**
 * Generator factory for Tunisia flag (red field, white central circle, red crescent and star)
 */
export function createTunisiaFlagGenerator(): FlagGeneratorFn {
  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const isVertical =
      orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
    const w = (rInner * Math.sqrt(3)) / 2;

    const discRadius = rInner * 0.52;
    const discDrawing = drawCircle(discRadius);

    const outerR = rInner * 0.34;
    const innerR = outerR * 0.8;
    const offsetDist = rInner * 0.085;

    const crescentCenter: [number, number] = isVertical ? [0, 0.04 * rInner] : [-0.04 * w, 0];
    const crescentAngle = isVertical ? -Math.PI / 2 : 0;
    const crescentDrawing = drawCrescent(outerR, innerR, crescentCenter, offsetDist, crescentAngle);

    const starR = rInner * 0.15;
    const starCenter: [number, number] = isVertical ? [0, -0.08 * rInner] : [0.08 * w, 0];
    const starRot = isVertical ? 0 : Math.PI / 2;
    const starDrawing = drawStar(starR, starR * 0.381966, starCenter, starRot);

    let fieldSection = innerHex;
    try {
      fieldSection = fieldSection.cut(discDrawing);
    } catch {}

    let discSection = innerHex.intersect(discDrawing);
    try {
      discSection = discSection.cut(crescentDrawing);
    } catch {}
    try {
      discSection = discSection.cut(starDrawing);
    } catch {}

    const parts: ReplicadPart[] = [];
    const sField = extrudeAndFillet2D(fieldSection, zOffset, hFlag, fFlag);
    if (sField) parts.push({ shape: sField, name: 'Flag_Field', color: '#ef4444' });

    const sDisc = extrudeAndFillet2D(discSection, zOffset, hFlag, fFlag);
    if (sDisc) parts.push({ shape: sDisc, name: 'Flag_Circle', color: '#f8fafc' });

    const sCrescent = extrudeAndFillet2D(innerHex.intersect(crescentDrawing), zOffset, hFlag, 0);
    if (sCrescent) parts.push({ shape: sCrescent, name: 'Flag_Crescent', color: '#ef4444' });

    const sStar = extrudeAndFillet2D(innerHex.intersect(starDrawing), zOffset, hFlag, 0);
    if (sStar) parts.push({ shape: sStar, name: 'Flag_Star', color: '#ef4444' });

    return parts;
  };
}

/**
 * Generator factory for Algeria flag (green/white vertical bicolor, central red crescent and star)
 */
export function createAlgeriaFlagGenerator(): FlagGeneratorFn {
  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const isVertical =
      orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
    const span = rInner * 4;
    const w = (rInner * Math.sqrt(3)) / 2;

    const leftBox = isVertical
      ? draw([-span, 0]).lineTo([span, 0]).lineTo([span, span]).lineTo([-span, span]).close()
      : draw([-span, -span]).lineTo([0, -span]).lineTo([0, span]).lineTo([-span, span]).close();

    const rightBox = isVertical
      ? draw([-span, -span]).lineTo([span, -span]).lineTo([span, 0]).lineTo([-span, 0]).close()
      : draw([0, -span]).lineTo([span, -span]).lineTo([span, span]).lineTo([0, span]).close();

    const outerR = rInner * 0.46;
    const innerR = outerR * 0.8;
    const offsetDist = rInner * 0.1;

    const crescentCenter: [number, number] = [0, 0];
    const crescentAngle = isVertical ? -Math.PI / 2 : 0;
    const crescentDrawing = drawCrescent(outerR, innerR, crescentCenter, offsetDist, crescentAngle);

    const starR = rInner * 0.18;
    const starCenter: [number, number] = isVertical ? [0, -0.1 * rInner] : [0.1 * w, 0];
    const starRot = isVertical ? 0 : Math.PI / 2;
    const starDrawing = drawStar(starR, starR * 0.381966, starCenter, starRot);

    let leftSection = innerHex.intersect(leftBox);
    let rightSection = innerHex.intersect(rightBox);

    try {
      leftSection = leftSection.cut(crescentDrawing);
    } catch {}
    try {
      leftSection = leftSection.cut(starDrawing);
    } catch {}

    try {
      rightSection = rightSection.cut(crescentDrawing);
    } catch {}
    try {
      rightSection = rightSection.cut(starDrawing);
    } catch {}

    const parts: ReplicadPart[] = [];
    const sLeft = extrudeAndFillet2D(leftSection, zOffset, hFlag, fFlag);
    if (sLeft) {
      parts.push({
        shape: sLeft,
        name: isVertical ? 'Flag_Top' : 'Flag_Left',
        color: '#16a34a'
      });
    }

    const sRight = extrudeAndFillet2D(rightSection, zOffset, hFlag, fFlag);
    if (sRight) {
      parts.push({
        shape: sRight,
        name: isVertical ? 'Flag_Bottom' : 'Flag_Right',
        color: '#f8fafc'
      });
    }

    const sCrescent = extrudeAndFillet2D(innerHex.intersect(crescentDrawing), zOffset, hFlag, 0);
    if (sCrescent) parts.push({ shape: sCrescent, name: 'Flag_Crescent', color: '#ef4444' });

    const sStar = extrudeAndFillet2D(innerHex.intersect(starDrawing), zOffset, hFlag, 0);
    if (sStar) parts.push({ shape: sStar, name: 'Flag_Star', color: '#ef4444' });

    return parts;
  };
}

/**
 * Generator factory for Pakistan flag (white hoist stripe, dark green fly with white crescent and star)
 */
export function createPakistanFlagGenerator(): FlagGeneratorFn {
  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const isVertical =
      orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
    const span = rInner * 4;
    const w = (rInner * Math.sqrt(3)) / 2;
    const hoistSplit = 0.5; // hoist band is 1/4 of total flag width

    const hoistBox = isVertical
      ? draw([-span, hoistSplit * rInner])
          .lineTo([span, hoistSplit * rInner])
          .lineTo([span, span])
          .lineTo([-span, span])
          .close()
      : draw([-span, -span])
          .lineTo([-hoistSplit * w, -span])
          .lineTo([-hoistSplit * w, span])
          .lineTo([-span, span])
          .close();

    const flyBox = isVertical
      ? draw([-span, -span])
          .lineTo([span, -span])
          .lineTo([span, hoistSplit * rInner])
          .lineTo([-span, hoistSplit * rInner])
          .close()
      : draw([-hoistSplit * w, -span])
          .lineTo([span, -span])
          .lineTo([span, span])
          .lineTo([-hoistSplit * w, span])
          .close();

    const outerR = rInner * 0.44;
    const innerR = outerR * 0.82;
    const offsetDist = rInner * 0.11;

    // In horizontal: center in fly field at [0.15 * w, 0], tilted 45 deg (Math.PI / 4)
    // In vertical: center at [0, -0.15 * rInner], tilted -45 deg (-Math.PI / 4)
    const crescentCenter: [number, number] = isVertical ? [0, -0.15 * rInner] : [0.15 * w, 0];
    const crescentAngle = isVertical ? -Math.PI / 4 : Math.PI / 4;
    const crescentDrawing = drawCrescent(outerR, innerR, crescentCenter, offsetDist, crescentAngle);

    const starR = rInner * 0.16;
    const starDist = rInner * 0.22;
    const starCenter: [number, number] = [
      crescentCenter[0] + starDist * Math.cos(crescentAngle),
      crescentCenter[1] + starDist * Math.sin(crescentAngle)
    ];
    const starRot = isVertical ? (-3 * Math.PI) / 4 : -Math.PI / 4;
    const starDrawing = drawStar(starR, starR * 0.381966, starCenter, starRot);

    let flySection = innerHex.intersect(flyBox);
    try {
      flySection = flySection.cut(crescentDrawing);
    } catch {}
    try {
      flySection = flySection.cut(starDrawing);
    } catch {}

    const hoistSection = innerHex.intersect(hoistBox);

    const parts: ReplicadPart[] = [];
    const sHoist = extrudeAndFillet2D(hoistSection, zOffset, hFlag, fFlag);
    if (sHoist) {
      parts.push({
        shape: sHoist,
        name: isVertical ? 'Flag_Top' : 'Flag_Left',
        color: '#f8fafc'
      });
    }

    const sFly = extrudeAndFillet2D(flySection, zOffset, hFlag, fFlag);
    if (sFly) {
      parts.push({
        shape: sFly,
        name: isVertical ? 'Flag_Bottom' : 'Flag_Right',
        color: '#14532d'
      });
    }

    const sCrescent = extrudeAndFillet2D(innerHex.intersect(crescentDrawing), zOffset, hFlag, 0);
    if (sCrescent) parts.push({ shape: sCrescent, name: 'Flag_Crescent', color: '#f8fafc' });

    const sStar = extrudeAndFillet2D(innerHex.intersect(starDrawing), zOffset, hFlag, 0);
    if (sStar) parts.push({ shape: sStar, name: 'Flag_Star', color: '#f8fafc' });

    return parts;
  };
}

/**
 * Generator factory for Libya flag (red/black/green stripes with 1:2:1 ratio, white crescent and star)
 */
export function createLibyaFlagGenerator(): FlagGeneratorFn {
  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const isVertical =
      orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
    const w = (rInner * Math.sqrt(3)) / 2;

    const baseSections = createMultiStripeSections2D(
      innerHex,
      rInner,
      [1, 2, 1],
      isVertical ? 'vertical' : 'horizontal',
      'horizontal'
    );

    const outerR = rInner * 0.32;
    const innerR = outerR * 0.8;
    const offsetDist = rInner * 0.08;

    const crescentCenter: [number, number] = [0, 0];
    const crescentAngle = isVertical ? -Math.PI / 2 : 0;
    const crescentDrawing = drawCrescent(outerR, innerR, crescentCenter, offsetDist, crescentAngle);

    const starR = rInner * 0.14;
    const starCenter: [number, number] = isVertical ? [0, -0.09 * rInner] : [0.09 * w, 0];
    const starRot = isVertical ? 0 : Math.PI / 2;
    const starDrawing = drawStar(starR, starR * 0.381966, starCenter, starRot);

    const cutSections = baseSections.map((s) => {
      let res = s;
      try {
        res = res.cut(crescentDrawing);
      } catch {}
      try {
        res = res.cut(starDrawing);
      } catch {}
      return res;
    });

    const colors = ['#ef4444', '#0f172a', '#16a34a'];
    const parts: ReplicadPart[] = [];
    for (let i = 0; i < 3; i++) {
      const solid = extrudeAndFillet2D(cutSections[i], zOffset, hFlag, fFlag);
      if (solid) {
        let name: string;
        if (isVertical) {
          name = i === 0 ? 'Flag_Right' : i === 1 ? 'Flag_Middle' : 'Flag_Left';
        } else {
          name = i === 0 ? 'Flag_Top' : i === 1 ? 'Flag_Middle' : 'Flag_Bottom';
        }
        parts.push({ shape: solid, name, color: colors[i] });
      }
    }

    const sCrescent = extrudeAndFillet2D(innerHex.intersect(crescentDrawing), zOffset, hFlag, 0);
    if (sCrescent) parts.push({ shape: sCrescent, name: 'Flag_Crescent', color: '#f8fafc' });

    const sStar = extrudeAndFillet2D(innerHex.intersect(starDrawing), zOffset, hFlag, 0);
    if (sStar) parts.push({ shape: sStar, name: 'Flag_Star', color: '#f8fafc' });

    return parts;
  };
}

/**
 * Generator factory for Mauritania flag (red top/bottom stripes, green field with upward crescent and star)
 */
export function createMauritaniaFlagGenerator(): FlagGeneratorFn {
  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const isVertical =
      orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
    const w = (rInner * Math.sqrt(3)) / 2;

    const baseSections = createMultiStripeSections2D(
      innerHex,
      rInner,
      [1, 3.5, 1],
      isVertical ? 'vertical' : 'horizontal',
      'horizontal'
    );

    const outerR = rInner * 0.36;
    const innerR = outerR * 0.82;
    const offsetDist = rInner * 0.09;

    const crescentCenter: [number, number] = isVertical ? [-0.06 * w, 0] : [0, -0.06 * rInner];
    const crescentAngle = isVertical ? 0 : Math.PI / 2;
    const crescentDrawing = drawCrescent(outerR, innerR, crescentCenter, offsetDist, crescentAngle);

    const starR = rInner * 0.15;
    const starCenter: [number, number] = isVertical ? [0.12 * w, 0] : [0, 0.12 * rInner];
    const starRot = isVertical ? -Math.PI / 2 : 0;
    const starDrawing = drawStar(starR, starR * 0.381966, starCenter, starRot);

    const cutSections = baseSections.map((s) => {
      let res = s;
      try {
        res = res.cut(crescentDrawing);
      } catch {}
      try {
        res = res.cut(starDrawing);
      } catch {}
      return res;
    });

    const colors = ['#ef4444', '#16a34a', '#ef4444'];
    const parts: ReplicadPart[] = [];
    for (let i = 0; i < 3; i++) {
      const solid = extrudeAndFillet2D(cutSections[i], zOffset, hFlag, fFlag);
      if (solid) {
        let name: string;
        if (isVertical) {
          name = i === 0 ? 'Flag_Right' : i === 1 ? 'Flag_Middle' : 'Flag_Left';
        } else {
          name = i === 0 ? 'Flag_Top' : i === 1 ? 'Flag_Middle' : 'Flag_Bottom';
        }
        parts.push({ shape: solid, name, color: colors[i] });
      }
    }

    const sCrescent = extrudeAndFillet2D(innerHex.intersect(crescentDrawing), zOffset, hFlag, 0);
    if (sCrescent) parts.push({ shape: sCrescent, name: 'Flag_Crescent', color: '#eab308' });

    const sStar = extrudeAndFillet2D(innerHex.intersect(starDrawing), zOffset, hFlag, 0);
    if (sStar) parts.push({ shape: sStar, name: 'Flag_Star', color: '#eab308' });

    return parts;
  };
}

/**
 * Generator factory for Azerbaijan flag (blue/red/green tricolor with white crescent and 8-pointed star)
 */
export function createAzerbaijanFlagGenerator(): FlagGeneratorFn {
  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const isVertical =
      orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
    const w = (rInner * Math.sqrt(3)) / 2;

    const baseSections = createMultiStripeSections2D(
      innerHex,
      rInner,
      [1, 1, 1],
      isVertical ? 'vertical' : 'horizontal',
      'horizontal'
    );

    const outerR = rInner * 0.28;
    const innerR = outerR * 0.8;
    const offsetDist = rInner * 0.07;

    const crescentCenter: [number, number] = isVertical ? [0, 0.08 * rInner] : [-0.08 * w, 0];
    const crescentAngle = isVertical ? -Math.PI / 2 : 0;
    const crescentDrawing = drawCrescent(outerR, innerR, crescentCenter, offsetDist, crescentAngle);

    const starR = rInner * 0.13;
    const starCenter: [number, number] = isVertical ? [0, -0.09 * rInner] : [0.09 * w, 0];
    const starRot = isVertical ? -Math.PI / 2 : 0;
    const starDrawing = drawStar(starR, starR * 0.48, starCenter, starRot, 8);

    const cutSections = baseSections.map((s) => {
      let res = s;
      try {
        res = res.cut(crescentDrawing);
      } catch {}
      try {
        res = res.cut(starDrawing);
      } catch {}
      return res;
    });

    const colors = ['#0284c7', '#ef4444', '#16a34a'];
    const parts: ReplicadPart[] = [];
    for (let i = 0; i < 3; i++) {
      const solid = extrudeAndFillet2D(cutSections[i], zOffset, hFlag, fFlag);
      if (solid) {
        let name: string;
        if (isVertical) {
          name = i === 0 ? 'Flag_Right' : i === 1 ? 'Flag_Middle' : 'Flag_Left';
        } else {
          name = i === 0 ? 'Flag_Top' : i === 1 ? 'Flag_Middle' : 'Flag_Bottom';
        }
        parts.push({ shape: solid, name, color: colors[i] });
      }
    }

    const sCrescent = extrudeAndFillet2D(innerHex.intersect(crescentDrawing), zOffset, hFlag, 0);
    if (sCrescent) parts.push({ shape: sCrescent, name: 'Flag_Crescent', color: '#f8fafc' });

    const sStar = extrudeAndFillet2D(innerHex.intersect(starDrawing), zOffset, hFlag, 0);
    if (sStar) parts.push({ shape: sStar, name: 'Flag_Star', color: '#f8fafc' });

    return parts;
  };
}

/**
 * Generator factory for Malaysia flag (14 stripes, blue canton with yellow crescent and 14-point star)
 */
export function createMalaysiaFlagGenerator(): FlagGeneratorFn {
  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const isVertical =
      orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
    const span = rInner * 4;
    const w = (rInner * Math.sqrt(3)) / 2;
    const cantonWidthRatio = 0.5;
    const cantonHeightRatio = 8 / 14;

    const splitX = isVertical ? w * (1 - 2 * cantonHeightRatio) : w * (2 * cantonWidthRatio - 1);
    const splitY = isVertical
      ? rInner * (1 - 2 * cantonWidthRatio)
      : rInner * (1 - 2 * cantonHeightRatio);

    const cantonBox = isVertical
      ? draw([splitX, splitY])
          .lineTo([span, splitY])
          .lineTo([span, span])
          .lineTo([splitX, span])
          .close()
      : draw([-span, splitY])
          .lineTo([splitX, splitY])
          .lineTo([splitX, span])
          .lineTo([-span, span])
          .close();

    const numStripes = 14;
    const stripeColors: string[] = [];
    for (let i = 0; i < numStripes; i++) {
      stripeColors.push(i % 2 === 0 ? '#ef4444' : '#f8fafc');
    }

    const cumSums: number[] = [0];
    for (let i = 0; i < numStripes; i++) {
      cumSums.push(cumSums[i] + 1);
    }

    let baseStripes: Drawing[] = [];
    if (isVertical) {
      const splitXStripes: number[] = [span];
      for (let i = 1; i < numStripes; i++) {
        const frac = cumSums[i] / numStripes;
        splitXStripes.push(w * (1 - 2 * frac));
      }
      splitXStripes.push(-span);
      for (let i = 0; i < numStripes; i++) {
        const box = draw([splitXStripes[i + 1], -span])
          .lineTo([splitXStripes[i], -span])
          .lineTo([splitXStripes[i], span])
          .lineTo([splitXStripes[i + 1], span])
          .close();
        baseStripes.push(innerHex.intersect(box));
      }
    } else {
      baseStripes = createMultiStripeSections2D(
        innerHex,
        rInner,
        stripeColors.map(() => 1),
        'horizontal'
      );
    }

    // Inside canton: yellow crescent and 14-pointed star
    const outerR = rInner * 0.28;
    const innerR = outerR * 0.8;
    const offsetDist = rInner * 0.07;

    const crescentCenter: [number, number] = isVertical
      ? [0.42 * w, 0.58 * rInner]
      : [-0.58 * w, 0.42 * rInner];
    const crescentAngle = isVertical ? -Math.PI / 2 : 0;
    const crescentDrawing = drawCrescent(outerR, innerR, crescentCenter, offsetDist, crescentAngle);

    const starR = rInner * 0.16;
    const starCenter: [number, number] = isVertical
      ? [0.42 * w, 0.38 * rInner]
      : [-0.38 * w, 0.42 * rInner];
    const starRot = isVertical ? -Math.PI / 2 : 0;
    const starDrawing = drawStar(starR, starR * 0.58, starCenter, starRot, 14);

    let cantonSection = innerHex.intersect(cantonBox);
    try {
      cantonSection = cantonSection.cut(crescentDrawing);
    } catch {}
    try {
      cantonSection = cantonSection.cut(starDrawing);
    } catch {}

    const cutStripes = baseStripes.map((stripe) => {
      let s = stripe;
      try {
        s = s.cut(cantonBox);
      } catch {}
      try {
        s = s.cut(crescentDrawing);
      } catch {}
      try {
        s = s.cut(starDrawing);
      } catch {}
      return s;
    });

    const parts: ReplicadPart[] = [];
    const sCanton = extrudeAndFillet2D(cantonSection, zOffset, hFlag, fFlag);
    if (sCanton) parts.push({ shape: sCanton, name: 'Flag_Canton', color: '#1d4ed8' });

    for (let i = 0; i < numStripes; i++) {
      const sStripe = extrudeAndFillet2D(cutStripes[i], zOffset, hFlag, fFlag);
      if (sStripe) {
        parts.push({
          shape: sStripe,
          name: isVertical ? `Flag_Col_${i + 1}` : `Flag_Stripe_${i + 1}`,
          color: stripeColors[i]
        });
      }
    }

    const sCrescent = extrudeAndFillet2D(innerHex.intersect(crescentDrawing), zOffset, hFlag, 0);
    if (sCrescent) parts.push({ shape: sCrescent, name: 'Flag_Crescent', color: '#eab308' });

    const sStar = extrudeAndFillet2D(innerHex.intersect(starDrawing), zOffset, hFlag, 0);
    if (sStar) parts.push({ shape: sStar, name: 'Flag_Star', color: '#eab308' });

    return parts;
  };
}

/**
 * Generator factory for Singapore flag (red/white bicolor, white crescent and 5 stars in upper hoist)
 */
export function createSingaporeFlagGenerator(): FlagGeneratorFn {
  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const isVertical =
      orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
    const span = rInner * 4;
    const w = (rInner * Math.sqrt(3)) / 2;

    const topBox = isVertical
      ? draw([0, -span]).lineTo([span, -span]).lineTo([span, span]).lineTo([0, span]).close()
      : draw([-span, 0]).lineTo([span, 0]).lineTo([span, span]).lineTo([-span, span]).close();

    const bottomBox = isVertical
      ? draw([-span, -span]).lineTo([0, -span]).lineTo([0, span]).lineTo([-span, span]).close()
      : draw([-span, -span]).lineTo([span, -span]).lineTo([span, 0]).lineTo([-span, 0]).close();

    const outerR = rInner * 0.26;
    const innerR = outerR * 0.8;
    const offsetDist = rInner * 0.065;

    const crescentCenter: [number, number] = isVertical
      ? [0.5 * w, 0.54 * rInner]
      : [-0.54 * w, 0.5 * rInner];
    const crescentAngle = isVertical ? -Math.PI / 2 : 0;
    const crescentDrawing = drawCrescent(outerR, innerR, crescentCenter, offsetDist, crescentAngle);

    // 5 stars in pentagon ring
    const starClusterCenter: [number, number] = isVertical
      ? [0.5 * w, 0.36 * rInner]
      : [-0.36 * w, 0.5 * rInner];
    const clusterR = rInner * 0.085;
    const starR = rInner * 0.038;
    const starRot = isVertical ? -Math.PI / 2 : 0;

    const starDrawings: Drawing[] = [];
    for (let k = 0; k < 5; k++) {
      const theta = Math.PI / 2 - (k * 2 * Math.PI) / 5 + (isVertical ? -Math.PI / 2 : 0);
      const sc: [number, number] = [
        starClusterCenter[0] + clusterR * Math.cos(theta),
        starClusterCenter[1] + clusterR * Math.sin(theta)
      ];
      starDrawings.push(drawStar(starR, starR * 0.381966, sc, starRot, 5));
    }

    let topSection = innerHex.intersect(topBox);
    try {
      topSection = topSection.cut(crescentDrawing);
    } catch {}
    for (const sd of starDrawings) {
      try {
        topSection = topSection.cut(sd);
      } catch {}
    }

    const bottomSection = innerHex.intersect(bottomBox);

    const parts: ReplicadPart[] = [];
    const sTop = extrudeAndFillet2D(topSection, zOffset, hFlag, fFlag);
    if (sTop) {
      parts.push({
        shape: sTop,
        name: isVertical ? 'Flag_Right' : 'Flag_Top',
        color: '#ef4444'
      });
    }

    const sBottom = extrudeAndFillet2D(bottomSection, zOffset, hFlag, fFlag);
    if (sBottom) {
      parts.push({
        shape: sBottom,
        name: isVertical ? 'Flag_Left' : 'Flag_Bottom',
        color: '#f8fafc'
      });
    }

    const sCrescent = extrudeAndFillet2D(innerHex.intersect(crescentDrawing), zOffset, hFlag, 0);
    if (sCrescent) parts.push({ shape: sCrescent, name: 'Flag_Crescent', color: '#f8fafc' });

    for (let k = 0; k < 5; k++) {
      const sStar = extrudeAndFillet2D(innerHex.intersect(starDrawings[k]), zOffset, hFlag, 0);
      if (sStar) parts.push({ shape: sStar, name: `Flag_Star_${k + 1}`, color: '#f8fafc' });
    }

    return parts;
  };
}

export interface DiagonalBandLayer {
  color: string;
  widthRatio: number;
}

/**
 * Generator factory for diagonal bend flags (e.g. DR Congo, Solomon Islands, Saint Kitts and Nevis)
 */
export function createDiagonalBendFlagGenerator(
  topLeftColor: string,
  bottomRightColor: string,
  bands: DiagonalBandLayer | DiagonalBandLayer[],
  stars?: StarConfig | StarConfig[]
): FlagGeneratorFn {
  const bandList = Array.isArray(bands) ? bands : [bands];
  const starConfigs = stars ? (Array.isArray(stars) ? stars : [stars]) : [];

  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const isVertical =
      orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
    const span = rInner * 4;
    const w = (rInner * Math.sqrt(3)) / 2;
    const m = (isVertical ? -1 : 1) * (rInner / w);

    const totalBandThickness = bandList.reduce((sum, b) => sum + b.widthRatio, 0);
    let currentU = -totalBandThickness / 2;

    const bandDrawings: Drawing[] = [];
    for (const b of bandList) {
      const u1 = currentU;
      const u2 = currentU + b.widthRatio;
      currentU = u2;

      const poly = draw([-span, -span * m + u1 * rInner])
        .lineTo([span, span * m + u1 * rInner])
        .lineTo([span, span * m + u2 * rInner])
        .lineTo([-span, -span * m + u2 * rInner])
        .close();
      bandDrawings.push(poly);
    }

    const topU = totalBandThickness / 2;
    const topLeftBox = isVertical
      ? draw([-span, -span * m + topU * rInner])
          .lineTo([span, span * m + topU * rInner])
          .lineTo([span, span * 4])
          .lineTo([-span, span * 4])
          .close()
      : draw([-span, -span * m + topU * rInner])
          .lineTo([span, span * m + topU * rInner])
          .lineTo([span, span * 4])
          .lineTo([-span, span * 4])
          .close();

    const botU = -totalBandThickness / 2;
    const bottomRightBox = isVertical
      ? draw([-span, -span * m + botU * rInner])
          .lineTo([span, span * m + botU * rInner])
          .lineTo([span, -span * 4])
          .lineTo([-span, -span * 4])
          .close()
      : draw([-span, -span * m + botU * rInner])
          .lineTo([span, span * m + botU * rInner])
          .lineTo([span, -span * 4])
          .lineTo([-span, -span * 4])
          .close();

    const starDrawings: Drawing[] = [];
    for (const sc of starConfigs) {
      const outerR = rInner * (sc.outerRadiusRatio ?? 0.2);
      const innerR = sc.innerRadiusRatio !== undefined ? rInner * sc.innerRadiusRatio : undefined;
      const [xf, yf] = sc.centerRatio ?? [0, 0];
      const baseRot = sc.rotationAngle ?? 0;

      const cx = isVertical ? -yf * w : w * xf;
      const cy = isVertical ? -xf * rInner : rInner * yf;
      const rot = baseRot + (isVertical ? -Math.PI / 2 : 0);
      starDrawings.push(drawStar(outerR, innerR, [cx, cy], rot, sc.numPoints ?? 5));
    }

    let tlSection = innerHex.intersect(topLeftBox);
    let brSection = innerHex.intersect(bottomRightBox);
    const bandSections = bandDrawings.map((b) => innerHex.intersect(b));

    for (const sd of starDrawings) {
      try {
        tlSection = tlSection.cut(sd);
      } catch {}
      try {
        brSection = brSection.cut(sd);
      } catch {}
      for (let i = 0; i < bandSections.length; i++) {
        try {
          bandSections[i] = bandSections[i].cut(sd);
        } catch {}
      }
    }

    const parts: ReplicadPart[] = [];
    const sTL = extrudeAndFillet2D(tlSection, zOffset, hFlag, fFlag);
    if (sTL) parts.push({ shape: sTL, name: 'Flag_Top_Left', color: topLeftColor });

    const sBR = extrudeAndFillet2D(brSection, zOffset, hFlag, fFlag);
    if (sBR) parts.push({ shape: sBR, name: 'Flag_Bottom_Right', color: bottomRightColor });

    for (let i = 0; i < bandList.length; i++) {
      const sBand = extrudeAndFillet2D(bandSections[i], zOffset, hFlag, fFlag);
      if (sBand) parts.push({ shape: sBand, name: `Flag_Band_${i + 1}`, color: bandList[i].color });
    }

    for (let i = 0; i < starConfigs.length; i++) {
      const sStar = extrudeAndFillet2D(innerHex.intersect(starDrawings[i]), zOffset, hFlag, 0);
      if (sStar) {
        const starName =
          starConfigs[i].name ?? (starConfigs.length === 1 ? 'Flag_Star' : `Flag_Star_${i + 1}`);
        parts.push({ shape: sStar, name: starName, color: starConfigs[i].color });
      }
    }

    return parts;
  };
}

/**
 * Generator factory for European Union flag (12 stars in a circle)
 */
export function createEuropeanUnionFlagGenerator(): FlagGeneratorFn {
  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const isVertical =
      orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
    const numStars = 12;
    const circleRadius = rInner * 0.52;
    const starRadius = rInner * 0.075;
    const starRot = isVertical ? -Math.PI / 2 : 0;

    const starDrawings: Drawing[] = [];
    for (let i = 0; i < numStars; i++) {
      const angle = Math.PI / 2 - (i * 2 * Math.PI) / numStars + (isVertical ? -Math.PI / 2 : 0);
      const cx = circleRadius * Math.cos(angle);
      const cy = circleRadius * Math.sin(angle);
      starDrawings.push(drawStar(starRadius, starRadius * 0.381966, [cx, cy], starRot));
    }

    let fieldSection = innerHex;
    for (const sd of starDrawings) {
      try {
        fieldSection = fieldSection.cut(sd);
      } catch {}
    }

    const parts: ReplicadPart[] = [];
    const sField = extrudeAndFillet2D(fieldSection, zOffset, hFlag, fFlag);
    if (sField) parts.push({ shape: sField, name: 'Flag_Field', color: '#1d4ed8' });

    for (let i = 0; i < numStars; i++) {
      const sStar = extrudeAndFillet2D(innerHex.intersect(starDrawings[i]), zOffset, hFlag, 0);
      if (sStar) parts.push({ shape: sStar, name: `Flag_Star_${i + 1}`, color: '#eab308' });
    }

    return parts;
  };
}

/**
 * Generator factory for serrated / zigzag divider flags (e.g. Bahrain with 5 points, Qatar with 9 points)
 */
export function createSerratedFlagGenerator(
  hoistColor: string,
  flyColor: string,
  numPoints: number = 5,
  hoistFraction: number = 0.28,
  toothDepthFraction: number = 0.15
): FlagGeneratorFn {
  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const isVertical =
      orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
    const span = rInner * 4;
    const w = (rInner * Math.sqrt(3)) / 2;

    let hoistDrawing: Drawing;

    if (isVertical) {
      // Rotated 90 deg CW: Hoist is at Top (+Y), teeth point downwards (-Y)
      const yBase = rInner * (1 - 2 * hoistFraction);
      const yPeak = yBase - 2 * rInner * toothDepthFraction;
      const toothWidth = (2 * w) / numPoints;

      let pen = draw([span, span]).lineTo([span, yBase]).lineTo([w, yBase]);

      for (let k = 0; k < numPoints; k++) {
        const xMid = w - (k + 0.5) * toothWidth;
        const xLeft = w - (k + 1) * toothWidth;
        pen = pen.lineTo([xMid, yPeak]).lineTo([xLeft, yBase]);
      }

      hoistDrawing = pen.lineTo([-span, yBase]).lineTo([-span, span]).close();
    } else {
      // Standard horizontal: Hoist is on Left (-X), teeth point right (+X)
      const xBase = w * (2 * hoistFraction - 1);
      const xPeak = xBase + 2 * w * toothDepthFraction;
      const toothHeight = (2 * rInner) / numPoints;

      let pen = draw([-span, span]).lineTo([xBase, span]).lineTo([xBase, rInner]);

      for (let k = 0; k < numPoints; k++) {
        const yMid = rInner - (k + 0.5) * toothHeight;
        const yBot = rInner - (k + 1) * toothHeight;
        pen = pen.lineTo([xPeak, yMid]).lineTo([xBase, yBot]);
      }

      hoistDrawing = pen.lineTo([xBase, -span]).lineTo([-span, -span]).close();
    }

    const hoistSection = innerHex.intersect(hoistDrawing);
    let flySection = innerHex;
    try {
      flySection = flySection.cut(hoistDrawing);
    } catch {}

    const parts: ReplicadPart[] = [];
    const sHoist = extrudeAndFillet2D(hoistSection, zOffset, hFlag, fFlag);
    if (sHoist) {
      parts.push({
        shape: sHoist,
        name: isVertical ? 'Flag_Top' : 'Flag_Left',
        color: hoistColor
      });
    }

    const sFly = extrudeAndFillet2D(flySection, zOffset, hFlag, fFlag);
    if (sFly) {
      parts.push({
        shape: sFly,
        name: isVertical ? 'Flag_Bottom' : 'Flag_Right',
        color: flyColor
      });
    }

    return parts;
  };
}

/**
 * Generator factory for Laos flag (red/blue/red 1:2:1 horizontal stripes with white central disc)
 */
export function createLaosFlagGenerator(): FlagGeneratorFn {
  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const isVertical =
      orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
    const baseSections = createMultiStripeSections2D(
      innerHex,
      rInner,
      [1, 2, 1],
      isVertical ? 'vertical' : 'horizontal',
      'horizontal'
    );

    const discRadius = rInner * 0.4;
    const discDrawing = drawCircle(discRadius);

    const cutSections = baseSections.map((s) => {
      try {
        return s.cut(discDrawing);
      } catch {
        return s;
      }
    });

    const discSection = innerHex.intersect(discDrawing);

    const parts: ReplicadPart[] = [];
    const colors = ['#ef4444', '#1d4ed8', '#ef4444'];
    for (let i = 0; i < 3; i++) {
      const sShape = extrudeAndFillet2D(cutSections[i], zOffset, hFlag, fFlag);
      if (sShape) {
        let name: string;
        if (isVertical) {
          name = i === 0 ? 'Flag_Right' : i === 1 ? 'Flag_Middle' : 'Flag_Left';
        } else {
          name = i === 0 ? 'Flag_Top' : i === 1 ? 'Flag_Middle' : 'Flag_Bottom';
        }
        parts.push({
          shape: sShape,
          name,
          color: colors[i]
        });
      }
    }

    const sDisc = extrudeAndFillet2D(discSection, zOffset, hFlag, fFlag);
    if (sDisc) {
      parts.push({
        shape: sDisc,
        name: 'Flag_Circle',
        color: '#f8fafc'
      });
    }

    return parts;
  };
}

/**
 * Generator factory for Greenland flag (white/red bicolor with offset counter-charged disc)
 */
export function createGreenlandFlagGenerator(): FlagGeneratorFn {
  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const isVertical =
      orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
    const span = rInner * 4;
    const w = (rInner * Math.sqrt(3)) / 2;

    const topBox = isVertical
      ? draw([0, -span]).lineTo([span, -span]).lineTo([span, span]).lineTo([0, span]).close()
      : draw([-span, 0]).lineTo([span, 0]).lineTo([span, span]).lineTo([-span, span]).close();

    const bottomBox = isVertical
      ? draw([-span, -span]).lineTo([0, -span]).lineTo([0, span]).lineTo([-span, span]).close()
      : draw([-span, -span]).lineTo([span, -span]).lineTo([span, 0]).lineTo([-span, 0]).close();

    const rDisc = rInner * 0.52;
    const cx = isVertical ? 0 : -0.28 * w;
    const cy = isVertical ? 0.28 * rInner : 0;
    const discDrawing = drawCircle(rDisc).translate([cx, cy]);

    const discTop = discDrawing.intersect(topBox);
    const discBottom = discDrawing.intersect(bottomBox);

    let topField = innerHex.intersect(topBox);
    try {
      topField = topField.cut(discDrawing);
    } catch {}

    let bottomField = innerHex.intersect(bottomBox);
    try {
      bottomField = bottomField.cut(discDrawing);
    } catch {}

    const parts: ReplicadPart[] = [];
    const sTopField = extrudeAndFillet2D(topField, zOffset, hFlag, fFlag);
    if (sTopField) {
      parts.push({
        shape: sTopField,
        name: isVertical ? 'Flag_Right' : 'Flag_Top',
        color: '#f8fafc'
      });
    }

    const sBottomField = extrudeAndFillet2D(bottomField, zOffset, hFlag, fFlag);
    if (sBottomField) {
      parts.push({
        shape: sBottomField,
        name: isVertical ? 'Flag_Left' : 'Flag_Bottom',
        color: '#ef4444'
      });
    }

    const sDiscTop = extrudeAndFillet2D(innerHex.intersect(discTop), zOffset, hFlag, 0);
    if (sDiscTop) {
      parts.push({
        shape: sDiscTop,
        name: isVertical ? 'Flag_Disc_Right' : 'Flag_Disc_Top',
        color: '#ef4444'
      });
    }

    const sDiscBottom = extrudeAndFillet2D(innerHex.intersect(discBottom), zOffset, hFlag, 0);
    if (sDiscBottom) {
      parts.push({
        shape: sDiscBottom,
        name: isVertical ? 'Flag_Disc_Left' : 'Flag_Disc_Bottom',
        color: '#f8fafc'
      });
    }

    return parts;
  };
}

/**
 * Generator factory for Niger flag (orange/white/green 1:1:1 horizontal stripes with orange central disc)
 */
export function createNigerFlagGenerator(): FlagGeneratorFn {
  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const isVertical =
      orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
    const baseSections = createMultiStripeSections2D(
      innerHex,
      rInner,
      [1, 1, 1],
      isVertical ? 'vertical' : 'horizontal',
      'horizontal'
    );

    const discRadius = rInner * 0.28;
    const discDrawing = drawCircle(discRadius);

    const cutSections = baseSections.map((s) => {
      try {
        return s.cut(discDrawing);
      } catch {
        return s;
      }
    });

    const discSection = innerHex.intersect(discDrawing);

    const parts: ReplicadPart[] = [];
    const colors = ['#f97316', '#f8fafc', '#16a34a'];
    for (let i = 0; i < 3; i++) {
      const sShape = extrudeAndFillet2D(cutSections[i], zOffset, hFlag, fFlag);
      if (sShape) {
        let name: string;
        if (isVertical) {
          name = i === 0 ? 'Flag_Right' : i === 1 ? 'Flag_Middle' : 'Flag_Left';
        } else {
          name = i === 0 ? 'Flag_Top' : i === 1 ? 'Flag_Middle' : 'Flag_Bottom';
        }
        parts.push({
          shape: sShape,
          name,
          color: colors[i]
        });
      }
    }

    const sDisc = extrudeAndFillet2D(discSection, zOffset, hFlag, 0);
    if (sDisc) {
      parts.push({
        shape: sDisc,
        name: 'Flag_Circle',
        color: '#f97316'
      });
    }

    return parts;
  };
}

/**
 * Generator factory for South Korea flag (white field, central red/blue Taegeuk, 4 black trigrams)
 */
export function createSouthKoreaFlagGenerator(): FlagGeneratorFn {
  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const isVertical =
      orientation === 'vertical' || orientation === '90' || orientation === 'rotated';

    const baseAngle = -Math.atan2(2, 3);
    const angle = isVertical ? baseAngle - Math.PI / 2 : baseAngle;

    const rt = rInner * 0.38;
    const fullCircle = drawCircle(rt);
    const redTaegeuk = drawTaegeukRed(rt, [0, 0], angle);
    const blueTaegeuk = drawTaegeukBlue(rt, [0, 0], angle);

    const barLen = rInner * 0.26;
    const barW = rInner * 0.042;
    const barSp = rInner * 0.032;
    const barGap = rInner * 0.038;
    const trigramDist = rInner * 0.68;

    const phi = Math.atan2(2, 3);

    // 4 Trigrams in 4 quadrants:
    // Top-Left (Geon ☰): 3 solid
    // Bottom-Right (Gon ☷): 3 broken
    // Top-Right (Gam ☵): broken, solid, broken
    // Bottom-Left (Ri ☲): solid, broken, solid
    const makePosAndAngle = (
      x0: number,
      y0: number,
      radAngle: number
    ): { pos: [number, number]; barAngle: number } => {
      if (isVertical) {
        return {
          pos: [y0, -x0],
          barAngle: radAngle + Math.PI / 2 - Math.PI / 2
        };
      }
      return {
        pos: [x0, y0],
        barAngle: radAngle + Math.PI / 2
      };
    };

    const tl = makePosAndAngle(
      -trigramDist * Math.cos(phi),
      trigramDist * Math.sin(phi),
      Math.PI - phi
    );
    const br = makePosAndAngle(trigramDist * Math.cos(phi), -trigramDist * Math.sin(phi), -phi);
    const tr = makePosAndAngle(trigramDist * Math.cos(phi), trigramDist * Math.sin(phi), phi);
    const bl = makePosAndAngle(
      -trigramDist * Math.cos(phi),
      -trigramDist * Math.sin(phi),
      -Math.PI + phi
    );

    const trigramDrawings: Drawing[] = [
      ...drawTrigram(tl.pos, tl.barAngle, [true, true, true], barLen, barW, barSp, barGap),
      ...drawTrigram(br.pos, br.barAngle, [false, false, false], barLen, barW, barSp, barGap),
      ...drawTrigram(tr.pos, tr.barAngle, [false, true, false], barLen, barW, barSp, barGap),
      ...drawTrigram(bl.pos, bl.barAngle, [true, false, true], barLen, barW, barSp, barGap)
    ];

    let fieldSection = innerHex;
    try {
      fieldSection = fieldSection.cut(fullCircle);
    } catch {}

    for (const td of trigramDrawings) {
      try {
        fieldSection = fieldSection.cut(td);
      } catch {}
    }

    const parts: ReplicadPart[] = [];
    const sField = extrudeAndFillet2D(fieldSection, zOffset, hFlag, fFlag);
    if (sField) {
      parts.push({
        shape: sField,
        name: 'Flag_Field',
        color: '#f8fafc'
      });
    }

    const sRed = extrudeAndFillet2D(innerHex.intersect(redTaegeuk), zOffset, hFlag, 0);
    if (sRed) {
      parts.push({
        shape: sRed,
        name: 'Flag_Taegeuk_Red',
        color: '#ef4444'
      });
    }

    const sBlue = extrudeAndFillet2D(innerHex.intersect(blueTaegeuk), zOffset, hFlag, 0);
    if (sBlue) {
      parts.push({
        shape: sBlue,
        name: 'Flag_Taegeuk_Blue',
        color: '#1d4ed8'
      });
    }

    for (let i = 0; i < trigramDrawings.length; i++) {
      const sBar = extrudeAndFillet2D(innerHex.intersect(trigramDrawings[i]), zOffset, hFlag, 0);
      if (sBar) {
        parts.push({
          shape: sBar,
          name: `Flag_Trigram_${i + 1}`,
          color: '#0f172a'
        });
      }
    }

    return parts;
  };
}

/**
 * Creates a 2D rotated bounding box / strip centered at (cx, cy)
 */
function createRotatedBox(
  cx: number,
  cy: number,
  length: number,
  thickness: number,
  angleRad: number
): Drawing {
  const hl = length / 2;
  const ht = thickness / 2;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  const p1: [number, number] = [cx - hl * cos + ht * sin, cy - hl * sin - ht * cos];
  const p2: [number, number] = [cx + hl * cos + ht * sin, cy + hl * sin - ht * cos];
  const p3: [number, number] = [cx + hl * cos - ht * sin, cy + hl * sin + ht * cos];
  const p4: [number, number] = [cx - hl * cos - ht * sin, cy - hl * sin + ht * cos];

  return draw(p1).lineTo(p2).lineTo(p3).lineTo(p4).close();
}

/**
 * Generates fused 3D solids for the Union Jack (Blue field, White fimbriation cross/saltire, Red cross/saltire)
 */
export function createUnionJackSolids(
  boundary: Drawing,
  cx: number,
  cy: number,
  hw: number,
  hh: number,
  isVertical: boolean,
  zOffset: number,
  hFlag: number,
  fFlag: number
): {
  sBlue: AnyShape | null;
  sWhite: AnyShape | null;
  sRed: AnyShape | null;
} {
  const span = Math.max(hw, hh) * 6;
  const hRef = (isVertical ? hw : hh) * 2;

  const tRedCross = hRef * 0.2;
  const tWhiteCross = hRef * 0.33;
  const tRedSaltire = hRef * 0.08;
  const tWhiteSaltire = hRef * 0.2;

  const diagAngle = isVertical ? Math.atan2(hw, hh) : Math.atan2(hh, hw);

  const angH = isVertical ? -Math.PI / 2 : 0;
  const angV = isVertical ? 0 : Math.PI / 2;
  const angD1 = isVertical ? diagAngle - Math.PI / 2 : diagAngle;
  const angD2 = isVertical ? -diagAngle - Math.PI / 2 : -diagAngle;

  const boxRedH = createRotatedBox(cx, cy, span, tRedCross, angH);
  const boxRedV = createRotatedBox(cx, cy, span, tRedCross, angV);
  const boxRedD1 = createRotatedBox(cx, cy, span, tRedSaltire, angD1);
  const boxRedD2 = createRotatedBox(cx, cy, span, tRedSaltire, angD2);

  const boxWhiteH = createRotatedBox(cx, cy, span, tWhiteCross, angH);
  const boxWhiteV = createRotatedBox(cx, cy, span, tWhiteCross, angV);
  const boxWhiteD1 = createRotatedBox(cx, cy, span, tWhiteSaltire, angD1);
  const boxWhiteD2 = createRotatedBox(cx, cy, span, tWhiteSaltire, angD2);

  // Extrude red components (which overlap in the center and fuse cleanly in 3D)
  const rH = extrudeAndFillet2D(boundary.intersect(boxRedH), zOffset, hFlag, fFlag);
  const rV = extrudeAndFillet2D(boundary.intersect(boxRedV), zOffset, hFlag, fFlag);
  const rD1 = extrudeAndFillet2D(boundary.intersect(boxRedD1), zOffset, hFlag, fFlag);
  const rD2 = extrudeAndFillet2D(boundary.intersect(boxRedD2), zOffset, hFlag, fFlag);

  let sRed: AnyShape | null = null;
  for (const r of [rH, rV, rD1, rD2]) {
    if (!r) continue;
    if (!sRed) sRed = r;
    else {
      try {
        sRed = (sRed as any).fuse(r);
      } catch {}
    }
  }

  // Extrude white components (which overlap in the center and fuse cleanly in 3D)
  const wH = extrudeAndFillet2D(boundary.intersect(boxWhiteH), zOffset, hFlag, fFlag);
  const wV = extrudeAndFillet2D(boundary.intersect(boxWhiteV), zOffset, hFlag, fFlag);
  const wD1 = extrudeAndFillet2D(boundary.intersect(boxWhiteD1), zOffset, hFlag, fFlag);
  const wD2 = extrudeAndFillet2D(boundary.intersect(boxWhiteD2), zOffset, hFlag, fFlag);

  let sWhiteRaw: AnyShape | null = null;
  for (const w of [wH, wV, wD1, wD2]) {
    if (!w) continue;
    if (!sWhiteRaw) sWhiteRaw = w;
    else {
      try {
        sWhiteRaw = (sWhiteRaw as any).fuse(w);
      } catch {}
    }
  }

  let sWhite: AnyShape | null = sWhiteRaw;
  if (sWhiteRaw && sRed) {
    try {
      sWhite = (sWhiteRaw as any).cut(sRed);
    } catch {}
  }

  const sBase = extrudeAndFillet2D(boundary, zOffset, hFlag, fFlag);
  let sBlue: AnyShape | null = sBase;
  if (sBase && sWhiteRaw) {
    try {
      sBlue = (sBase as any).cut(sWhiteRaw);
    } catch {}
  }

  return { sBlue, sWhite, sRed };
}

/**
 * Generator factory for the United Kingdom flag (Union Jack)
 */
export function createUnitedKingdomFlagGenerator(): FlagGeneratorFn {
  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const isVertical =
      orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
    const w = (rInner * Math.sqrt(3)) / 2;

    const hw = isVertical ? rInner : w;
    const hh = isVertical ? w : rInner;

    const { sBlue, sWhite, sRed } = createUnionJackSolids(
      innerHex,
      0,
      0,
      hw,
      hh,
      isVertical,
      zOffset,
      hFlag,
      fFlag
    );

    const parts: ReplicadPart[] = [];
    if (sBlue) {
      parts.push({ shape: sBlue, name: 'Flag_Field_Blue', color: '#1e3a8a' });
    }
    if (sWhite) {
      parts.push({ shape: sWhite, name: 'Flag_Cross_White', color: '#f8fafc' });
    }
    if (sRed) {
      parts.push({ shape: sRed, name: 'Flag_Cross_Red', color: '#ef4444' });
    }

    return parts;
  };
}

/**
 * Generator factory for the Australia flag
 */
export function createAustraliaFlagGenerator(): FlagGeneratorFn {
  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const isVertical =
      orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
    const span = rInner * 4;
    const w = (rInner * Math.sqrt(3)) / 2;

    // Canton occupies upper hoist quadrant
    const cantonBox = isVertical
      ? draw([0, 0]).lineTo([span, 0]).lineTo([span, span]).lineTo([0, span]).close()
      : draw([-span, 0]).lineTo([0, 0]).lineTo([0, span]).lineTo([-span, span]).close();

    const cantonHex = innerHex.intersect(cantonBox);

    const cxCanton = isVertical ? rInner / 2 : -w / 2;
    const cyCanton = isVertical ? w / 2 : rInner / 2;
    const hwCanton = isVertical ? rInner / 2 : w / 2;
    const hhCanton = isVertical ? w / 2 : rInner / 2;

    const {
      sBlue: sCantonBlue,
      sWhite: sCantonWhite,
      sRed: sCantonRed
    } = createUnionJackSolids(
      cantonHex,
      cxCanton,
      cyCanton,
      hwCanton,
      hhCanton,
      isVertical,
      zOffset,
      hFlag,
      fFlag
    );

    // Stars on the Australia Flag:
    // 1. Commonwealth Star (7 points) under the canton (lower hoist)
    // 2. Southern Cross on the fly half:
    //    - Alpha Crucis (7 points) - bottom
    //    - Beta Crucis (7 points) - left
    //    - Gamma Crucis (7 points) - top
    //    - Delta Crucis (7 points) - right
    //    - Epsilon Crucis (5 points) - small, middle-right
    const starDefs: Array<{
      pos: [number, number];
      points: number;
      outerR: number;
      name: string;
    }> = [
      {
        pos: [-0.5 * w, -0.5 * rInner],
        points: 7,
        outerR: rInner * 0.24,
        name: 'Flag_Commonwealth_Star'
      },
      {
        pos: [0.5 * w, -0.65 * rInner],
        points: 7,
        outerR: rInner * 0.14,
        name: 'Flag_Star_Alpha'
      },
      {
        pos: [0.25 * w, 0.05 * rInner],
        points: 7,
        outerR: rInner * 0.14,
        name: 'Flag_Star_Beta'
      },
      {
        pos: [0.5 * w, 0.65 * rInner],
        points: 7,
        outerR: rInner * 0.14,
        name: 'Flag_Star_Gamma'
      },
      {
        pos: [0.72 * w, 0.15 * rInner],
        points: 7,
        outerR: rInner * 0.14,
        name: 'Flag_Star_Delta'
      },
      {
        pos: [0.55 * w, -0.15 * rInner],
        points: 5,
        outerR: rInner * 0.09,
        name: 'Flag_Star_Epsilon'
      }
    ];

    const starDrawings: Array<{ drawing: Drawing; name: string }> = [];
    for (const sd of starDefs) {
      const [x0, y0] = sd.pos;
      const center: [number, number] = isVertical ? [y0, -x0] : [x0, y0];
      const baseRot = isVertical ? -Math.PI / 2 : 0;
      const d = drawStar(sd.outerR, undefined, center, baseRot, sd.points);
      starDrawings.push({ drawing: d, name: sd.name });
    }

    // Blue field outside canton (and minus the stars)
    let fieldSection = innerHex.cut(cantonBox);
    for (const s of starDrawings) {
      fieldSection = fieldSection.cut(s.drawing);
    }

    const parts: ReplicadPart[] = [];

    // Base blue field
    const sField = extrudeAndFillet2D(fieldSection, zOffset, hFlag, fFlag);
    if (sField) {
      parts.push({ shape: sField, name: 'Flag_Field', color: '#1e3a8a' });
    }

    // Blue triangles in canton
    if (sCantonBlue) {
      parts.push({ shape: sCantonBlue, name: 'Flag_Canton_Blue', color: '#1e3a8a' });
    }

    // White cross/saltire in canton (fused)
    if (sCantonWhite) {
      parts.push({ shape: sCantonWhite, name: 'Flag_Canton_White', color: '#f8fafc' });
    }

    // Red cross/saltire in canton (fused)
    if (sCantonRed) {
      parts.push({ shape: sCantonRed, name: 'Flag_Canton_Red', color: '#ef4444' });
    }

    // All stars (zero fillet)
    for (const sd of starDrawings) {
      const s = extrudeAndFillet2D(innerHex.intersect(sd.drawing), zOffset, hFlag, 0);
      if (s) {
        parts.push({ shape: s, name: sd.name, color: '#f8fafc' });
      }
    }

    return parts;
  };
}

/**
 * Generator factory for the New Zealand flag
 */
export function createNewZealandFlagGenerator(): FlagGeneratorFn {
  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const isVertical =
      orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
    const span = rInner * 4;
    const w = (rInner * Math.sqrt(3)) / 2;

    const cantonBox = isVertical
      ? draw([0, 0]).lineTo([span, 0]).lineTo([span, span]).lineTo([0, span]).close()
      : draw([-span, 0]).lineTo([0, 0]).lineTo([0, span]).lineTo([-span, span]).close();

    const cantonHex = innerHex.intersect(cantonBox);

    const cxCanton = isVertical ? rInner / 2 : -w / 2;
    const cyCanton = isVertical ? w / 2 : rInner / 2;
    const hwCanton = isVertical ? rInner / 2 : w / 2;
    const hhCanton = isVertical ? w / 2 : rInner / 2;

    const {
      sBlue: sCantonBlue,
      sWhite: sCantonWhite,
      sRed: sCantonRed
    } = createUnionJackSolids(
      cantonHex,
      cxCanton,
      cyCanton,
      hwCanton,
      hhCanton,
      isVertical,
      zOffset,
      hFlag,
      fFlag
    );

    // Stars on the New Zealand Flag:
    // 4 × 5-point red stars with white borders on the fly half
    const starDefs: Array<{
      pos: [number, number];
      outerR: number;
      name: string;
    }> = [
      {
        pos: [0.5 * w, -0.6 * rInner],
        outerR: rInner * 0.15,
        name: 'Alpha'
      },
      {
        pos: [0.25 * w, 0.05 * rInner],
        outerR: rInner * 0.13,
        name: 'Beta'
      },
      {
        pos: [0.5 * w, 0.6 * rInner],
        outerR: rInner * 0.15,
        name: 'Gamma'
      },
      {
        pos: [0.72 * w, 0.15 * rInner],
        outerR: rInner * 0.13,
        name: 'Delta'
      }
    ];

    const starSections: Array<{
      whiteBorder: Drawing;
      redCore: Drawing;
      name: string;
    }> = [];

    for (const sd of starDefs) {
      const [x0, y0] = sd.pos;
      const center: [number, number] = isVertical ? [y0, -x0] : [x0, y0];
      const baseRot = isVertical ? -Math.PI / 2 : 0;
      const outerStar = drawStar(sd.outerR, undefined, center, baseRot, 5);
      const innerStar = drawStar(sd.outerR * 0.68, undefined, center, baseRot, 5);
      const whiteBorder = innerHex.intersect(outerStar).cut(innerStar);
      const redCore = innerHex.intersect(innerStar);

      starSections.push({
        whiteBorder,
        redCore,
        name: sd.name
      });
    }

    let fieldSection = innerHex.cut(cantonBox);
    for (const sd of starDefs) {
      const [x0, y0] = sd.pos;
      const center: [number, number] = isVertical ? [y0, -x0] : [x0, y0];
      const baseRot = isVertical ? -Math.PI / 2 : 0;
      const outerStar = drawStar(sd.outerR, undefined, center, baseRot, 5);
      fieldSection = fieldSection.cut(outerStar);
    }

    const parts: ReplicadPart[] = [];

    // Base blue field
    const sField = extrudeAndFillet2D(fieldSection, zOffset, hFlag, fFlag);
    if (sField) {
      parts.push({ shape: sField, name: 'Flag_Field', color: '#1e3a8a' });
    }

    // Blue triangles in canton
    if (sCantonBlue) {
      parts.push({ shape: sCantonBlue, name: 'Flag_Canton_Blue', color: '#1e3a8a' });
    }

    // White cross/saltire in canton (fused)
    if (sCantonWhite) {
      parts.push({ shape: sCantonWhite, name: 'Flag_Canton_White', color: '#f8fafc' });
    }

    // Red cross/saltire in canton (fused)
    if (sCantonRed) {
      parts.push({ shape: sCantonRed, name: 'Flag_Canton_Red', color: '#ef4444' });
    }

    // Southern cross stars (white borders + red cores, zero fillet)
    for (const ss of starSections) {
      const sWhite = extrudeAndFillet2D(ss.whiteBorder, zOffset, hFlag, 0);
      if (sWhite) {
        parts.push({ shape: sWhite, name: `Flag_Star_Border_${ss.name}`, color: '#f8fafc' });
      }
      const sRed = extrudeAndFillet2D(ss.redCore, zOffset, hFlag, 0);
      if (sRed) {
        parts.push({ shape: sRed, name: `Flag_Star_Core_${ss.name}`, color: '#ef4444' });
      }
    }

    return parts;
  };
}

/**
 * Generator factory for the Greece flag
 */
export function createGreeceFlagGenerator(): FlagGeneratorFn {
  const stripeColors = [
    '#1d4ed8',
    '#f8fafc',
    '#1d4ed8',
    '#f8fafc',
    '#1d4ed8',
    '#f8fafc',
    '#1d4ed8',
    '#f8fafc',
    '#1d4ed8'
  ];
  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const isVertical =
      orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
    const span = rInner * 4;
    const w = (rInner * Math.sqrt(3)) / 2;

    const cantonWidthRatio = 0.48;
    const cantonHeightRatio = 5 / 9;

    const splitX = isVertical ? w * (1 - 2 * cantonHeightRatio) : w * (2 * cantonWidthRatio - 1);
    const splitY = isVertical
      ? rInner * (1 - 2 * cantonWidthRatio)
      : rInner * (1 - 2 * cantonHeightRatio);

    const cantonBox = isVertical
      ? draw([splitX, splitY])
          .lineTo([span, splitY])
          .lineTo([span, span])
          .lineTo([splitX, span])
          .close()
      : draw([-span, splitY])
          .lineTo([splitX, splitY])
          .lineTo([splitX, span])
          .lineTo([-span, span])
          .close();

    const cantonHex = innerHex.intersect(cantonBox);

    const cxCanton = isVertical ? (w + splitX) / 2 : (-w + splitX) / 2;
    const cyCanton = (rInner + splitY) / 2;
    const cantonH = isVertical ? w - splitX : rInner - splitY;

    const crossT = cantonH * 0.22;

    const boxCrossH = createRotatedBox(
      cxCanton,
      cyCanton,
      span,
      crossT,
      isVertical ? -Math.PI / 2 : 0
    );
    const boxCrossV = createRotatedBox(
      cxCanton,
      cyCanton,
      span,
      crossT,
      isVertical ? 0 : Math.PI / 2
    );

    const sCrossH = extrudeAndFillet2D(cantonHex.intersect(boxCrossH), zOffset, hFlag, fFlag);
    const sCrossV = extrudeAndFillet2D(cantonHex.intersect(boxCrossV), zOffset, hFlag, fFlag);

    let sCross: AnyShape | null = null;
    if (sCrossH && sCrossV) {
      try {
        sCross = (sCrossH as any).fuse(sCrossV);
      } catch {
        sCross = sCrossH;
      }
    } else {
      sCross = sCrossH || sCrossV;
    }

    const sCantonBase = extrudeAndFillet2D(cantonHex, zOffset, hFlag, fFlag);
    let sCantonBlue: AnyShape | null = sCantonBase;
    if (sCantonBase && sCross) {
      try {
        sCantonBlue = (sCantonBase as any).cut(sCross);
      } catch {}
    }

    // 9 stripes
    let baseStripes: Drawing[] = [];
    if (isVertical) {
      const splitXStripes: number[] = [span];
      for (let i = 1; i < 9; i++) {
        splitXStripes.push(w * (1 - (2 * i) / 9));
      }
      splitXStripes.push(-span);

      for (let i = 0; i < 9; i++) {
        const box = draw([splitXStripes[i + 1], -span])
          .lineTo([splitXStripes[i], -span])
          .lineTo([splitXStripes[i], span])
          .lineTo([splitXStripes[i + 1], span])
          .close();
        baseStripes.push(innerHex.intersect(box).cut(cantonBox));
      }
    } else {
      const allStripes = createMultiStripeSections2D(
        innerHex,
        rInner,
        stripeColors.map(() => 1),
        'horizontal'
      );
      baseStripes = allStripes.map((s) => s.cut(cantonBox));
    }

    const parts: ReplicadPart[] = [];

    // Canton Blue & Cross
    if (sCantonBlue) {
      parts.push({ shape: sCantonBlue, name: 'Flag_Canton_Blue', color: '#1d4ed8' });
    }
    if (sCross) {
      parts.push({ shape: sCross, name: 'Flag_Canton_Cross', color: '#f8fafc' });
    }

    // Fly stripes
    for (let i = 0; i < baseStripes.length; i++) {
      const s = extrudeAndFillet2D(baseStripes[i], zOffset, hFlag, fFlag);
      if (s) {
        parts.push({
          shape: s,
          name: `Flag_Stripe_${i + 1}`,
          color: stripeColors[i]
        });
      }
    }

    return parts;
  };
}

/**
 * Generator factory for the Switzerland flag
 */
export function createSwitzerlandFlagGenerator(): FlagGeneratorFn {
  return ({ innerHex, rInner, zOffset, hFlag, fFlag }: FlagBuildContext): ReplicadPart[] => {
    // Swiss cross dimensions (couped Greek cross centered at origin)
    const crossSpan = rInner * 1.16;
    const crossT = rInner * 0.35;

    const boxH = draw([-crossSpan / 2, -crossT / 2])
      .lineTo([crossSpan / 2, -crossT / 2])
      .lineTo([crossSpan / 2, crossT / 2])
      .lineTo([-crossSpan / 2, crossT / 2])
      .close();

    const boxV = draw([-crossT / 2, -crossSpan / 2])
      .lineTo([crossT / 2, -crossSpan / 2])
      .lineTo([crossT / 2, crossSpan / 2])
      .lineTo([-crossT / 2, crossSpan / 2])
      .close();

    const sCrossH = extrudeAndFillet2D(innerHex.intersect(boxH), zOffset, hFlag, fFlag);
    const sCrossV = extrudeAndFillet2D(innerHex.intersect(boxV), zOffset, hFlag, fFlag);

    let sCross: AnyShape | null = null;
    if (sCrossH && sCrossV) {
      try {
        sCross = (sCrossH as any).fuse(sCrossV);
      } catch {
        sCross = sCrossH;
      }
    } else {
      sCross = sCrossH || sCrossV;
    }

    const sFieldBase = extrudeAndFillet2D(innerHex, zOffset, hFlag, fFlag);
    let sField: AnyShape | null = sFieldBase;
    if (sFieldBase && sCross) {
      try {
        sField = (sFieldBase as any).cut(sCross);
      } catch {}
    }

    const parts: ReplicadPart[] = [];
    if (sField) {
      parts.push({ shape: sField, name: 'Flag_Field', color: '#ef4444' });
    }
    if (sCross) {
      parts.push({ shape: sCross, name: 'Flag_Cross_White', color: '#f8fafc' });
    }

    return parts;
  };
}

/**
 * Generator factory for the Tonga flag
 */
export function createTongaFlagGenerator(): FlagGeneratorFn {
  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const isVertical =
      orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
    const span = rInner * 4;
    const w = (rInner * Math.sqrt(3)) / 2;

    const cantonWidthRatio = 0.5;
    const cantonHeightRatio = 0.5;

    const splitX = isVertical ? w * (1 - 2 * cantonHeightRatio) : w * (2 * cantonWidthRatio - 1);
    const splitY = isVertical
      ? rInner * (1 - 2 * cantonWidthRatio)
      : rInner * (1 - 2 * cantonHeightRatio);

    const cantonBox = isVertical
      ? draw([splitX, splitY])
          .lineTo([span, splitY])
          .lineTo([span, span])
          .lineTo([splitX, span])
          .close()
      : draw([-span, splitY])
          .lineTo([splitX, splitY])
          .lineTo([splitX, span])
          .lineTo([-span, span])
          .close();

    const cantonHex = innerHex.intersect(cantonBox);

    const cxCanton = isVertical ? rInner / 2 : -w / 2;
    const cyCanton = isVertical ? w / 2 : rInner / 2;

    // Couped Greek cross inside canton
    const crossSpan = rInner * 0.46;
    const crossT = rInner * 0.16;

    const boxH = createRotatedBox(
      cxCanton,
      cyCanton,
      crossSpan,
      crossT,
      isVertical ? -Math.PI / 2 : 0
    );
    const boxV = createRotatedBox(
      cxCanton,
      cyCanton,
      crossSpan,
      crossT,
      isVertical ? 0 : Math.PI / 2
    );

    const sCrossH = extrudeAndFillet2D(cantonHex.intersect(boxH), zOffset, hFlag, fFlag);
    const sCrossV = extrudeAndFillet2D(cantonHex.intersect(boxV), zOffset, hFlag, fFlag);

    let sCross: AnyShape | null = null;
    if (sCrossH && sCrossV) {
      try {
        sCross = (sCrossH as any).fuse(sCrossV);
      } catch {
        sCross = sCrossH;
      }
    } else {
      sCross = sCrossH || sCrossV;
    }

    const sCantonBase = extrudeAndFillet2D(cantonHex, zOffset, hFlag, fFlag);
    let sCantonWhite: AnyShape | null = sCantonBase;
    if (sCantonBase && sCross) {
      try {
        sCantonWhite = (sCantonBase as any).cut(sCross);
      } catch {}
    }

    const sField = extrudeAndFillet2D(innerHex.cut(cantonBox), zOffset, hFlag, fFlag);

    const parts: ReplicadPart[] = [];
    if (sField) {
      parts.push({ shape: sField, name: 'Flag_Field', color: '#ef4444' });
    }
    if (sCantonWhite) {
      parts.push({ shape: sCantonWhite, name: 'Flag_Canton_White', color: '#f8fafc' });
    }
    if (sCross) {
      parts.push({ shape: sCross, name: 'Flag_Canton_Cross', color: '#ef4444' });
    }

    return parts;
  };
}

/**
 * Generator factory for the North Macedonia flag
 */
export function createNorthMacedoniaFlagGenerator(): FlagGeneratorFn {
  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const isVertical =
      orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
    const span = rInner * 4;
    const w = (rInner * Math.sqrt(3)) / 2;

    const rDisc = rInner * 0.28;
    const discDrawing = drawCircle(rDisc);

    const diagAngle = isVertical ? Math.atan2(w, rInner) : Math.atan2(rInner, w);

    const angles = isVertical
      ? [
          -Math.PI / 2,
          Math.PI / 2,
          Math.PI,
          0,
          diagAngle - Math.PI / 2,
          -diagAngle - Math.PI / 2,
          Math.PI - diagAngle - Math.PI / 2,
          -Math.PI + diagAngle - Math.PI / 2
        ]
      : [
          Math.PI / 2,
          -Math.PI / 2,
          Math.PI,
          0,
          diagAngle,
          -diagAngle,
          Math.PI - diagAngle,
          -Math.PI + diagAngle
        ];

    const raySolids: AnyShape[] = [];

    // 4 Orthogonal rays
    const orthoT0 = rInner * 0.12;
    const orthoT1 = rInner * 0.38;
    for (let i = 0; i < 4; i++) {
      const ang = angles[i];
      const p1: [number, number] = [(-orthoT0 / 2) * Math.sin(ang), (orthoT0 / 2) * Math.cos(ang)];
      const p2: [number, number] = [
        span * Math.cos(ang) - (orthoT1 / 2) * Math.sin(ang),
        span * Math.sin(ang) + (orthoT1 / 2) * Math.cos(ang)
      ];
      const p3: [number, number] = [
        span * Math.cos(ang) + (orthoT1 / 2) * Math.sin(ang),
        span * Math.sin(ang) - (orthoT1 / 2) * Math.cos(ang)
      ];
      const p4: [number, number] = [(orthoT0 / 2) * Math.sin(ang), (-orthoT0 / 2) * Math.cos(ang)];

      const rayD = draw(p1).lineTo(p2).lineTo(p3).lineTo(p4).close();
      const s = extrudeAndFillet2D(innerHex.intersect(rayD), zOffset, hFlag, fFlag);
      if (s) raySolids.push(s);
    }

    // 4 Diagonal rays
    const diagT0 = rInner * 0.08;
    const diagT1 = rInner * 0.32;
    for (let i = 4; i < 8; i++) {
      const ang = angles[i];
      const p1: [number, number] = [(-diagT0 / 2) * Math.sin(ang), (diagT0 / 2) * Math.cos(ang)];
      const p2: [number, number] = [
        span * Math.cos(ang) - (diagT1 / 2) * Math.sin(ang),
        span * Math.sin(ang) + (diagT1 / 2) * Math.cos(ang)
      ];
      const p3: [number, number] = [
        span * Math.cos(ang) + (diagT1 / 2) * Math.sin(ang),
        span * Math.sin(ang) - (diagT1 / 2) * Math.cos(ang)
      ];
      const p4: [number, number] = [(diagT0 / 2) * Math.sin(ang), (-diagT0 / 2) * Math.cos(ang)];

      const rayD = draw(p1).lineTo(p2).lineTo(p3).lineTo(p4).close();
      const s = extrudeAndFillet2D(innerHex.intersect(rayD), zOffset, hFlag, fFlag);
      if (s) raySolids.push(s);
    }

    const sDisc = extrudeAndFillet2D(innerHex.intersect(discDrawing), zOffset, hFlag, fFlag);
    if (sDisc) raySolids.push(sDisc);

    let sSun: AnyShape | null = null;
    for (const rs of raySolids) {
      if (!sSun) sSun = rs;
      else {
        try {
          sSun = (sSun as any).fuse(rs);
        } catch {}
      }
    }

    const sBaseField = extrudeAndFillet2D(innerHex, zOffset, hFlag, fFlag);
    let sField: AnyShape | null = sBaseField;
    if (sBaseField && sSun) {
      try {
        sField = (sBaseField as any).cut(sSun);
      } catch {}
    }

    const parts: ReplicadPart[] = [];
    if (sField) {
      parts.push({ shape: sField, name: 'Flag_Field', color: '#ef4444' });
    }
    if (sSun) {
      parts.push({ shape: sSun, name: 'Flag_Sun', color: '#eab308' });
    }

    return parts;
  };
}

/**
 * Generator factory for the Seychelles flag (5 radiating oblique bands from lower hoist corner)
 */
export function createSeychellesFlagGenerator(): FlagGeneratorFn {
  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const isVertical =
      orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
    const w = (rInner * Math.sqrt(3)) / 2;

    const orig: [number, number] = isVertical ? [-rInner, w] : [-w, -rInner];

    const mapPt = (x: number, y: number): [number, number] => (isVertical ? [y, -x] : [x, y]);

    const p0 = mapPt(-w, rInner);
    const p1 = mapPt(-w / 3, rInner);
    const p2 = mapPt(w / 3, rInner);
    const p3 = mapPt(w, rInner);
    const p4 = mapPt(w, rInner / 3);
    const p5 = mapPt(w, -rInner / 3);
    const p6 = mapPt(w, -rInner);

    const bluePoly = draw(orig).lineTo(p0).lineTo(p1).close();
    const yellowPoly = draw(orig).lineTo(p1).lineTo(p2).close();
    const redPoly = draw(orig).lineTo(p2).lineTo(p3).lineTo(p4).close();
    const whitePoly = draw(orig).lineTo(p4).lineTo(p5).close();
    const greenPoly = draw(orig).lineTo(p5).lineTo(p6).close();

    const bands = [
      { drawing: bluePoly, name: 'Flag_Band_Blue', color: '#0284c7' },
      { drawing: yellowPoly, name: 'Flag_Band_Yellow', color: '#eab308' },
      { drawing: redPoly, name: 'Flag_Band_Red', color: '#ef4444' },
      { drawing: whitePoly, name: 'Flag_Band_White', color: '#f8fafc' },
      { drawing: greenPoly, name: 'Flag_Band_Green', color: '#16a34a' }
    ];

    const parts: ReplicadPart[] = [];
    for (const b of bands) {
      const s = extrudeAndFillet2D(innerHex.intersect(b.drawing), zOffset, hFlag, fFlag);
      if (s) {
        parts.push({ shape: s, name: b.name, color: b.color });
      }
    }

    return parts;
  };
}

/**
 * Generator factory for the United States flag (13 alternating red and white stripes, blue canton with 50 white stars)
 */
export function createUnitedStatesFlagGenerator(): FlagGeneratorFn {
  const stripeColors = [
    '#ef4444', // 1 Red (top)
    '#f8fafc', // 2 White
    '#ef4444', // 3 Red
    '#f8fafc', // 4 White
    '#ef4444', // 5 Red
    '#f8fafc', // 6 White
    '#ef4444', // 7 Red
    '#f8fafc', // 8 White
    '#ef4444', // 9 Red
    '#f8fafc', // 10 White
    '#ef4444', // 11 Red
    '#f8fafc', // 12 White
    '#ef4444' // 13 Red (bottom)
  ];

  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const isVertical =
      orientation === 'vertical' || orientation === '90' || orientation === 'rotated';
    const span = rInner * 4;
    const w = (rInner * Math.sqrt(3)) / 2;

    const cantonWidthRatio = 0.48;
    const cantonHeightRatio = 7 / 13;

    // In standard orientation:
    // - 13 stripes stacked horizontally along Y: [-rInner, +rInner]
    // - Canton is at top-left: X in [-w, splitX], Y in [splitY, +rInner]
    // In rotated 90° CW orientation:
    // - (x, y) -> (y, -x)
    // - 13 stripes stacked vertically along X: from right (+rInner) to left (-rInner)
    // - Canton is at top-right: X in [splitX, +span], Y in [splitY, +span]

    const splitX = isVertical
      ? rInner * (1 - 2 * cantonHeightRatio)
      : w * (2 * cantonWidthRatio - 1);
    const splitY = isVertical
      ? w * (1 - 2 * cantonWidthRatio)
      : rInner * (1 - 2 * cantonHeightRatio);

    const cantonBox = isVertical
      ? draw([splitX, splitY])
          .lineTo([span, splitY])
          .lineTo([span, span])
          .lineTo([splitX, span])
          .close()
      : draw([-span, splitY])
          .lineTo([splitX, splitY])
          .lineTo([splitX, span])
          .lineTo([-span, span])
          .close();

    const cantonHex = innerHex.intersect(cantonBox);

    // Full rectangular canton dimensions in standard coordinates
    const unrotatedCantonW = 2 * w * cantonWidthRatio;
    const unrotatedCantonH = 2 * rInner * cantonHeightRatio;
    const unrotatedCantonXMin = -w;
    const unrotatedCantonYMin = rInner * (1 - 2 * cantonHeightRatio);

    // Star radius
    const rStar = rInner * 0.03;

    // 50 stars in 9 rows (alternating 6 and 5) across the canton
    const starSolids: AnyShape[] = [];

    for (let row = 0; row < 9; row++) {
      const isSixStarRow = row % 2 === 0;
      const numStarsInRow = isSixStarRow ? 6 : 5;
      const unrotY = unrotatedCantonYMin + unrotatedCantonH * (1 - (row + 1) / 10);

      for (let col = 0; col < numStarsInRow; col++) {
        const colFrac = isSixStarRow ? (col + 1) / 7 : (col + 1.5) / 7;
        const unrotX = unrotatedCantonXMin + unrotatedCantonW * colFrac;

        const starCenter: [number, number] = isVertical ? [unrotY, -unrotX] : [unrotX, unrotY];
        const starRot = isVertical ? -Math.PI / 2 : 0;

        const sDraw = drawStar(rStar, rStar * 0.381966, starCenter, starRot);
        const sClipped = innerHex.intersect(sDraw);

        // Extrude star solid (zero fillet for clean sharp star geometry)
        // Stars are extruded +0.04mm above the blue canton to guarantee crisp rendering in Three.js
        const sStarSolid = extrudeAndFillet2D(sClipped, zOffset, hFlag + 0.04, 0);
        if (sStarSolid) {
          starSolids.push(sStarSolid);
        }
      }
    }

    // Extrude clean solid blue canton (zero fillet for 100% CAD robustness)
    const sCantonBlue = extrudeAndFillet2D(cantonHex, zOffset, hFlag, 0);

    // 13 stripes
    const baseStripes: Drawing[] = [];
    if (isVertical) {
      // 13 vertical stripes from right (+rInner) to left (-rInner)
      const xBounds: number[] = [span];
      for (let i = 1; i < 13; i++) {
        xBounds.push(rInner * (1 - (2 * i) / 13));
      }
      xBounds.push(-span);

      for (let i = 0; i < 13; i++) {
        const xRight = xBounds[i];
        const xLeft = xBounds[i + 1];

        if (i < 7) {
          // Top 7 stripes (now right 7 stripes): section below canton
          const box = draw([xLeft, -span])
            .lineTo([xRight, -span])
            .lineTo([xRight, splitY])
            .lineTo([xLeft, splitY])
            .close();
          baseStripes.push(innerHex.intersect(box));
        } else {
          // Bottom 6 stripes (now left 6 stripes): full vertical span
          const box = draw([xLeft, -span])
            .lineTo([xRight, -span])
            .lineTo([xRight, span])
            .lineTo([xLeft, span])
            .close();
          baseStripes.push(innerHex.intersect(box));
        }
      }
    } else {
      // 13 horizontal stripes from top (+rInner) to bottom (-rInner)
      const yBounds: number[] = [span];
      for (let i = 1; i < 13; i++) {
        yBounds.push(rInner * (1 - (2 * i) / 13));
      }
      yBounds.push(-span);

      for (let i = 0; i < 13; i++) {
        const yTop = yBounds[i];
        const yBot = yBounds[i + 1];

        if (i < 7) {
          // Top 7 stripes: right section next to canton
          const box = draw([splitX, yBot])
            .lineTo([span, yBot])
            .lineTo([span, yTop])
            .lineTo([splitX, yTop])
            .close();
          baseStripes.push(innerHex.intersect(box));
        } else {
          // Bottom 6 stripes: full horizontal span
          const box = draw([-span, yBot])
            .lineTo([span, yBot])
            .lineTo([span, yTop])
            .lineTo([-span, yTop])
            .close();
          baseStripes.push(innerHex.intersect(box));
        }
      }
    }

    const parts: ReplicadPart[] = [];

    // Canton Blue
    if (sCantonBlue) {
      parts.push({ shape: sCantonBlue, name: 'Flag_Canton_Blue', color: '#1e3a8a' });
    }

    // 50 Stars
    for (let i = 0; i < starSolids.length; i++) {
      parts.push({
        shape: starSolids[i],
        name: `Flag_Star_${i + 1}`,
        color: '#f8fafc'
      });
    }

    // 13 Stripes
    for (let i = 0; i < baseStripes.length; i++) {
      const s = extrudeAndFillet2D(baseStripes[i], zOffset, hFlag, fFlag);
      if (s) {
        parts.push({
          shape: s,
          name: `Flag_Stripe_${i + 1}`,
          color: stripeColors[i]
        });
      }
    }

    return parts;
  };
}

/**
 * Generator factory for the Flag of Canada (Canadian Pale: Red, White, Red with stylized 11-pointed maple leaf)
 */
export function createCanadaFlagGenerator(): FlagGeneratorFn {
  return ({
    innerHex,
    rInner,
    zOffset,
    hFlag,
    fFlag,
    orientation
  }: FlagBuildContext): ReplicadPart[] => {
    const effectiveOrientation = resolveEffectiveOrientation(orientation, 'vertical');
    const isVertical = effectiveOrientation === 'vertical';

    // Wider middle band (ratio [1, 3.2, 1]) gives the Canadian pale room to breathe on the hex keychain
    const sections = createMultiStripeSections2D(
      innerHex,
      rInner,
      [1, 3.2, 1],
      effectiveOrientation,
      'vertical'
    );

    const leafScale = rInner * 0.52;
    const leafRot = isVertical ? 0 : -Math.PI / 2;
    const leafDrawing = drawMapleLeaf(leafScale, [0, 0], leafRot);

    // Section 0: Red (Left in vertical, Top in horizontal)
    // Section 1: White (Middle) minus leaf
    // Section 2: Red (Right in vertical, Bottom in horizontal)

    let whiteSection = sections[1];
    try {
      whiteSection = whiteSection.cut(leafDrawing);
    } catch {}

    const parts: ReplicadPart[] = [];

    const sRed1 = extrudeAndFillet2D(sections[0], zOffset, hFlag, fFlag);
    if (sRed1) {
      parts.push({
        shape: sRed1,
        name: isVertical ? 'Flag_Left' : 'Flag_Top',
        color: '#ef4444'
      });
    }

    const sWhite =
      extrudeAndFillet2D(whiteSection, zOffset, hFlag, 0) ??
      extrudeAndFillet2D(sections[1], zOffset, hFlag, fFlag);
    if (sWhite) {
      parts.push({
        shape: sWhite,
        name: 'Flag_Middle',
        color: '#f8fafc'
      });
    }

    const sRed2 = extrudeAndFillet2D(sections[2], zOffset, hFlag, fFlag);
    if (sRed2) {
      parts.push({
        shape: sRed2,
        name: isVertical ? 'Flag_Right' : 'Flag_Bottom',
        color: '#ef4444'
      });
    }

    const sLeaf = extrudeAndFillet2D(innerHex.intersect(leafDrawing), zOffset, hFlag, 0);
    if (sLeaf) {
      parts.push({
        shape: sLeaf,
        name: 'Flag_Maple_Leaf',
        color: '#ef4444'
      });
    }

    return parts;
  };
}

/**
 * Registry of flag designs and their modular generator functions
 */
export const FLAG_REGISTRY: Record<string, FlagRegistryEntry> = {
  algeria: {
    name: 'Algeria',
    generate: createAlgeriaFlagGenerator()
  },
  armenia: {
    name: 'Armenia',
    generate: createTricolorFlagGenerator('#ef4444', '#2563eb', '#f97316', 'horizontal')
  },
  australia: {
    name: 'Australia',
    generate: createAustraliaFlagGenerator()
  },
  austria: {
    name: 'Austria',
    generate: createTricolorFlagGenerator('#ef4444', '#f8fafc', '#ef4444', 'horizontal')
  },
  azerbaijan: {
    name: 'Azerbaijan',
    generate: createAzerbaijanFlagGenerator()
  },
  bahamas: {
    name: 'Bahamas',
    generate: createTrianglePileMultiBandsFlagGenerator(
      '#0f172a',
      ['#0284c7', '#eab308', '#0284c7'],
      0.5,
      'horizontal'
    )
  },
  bahrain: {
    name: 'Bahrain',
    generate: createSerratedFlagGenerator('#f8fafc', '#ef4444', 5, 0.28, 0.16)
  },
  bangladesh: {
    name: 'Bangladesh',
    generate: createCircleFlagGenerator('#15803d', '#ef4444', 0.45, -0.1, 'horizontal')
  },
  belarus: {
    name: 'Belarus',
    generate: createBicolorFlagGenerator('#ef4444', '#16a34a', 'horizontal')
  },
  benin: {
    name: 'Benin',
    generate: createHoistTwoBandsFlagGenerator('#16a34a', '#eab308', '#ef4444', 0.4, 'horizontal')
  },
  bolivia: {
    name: 'Bolivia',
    generate: createTricolorFlagGenerator('#ef4444', '#eab308', '#16a34a', 'horizontal')
  },
  botswana: {
    name: 'Botswana',
    generate: createMultiStripeFlagGenerator(
      ['#38bdf8', '#f8fafc', '#0f172a', '#f8fafc', '#38bdf8'],
      'horizontal',
      [9, 1, 4, 1, 9]
    )
  },
  bulgaria: {
    name: 'Bulgaria',
    generate: createTricolorFlagGenerator('#f8fafc', '#16a34a', '#ef4444', 'horizontal')
  },
  burkina_faso: {
    name: 'Burkina Faso',
    generate: createMultiStripeWithStarsFlagGenerator(
      ['#ef4444', '#16a34a'],
      { color: '#eab308', outerRadiusRatio: 0.45 },
      'horizontal'
    )
  },
  cameroon: {
    name: 'Cameroon',
    generate: createMultiStripeWithStarsFlagGenerator(
      ['#16a34a', '#ef4444', '#eab308'],
      { color: '#eab308', outerRadiusRatio: 0.28 },
      'vertical'
    )
  },
  canada: {
    name: 'Canada',
    generate: createCanadaFlagGenerator()
  },
  central_african_republic: {
    name: 'Central African Republic',
    generate: createCentralAfricanRepublicFlagGenerator()
  },
  chad: {
    name: 'Chad',
    generate: createTricolorFlagGenerator('#1d4ed8', '#eab308', '#ef4444', 'vertical')
  },
  chile: {
    name: 'Chile',
    generate: createCantonStripesWithStarFlagGenerator(
      '#1d4ed8',
      ['#f8fafc', '#ef4444'],
      { color: '#f8fafc', outerRadiusRatio: 0.3, centerRatio: [-0.45, 0.45] },
      0.5,
      0.5,
      [1, 1]
    )
  },
  china: {
    name: 'China',
    generate: createChinaFlagGenerator()
  },
  colombia: {
    name: 'Colombia',
    generate: createTricolorFlagGenerator('#eab308', '#2563eb', '#ef4444', 'horizontal', [2, 1, 1])
  },
  costa_rica: {
    name: 'Costa Rica',
    generate: createMultiStripeFlagGenerator(
      ['#2563eb', '#f8fafc', '#ef4444', '#f8fafc', '#2563eb'],
      'horizontal',
      [1, 1, 2, 1, 1]
    )
  },
  cuba: {
    name: 'Cuba',
    generate: createTrianglePileMultiBandsWithStarsFlagGenerator(
      '#ef4444',
      ['#1d4ed8', '#f8fafc', '#1d4ed8', '#f8fafc', '#1d4ed8'],
      { color: '#f8fafc', outerRadiusRatio: 0.2, centerRatio: [-0.48, 0] },
      0.5,
      'horizontal'
    )
  },
  czechia: {
    name: 'Czechia',
    generate: createTrianglePileTwoBandsFlagGenerator(
      '#2563eb',
      '#f8fafc',
      '#ef4444',
      0.5,
      'horizontal'
    )
  },
  denmark: {
    name: 'Denmark',
    generate: createCrossFlagGenerator('#f8fafc', '#ef4444', 0.3, -0.2, 'horizontal')
  },
  djibouti: {
    name: 'Djibouti',
    generate: createTrianglePileMultiBandsWithStarsFlagGenerator(
      '#f8fafc',
      ['#38bdf8', '#16a34a'],
      { color: '#ef4444', outerRadiusRatio: 0.2, centerRatio: [-0.48, 0] },
      0.5,
      'horizontal'
    )
  },
  dr_congo: {
    name: 'Democratic Republic of the Congo',
    generate: createDiagonalBendFlagGenerator(
      '#0284c7',
      '#0284c7',
      [
        { color: '#eab308', widthRatio: 0.08 },
        { color: '#ef4444', widthRatio: 0.32 },
        { color: '#eab308', widthRatio: 0.08 }
      ],
      { color: '#eab308', outerRadiusRatio: 0.22, centerRatio: [-0.48, 0.48] }
    )
  },
  dominican_republic: {
    name: 'Dominican Republic',
    generate: createCrossFlagGenerator(
      '#f8fafc',
      ['#2563eb', '#ef4444', '#ef4444', '#2563eb'],
      0.35,
      0,
      'horizontal'
    )
  },
  england: {
    name: 'England',
    generate: createCrossFlagGenerator('#ef4444', '#f8fafc', 0.35, 0, 'horizontal')
  },
  estonia: {
    name: 'Estonia',
    generate: createTricolorFlagGenerator('#2563eb', '#0f172a', '#f8fafc', 'horizontal')
  },
  european_union: {
    name: 'European Union',
    generate: createEuropeanUnionFlagGenerator()
  },
  faroe_islands: {
    name: 'Faroe Islands',
    generate: createDoubleCrossFlagGenerator(
      '#ef4444',
      '#0284c7',
      '#f8fafc',
      0.36,
      0.18,
      -0.2,
      'horizontal'
    )
  },
  finland: {
    name: 'Finland',
    generate: createCrossFlagGenerator('#1d4ed8', '#f8fafc', 0.4, -0.2, 'horizontal')
  },
  france: {
    name: 'France',
    generate: createTricolorFlagGenerator('#2563eb', '#f8fafc', '#ef4444', 'vertical')
  },
  gabon: {
    name: 'Gabon',
    generate: createTricolorFlagGenerator('#16a34a', '#eab308', '#2563eb', 'horizontal')
  },
  gambia: {
    name: 'Gambia',
    generate: createMultiStripeFlagGenerator(
      ['#ef4444', '#f8fafc', '#2563eb', '#f8fafc', '#16a34a'],
      'horizontal',
      [6, 1, 4, 1, 6]
    )
  },
  germany: {
    name: 'Germany',
    generate: createTricolorFlagGenerator('#0f172a', '#ef4444', '#eab308', 'horizontal')
  },
  ghana: {
    name: 'Ghana',
    generate: createMultiStripeWithStarsFlagGenerator(
      ['#ef4444', '#eab308', '#16a34a'],
      { color: '#0f172a', outerRadiusRatio: 0.35 },
      'horizontal'
    )
  },
  greenland: {
    name: 'Greenland',
    generate: createGreenlandFlagGenerator()
  },
  greece: {
    name: 'Greece',
    generate: createGreeceFlagGenerator()
  },
  guatemala: {
    name: 'Guatemala',
    generate: createTricolorFlagGenerator('#0284c7', '#f8fafc', '#0284c7', 'vertical')
  },
  guinea: {
    name: 'Guinea',
    generate: createTricolorFlagGenerator('#ef4444', '#eab308', '#16a34a', 'vertical')
  },
  guinea_bissau: {
    name: 'Guinea-Bissau',
    generate: createHoistMultiBandsWithStarsFlagGenerator(
      '#ef4444',
      ['#eab308', '#16a34a'],
      { color: '#0f172a', outerRadiusRatio: 0.28, centerRatio: [-0.65, 0] },
      1 / 3,
      'horizontal'
    )
  },
  honduras: {
    name: 'Honduras',
    generate: createMultiStripeWithStarsFlagGenerator(
      ['#0284c7', '#f8fafc', '#0284c7'],
      [
        { color: '#0284c7', outerRadiusRatio: 0.12, centerRatio: [0, 0], name: 'Flag_Star_Center' },
        {
          color: '#0284c7',
          outerRadiusRatio: 0.12,
          centerRatio: [-0.35, 0.14],
          name: 'Flag_Star_Top_Left'
        },
        {
          color: '#0284c7',
          outerRadiusRatio: 0.12,
          centerRatio: [0.35, 0.14],
          name: 'Flag_Star_Top_Right'
        },
        {
          color: '#0284c7',
          outerRadiusRatio: 0.12,
          centerRatio: [-0.35, -0.14],
          name: 'Flag_Star_Bottom_Left'
        },
        {
          color: '#0284c7',
          outerRadiusRatio: 0.12,
          centerRatio: [0.35, -0.14],
          name: 'Flag_Star_Bottom_Right'
        }
      ],
      'horizontal'
    )
  },
  hungary: {
    name: 'Hungary',
    generate: createTricolorFlagGenerator('#ef4444', '#f8fafc', '#16a34a', 'horizontal')
  },
  iceland: {
    name: 'Iceland',
    generate: createDoubleCrossFlagGenerator(
      '#ef4444',
      '#f8fafc',
      '#1d4ed8',
      0.36,
      0.18,
      -0.2,
      'horizontal'
    )
  },
  indonesia: {
    name: 'Indonesia',
    generate: createBicolorFlagGenerator('#ef4444', '#f8fafc', 'horizontal')
  },
  ireland: {
    name: 'Ireland',
    generate: createTricolorFlagGenerator('#16a34a', '#f8fafc', '#f97316', 'vertical')
  },
  italy: {
    name: 'Italy',
    generate: createTricolorFlagGenerator('#16a34a', '#f8fafc', '#ef4444', 'vertical')
  },
  ivory_coast: {
    name: 'Ivory Coast',
    generate: createTricolorFlagGenerator('#f97316', '#f8fafc', '#16a34a', 'vertical')
  },
  jamaica: {
    name: 'Jamaica',
    generate: createSaltireFlagGenerator(
      '#eab308',
      ['#16a34a', '#16a34a', '#0f172a', '#0f172a'],
      0.3,
      'horizontal'
    )
  },
  japan: {
    name: 'Japan',
    generate: createCircleFlagGenerator('#f8fafc', '#dc2626', 0.55, 0, 'horizontal')
  },
  jordan: {
    name: 'Jordan',
    generate: createTrianglePileMultiBandsWithStarsFlagGenerator(
      '#ef4444',
      ['#0f172a', '#f8fafc', '#16a34a'],
      {
        color: '#f8fafc',
        outerRadiusRatio: 0.16,
        centerRatio: [-0.54, 0],
        numPoints: 7,
        name: 'Flag_Star'
      },
      0.5,
      'horizontal'
    )
  },
  laos: {
    name: 'Laos',
    generate: createLaosFlagGenerator()
  },
  latvia: {
    name: 'Latvia',
    generate: createTricolorFlagGenerator('#991b1b', '#f8fafc', '#991b1b', 'horizontal', [2, 1, 2])
  },
  liberia: {
    name: 'Liberia',
    generate: createCantonStripesWithStarFlagGenerator(
      '#1d4ed8',
      [
        '#ef4444',
        '#f8fafc',
        '#ef4444',
        '#f8fafc',
        '#ef4444',
        '#f8fafc',
        '#ef4444',
        '#f8fafc',
        '#ef4444',
        '#f8fafc',
        '#ef4444'
      ],
      { color: '#f8fafc', outerRadiusRatio: 0.28, centerRatio: [-0.48, 0.45] },
      0.46,
      0.545,
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    )
  },
  libya: {
    name: 'Libya',
    generate: createLibyaFlagGenerator()
  },
  lithuania: {
    name: 'Lithuania',
    generate: createTricolorFlagGenerator('#eab308', '#16a34a', '#ef4444', 'horizontal')
  },
  luxemburg: {
    name: 'Luxembourg',
    generate: createTricolorFlagGenerator('#ef4444', '#f8fafc', '#38bdf8', 'horizontal')
  },
  madagascar: {
    name: 'Madagascar',
    generate: createHoistTwoBandsFlagGenerator('#f8fafc', '#ef4444', '#16a34a', 1 / 3, 'horizontal')
  },
  malaysia: {
    name: 'Malaysia',
    generate: createMalaysiaFlagGenerator()
  },
  mali: {
    name: 'Mali',
    generate: createTricolorFlagGenerator('#16a34a', '#eab308', '#ef4444', 'vertical')
  },
  martinique: {
    name: 'Martinique',
    generate: createTrianglePileTwoBandsFlagGenerator(
      '#ef4444',
      '#16a34a',
      '#0f172a',
      0.5,
      'horizontal'
    )
  },
  mauritania: {
    name: 'Mauritania',
    generate: createMauritaniaFlagGenerator()
  },
  mauritius: {
    name: 'Mauritius',
    generate: createMultiStripeFlagGenerator(
      ['#ef4444', '#2563eb', '#eab308', '#16a34a'],
      'horizontal'
    )
  },
  monaco: {
    name: 'Monaco',
    generate: createBicolorFlagGenerator('#ef4444', '#f8fafc', 'horizontal')
  },
  myanmar: {
    name: 'Myanmar',
    generate: createMultiStripeWithStarsFlagGenerator(
      ['#eab308', '#16a34a', '#ef4444'],
      { color: '#f8fafc', outerRadiusRatio: 0.65 },
      'horizontal'
    )
  },
  nauru: {
    name: 'Nauru',
    generate: createMultiStripeWithStarsFlagGenerator(
      ['#0284c7', '#eab308', '#0284c7'],
      {
        color: '#f8fafc',
        outerRadiusRatio: 0.24,
        centerRatio: [-0.48, -0.45],
        numPoints: 12,
        name: 'Flag_Star'
      },
      'horizontal',
      [11, 2, 11]
    )
  },
  netherlands: {
    name: 'Netherlands',
    generate: createTricolorFlagGenerator('#ef4444', '#f8fafc', '#2563eb', 'horizontal')
  },
  new_zealand: {
    name: 'New Zealand',
    generate: createNewZealandFlagGenerator()
  },
  niger: {
    name: 'Niger',
    generate: createNigerFlagGenerator()
  },
  nigeria: {
    name: 'Nigeria',
    generate: createTricolorFlagGenerator('#16a34a', '#f8fafc', '#16a34a', 'vertical')
  },
  north_korea: {
    name: 'North Korea',
    generate: createNorthKoreaFlagGenerator()
  },
  north_macedonia: {
    name: 'North Macedonia',
    generate: createNorthMacedoniaFlagGenerator()
  },
  norway: {
    name: 'Norway',
    generate: createDoubleCrossFlagGenerator(
      '#1e3a8a',
      '#f8fafc',
      '#ef4444',
      0.36,
      0.18,
      -0.2,
      'horizontal'
    )
  },
  pakistan: {
    name: 'Pakistan',
    generate: createPakistanFlagGenerator()
  },
  palau: {
    name: 'Palau',
    generate: createCircleFlagGenerator('#38bdf8', '#eab308', 0.55, -0.125, 'horizontal')
  },
  palestine: {
    name: 'Palestine',
    generate: createTrianglePileMultiBandsFlagGenerator(
      '#ef4444',
      ['#0f172a', '#f8fafc', '#16a34a'],
      0.5,
      'horizontal'
    )
  },
  panama: {
    name: 'Panama',
    generate: createPanamaFlagGenerator()
  },
  peru: {
    name: 'Peru',
    generate: createTricolorFlagGenerator('#ef4444', '#f8fafc', '#ef4444', 'vertical')
  },
  poland: {
    name: 'Poland',
    generate: createBicolorFlagGenerator('#f8fafc', '#ef4444', 'horizontal')
  },
  puerto_rico: {
    name: 'Puerto Rico',
    generate: createTrianglePileMultiBandsWithStarsFlagGenerator(
      '#1d4ed8',
      ['#ef4444', '#f8fafc', '#ef4444', '#f8fafc', '#ef4444'],
      { color: '#f8fafc', outerRadiusRatio: 0.2, centerRatio: [-0.48, 0] },
      0.5,
      'horizontal'
    )
  },
  qatar: {
    name: 'Qatar',
    generate: createSerratedFlagGenerator('#f8fafc', '#88123b', 9, 0.28, 0.14)
  },
  romania: {
    name: 'Romania',
    generate: createTricolorFlagGenerator('#1d4ed8', '#eab308', '#ef4444', 'vertical')
  },
  russia: {
    name: 'Russia',
    generate: createTricolorFlagGenerator('#f8fafc', '#2563eb', '#ef4444', 'horizontal')
  },
  san_marino: {
    name: 'San Marino',
    generate: createBicolorFlagGenerator('#f8fafc', '#38bdf8', 'horizontal')
  },
  saint_kitts: {
    name: 'Saint Kitts and Nevis',
    generate: createDiagonalBendFlagGenerator(
      '#ef4444',
      '#16a34a',
      [
        { color: '#eab308', widthRatio: 0.08 },
        { color: '#0f172a', widthRatio: 0.38 },
        { color: '#eab308', widthRatio: 0.08 }
      ],
      [
        {
          color: '#f8fafc',
          outerRadiusRatio: 0.12,
          centerRatio: [-0.26, -0.26],
          rotationAngle: Math.atan(2 / Math.sqrt(3)) - Math.PI / 2,
          name: 'Flag_Star_1'
        },
        {
          color: '#f8fafc',
          outerRadiusRatio: 0.12,
          centerRatio: [0.26, 0.26],
          rotationAngle: Math.atan(2 / Math.sqrt(3)) - Math.PI / 2,
          name: 'Flag_Star_2'
        }
      ]
    )
  },
  sao_tome_and_principe: {
    name: 'São Tomé and Príncipe',
    generate: createTrianglePileMultiBandsWithStarsFlagGenerator(
      '#ef4444',
      ['#16a34a', '#eab308', '#16a34a'],
      [
        {
          color: '#0f172a',
          outerRadiusRatio: 0.18,
          centerRatio: [0.05, 0],
          name: 'Flag_Star_1'
        },
        {
          color: '#0f172a',
          outerRadiusRatio: 0.18,
          centerRatio: [0.45, 0],
          name: 'Flag_Star_2'
        }
      ],
      0.38,
      'horizontal',
      [1, 1.4, 1]
    )
  },
  scotland: {
    name: 'Scotland',
    generate: createSaltireFlagGenerator('#f8fafc', '#2563eb', 0.3, 'horizontal')
  },
  senegal: {
    name: 'Senegal',
    generate: createMultiStripeWithStarsFlagGenerator(
      ['#16a34a', '#eab308', '#ef4444'],
      { color: '#16a34a', outerRadiusRatio: 0.28 },
      'vertical'
    )
  },
  seychelles: {
    name: 'Seychelles',
    generate: createSeychellesFlagGenerator()
  },
  serbia: {
    name: 'Serbia',
    generate: createTricolorFlagGenerator('#ef4444', '#2563eb', '#f8fafc', 'horizontal')
  },
  sierra_leone: {
    name: 'Sierra Leone',
    generate: createTricolorFlagGenerator('#16a34a', '#f8fafc', '#0284c7', 'horizontal')
  },
  singapore: {
    name: 'Singapore',
    generate: createSingaporeFlagGenerator()
  },
  somalia: {
    name: 'Somalia',
    generate: createStarFlagGenerator('#38bdf8', '#f8fafc', 0.55, 0, 'horizontal')
  },
  south_korea: {
    name: 'South Korea',
    generate: createSouthKoreaFlagGenerator()
  },
  south_sudan: {
    name: 'South Sudan',
    generate: createTrianglePileMultiBandsWithStarsFlagGenerator(
      '#1d4ed8',
      ['#0f172a', '#f8fafc', '#ef4444', '#f8fafc', '#16a34a'],
      { color: '#eab308', outerRadiusRatio: 0.2, centerRatio: [-0.48, 0] },
      0.5,
      'horizontal',
      [3, 0.6, 3, 0.6, 3]
    )
  },
  suriname: {
    name: 'Suriname',
    generate: createMultiStripeWithStarsFlagGenerator(
      ['#16a34a', '#f8fafc', '#ef4444', '#f8fafc', '#16a34a'],
      { color: '#eab308', outerRadiusRatio: 0.38 },
      'horizontal',
      [2, 1, 4, 1, 2]
    )
  },
  sweden: {
    name: 'Sweden',
    generate: createCrossFlagGenerator('#eab308', '#2563eb', 0.35, -0.2, 'horizontal')
  },
  switzerland: {
    name: 'Switzerland',
    generate: createSwitzerlandFlagGenerator()
  },
  syria: {
    name: 'Syria',
    generate: createMultiStripeWithStarsFlagGenerator(
      ['#ef4444', '#f8fafc', '#0f172a'],
      [
        {
          color: '#16a34a',
          outerRadiusRatio: 0.2,
          centerRatio: [-0.28, 0],
          name: 'Flag_Star_1'
        },
        {
          color: '#16a34a',
          outerRadiusRatio: 0.2,
          centerRatio: [0.28, 0],
          name: 'Flag_Star_2'
        }
      ],
      'horizontal'
    )
  },
  thailand: {
    name: 'Thailand',
    generate: createMultiStripeFlagGenerator(
      ['#ef4444', '#f8fafc', '#1e3a8a', '#f8fafc', '#ef4444'],
      'horizontal',
      [1, 1, 2, 1, 1]
    )
  },
  timor_leste: {
    name: 'Timor-Leste',
    generate: createTimorLesteFlagGenerator()
  },
  togo: {
    name: 'Togo',
    generate: createCantonStripesWithStarFlagGenerator(
      '#ef4444',
      ['#16a34a', '#eab308', '#16a34a', '#eab308', '#16a34a'],
      { color: '#f8fafc', outerRadiusRatio: 0.3, centerRatio: [-0.45, 0.38] },
      0.48,
      0.6,
      [1, 1, 1, 1, 1]
    )
  },
  tonga: {
    name: 'Tonga',
    generate: createTongaFlagGenerator()
  },
  tunisia: {
    name: 'Tunisia',
    generate: createTunisiaFlagGenerator()
  },
  turkey: {
    name: 'Turkey',
    generate: createTurkeyFlagGenerator()
  },
  turkiye: {
    name: 'Türkiye',
    generate: createTurkeyFlagGenerator()
  },
  uae: {
    name: 'United Arab Emirates',
    generate: createHoistMultiBandsFlagGenerator(
      '#ef4444',
      ['#16a34a', '#f8fafc', '#0f172a'],
      0.3,
      'horizontal'
    )
  },
  ukraine: {
    name: 'Ukraine',
    generate: createBicolorFlagGenerator('#2563eb', '#eab308', 'horizontal')
  },
  united_kingdom: {
    name: 'United Kingdom',
    generate: createUnitedKingdomFlagGenerator()
  },
  united_states: {
    name: 'United States',
    generate: createUnitedStatesFlagGenerator()
  },
  venezuela: {
    name: 'Venezuela',
    generate: (() => {
      const vStars: StarConfig[] = [];
      const numStars = 8;
      const arcR = 0.65;
      const arcCenterY = -0.45;
      const startAngle = (155 * Math.PI) / 180;
      const endAngle = (25 * Math.PI) / 180;
      for (let i = 0; i < numStars; i++) {
        const theta = startAngle + (i / (numStars - 1)) * (endAngle - startAngle);
        const xFrac = (arcR * Math.cos(theta)) / (Math.sqrt(3) / 2);
        const yFrac = arcCenterY + arcR * Math.sin(theta);
        vStars.push({
          color: '#f8fafc',
          outerRadiusRatio: 0.07,
          centerRatio: [xFrac, yFrac],
          rotationAngle: theta - Math.PI / 2,
          name: `Flag_Star_${i + 1}`
        });
      }
      return createMultiStripeWithStarsFlagGenerator(
        ['#eab308', '#1d4ed8', '#ef4444'],
        vStars,
        'horizontal'
      );
    })()
  },
  vietnam: {
    name: 'Vietnam',
    generate: createStarFlagGenerator('#ef4444', '#eab308', 0.6, 0, 'horizontal')
  },
  yemen: {
    name: 'Yemen',
    generate: createTricolorFlagGenerator('#ef4444', '#f8fafc', '#0f172a', 'horizontal')
  }
};

/**
 * Register a custom flag generator dynamically
 */
export function registerFlag(id: string, entry: FlagRegistryEntry): void {
  FLAG_REGISTRY[id] = entry;
}

export const FLAG_OPTIONS = [
  { value: 'empty', label: 'Empty (Frame Only)' },
  ...Object.entries(FLAG_REGISTRY).map(([value, config]) => ({
    value,
    label: config.name
  }))
];

export const FLAG_ORIENTATION_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'rotated', label: 'Rotated 90°' }
];

export const flagsParameters: ParameterDefinition[] = [
  {
    id: 'flag_type',
    name: 'Flag Design',
    type: 'enum',
    default: 'empty',
    options: FLAG_OPTIONS,
    group: 'Flag Design',
    description: 'Select world flag design (bicolor or tricolor layouts)'
  },
  {
    id: 'flag_orientation',
    name: 'Flag Orientation',
    type: 'enum',
    default: 'standard',
    options: FLAG_ORIENTATION_OPTIONS,
    widget: 'segmented',
    group: 'Flag Design',
    dependsOn: 'flag_type',
    description: 'Use standard national flag orientation or rotate sections 90 degrees'
  },
  {
    id: 'flag_fillet',
    name: 'Flag Corner Fillet',
    type: 'quantity',
    unit: 'millimeter',
    default: 0.2,
    min: 0,
    max: 1,
    step: 0.05,
    group: 'Flag Design',
    dependsOn: 'flag_type',
    description: 'Fillet radius on the outer edges of the flag sections'
  },
  {
    id: 'flag_depth',
    name: 'Flag Parts Height / Depth',
    type: 'quantity',
    unit: 'millimeter',
    default: 1.2,
    min: 0.2,
    max: 5,
    step: 0.1,
    group: 'Flag Design',
    dependsOn: 'flag_type',
    description: 'Extruded thickness / height of the flag design parts'
  },
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
    id: 'include_backplate',
    name: 'Include Backplate',
    type: 'boolean',
    default: true,
    group: 'Backplate',
    description: 'Include solid hexagon bottom backplate'
  },
  {
    id: 'backplate_thickness',
    name: 'Backplate Thickness',
    type: 'quantity',
    unit: 'millimeter',
    default: 1.8,
    min: 0.4,
    max: 5,
    step: 0.2,
    group: 'Backplate',
    dependsOn: 'include_backplate',
    description: 'Thickness of the bottom solid backplate'
  },
  {
    id: 'backplate_fillet',
    name: 'Backplate Fillet',
    type: 'quantity',
    unit: 'millimeter',
    default: 0.2,
    min: 0,
    max: 1,
    step: 0.05,
    group: 'Backplate',
    dependsOn: 'include_backplate',
    description: 'Corner fillet radius on the outer edge of the backplate'
  },
  {
    id: 'hex_radius',
    name: 'Hexagon Radius',
    type: 'quantity',
    unit: 'millimeter',
    default: 25,
    min: 10,
    max: 45,
    step: 1,
    group: 'Hexagon Frame',
    description: 'Outer radius of the hexagonal boundary'
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
    group: 'Hexagon Frame',
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
    group: 'Hexagon Frame',
    description: 'Corner fillet radius on the outer hexagon frame'
  },
  {
    id: 'height',
    name: 'Total Height / Depth',
    type: 'quantity',
    unit: 'millimeter',
    default: 3,
    min: 1,
    max: 5,
    step: 0.5,
    group: 'Hexagon Frame',
    description: 'Total extruded depth of the hex frame perimeter'
  },
  {
    id: 'single_part',
    name: 'Single Part (Fuse Solids)',
    type: 'boolean',
    default: false,
    group: 'Assembly & Output',
    description:
      'Fuse base frame components into a single unified part while keeping flag sections separate for multi-color 3D printing'
  }
];

export const defaultFlagsParameters: FlagsParameters =
  extractDefaultParameters<FlagsParameters>(flagsParameters);

/**
 * Builds the 3D Flags of the World Keychain assembly parts:
 * 1. Hex_Frame (outer perimeter border)
 * 2. Hex_Backplate (optional solid bottom backing plate)
 * 3. Flag Sections (generated via registered flag generator)
 * 4. Keychain_Ring_Attachment (optional keychain loop)
 */
export function buildFlagsKeychainParts(params: FlagsParameters): ReplicadPart[] {
  const flagType = String(params.flag_type ?? 'empty')
    .toLowerCase()
    .trim();
  const rOuter = Number(params.hex_radius ?? 20);
  const tHex = Number(params.hex_thickness ?? 2);
  const h = Number(params.height ?? 3);
  const fHex = Number(params.hex_fillet ?? 0.2);

  const hasBackplate =
    params.include_backplate !== false && String(params.include_backplate) !== 'false';
  const tBackplate = hasBackplate ? Math.min(h, Number(params.backplate_thickness ?? 1.8)) : 0;
  const fBackplate = Number(params.backplate_fillet ?? 0.2);

  const hasRing =
    params.include_keychain_ring !== false && String(params.include_keychain_ring) !== 'false';
  const tRing = Number(params.ring_thickness ?? 2);
  const fRing = Number(params.ring_fillet ?? 0.2);

  const deltaCorner = tHex / Math.sqrt(3);
  const rMidpoint = rOuter - deltaCorner;
  const rInner = Math.max(2, rMidpoint - deltaCorner);

  const parts: ReplicadPart[] = [];

  // ==========================================
  // Part 1: Hexagonal Perimeter Frame (Outer & Inner Filleted)
  // ==========================================
  const outerHex = drawPolysides(rOuter, 6);
  const innerHex = drawPolysides(rInner, 6);
  const frame2D = outerHex.cut(innerHex);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hexSketch = frame2D.sketchOnPlane('XY') as any;
  let hexSolid = hexSketch.extrude(h);

  if (fHex > 0 && fHex < 0.6) {
    try {
      // Fillet both outer and inner perimeter edges of the hex frame
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hexSolid = (hexSolid as any).fillet(fHex);
    } catch {
      // Keep unfilleted if non-manifold
    }
  }

  // ==========================================
  // Part 2: Hexagonal Backplate (if enabled)
  // ==========================================
  if (hasBackplate && tBackplate > 0) {
    // Backplate covers the inner area of the hexagon from Z=0 up to tBackplate
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const backplateSketch = innerHex.sketchOnPlane('XY') as any;
    let backplateSolid = backplateSketch.extrude(tBackplate);

    if (fBackplate > 0 && fBackplate < 0.6) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        backplateSolid = (backplateSolid as any).fillet(fBackplate);
      } catch {
        // Fallback
      }
    }

    if (backplateSolid) {
      parts.push({
        shape: backplateSolid,
        name: 'Hex_Backplate',
        color: '#f8fafc'
      });
    }
  }

  // ==========================================
  // Part 3: Flag Design (Invoked via Modular FLAG_REGISTRY)
  // ==========================================
  if (flagType !== 'empty') {
    const flagDef = FLAG_REGISTRY[flagType];
    if (flagDef && typeof flagDef.generate === 'function') {
      const zOffset = hasBackplate && tBackplate > 0 ? tBackplate : 0;
      const flagDepthParam = params.flag_depth ?? params.flag_thickness ?? params.flag_height;
      const hFlag =
        flagDepthParam !== undefined && flagDepthParam !== null
          ? Math.max(0.1, Number(flagDepthParam))
          : Math.max(0.2, h - zOffset);
      const fFlag = Number(params.flag_fillet ?? 0.2);

      const flagParts = flagDef.generate({
        innerHex,
        rInner,
        hFlag,
        zOffset,
        fFlag,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        orientation: (params.flag_orientation as any) || 'standard',
        params
      });

      parts.push(...flagParts);
    }
  }

  // Add Hex Frame to parts list
  parts.push({
    shape: hexSolid,
    name: 'Hex_Frame',
    color: '#1e3a8a'
  });

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
        // Fallback
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
  // Fuses structural base parts (frame, backplate, ring) while keeping flag parts separate
  // ==========================================
  const shouldFuse =
    params.single_part === true ||
    params.single_part === 'true' ||
    params.fuse_all_parts === true ||
    params.fuse_all_parts === 'true';

  if (shouldFuse && parts.length > 0) {
    const baseParts = parts.filter((p) => !p.name.toLowerCase().startsWith('flag_'));
    const flagParts = parts.filter((p) => p.name.toLowerCase().startsWith('flag_'));

    if (baseParts.length > 0) {
      let fusedBase = baseParts[0].shape;
      for (let i = 1; i < baseParts.length; i++) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fusedBase = (fusedBase as any).fuse(baseParts[i].shape);
        } catch {
          // Fallback
        }
      }
      return [
        {
          shape: fusedBase,
          name: 'Hex_Keychain_Base',
          color: baseParts[0].color || '#1e3a8a'
        },
        ...flagParts
      ];
    }
  }

  return parts;
}

/**
 * Builds the composite 3D Flags Keychain solid model for Three.js meshing & STL export
 */
export function buildFlagsKeychain(params: FlagsParameters): AnyShape {
  const parts = buildFlagsKeychainParts(params);
  if (parts.length === 1) return parts[0].shape;
  return makeCompound(parts.map((p) => p.shape));
}

/**
 * Computes exact geometric model dimensions for the Flags Keychain
 */
export function calculateFlagsDimensions(params: FlagsParameters): ModelDimensionItem[] {
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
      description: 'Total extruded solid height / depth'
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
 * Replicad Model Definition bundle for Flags of the World Hex Keychain
 */
export const flagsKeychainModel: ReplicadModelDefinition<FlagsParameters> = {
  id: 'flags-keychain',
  name: 'Flags of the World Keychain',
  project: 'Hex Keychain',
  partName: 'Flags of the World',
  description:
    'Customisable Flags of the World Hex Keychain with optional backplate and multi-part 3D print support.',
  tags: ['Flags', '3D Print', 'Keychain', 'Replicad', 'Instant CAD'],
  aiDisclosure: {
    modelingAiAssisted: true,
    modelNotice:
      'The 3D model generation code, parametric geometry definitions, and CAD algorithms for this model were created with AI assistance.'
  },
  links: [],
  parameters: flagsParameters,
  calculateDimensions: (params: FlagsParameters) => calculateFlagsDimensions(params),
  buildParts: (params: FlagsParameters) => buildFlagsKeychainParts(params),
  buildShape: (params: FlagsParameters) => buildFlagsKeychain(params)
};
