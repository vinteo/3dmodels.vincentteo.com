import { ParameterDefinition } from '../../../types/model';
import { ModelDimensionItem } from '../../replicad/types';
import { OpenSCADModelDefinition } from '../types';
import openGridDisplayCaseCoverScad from './openGridDisplayCaseCover.scad?raw';

export interface OpenGridDisplayCaseCoverParameters {
  dimension_mode?: 'grid' | 'custom' | string;
  grid_width?: number;
  grid_height?: number;
  custom_width?: number;
  custom_height?: number;
  width?: number;
  height?: number;
  base_thickness?: number;
  arcylic_width?: number;
  arcylic_height?: number;
  arcylic_thickness?: number;
  connector_offset?: number;
  connector_depth?: number;
  connector_fillet?: number;
  [key: string]: unknown;
}

export const openGridDisplayCaseCoverParameters: ParameterDefinition[] = [
  {
    id: 'dimension_mode',
    name: 'Sizing Mode',
    type: 'enum',
    widget: 'segmented',
    default: 'grid',
    group: 'Cover Dimensions',
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
    group: 'Cover Dimensions',
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
    group: 'Cover Dimensions',
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
    group: 'Cover Dimensions',
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
    group: 'Cover Dimensions',
    dependsOn: 'dimension_mode=custom',
    description: 'Arbitrary outer height in millimeters'
  },
  {
    id: 'base_thickness',
    name: 'Base Rim Thickness',
    type: 'quantity',
    unit: 'millimeter',
    default: 1,
    min: 0.6,
    max: 6,
    step: 0.2,
    group: 'Cover Dimensions',
    description: 'Thickness of the front cover face frame rim'
  },
  {
    id: 'arcylic_width',
    name: 'Acrylic Sheet Width',
    type: 'quantity',
    unit: 'millimeter',
    default: 150,
    min: 20,
    max: 400,
    step: 1,
    group: 'Acrylic Window',
    description: 'Width of the transparent acrylic sheet insert'
  },
  {
    id: 'arcylic_height',
    name: 'Acrylic Sheet Height',
    type: 'quantity',
    unit: 'millimeter',
    default: 100,
    min: 20,
    max: 400,
    step: 1,
    group: 'Acrylic Window',
    description: 'Height of the transparent acrylic sheet insert'
  },
  {
    id: 'arcylic_thickness',
    name: 'Acrylic Sheet Thickness',
    type: 'quantity',
    unit: 'millimeter',
    default: 1,
    min: 0.5,
    max: 5,
    step: 0.1,
    group: 'Acrylic Window',
    description: 'Thickness of the acrylic pane (e.g. 1mm or 2mm sheet)'
  },
  {
    id: 'connector_offset',
    name: 'Connector Offset / Clearance',
    type: 'quantity',
    unit: 'millimeter',
    default: 0.05,
    min: 0,
    max: 0.3,
    step: 0.01,
    group: 'Corner Connectors',
    description: 'Clearance offset for corner connector tabs'
  },
  {
    id: 'connector_depth',
    name: 'Connector Depth',
    type: 'quantity',
    unit: 'millimeter',
    default: 8,
    min: 4,
    max: 20,
    step: 0.5,
    group: 'Corner Connectors',
    description: 'Extrusion depth of corner snap connectors'
  },
  {
    id: 'connector_fillet',
    name: 'Connector Fillet',
    type: 'quantity',
    unit: 'millimeter',
    default: 0.2,
    min: 0,
    max: 0.5,
    step: 0.05,
    group: 'Corner Connectors',
    description: 'Fillet radius on corner connector locking lobes'
  }
];

export function calculateOpenGridCoverDimensions(
  params: OpenGridDisplayCaseCoverParameters
): ModelDimensionItem[] {
  const isCustom = params.dimension_mode === 'custom';
  const gridWidth = Number(params.grid_width ?? 6);
  const gridHeight = Number(params.grid_height ?? 4);
  const width = isCustom ? Number(params.custom_width ?? params.width ?? 168) : gridWidth * 28;
  const height = isCustom ? Number(params.custom_height ?? params.height ?? 112) : gridHeight * 28;
  const baseThickness = Number(params.base_thickness ?? 1);
  const arcylicWidth = Number(params.arcylic_width ?? 150);
  const arcylicHeight = Number(params.arcylic_height ?? 100);
  const arcylicThickness = Number(params.arcylic_thickness ?? 1);
  const totalThickness = baseThickness + arcylicThickness + 0.5;

  return [
    {
      id: 'outer_width',
      label: 'Cover Width',
      value: Number(width.toFixed(1)),
      unit: 'mm',
      formatted: `${width.toFixed(1)} mm${!isCustom ? ` (${gridWidth}u)` : ''}`,
      description: 'Overall outer cover width'
    },
    {
      id: 'outer_height',
      label: 'Cover Height',
      value: Number(height.toFixed(1)),
      unit: 'mm',
      formatted: `${height.toFixed(1)} mm${!isCustom ? ` (${gridHeight}u)` : ''}`,
      description: 'Overall outer cover height'
    },
    {
      id: 'acrylic_sheet_size',
      label: 'Acrylic Pane Size',
      value: Number(arcylicWidth.toFixed(1)),
      unit: 'mm',
      formatted: `${arcylicWidth.toFixed(1)} × ${arcylicHeight.toFixed(1)} mm (${arcylicThickness.toFixed(1)}mm thk)`,
      description: 'Required dimensions for acrylic sheet insert'
    },
    {
      id: 'frame_thickness',
      label: 'Frame Thickness',
      value: Number(totalThickness.toFixed(1)),
      unit: 'mm',
      formatted: `${totalThickness.toFixed(1)} mm`,
      description: 'Total depth of the front frame'
    }
  ];
}

type CoverModelDef = OpenSCADModelDefinition<OpenGridDisplayCaseCoverParameters>;

export const openGridDisplayCaseCoverModel: CoverModelDef = {
  id: 'opengrid-display-case-cover',
  name: 'OpenGrid Display Case Cover',
  project: 'OpenGrid Display Case',
  partName: 'Cover',
  description:
    'Parametric display case front cover with acrylic sheet holder and corner connectors.',
  tags: ['OpenGrid', 'Display Case', 'Cover', 'OpenSCAD', 'Parametric', '3D Print'],
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
  parameters: openGridDisplayCaseCoverParameters,
  scadContent: openGridDisplayCaseCoverScad,
  calculateDimensions: (params) => calculateOpenGridCoverDimensions(params)
};
