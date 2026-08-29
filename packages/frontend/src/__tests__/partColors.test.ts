import { describe, it, expect } from 'vitest';
import {
  formatPartName,
  resolveThemeColorForPart,
  PRESET_SWATCHES,
  THEME_PALETTES
} from '../utils/partColors';

describe('Part Colors & Palette Utilities', () => {
  it('formats internal CAD part names into clean human-readable labels', () => {
    expect(formatPartName('Kumiko_Hex_Frame')).toBe('Hex Frame');
    expect(formatPartName('Kumiko_Hex_Spokes')).toBe('Internal Spokes');
    expect(formatPartName('Kumiko_Lattice_Pattern')).toBe('Kumiko Lattice');
    expect(formatPartName('Keychain_Ring_Attachment')).toBe('Keychain Ring');
    expect(formatPartName('Kumiko_Keychain_Fused')).toBe('Unified Solid');
    expect(formatPartName('')).toBe('Main Body');
    expect(formatPartName('custom_part_one')).toBe('Custom Part One');
  });

  it('provides a valid set of modern preset swatches', () => {
    expect(PRESET_SWATCHES.length).toBeGreaterThanOrEqual(10);
    for (const color of PRESET_SWATCHES) {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('provides rich 1-click theme palettes and resolves colors accurately', () => {
    expect(THEME_PALETTES.length).toBeGreaterThanOrEqual(4);

    const classic = THEME_PALETTES.find((t) => t.id === 'classic-wood')!;
    expect(classic).toBeDefined();

    const frameColor = resolveThemeColorForPart(classic, 'Kumiko_Hex_Frame', 0);
    const patternColor = resolveThemeColorForPart(classic, 'Kumiko_Lattice_Pattern', 2);
    const fallbackColor = resolveThemeColorForPart(classic, 'unknown_component', 0);

    expect(frameColor).toBe('#92400e');
    expect(patternColor).toBe('#f59e0b');
    expect(fallbackColor).toBe('#92400e');
  });
});
