import { ModelConfig } from '../types';
import modelsJson from '../../../../config/models.config.json';

export const MODELS: ModelConfig[] = modelsJson as ModelConfig[];

export function getModelById(id: string): ModelConfig | undefined {
  return MODELS.find((m) => m.id === id);
}

export function getAllModels(): ModelConfig[] {
  return MODELS;
}

/**
 * Builds an Onshape configuration string from a key-value dictionary of parameters
 * based on the model's parameter schema.
 * Example output: "Length=120+millimeter;Dividers=2;ChamferBase=true"
 */
export function buildConfigurationString(
  model: ModelConfig,
  params: Record<string, number | string | boolean>
): string {
  const parts: string[] = [];

  for (const def of model.parameters) {
    const val = params[def.id] ?? def.default;

    if (def.type === 'quantity') {
      const unit = def.unit || 'millimeter';
      parts.push(`${def.id}=${val}+${unit}`);
    } else if (def.type === 'enum') {
      // If the enum value already contains units (e.g. "5+millimeter"), keep it as is
      const strVal = String(val);
      parts.push(`${def.id}=${strVal}`);
    } else if (def.type === 'boolean') {
      parts.push(`${def.id}=${Boolean(val)}`);
    } else {
      parts.push(`${def.id}=${String(val)}`);
    }
  }

  return parts.join(';');
}

/**
 * Parses an Onshape configuration string into a key-value dictionary.
 */
export function parseConfigurationString(configStr: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!configStr) return result;

  const pairs = configStr.split(';');
  for (const pair of pairs) {
    const [key, ...rest] = pair.split('=');
    if (key && rest.length > 0) {
      result[key.trim()] = rest.join('=').trim();
    }
  }

  return result;
}
