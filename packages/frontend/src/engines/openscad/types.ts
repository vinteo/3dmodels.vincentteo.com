import { ParameterDefinition, ModelLink } from '../../types/model';
import { ModelDimensionItem } from '../replicad/types';

export interface OpenSCADModelDefinition<TParams = Record<string, number | string | boolean>> {
  id: string;
  name: string;
  project?: string;
  partName?: string;
  description: string;
  tags: string[];
  hidden?: boolean;
  thumbnail?: string;
  links?: ModelLink[];
  parameters: ParameterDefinition[];
  scadContent: string;
  defaultConfiguration?: string;
  calculateDimensions?: (params: TParams) => ModelDimensionItem[];
}

/**
 * Extracts default key-value pairs from an array of ParameterDefinitions
 */
export function extractDefaultOpenSCADParameters<T = Record<string, number | string | boolean>>(
  parameters: ParameterDefinition[]
): T {
  const defaults: Record<string, number | string | boolean> = {};
  for (const param of parameters) {
    defaults[param.id] = param.default;
  }
  return defaults as T;
}

/**
 * Formats a single JavaScript value into valid OpenSCAD syntax
 */
export function formatOpenSCADValue(value: unknown): string {
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value.toString() : '0';
  }
  if (typeof value === 'string') {
    // If it looks like a numeric string (e.g. from slider input), check if valid number
    if (!isNaN(Number(value)) && value.trim() !== '') {
      return value.trim();
    }
    const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `"${escaped}"`;
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => formatOpenSCADValue(v)).join(', ')}]`;
  }
  return String(value);
}

/**
 * Injects parameter values into OpenSCAD source code.
 * Replaces existing top-level assignments (e.g. `width = 168;`) if present,
 * or prepends them if not previously declared.
 */
export function injectOpenSCADParameters(
  scadCode: string,
  parameters: Record<string, unknown>
): string {
  let updatedCode = scadCode;
  const unhandledParams: Array<{ id: string; value: string }> = [];

  for (const [key, rawValue] of Object.entries(parameters)) {
    if (rawValue === undefined || rawValue === null) continue;
    const formattedVal = formatOpenSCADValue(rawValue);
    // Regex matches: start-of-line or whitespace, then key, optional whitespace, '=', anything until ';'
    const paramRegex = new RegExp(`^([ \\t]*${key}[ \\t]*=[ \\t]*)[^;]+;`, 'm');

    if (paramRegex.test(updatedCode)) {
      updatedCode = updatedCode.replace(paramRegex, `$1${formattedVal};`);
    } else {
      unhandledParams.push({ id: key, value: formattedVal });
    }
  }

  if (unhandledParams.length > 0) {
    const injectedHeader =
      '/* Injected Parameters */\n' +
      unhandledParams.map((p) => `${p.id} = ${p.value};`).join('\n') +
      '\n\n';
    updatedCode = injectedHeader + updatedCode;
  }

  return updatedCode;
}
