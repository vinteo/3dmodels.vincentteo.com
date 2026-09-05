export type ParameterType = 'quantity' | 'enum' | 'boolean' | 'string';
export type ParameterWidget = 'slider' | 'stepper' | 'segmented' | 'switch' | 'select';
export type ParameterLayout = 'full' | 'half' | 'inline';

export interface ParameterOption {
  value: string;
  label: string;
  description?: string;
}

export interface ParameterDefinition {
  id: string;
  name: string;
  type: ParameterType;
  unit?: string;
  default: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: ParameterOption[];
  description?: string;
  group?: string;
  dependsOn?: string;
  widget?: ParameterWidget;
  layout?: ParameterLayout;
}

export interface ModelLink {
  label: string;
  url: string;
  site?: 'printables' | 'qidimaker' | 'makerworld' | 'thingiverse' | 'github' | string;
}

export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  project?: string;
  partName?: string;
  engine?: 'onshape' | 'replicad' | 'openscad';
  hidden?: boolean;
  documentId?: string;
  workspaceId?: string;
  elementId?: string;
  elementType?: 'partstudio' | 'assembly';
  tags: string[];
  defaultConfiguration: string;
  parameters: ParameterDefinition[];
  thumbnail?: string;
  links?: ModelLink[];
}

export interface ModelsApiResponse {
  success: boolean;
  mockMode: boolean;
  data: ModelConfig[];
}

export interface ModelDetailApiResponse {
  success: boolean;
  mockMode: boolean;
  data: ModelConfig & {
    liveOnshapeSchema?: unknown;
  };
}

export interface ExportOptions {
  format: 'stl' | 'step' | 'scad';
  units?: 'millimeter' | 'inch';
  stlMode?: 'binary' | 'ascii';
  stepVersion?: 'AP203' | 'AP214' | 'AP242';
}

export interface PreviewPartMesh {
  name: string;
  buffer: ArrayBuffer;
  color?: string;
}

export interface MultiPartPreview {
  parts: PreviewPartMesh[];
}

export type PreviewMeshData = ArrayBuffer | MultiPartPreview;
