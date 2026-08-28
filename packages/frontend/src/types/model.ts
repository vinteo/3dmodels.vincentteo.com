export type ParameterType = 'quantity' | 'enum' | 'boolean' | 'string';

export interface ParameterOption {
  value: string;
  label: string;
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
}

export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  engine?: 'onshape' | 'replicad';
  documentId?: string;
  workspaceId?: string;
  elementId?: string;
  elementType?: 'partstudio' | 'assembly';
  tags: string[];
  defaultConfiguration: string;
  parameters: ParameterDefinition[];
  thumbnail?: string;
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
  format: 'stl' | 'step';
  units?: 'millimeter' | 'inch';
  stlMode?: 'binary' | 'ascii';
  stepVersion?: 'AP203' | 'AP214' | 'AP242';
}
