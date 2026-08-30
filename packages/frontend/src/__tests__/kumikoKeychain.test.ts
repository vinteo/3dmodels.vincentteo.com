import { describe, it, expect, beforeAll } from 'vitest';
import {
  getMidpoint,
  getOneThirdPoint,
  getPointAtFraction,
  rotatePoint2D,
  createSectorPattern,
  buildKumikoKeychainParts,
  defaultKumikoParameters,
  kumikoParameters,
  calculateKumikoDimensions,
  kumikoKeychainModel,
  KUMIKO_PATTERNS,
  KUMIKO_PATTERN_OPTIONS,
  KUMIKO_ROTATION_OPTIONS,
  getKumikoPatternOptions,
  registerKumikoPattern,
  Triangle2D,
  Point2D
} from '../engines/replicad/models/kumikoKeychain';
import { ensureReplicadReady } from '../engines/replicad/occt';

describe('Kumiko Keychain Geometry & 120° Solid Rotation', () => {
  beforeAll(async () => {
    await ensureReplicadReady();
  });

  it('builds complete assembly from defaultKumikoParameters and model definition', () => {
    expect(defaultKumikoParameters).toBeDefined();
    expect(defaultKumikoParameters.hex_radius).toBe(20);

    const partsFromDefaults = buildKumikoKeychainParts(defaultKumikoParameters);
    expect(partsFromDefaults.length).toBeGreaterThanOrEqual(3);

    const partsFromModel = kumikoKeychainModel.buildParts(defaultKumikoParameters);
    expect(partsFromModel.length).toBe(partsFromDefaults.length);
  });

  it('calculates the midpoint between two 2D points accurately', () => {
    const p1: Point2D = [0, 10];
    const p2: Point2D = [20, 30];
    const mid = getMidpoint(p1, p2);
    expect(mid[0]).toBe(10);
    expect(mid[1]).toBe(20);
  });

  it('calculates the 1/3 distance between two 2D points accurately', () => {
    const p1: Point2D = [0, 0];
    const p2: Point2D = [30, 60];
    const oneThird = getOneThirdPoint(p1, p2);
    expect(oneThird[0]).toBeCloseTo(10, 4);
    expect(oneThird[1]).toBeCloseTo(20, 4);

    const fraction = getPointAtFraction(p1, p2, 1 / 3);
    expect(fraction[0]).toBeCloseTo(10, 4);
    expect(fraction[1]).toBeCloseTo(20, 4);
  });

  it('rotates a 2D point around a center point accurately', () => {
    const center: Point2D = [10, 10];
    const point: Point2D = [20, 10]; // 10 units to the right

    // 0° rotation
    const rot0 = rotatePoint2D(point, center, 0);
    expect(rot0[0]).toBeCloseTo(20, 4);
    expect(rot0[1]).toBeCloseTo(10, 4);

    // 120° rotation (2π/3)
    const rot120 = rotatePoint2D(point, center, (2 * Math.PI) / 3);
    expect(rot120[0]).toBeCloseTo(10 + 10 * Math.cos((2 * Math.PI) / 3), 4);
    expect(rot120[1]).toBeCloseTo(10 + 10 * Math.sin((2 * Math.PI) / 3), 4);

    // 360° rotation (2π) brings it back
    const rot360 = rotatePoint2D(point, center, 2 * Math.PI);
    expect(rot360[0]).toBeCloseTo(20, 4);
    expect(rot360[1]).toBeCloseTo(10, 4);
  });

  it('generates rotated 3D pattern solids for 0°, 120°, and 240° rotations', () => {
    const spokeTriangle: Triangle2D = [
      [0, 0],
      [20 * Math.cos(Math.PI / 6), 20 * Math.sin(Math.PI / 6)],
      [20 * Math.cos(Math.PI / 2), 20 * Math.sin(Math.PI / 2)]
    ];

    const innerTriangle: Triangle2D = [
      [2 * Math.cos(Math.PI / 3), 2 * Math.sin(Math.PI / 3)],
      [18 * Math.cos(Math.PI / 6), 18 * Math.sin(Math.PI / 6)],
      [18 * Math.cos(Math.PI / 2), 18 * Math.sin(Math.PI / 2)]
    ];

    // Test Asa-no-ha (Pattern 1) under 0, 120, 240
    for (const rot of ['0', '120', '240']) {
      const solid = createSectorPattern('1', spokeTriangle, innerTriangle, 1.0, 2.0, rot);
      expect(solid).not.toBeNull();
    }

    // Test Ryuso Asa-no-ha (Pattern 2) under 0, 120, 240
    for (const rot of ['0', '120', '240']) {
      const solid = createSectorPattern('2', spokeTriangle, innerTriangle, 1.0, 2.0, rot);
      expect(solid).not.toBeNull();
    }

    // Test Asa-no-ha Variant (Pattern 3) under 0, 120, 240
    for (const rot of ['0', '120', '240']) {
      const solid = createSectorPattern('3', spokeTriangle, innerTriangle, 1.0, 2.0, rot);
      expect(solid).not.toBeNull();
    }

    // Test Rindo Asa-no-ha (Pattern 4) under 0, 120, 240
    for (const rot of ['0', '120', '240']) {
      const solid = createSectorPattern('4', spokeTriangle, innerTriangle, 1.0, 2.0, rot);
      expect(solid).not.toBeNull();
    }

    // Pattern 0 (Empty) returns null
    const emptySolid = createSectorPattern('0', spokeTriangle, innerTriangle, 1.0, 2.0, 0);
    expect(emptySolid).toBeNull();
  });

  it('builds complete watertight Kumiko Keychain assembly with distinct rotated sections', () => {
    const parts = buildKumikoKeychainParts({
      hex_radius: 20,
      hex_thickness: 2,
      hex_spoke_thickness: 2,
      hex_design_thickness: 1,
      height: 2,
      include_keychain_ring: true,
      section_1: '1',
      section_1_rotation: '0',
      section_2: '2',
      section_2_rotation: '120',
      section_3: '1',
      section_3_rotation: '240',
      section_4: '2',
      section_4_rotation: '0',
      section_5: '1',
      section_5_rotation: '120',
      section_6: '2',
      section_6_rotation: '240'
    });

    expect(parts.length).toBeGreaterThanOrEqual(3);
    const names = parts.map((p) => p.name);
    expect(names).toContain('Kumiko_Hex_Frame');
    expect(names).toContain('Kumiko_Hex_Spokes');
    expect(names).toContain('Kumiko_Lattice_Pattern');
    expect(names).toContain('Keychain_Ring_Attachment');
  });

  it('fuses all solids into a single part when single_part is true', () => {
    const parts = buildKumikoKeychainParts({
      hex_radius: 20,
      hex_thickness: 2,
      hex_spoke_thickness: 2,
      hex_design_thickness: 1,
      height: 2,
      include_keychain_ring: true,
      single_part: true,
      section_1: '1',
      section_2: '2',
      section_3: '3',
      section_4: '4',
      section_5: '1',
      section_6: '2'
    });

    expect(parts.length).toBe(1);
    expect(parts[0].name).toBe('Kumiko_Keychain_Fused');
    expect(parts[0].shape).toBeDefined();
  });

  it('calculates exact model dimensions including vertex-to-vertex, side-to-side, height, and ring length', () => {
    const dimensionsWithRing = calculateKumikoDimensions({
      hex_radius: 20,
      height: 3,
      include_keychain_ring: true,
      ring_thickness: 2
    });

    expect(dimensionsWithRing).toHaveLength(4);

    const v2v = dimensionsWithRing.find((d) => d.id === 'vertex_to_vertex');
    expect(v2v?.value).toBe(40);
    expect(v2v?.formatted).toBe('40.0 mm');

    const s2s = dimensionsWithRing.find((d) => d.id === 'side_to_side');
    expect(s2s?.value).toBeCloseTo(34.64, 1);
    expect(s2s?.formatted).toBe('34.6 mm');

    const h = dimensionsWithRing.find((d) => d.id === 'height');
    expect(h?.value).toBe(3);
    expect(h?.formatted).toBe('3.0 mm');

    const fullLengthWithRing = dimensionsWithRing.find((d) => d.id === 'full_length');
    expect(fullLengthWithRing?.value).toBe(48.5);
    expect(fullLengthWithRing?.formatted).toBe('48.5 mm');

    // Without ring, full length equals vertex-to-vertex
    const dimensionsWithoutRing = calculateKumikoDimensions({
      hex_radius: 20,
      height: 3,
      include_keychain_ring: false
    });
    const fullLengthWithoutRing = dimensionsWithoutRing.find((d) => d.id === 'full_length');
    expect(fullLengthWithoutRing?.value).toBe(40);
  });

  it('derives section parameter options from KUMIKO_PATTERN_REGISTRY', () => {
    expect(KUMIKO_PATTERNS.length).toBeGreaterThanOrEqual(5);

    const patternOptions = getKumikoPatternOptions();
    expect(patternOptions).toEqual(KUMIKO_PATTERN_OPTIONS);
    expect(patternOptions.map((o) => o.value)).toEqual(['0', '1', '2', '3', '4']);
    expect(patternOptions.map((o) => o.label)).toEqual([
      'Empty',
      'Asa-no-ha (Hemp Leaf)',
      'Ryuso Asa-no-ha',
      'Asa-no-ha Variant',
      'Rindo Asa-no-ha (Bellflower)'
    ]);

    // Check that section parameters (1 to 6) all use the registry options
    for (let s = 1; s <= 6; s++) {
      const sectionParam = kumikoParameters.find((p) => p.id === `section_${s}`);
      expect(sectionParam).toBeDefined();
      expect(sectionParam?.options).toBe(KUMIKO_PATTERN_OPTIONS);

      const rotParam = kumikoParameters.find((p) => p.id === `section_${s}_rotation`);
      expect(rotParam).toBeDefined();
      expect(rotParam?.options).toBe(KUMIKO_ROTATION_OPTIONS);
    }
  });

  it('allows registering new custom patterns dynamically into the registry', () => {
    const dummyGenerator = () => null;

    registerKumikoPattern({
      id: 'custom-flower',
      name: 'Custom Flower Pattern',
      generator: dummyGenerator,
      aliases: ['flower']
    });

    const spokeTriangle: Triangle2D = [
      [0, 0],
      [20, 0],
      [20, 20]
    ];
    const innerTriangle: Triangle2D = [
      [2, 2],
      [18, 2],
      [18, 18]
    ];

    // createSectorPattern should find and execute custom-flower without error
    const result = createSectorPattern('custom-flower', spokeTriangle, innerTriangle, 1, 2, 0);
    expect(result).toBeNull(); // dummyGenerator returns null

    // Alias lookup
    const aliasResult = createSectorPattern('flower', spokeTriangle, innerTriangle, 1, 2, 0);
    expect(aliasResult).toBeNull();
  });
});
