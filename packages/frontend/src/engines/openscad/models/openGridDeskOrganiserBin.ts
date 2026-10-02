import { ParameterDefinition } from '../../../types/model';
import { ModelDimensionItem } from '../../replicad/types';
import { OpenSCADModelDefinition } from '../types';
import openGridDeskOrganiserBinScad from './openGridDeskOrganiserBin.scad?raw';

export interface OpenGridDeskOrganiserBinParameters {
  grid_width?: number;
  grid_depth?: number;
  height?: number;
  outer_walls?: boolean;
  wall_thickness?: number;
  bottom_thickness?: number;
  corner_chamfer?: number;
  inner_base_radius?: number;
  tolerance?: number;
  snap_type?: 'lite' | 'normal' | string;
  dividers_x?: number;
  divider_x_position_mode?: 'auto' | 'custom' | string;
  divider_x_1_pos?: number;
  divider_x_2_pos?: number;
  divider_x_3_pos?: number;
  divider_x_4_pos?: number;
  divider_x_5_pos?: number;
  dividers_y?: number;
  divider_y_position_mode?: 'auto' | 'custom' | string;
  divider_y_1_pos?: number;
  divider_y_2_pos?: number;
  divider_y_3_pos?: number;
  divider_y_4_pos?: number;
  divider_y_5_pos?: number;
  divider_thickness?: number;
  [key: string]: unknown;
}

export const openGridDeskOrganiserBinParameters: ParameterDefinition[] = [
  {
    id: 'grid_width',
    name: 'Grid Width (X)',
    type: 'quantity',
    unit: 'units (×28mm)',
    default: 2,
    min: 1,
    max: 10,
    step: 1,
    group: 'Bin Dimensions',
    description: 'Width in standard 28mm OpenGrid units (2 units = 56 mm nominal)'
  },
  {
    id: 'grid_depth',
    name: 'Grid Depth (Y)',
    type: 'quantity',
    unit: 'units (×28mm)',
    default: 2,
    min: 1,
    max: 10,
    step: 1,
    group: 'Bin Dimensions',
    description: 'Depth in standard 28mm OpenGrid units (2 units = 56 mm nominal)'
  },
  {
    id: 'height',
    name: 'Bin Height',
    type: 'quantity',
    unit: 'millimeter',
    default: 100,
    min: 5,
    max: 150,
    step: 1,
    group: 'Bin Dimensions',
    description: 'Nominal container height in millimeters'
  },
  {
    id: 'outer_walls',
    name: 'Outer Walls',
    type: 'boolean',
    default: true,
    group: 'Wall & Base',
    description: 'Include perimeter outer walls (uncheck for flat tray / dividers-only organizer)'
  },
  {
    id: 'wall_thickness',
    name: 'Wall Thickness',
    type: 'quantity',
    unit: 'millimeter',
    default: 1.6,
    min: 1.0,
    max: 4.0,
    step: 0.2,
    group: 'Wall & Base',
    dependsOn: 'outer_walls',
    description: 'Thickness of perimeter outer walls'
  },
  {
    id: 'bottom_thickness',
    name: 'Floor Thickness',
    type: 'quantity',
    unit: 'millimeter',
    default: 2.0,
    min: 1.0,
    max: 5.0,
    step: 0.2,
    group: 'Wall & Base',
    description: 'Thickness of bottom floor above snaps'
  },
  {
    id: 'corner_chamfer',
    name: 'Corner Chamfer (45°)',
    type: 'quantity',
    unit: 'millimeter',
    default: 4.2,
    min: 0.0,
    max: 8.0,
    step: 0.2,
    group: 'Wall & Base',
    description: '45-degree corner chamfer width (OpenGrid standard: 4.2mm)'
  },
  {
    id: 'inner_base_radius',
    name: 'Inner Base Radius',
    type: 'quantity',
    unit: 'millimeter',
    default: 2.5,
    min: 0.0,
    max: 6.0,
    step: 0.5,
    group: 'Wall & Base',
    description: 'Radius of rounded transition (scoop) from inner base floor to walls'
  },
  {
    id: 'tolerance',
    name: 'Grid Clearance',
    type: 'quantity',
    unit: 'millimeter',
    default: 0.5,
    min: 0.0,
    max: 2.0,
    step: 0.1,
    group: 'Wall & Base',
    description: 'Clearance gap ensuring adjacent bins on grid fit smoothly'
  },
  {
    id: 'snap_type',
    name: 'Snap Type',
    type: 'enum',
    widget: 'segmented',
    default: 'lite',
    group: 'Snap Base',
    options: [
      { value: 'lite', label: 'Snap Lite (3.4mm)' },
      { value: 'normal', label: 'Normal Snap (6.8mm)' }
    ],
    description:
      'Bottom OpenGrid snap connector profile: low-profile Snap Lite (3.4mm) or standard Normal Snap (6.8mm)'
  },
  {
    id: 'dividers_x',
    name: 'Columns (X Dividers)',
    type: 'quantity',
    unit: 'dividers',
    default: 0,
    min: 0,
    max: 5,
    step: 1,
    group: 'Internal Dividers',
    description: 'Number of vertical internal dividers creating compartments along X'
  },
  {
    id: 'divider_x_position_mode',
    name: 'X Divider Spacing',
    type: 'enum',
    widget: 'segmented',
    default: 'auto',
    group: 'Internal Dividers',
    dependsOn: 'dividers_x>0',
    options: [
      { value: 'auto', label: 'Even / Auto' },
      { value: 'custom', label: 'Custom' }
    ],
    description: 'Auto-space vertical dividers evenly or specify custom millimeter positions'
  },
  {
    id: 'divider_x_1_pos',
    name: 'Divider 1 Position (X)',
    type: 'quantity',
    unit: 'millimeter',
    default: 0,
    min: 0,
    max: 400,
    step: 1,
    group: 'Internal Dividers',
    dependsOn: 'dividers_x>=1&divider_x_position_mode=custom',
    description: 'Position from left inner wall in mm (0 = at edge)'
  },
  {
    id: 'divider_x_2_pos',
    name: 'Divider 2 Position (X)',
    type: 'quantity',
    unit: 'millimeter',
    default: 0,
    min: 0,
    max: 400,
    step: 1,
    group: 'Internal Dividers',
    dependsOn: 'dividers_x>=2&divider_x_position_mode=custom',
    description: 'Position from left inner wall in mm (0 = at edge)'
  },
  {
    id: 'divider_x_3_pos',
    name: 'Divider 3 Position (X)',
    type: 'quantity',
    unit: 'millimeter',
    default: 0,
    min: 0,
    max: 400,
    step: 1,
    group: 'Internal Dividers',
    dependsOn: 'dividers_x>=3&divider_x_position_mode=custom',
    description: 'Position from left inner wall in mm (0 = at edge)'
  },
  {
    id: 'divider_x_4_pos',
    name: 'Divider 4 Position (X)',
    type: 'quantity',
    unit: 'millimeter',
    default: 0,
    min: 0,
    max: 400,
    step: 1,
    group: 'Internal Dividers',
    dependsOn: 'dividers_x>=4&divider_x_position_mode=custom',
    description: 'Position from left inner wall in mm (0 = at edge)'
  },
  {
    id: 'divider_x_5_pos',
    name: 'Divider 5 Position (X)',
    type: 'quantity',
    unit: 'millimeter',
    default: 0,
    min: 0,
    max: 400,
    step: 1,
    group: 'Internal Dividers',
    dependsOn: 'dividers_x>=5&divider_x_position_mode=custom',
    description: 'Position from left inner wall in mm (0 = at edge)'
  },
  {
    id: 'dividers_y',
    name: 'Rows (Y Dividers)',
    type: 'quantity',
    unit: 'dividers',
    default: 0,
    min: 0,
    max: 5,
    step: 1,
    group: 'Internal Dividers',
    description: 'Number of horizontal internal dividers creating compartments along Y'
  },
  {
    id: 'divider_y_position_mode',
    name: 'Y Divider Spacing',
    type: 'enum',
    widget: 'segmented',
    default: 'auto',
    group: 'Internal Dividers',
    dependsOn: 'dividers_y>0',
    options: [
      { value: 'auto', label: 'Even / Auto' },
      { value: 'custom', label: 'Custom' }
    ],
    description: 'Auto-space horizontal dividers evenly or specify custom millimeter positions'
  },
  {
    id: 'divider_y_1_pos',
    name: 'Divider 1 Position (Y)',
    type: 'quantity',
    unit: 'millimeter',
    default: 0,
    min: 0,
    max: 400,
    step: 1,
    group: 'Internal Dividers',
    dependsOn: 'dividers_y>=1&divider_y_position_mode=custom',
    description: 'Position from front inner wall in mm (0 = at edge)'
  },
  {
    id: 'divider_y_2_pos',
    name: 'Divider 2 Position (Y)',
    type: 'quantity',
    unit: 'millimeter',
    default: 0,
    min: 0,
    max: 400,
    step: 1,
    group: 'Internal Dividers',
    dependsOn: 'dividers_y>=2&divider_y_position_mode=custom',
    description: 'Position from front inner wall in mm (0 = at edge)'
  },
  {
    id: 'divider_y_3_pos',
    name: 'Divider 3 Position (Y)',
    type: 'quantity',
    unit: 'millimeter',
    default: 0,
    min: 0,
    max: 400,
    step: 1,
    group: 'Internal Dividers',
    dependsOn: 'dividers_y>=3&divider_y_position_mode=custom',
    description: 'Position from front inner wall in mm (0 = at edge)'
  },
  {
    id: 'divider_y_4_pos',
    name: 'Divider 4 Position (Y)',
    type: 'quantity',
    unit: 'millimeter',
    default: 0,
    min: 0,
    max: 400,
    step: 1,
    group: 'Internal Dividers',
    dependsOn: 'dividers_y>=4&divider_y_position_mode=custom',
    description: 'Position from front inner wall in mm (0 = at edge)'
  },
  {
    id: 'divider_y_5_pos',
    name: 'Divider 5 Position (Y)',
    type: 'quantity',
    unit: 'millimeter',
    default: 0,
    min: 0,
    max: 400,
    step: 1,
    group: 'Internal Dividers',
    dependsOn: 'dividers_y>=5&divider_y_position_mode=custom',
    description: 'Position from front inner wall in mm (0 = at edge)'
  },
  {
    id: 'divider_thickness',
    name: 'Divider Thickness',
    type: 'quantity',
    unit: 'millimeter',
    default: 1.2,
    min: 0.8,
    max: 3.0,
    step: 0.2,
    group: 'Internal Dividers',
    description: 'Thickness of internal divider walls'
  }
];

export function calculateOpenGridDeskOrganiserBinDimensions(
  params: OpenGridDeskOrganiserBinParameters
): ModelDimensionItem[] {
  const gridW = Number(params.grid_width ?? 2);
  const gridD = Number(params.grid_depth ?? 2);
  const h = Number(params.height ?? 100);
  const wall = Number(params.wall_thickness ?? 1.6);
  const floor = Number(params.bottom_thickness ?? 2.0);
  const tol = Number(params.tolerance ?? 0.5);
  const snapType = params.snap_type === 'normal' ? 'normal' : 'lite';
  const snapHeight = snapType === 'normal' ? 6.8 : 3.4;
  const divX = Number(params.dividers_x ?? 0);
  const divY = Number(params.dividers_y ?? 0);
  const hasWalls = params.outer_walls !== false;

  const outerW = gridW * 28 - tol;
  const outerD = gridD * 28 - tol;
  const innerW = hasWalls ? Math.max(0, outerW - wall * 2) : outerW;
  const innerD = hasWalls ? Math.max(0, outerD - wall * 2) : outerD;
  const innerH = hasWalls || divX > 0 || divY > 0 ? Math.max(0, h - floor) : 0;
  const effHeight = hasWalls || divX > 0 || divY > 0 ? h : floor;

  const totalH = effHeight + snapHeight;
  const snapCount = gridW * gridD;
  const compartmentCount = (divX + 1) * (divY + 1);
  const approxVolumeCm3 = (innerW * innerD * innerH) / 1000;

  return [
    {
      id: 'outer_width',
      label: 'Outer Width (X)',
      value: Number(outerW.toFixed(1)),
      unit: 'mm',
      formatted: `${outerW.toFixed(1)} mm (${gridW}u)`,
      description: 'Overall outer width across OpenGrid units'
    },
    {
      id: 'outer_depth',
      label: 'Outer Depth (Y)',
      value: Number(outerD.toFixed(1)),
      unit: 'mm',
      formatted: `${outerD.toFixed(1)} mm (${gridD}u)`,
      description: 'Overall outer depth across OpenGrid units'
    },
    {
      id: 'bin_height',
      label: hasWalls ? 'Bin Height' : divX > 0 || divY > 0 ? 'Divider Height' : 'Platform Height',
      value: Number(effHeight.toFixed(1)),
      unit: 'mm',
      formatted: `${effHeight.toFixed(1)} mm`,
      description: hasWalls
        ? 'Nominal container wall height above grid base'
        : divX > 0 || divY > 0
          ? 'Divider wall height above grid base'
          : 'Flat baseplate floor thickness'
    },
    {
      id: 'total_height',
      label: 'Total Height with Snaps',
      value: Number(totalH.toFixed(1)),
      unit: 'mm',
      formatted: `${totalH.toFixed(1)} mm`,
      description: `Total vertical height including bottom OpenGrid ${snapType === 'normal' ? 'Normal (6.8mm)' : 'Lite (3.4mm)'} snaps`
    },
    {
      id: 'snap_count',
      label: 'OpenGrid Snaps',
      value: snapCount,
      unit: 'snaps',
      formatted: `${snapCount} snaps (${gridW} × ${gridD}, ${snapType === 'normal' ? 'Normal' : 'Lite'})`,
      description: `Evenly spaced bottom OpenGrid ${snapType === 'normal' ? 'Normal' : 'Lite'} connector snaps`
    },
    {
      id: 'compartments',
      label: 'Compartments',
      value: compartmentCount,
      unit: 'cells',
      formatted:
        compartmentCount > 1
          ? `${compartmentCount} cells (${divX + 1} col × ${divY + 1} row)`
          : '1 cell (open bin)',
      description: 'Internal storage cell division'
    },
    {
      id: 'internal_volume',
      label: 'Internal Volume',
      value: Number(approxVolumeCm3.toFixed(1)),
      unit: 'cm³',
      formatted: `${approxVolumeCm3.toFixed(1)} cm³`,
      description: 'Approximate internal storage capacity'
    },
    {
      id: 'corner_chamfer',
      label: 'Corner Chamfer',
      value: Number(Number(params.corner_chamfer ?? 4.2).toFixed(1)),
      unit: 'mm',
      formatted: `${Number(params.corner_chamfer ?? 4.2).toFixed(1)} mm (45°)`,
      description: '45-degree outer corner chamfer size'
    },
    {
      id: 'inner_base_radius',
      label: 'Inner Base Radius',
      value: Number(Number(params.inner_base_radius ?? 2.5).toFixed(1)),
      unit: 'mm',
      formatted: `${Number(params.inner_base_radius ?? 2.5).toFixed(1)} mm`,
      description: 'Radius of rounded transition from inner base to walls'
    }
  ];
}

export function calculateOpenGridDeskOrganiserBinDynamicConstraints(
  params: Record<string, any>
): Record<string, { min?: number; max?: number }> {
  const gridW = Number(params.grid_width ?? 2);
  const gridD = Number(params.grid_depth ?? 2);
  const wall = Number(params.wall_thickness ?? 1.6);
  const tol = Number(params.tolerance ?? 0.5);
  const hasWalls = params.outer_walls !== false;

  const outerW = gridW * 28 - tol;
  const outerD = gridD * 28 - tol;
  const innerW = Math.max(1, Math.floor(hasWalls ? outerW - wall * 2 : outerW));
  const innerD = Math.max(1, Math.floor(hasWalls ? outerD - wall * 2 : outerD));

  return {
    divider_x_1_pos: { min: 0, max: innerW },
    divider_x_2_pos: { min: 0, max: innerW },
    divider_x_3_pos: { min: 0, max: innerW },
    divider_x_4_pos: { min: 0, max: innerW },
    divider_x_5_pos: { min: 0, max: innerW },
    divider_y_1_pos: { min: 0, max: innerD },
    divider_y_2_pos: { min: 0, max: innerD },
    divider_y_3_pos: { min: 0, max: innerD },
    divider_y_4_pos: { min: 0, max: innerD },
    divider_y_5_pos: { min: 0, max: innerD }
  };
}

type BinModelDef = OpenSCADModelDefinition<OpenGridDeskOrganiserBinParameters>;

export const openGridDeskOrganiserBinModel: BinModelDef = {
  id: 'opengrid-desk-organiser-bin',
  name: 'OpenGrid Desk Organiser Bin',
  project: 'OpenGrid Desk Organiser',
  partName: 'Bin',
  description:
    'Customisable OpenGrid desk organiser bin with evenly spaced OpenGrid Snap Lite connectors on the bottom.',
  tags: ['OpenGrid', 'Desk Organiser', 'Bin', 'Storage', 'OpenSCAD', 'Parametric', '3D Print'],
  parameters: openGridDeskOrganiserBinParameters,
  scadContent: openGridDeskOrganiserBinScad,
  calculateDimensions: (params) => calculateOpenGridDeskOrganiserBinDimensions(params),
  calculateDynamicConstraints: (params) =>
    calculateOpenGridDeskOrganiserBinDynamicConstraints(params)
};
