import { AnyShape } from 'replicad';
import { ParameterDefinition, ModelLink } from '../../types/model';

export interface ReplicadPart {
  shape: AnyShape;
  name: string;
  color?: string;
  alpha?: number;
}

export interface ModelDimensionItem {
  id: string;
  label: string;
  value: number;
  unit: string;
  formatted?: string;
  description?: string;
}

export interface ReplicadModelDefinition<TParams = Record<string, number | string | boolean>> {
  id: string;
  name: string;
  description: string;
  tags: string[];
  hidden?: boolean;
  thumbnail?: string;
  links?: ModelLink[];
  parameters: ParameterDefinition[];
  defaultConfiguration?: string;
  calculateDimensions?: (params: TParams) => ModelDimensionItem[];
  buildParts: (params: TParams) => ReplicadPart[];
  buildShape?: (params: TParams) => AnyShape;
}

/**
 * Extracts default key-value pairs from an array of ParameterDefinitions
 */
export function extractDefaultParameters<T = Record<string, number | string | boolean>>(
  parameters: ParameterDefinition[]
): T {
  const defaults: Record<string, number | string | boolean> = {};
  for (const param of parameters) {
    defaults[param.id] = param.default;
  }
  return defaults as T;
}

/**
 * Serializes default parameter values into a semicolon-delimited configuration string
 */
export function buildDefaultConfigurationString(parameters: ParameterDefinition[]): string {
  const parts: string[] = [];
  for (const def of parameters) {
    if (def.type === 'quantity') {
      const unit = def.unit || 'millimeter';
      parts.push(`${def.id}=${def.default}+${unit}`);
    } else {
      parts.push(`${def.id}=${def.default}`);
    }
  }
  return parts.join(';');
}
