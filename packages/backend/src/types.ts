export interface Env {
  ONSHAPE_ACCESS_KEY?: string;
  ONSHAPE_SECRET_KEY?: string;
  ONSHAPE_BASE_URL?: string;
  MOCK_MODE?: string; // 'true' | 'false' | 'auto'
}

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

export interface PreviewRequest {
  configuration?: string;
  parameters?: Record<string, number | string | boolean>;
  format?: 'gltf' | 'stl';
}

export interface ExportRequest {
  configuration?: string;
  parameters?: Record<string, number | string | boolean>;
  format: 'stl' | 'step';
  units?: 'millimeter' | 'inch';
  stlMode?: 'binary' | 'ascii';
  stepVersion?: 'AP203' | 'AP214' | 'AP242';
}

export interface OnshapeConfigurationParameter {
  message?: {
    parameterId: string;
    parameterName: string;
    typeName: string;
    defaultValue?: unknown;
    rangeAndDefault?: {
      minValue?: number;
      maxValue?: number;
      defaultValue?: number;
      units?: string;
    };
    options?: Array<{
      message?: {
        option: string;
        optionName: string;
      };
    }>;
  };
  typeName?: string;
}

export interface OnshapeConfigurationResponse {
  configurationParameters?: OnshapeConfigurationParameter[];
}

export interface TranslationStatus {
  id: string;
  requestState: 'PENDING' | 'ACTIVE' | 'DONE' | 'FAILED';
  failureReason?: string;
  resultExternalDataIds?: string[];
  resultElementIds?: string[];
}
