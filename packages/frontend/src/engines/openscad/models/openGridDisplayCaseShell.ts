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

  return [
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
