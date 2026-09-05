import { ParameterDefinition } from '../../../types/model';
import { ModelDimensionItem } from '../../replicad/types';
import { OpenSCADModelDefinition } from '../types';
import openGridDisplayCaseConnectorScad from './openGridDisplayCaseConnector.scad?raw';

export interface OpenGridDisplayCaseConnectorParameters {
  opengrid_snap?: boolean;
  connector_offset?: number;
  connector_fillet?: number;
  corner_1?: boolean;
  corner_2?: boolean;
  corner_3?: boolean;
  corner_4?: boolean;
  corner_1_depth?: number;
  corner_2_depth?: number;
  corner_3_depth?: number;
  corner_4_depth?: number;
  [key: string]: unknown;
}

export const openGridDisplayCaseConnectorParameters: ParameterDefinition[] = [
  {
    id: 'opengrid_snap',
    name: 'OpenGrid Snap Base',
    type: 'boolean',
    default: true,
    group: 'Snap Base',
    description: 'Include rear snap mount for attaching directly onto OpenGrid baseboards'
  },
  {
    id: 'connector_offset',
    name: 'Clearance Offset',
    type: 'quantity',
    unit: 'millimeter',
    default: 0.05,
    min: 0,
    max: 0.3,
    step: 0.01,
    group: 'Connector Settings',
    description: 'Clearance tolerance offset for corner connector cutoffs'
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
    group: 'Connector Settings',
    description: 'Fillet radius on corner connector locking lobes'
  },
  {
    id: 'corner_1',
    name: 'Corner 1 (Top-Right)',
    type: 'boolean',
    default: true,
    group: 'Corner 1',
    description: 'Enable corner connector 1'
  },
  {
    id: 'corner_1_depth',
    name: 'Corner 1 Arm Depth',
    type: 'quantity',
    unit: 'millimeter',
    default: 25,
    min: 5,
    max: 60,
    step: 1,
    group: 'Corner 1',
    dependsOn: 'corner_1',
    description: 'Extrusion depth of corner connector 1'
  },
  {
    id: 'corner_2',
    name: 'Corner 2 (Bottom-Right)',
    type: 'boolean',
    default: true,
    group: 'Corner 2',
    description: 'Enable corner connector 2'
  },
  {
    id: 'corner_2_depth',
    name: 'Corner 2 Arm Depth',
    type: 'quantity',
    unit: 'millimeter',
    default: 25,
    min: 5,
    max: 60,
    step: 1,
    group: 'Corner 2',
    dependsOn: 'corner_2',
    description: 'Extrusion depth of corner connector 2'
  },
  {
    id: 'corner_3',
    name: 'Corner 3 (Bottom-Left)',
    type: 'boolean',
    default: true,
    group: 'Corner 3',
    description: 'Enable corner connector 3'
  },
  {
    id: 'corner_3_depth',
    name: 'Corner 3 Arm Depth',
    type: 'quantity',
    unit: 'millimeter',
    default: 25,
    min: 5,
    max: 60,
    step: 1,
    group: 'Corner 3',
    dependsOn: 'corner_3',
    description: 'Extrusion depth of corner connector 3'
  },
  {
    id: 'corner_4',
    name: 'Corner 4 (Top-Left)',
    type: 'boolean',
    default: true,
    group: 'Corner 4',
    description: 'Enable corner connector 4'
  },
  {
    id: 'corner_4_depth',
    name: 'Corner 4 Arm Depth',
    type: 'quantity',
    unit: 'millimeter',
    default: 25,
    min: 5,
    max: 60,
    step: 1,
    group: 'Corner 4',
    dependsOn: 'corner_4',
    description: 'Extrusion depth of corner connector 4'
  }
];

export function calculateOpenGridConnectorDimensions(
  params: OpenGridDisplayCaseConnectorParameters
): ModelDimensionItem[] {
  const hasSnap = params.opengrid_snap !== false;
  const activeCount = [params.corner_1, params.corner_2, params.corner_3, params.corner_4].filter(
    (c) => c !== false
  ).length;

  const depths = [
    params.corner_1 !== false ? Number(params.corner_1_depth ?? 25) : 0,
    params.corner_2 !== false ? Number(params.corner_2_depth ?? 25) : 0,
    params.corner_3 !== false ? Number(params.corner_3_depth ?? 25) : 0,
    params.corner_4 !== false ? Number(params.corner_4_depth ?? 25) : 0
  ];
  const maxDepth = Math.max(...depths, 0);

  return [
    {
      id: 'active_corners',
      label: 'Active Arms',
      value: activeCount,
      unit: 'corners',
      formatted: `${activeCount} of 4 Active`,
      description: 'Active corner connector arms'
    },
    {
      id: 'max_depth',
      label: 'Max Arm Depth',
      value: Number(maxDepth.toFixed(1)),
      unit: 'mm',
      formatted: `${maxDepth.toFixed(1)} mm`,
      description: 'Maximum connector arm depth'
    },
    {
      id: 'snap_base',
      label: 'OpenGrid Snap Base',
      value: hasSnap ? 1 : 0,
      unit: '',
      formatted: hasSnap ? 'Mounted' : 'None',
      description: 'Rear OpenGrid snap mounting adapter'
    }
  ];
}

type ConnectorModelDef = OpenSCADModelDefinition<OpenGridDisplayCaseConnectorParameters>;

export const openGridDisplayCaseConnectorModel: ConnectorModelDef = {
  id: 'opengrid-display-case-connector',
  name: 'OpenGrid Display Case Connector',
  project: 'OpenGrid Display Case',
  partName: 'Connector',
  description: 'Connector with optional OpenGrid snap base and individual arm depth controls.',
  tags: ['OpenGrid', 'Display Case', 'Connector', 'OpenSCAD', 'Parametric', '3D Print'],
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
  parameters: openGridDisplayCaseConnectorParameters,
  scadContent: openGridDisplayCaseConnectorScad,
  calculateDimensions: (params) => calculateOpenGridConnectorDimensions(params)
};
