/**
 * Utilities and presets for customizing 3D preview part colors
 */

export interface ThemePalette {
  id: string;
  name: string;
  description: string;
  icon: string;
  // Map of part name pattern / substring to hex color
  colors: Record<string, string>;
  // Fallback sequential colors if part name is not explicitly mapped
  fallback: string[];
}

/**
 * Curated palette swatches for quick color picking
 */
export const PRESET_SWATCHES: string[] = [
  '#f59e0b', // Amber / Warm Wood
  '#d97706', // Cedar / Honey
  '#92400e', // Dark Walnut
  '#3b82f6', // Electric Blue
  '#06b6d4', // Neon Cyan
  '#10b981', // Emerald Green
  '#84cc16', // Lime Green
  '#a855f7', // Cyber Purple
  '#ec4899', // Sakura Pink
  '#ef4444', // Crimson Red
  '#eab308', // Gold Accent
  '#f8fafc', // Titanium White
  '#94a3b8', // Cool Slate
  '#1e293b', // Deep Obsidian
  '#0f172a'  // Midnight Black
];

/**
 * Curated 1-click theme palettes
 */
export const THEME_PALETTES: ThemePalette[] = [
  {
    id: 'classic-wood',
    name: 'Classic Kumiko',
    description: 'Natural cedar, warm amber, and dark walnut woodwork tones',
    icon: '🪵',
    colors: {
      hex_frame: '#92400e',
      internal_spokes: '#b45309',
      kumiko_lattice_pattern: '#f59e0b',
      keychain_ring_attachment: '#78350f',
      fused: '#d97706',
      default: '#d97706'
    },
    fallback: ['#92400e', '#b45309', '#f59e0b', '#78350f']
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    description: 'Vibrant neon cyan, violet, and electric glow',
    icon: '🌌',
    colors: {
      hex_frame: '#3b82f6',
      internal_spokes: '#10b981',
      kumiko_lattice_pattern: '#f59e0b',
      keychain_ring_attachment: '#a855f7',
      fused: '#6366f1',
      default: '#3b82f6'
    },
    fallback: ['#3b82f6', '#10b981', '#f59e0b', '#a855f7']
  },
  {
    id: 'obsidian-gold',
    name: 'Obsidian & Gold',
    description: 'Sleek luxury dark titanium with polished gold lattice',
    icon: '👑',
    colors: {
      hex_frame: '#1e293b',
      internal_spokes: '#334155',
      kumiko_lattice_pattern: '#eab308',
      keychain_ring_attachment: '#f59e0b',
      fused: '#1e293b',
      default: '#eab308'
    },
    fallback: ['#1e293b', '#334155', '#eab308', '#f59e0b']
  },
  {
    id: 'sakura',
    name: 'Sakura Bloom',
    description: 'Soft cherry blossom pink, ruby red, and rose gold',
    icon: '🌸',
    colors: {
      hex_frame: '#fda4af',
      internal_spokes: '#f43f5e',
      kumiko_lattice_pattern: '#e11d48',
      keychain_ring_attachment: '#be123c',
      fused: '#fb7185',
      default: '#f43f5e'
    },
    fallback: ['#fda4af', '#f43f5e', '#e11d48', '#be123c']
  },
  {
    id: 'minimalist-mono',
    name: 'Mono Titanium',
    description: 'Crisp architectural monochrome and cool slate',
    icon: '🤍',
    colors: {
      hex_frame: '#475569',
      internal_spokes: '#64748b',
      kumiko_lattice_pattern: '#e2e8f0',
      keychain_ring_attachment: '#334155',
      fused: '#94a3b8',
      default: '#e2e8f0'
    },
    fallback: ['#475569', '#64748b', '#e2e8f0', '#334155']
  }
];

/**
 * Formats internal CAD part names into clean, user-friendly labels
 */
export function formatPartName(rawName: string): string {
  if (!rawName) return 'Main Body';

  const normalized = rawName.toLowerCase().replace(/[_-]/g, ' ').trim();

  if (normalized.includes('hex') && normalized.includes('frame')) {
    return 'Hex Frame';
  }
  if (normalized.includes('spoke')) {
    return 'Internal Spokes';
  }
  if (normalized.includes('lattice') || normalized.includes('pattern')) {
    return 'Kumiko Lattice';
  }
  if (normalized.includes('ring')) {
    return 'Keychain Ring';
  }
  if (normalized.includes('fused') || normalized.includes('single')) {
    return 'Unified Solid';
  }

  // Capitalize each word
  return rawName
    .replace(/[_-]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Resolves a palette color for a given part name in a theme
 */
export function resolveThemeColorForPart(theme: ThemePalette, partName: string, index: number): string {
  const norm = partName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  for (const [key, color] of Object.entries(theme.colors)) {
    if (norm.includes(key) || key.includes(norm)) {
      return color;
    }
  }
  return theme.fallback[index % theme.fallback.length] || theme.colors.default || '#3b82f6';
}
