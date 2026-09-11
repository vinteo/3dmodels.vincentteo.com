import { ParameterDefinition } from '../../../types/model';
import { ModelDimensionItem } from '../../replicad/types';
import { OpenSCADModelDefinition } from '../types';
import openGridDisplayCaseShellScad from './openGridDisplayCaseShell.scad?raw';

export interface OpenGridDisplayCaseShellParameters {
  dimension_mode?: 'grid' | 'custom' | string;
  grid_width?: number;
  grid_height?: number;
  custom_width?: number;
  custom_height?: number;
  width?: number;
  height?: number;
  depth?: number;
  wall_thickness?: number;
  back_thickness?: number;
  connector_offset?: number;
  // Horizontal Dividers
  h_divider_count?: number;
  h_divider_thickness?: number;
  h_divider_depth?: number;
  h_divider_1_pos?: number;
  h_divider_2_pos?: number;
  h_divider_3_pos?: number;
  h_divider_4_pos?: number;
  h_divider_5_pos?: number;
  // Vertical Dividers
  v_divider_count?: number;
  v_divider_thickness?: number;
  v_divider_depth?: number;
  v_divider_1_pos?: number;
  v_divider_2_pos?: number;
  v_divider_3_pos?: number;
  v_divider_4_pos?: number;
  v_divider_5_pos?: number;
  [key: string]: unknown;
}

export const openGridDisplayCaseShellParameters: ParameterDefinition[] = [
  {
    id: 'dimension_mode',
    name: 'Sizing Mode',
    type: 'enum',
    widget: 'segmented',
    default: 'grid',
    group: 'Shell Dimensions',
    options: [
      { value: 'grid', label: 'OpenGrid Units (28mm)' },
      { value: 'custom', label: 'Custom (mm)' }
    ],
    description: 'Adjust size via standard 28mm OpenGrid units or arbitrary millimeter dimensions'
  },
  {
    id: 'grid_width',
    name: 'Grid Width (X)',
    type: 'quantity',
    unit: 'units (×28mm)',
    default: 6,
    min: 1,
    max: 15,
    step: 1,
    group: 'Shell Dimensions',
    dependsOn: 'dimension_mode=grid',
    description: 'Width in standard 28mm OpenGrid units (6 units = 168 mm)'
  },
  {
    id: 'grid_height',
    name: 'Grid Height (Y)',
    type: 'quantity',
    unit: 'units (×28mm)',
    default: 4,
    min: 1,
    max: 15,
    step: 1,
    group: 'Shell Dimensions',
    dependsOn: 'dimension_mode=grid',
    description: 'Height in standard 28mm OpenGrid units (4 units = 112 mm)'
  },
  {
    id: 'custom_width',
    name: 'Custom Width',
    type: 'quantity',
    unit: 'millimeter',
    default: 168,
    min: 50,
    max: 420,
    step: 1,
    group: 'Shell Dimensions',
    dependsOn: 'dimension_mode=custom',
    description: 'Arbitrary outer width in millimeters'
  },
  {
    id: 'custom_height',
    name: 'Custom Height',
    type: 'quantity',
    unit: 'millimeter',
    default: 112,
    min: 50,
    max: 420,
    step: 1,
    group: 'Shell Dimensions',
    dependsOn: 'dimension_mode=custom',
    description: 'Arbitrary outer height in millimeters'
  },
  {
    id: 'depth',
    name: 'Shell Depth',
    type: 'quantity',
    unit: 'millimeter',
    default: 32,
    min: 8,
    max: 150,
    step: 1,
    group: 'Shell Dimensions',
    description: 'Total outer depth of the display case shell (Z axis)'
  },
  {
    id: 'wall_thickness',
    name: 'Wall Thickness',
    type: 'quantity',
    unit: 'millimeter',
    default: 5,
    min: 5,
    max: 15,
    step: 0.5,
    group: 'Shell Walls',
    description: 'Perimeter side wall thickness'
  },
  {
    id: 'back_thickness',
    name: 'Back Wall Thickness',
    type: 'quantity',
    unit: 'millimeter',
    default: 1,
    min: 0.8,
    max: 8,
    step: 0.2,
    group: 'Shell Walls',
    description: 'Thickness of the rear backing wall'
  },
  {
    id: 'connector_offset',
    name: 'Connector Offset / Clearance',
    type: 'quantity',
    unit: 'millimeter',
    default: 0.1,
    min: 0,
    max: 0.3,
    step: 0.05,
    group: 'Cutoffs & Connectors',
    description: 'Clearance offset for corner connector cutoffs'
  },

  // Horizontal Dividers (Shelves along X axis dividing Y)
  {
    id: 'h_divider_count',
    name: 'Horizontal Dividers',
    type: 'quantity',
    unit: 'dividers',
    default: 0,
    min: 0,
    max: 5,
    step: 1,
    group: 'Horizontal Dividers',
    description: 'Number of horizontal divider shelves across the display case (0 to 5)'
  },
  {
    id: 'h_divider_thickness',
    name: 'Shelf Thickness',
    type: 'quantity',
    unit: 'millimeter',
    default: 3,
    min: 1,
    max: 10,
    step: 0.5,
    group: 'Horizontal Dividers',
    dependsOn: 'h_divider_count>0',
    description: 'Thickness of horizontal divider shelves'
  },
  {
    id: 'h_divider_1_pos',
    name: 'Shelf 1 Position (Y)',
    type: 'quantity',
    unit: 'millimeter',
    default: 0,
    min: 0,
    max: 400,
    step: 1,
    group: 'Horizontal Dividers',
    dependsOn: 'h_divider_count>=1',
    description: 'Position from bottom inner wall in mm (0 = auto-space evenly)'
  },
  {
    id: 'h_divider_1_depth',
    name: 'Shelf 1 Depth',
    type: 'quantity',
    unit: 'millimeter',
    default: 32,
    min: 5,
    max: 150,
    step: 1,
    group: 'Horizontal Dividers',
    dependsOn: 'h_divider_count>=1',
    description: 'Depth of Shelf 1 (clamped to max of shell depth/height)'
  },
  {
    id: 'h_divider_2_pos',
    name: 'Shelf 2 Position (Y)',
    type: 'quantity',
    unit: 'millimeter',
    default: 0,
    min: 0,
    max: 400,
    step: 1,
    group: 'Horizontal Dividers',
    dependsOn: 'h_divider_count>=2',
    description: 'Position from bottom inner wall in mm (0 = auto-space evenly)'
  },
  {
    id: 'h_divider_2_depth',
    name: 'Shelf 2 Depth',
    type: 'quantity',
    unit: 'millimeter',
    default: 32,
    min: 5,
    max: 150,
    step: 1,
    group: 'Horizontal Dividers',
    dependsOn: 'h_divider_count>=2',
    description: 'Depth of Shelf 2 (clamped to max of shell depth/height)'
  },
  {
    id: 'h_divider_3_pos',
    name: 'Shelf 3 Position (Y)',
    type: 'quantity',
    unit: 'millimeter',
    default: 0,
    min: 0,
    max: 400,
    step: 1,
    group: 'Horizontal Dividers',
    dependsOn: 'h_divider_count>=3',
    description: 'Position from bottom inner wall in mm (0 = auto-space evenly)'
  },
  {
    id: 'h_divider_3_depth',
    name: 'Shelf 3 Depth',
    type: 'quantity',
    unit: 'millimeter',
    default: 32,
    min: 5,
    max: 150,
    step: 1,
    group: 'Horizontal Dividers',
    dependsOn: 'h_divider_count>=3',
    description: 'Depth of Shelf 3 (clamped to max of shell depth/height)'
  },
  {
    id: 'h_divider_4_pos',
    name: 'Shelf 4 Position (Y)',
    type: 'quantity',
    unit: 'millimeter',
    default: 0,
    min: 0,
    max: 400,
    step: 1,
    group: 'Horizontal Dividers',
    dependsOn: 'h_divider_count>=4',
    description: 'Position from bottom inner wall in mm (0 = auto-space evenly)'
  },
  {
    id: 'h_divider_4_depth',
    name: 'Shelf 4 Depth',
    type: 'quantity',
    unit: 'millimeter',
    default: 32,
    min: 5,
    max: 150,
    step: 1,
    group: 'Horizontal Dividers',
    dependsOn: 'h_divider_count>=4',
    description: 'Depth of Shelf 4 (clamped to max of shell depth/height)'
  },
  {
    id: 'h_divider_5_pos',
    name: 'Shelf 5 Position (Y)',
    type: 'quantity',
    unit: 'millimeter',
    default: 0,
    min: 0,
    max: 400,
    step: 1,
    group: 'Horizontal Dividers',
    dependsOn: 'h_divider_count>=5',
    description: 'Position from bottom inner wall in mm (0 = auto-space evenly)'
  },
  {
    id: 'h_divider_5_depth',
    name: 'Shelf 5 Depth',
    type: 'quantity',
    unit: 'millimeter',
    default: 32,
    min: 5,
    max: 150,
    step: 1,
    group: 'Horizontal Dividers',
    dependsOn: 'h_divider_count>=5',
    description: 'Depth of Shelf 5 (clamped to max of shell depth/height)'
  },

  // Vertical Dividers (Walls along Y axis dividing X)
  {
    id: 'v_divider_count',
    name: 'Vertical Dividers',
    type: 'quantity',
    unit: 'dividers',
    default: 0,
    min: 0,
    max: 5,
    step: 1,
    group: 'Vertical Dividers',
    description: 'Number of vertical divider walls across the display case (0 to 5)'
  },
  {
    id: 'v_divider_thickness',
    name: 'Divider Thickness',
    type: 'quantity',
    unit: 'millimeter',
    default: 3,
    min: 1,
    max: 10,
    step: 0.5,
    group: 'Vertical Dividers',
    dependsOn: 'v_divider_count>0',
    description: 'Thickness of vertical divider walls'
  },
  {
    id: 'v_divider_1_pos',
    name: 'Divider 1 Position (X)',
    type: 'quantity',
    unit: 'millimeter',
    default: 0,
    min: 0,
    max: 400,
    step: 1,
    group: 'Vertical Dividers',
    dependsOn: 'v_divider_count>=1',
    description: 'Position from left inner wall in mm (0 = auto-space evenly)'
  },
  {
    id: 'v_divider_1_depth',
    name: 'Divider 1 Depth',
    type: 'quantity',
    unit: 'millimeter',
    default: 32,
    min: 5,
    max: 150,
    step: 1,
    group: 'Vertical Dividers',
    dependsOn: 'v_divider_count>=1',
    description: 'Depth of Divider 1 (clamped to max of shell depth/height)'
  },
  {
    id: 'v_divider_2_pos',
    name: 'Divider 2 Position (X)',
    type: 'quantity',
    unit: 'millimeter',
    default: 0,
    min: 0,
    max: 400,
    step: 1,
    group: 'Vertical Dividers',
    dependsOn: 'v_divider_count>=2',
    description: 'Position from left inner wall in mm (0 = auto-space evenly)'
  },
  {
    id: 'v_divider_2_depth',
    name: 'Divider 2 Depth',
    type: 'quantity',
    unit: 'millimeter',
    default: 32,
    min: 5,
    max: 150,
    step: 1,
    group: 'Vertical Dividers',
    dependsOn: 'v_divider_count>=2',
    description: 'Depth of Divider 2 (clamped to max of shell depth/height)'
  },
  {
    id: 'v_divider_3_pos',
    name: 'Divider 3 Position (X)',
    type: 'quantity',
    unit: 'millimeter',
    default: 0,
    min: 0,
    max: 400,
    step: 1,
    group: 'Vertical Dividers',
    dependsOn: 'v_divider_count>=3',
    description: 'Position from left inner wall in mm (0 = auto-space evenly)'
  },
  {
    id: 'v_divider_3_depth',
    name: 'Divider 3 Depth',
    type: 'quantity',
    unit: 'millimeter',
    default: 32,
    min: 5,
    max: 150,
    step: 1,
    group: 'Vertical Dividers',
    dependsOn: 'v_divider_count>=3',
    description: 'Depth of Divider 3 (clamped to max of shell depth/height)'
  },
  {
    id: 'v_divider_4_pos',
    name: 'Divider 4 Position (X)',
    type: 'quantity',
    unit: 'millimeter',
    default: 0,
    min: 0,
    max: 400,
    step: 1,
    group: 'Vertical Dividers',
    dependsOn: 'v_divider_count>=4',
    description: 'Position from left inner wall in mm (0 = auto-space evenly)'
  },
  {
    id: 'v_divider_4_depth',
    name: 'Divider 4 Depth',
    type: 'quantity',
    unit: 'millimeter',
    default: 32,
    min: 5,
    max: 150,
    step: 1,
    group: 'Vertical Dividers',
    dependsOn: 'v_divider_count>=4',
    description: 'Depth of Divider 4 (clamped to max of shell depth/height)'
  },
  {
    id: 'v_divider_5_pos',
    name: 'Divider 5 Position (X)',
    type: 'quantity',
    unit: 'millimeter',
    default: 0,
    min: 0,
    max: 400,
    step: 1,
    group: 'Vertical Dividers',
    dependsOn: 'v_divider_count>=5',
    description: 'Position from left inner wall in mm (0 = auto-space evenly)'
  },
  {
    id: 'v_divider_5_depth',
    name: 'Divider 5 Depth',
    type: 'quantity',
    unit: 'millimeter',
    default: 32,
    min: 5,
    max: 150,
    step: 1,
    group: 'Vertical Dividers',
    dependsOn: 'v_divider_count>=5',
    description: 'Depth of Divider 5 (clamped to max of shell depth/height)'
  }
];

export function calculateOpenGridDimensions(
  params: OpenGridDisplayCaseShellParameters
): ModelDimensionItem[] {
  const isCustom = params.dimension_mode === 'custom';
  const gridWidth = Number(params.grid_width ?? 6);
  const gridHeight = Number(params.grid_height ?? 4);
  const width = isCustom ? Number(params.custom_width ?? params.width ?? 168) : gridWidth * 28;
  const height = isCustom ? Number(params.custom_height ?? params.height ?? 112) : gridHeight * 28;
  const depth = Number(params.depth ?? 32);
  const wallThickness = Number(params.wall_thickness ?? 5);
  const backThickness = Number(params.back_thickness ?? 1);

  const innerWidth = Math.max(0, width - wallThickness * 2);
  const innerHeight = Math.max(0, height - wallThickness * 2);
  const totalDepth = depth + backThickness;

  const hDividerCount = Number(params.h_divider_count ?? 0);
  const vDividerCount = Number(params.v_divider_count ?? 0);
  const totalCompartments = (hDividerCount + 1) * (vDividerCount + 1);

  const dimensions: ModelDimensionItem[] = [
    {
      id: 'outer_width',
      label: 'Outer Width',
      value: Number(width.toFixed(1)),
      unit: 'mm',
      formatted: `${width.toFixed(1)} mm${!isCustom ? ` (${gridWidth}u)` : ''}`,
      description: 'Overall outer case width'
    },
    {
      id: 'outer_height',
      label: 'Outer Height',
      value: Number(height.toFixed(1)),
      unit: 'mm',
      formatted: `${height.toFixed(1)} mm${!isCustom ? ` (${gridHeight}u)` : ''}`,
      description: 'Overall outer case height'
    },
    {
      id: 'inner_opening',
      label: 'Inner Opening',
      value: Number(innerWidth.toFixed(1)),
      unit: 'mm',
      formatted: `${innerWidth.toFixed(1)} × ${innerHeight.toFixed(1)} mm`,
      description: 'Internal usable display compartment area'
    },
    {
      id: 'total_depth',
      label: 'Total Depth',
      value: Number(totalDepth.toFixed(1)),
      unit: 'mm',
      formatted: `${totalDepth.toFixed(1)} mm`,
      description: 'Total depth including rear back wall'
    }
  ];

  if (hDividerCount > 0 || vDividerCount > 0) {
    dimensions.push({
      id: 'compartments',
      label: 'Compartments',
      value: totalCompartments,
      unit: 'cells',
      formatted: `${totalCompartments} cells (${vDividerCount + 1} col × ${hDividerCount + 1} row)`,
      description: 'Total internal compartments created by dividers'
    });
  }

  return dimensions;
}
type ShellModelDef = OpenSCADModelDefinition<OpenGridDisplayCaseShellParameters>;

export const openGridDisplayCaseShellModel: ShellModelDef = {
  id: 'opengrid-display-case-shell',
  name: 'OpenGrid Display Case Shell',
  project: 'OpenGrid Display Case',
  partName: 'Case',
  description: 'Parametric display case shell with corner connector cutouts.',
  tags: ['OpenGrid', 'Display Case', 'Storage', 'OpenSCAD', 'Parametric', '3D Print'],
  links: [
    {
      label: 'Printables',
      url: 'https://www.printables.com/model/1803030-enclosed-display-caseframe-with-opengrid-mounts',
      site: 'printables'
    },
    {
      label: 'QIDI Maker',
      url: 'https://www.qidimaker.com/en/models/detail/2089852363063504898?profile_id=2089864128757313537',
      site: 'qidimaker'
    }
  ],
  parameters: openGridDisplayCaseShellParameters,
  scadContent: openGridDisplayCaseShellScad,
  calculateDimensions: (params) => calculateOpenGridDimensions(params)
};
