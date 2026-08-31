import { ExportOptions, ModelConfig, ModelsApiResponse, PreviewMeshData } from '../types/model';
import fallbackModels from '../../../../config/models.config.json';
import {
  generateReplicadPreviewMesh,
  exportReplicadFile,
  getAllReplicadModels
} from '../engines/replicad';
import { buildDefaultConfigurationString } from '../engines/replicad/types';

const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Merges catalog models with registered code-first Replicad model definitions.
 * Replicad models defined in TypeScript are the single source of truth for their parameters and defaults.
 */
export function mergeWithReplicadModels(baseModels: ModelConfig[]): ModelConfig[] {
  const replicadDefs = getAllReplicadModels();
  const models = [...baseModels];
  const processedIds = new Set<string>();

  // 1. Update existing models in catalog with Replicad definitions
  const updatedModels = models.map((model) => {
    const repDef = replicadDefs.find((r) => r.id === model.id);
    if (repDef) {
      processedIds.add(repDef.id);
      return {
        ...model,
        name: repDef.name || model.name,
        description: repDef.description || model.description,
        engine: 'replicad' as const,
        tags: model.tags?.length ? model.tags : repDef.tags,
        parameters: repDef.parameters,
        defaultConfiguration:
          repDef.defaultConfiguration || buildDefaultConfigurationString(repDef.parameters)
      };
    }
    return model;
  });

  // 2. Append any Replicad models that were not in the JSON catalog
  for (const repDef of replicadDefs) {
    if (!processedIds.has(repDef.id)) {
      updatedModels.push({
        id: repDef.id,
        name: repDef.name,
        description: repDef.description,
        engine: 'replicad',
        tags: repDef.tags,
        hidden: repDef.hidden ?? false,
        thumbnail: repDef.thumbnail,
        links: repDef.links || [],
        defaultConfiguration:
          repDef.defaultConfiguration || buildDefaultConfigurationString(repDef.parameters),
        parameters: repDef.parameters
      });
    }
  }

  return updatedModels;
}

export async function getModels(
  includeHidden = false
): Promise<{ models: ModelConfig[]; mockMode: boolean }> {
  try {
    const url = includeHidden
      ? `${API_BASE}/api/models?includeHidden=true`
      : `${API_BASE}/api/models`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = (await res.json()) as ModelsApiResponse;
    const merged = mergeWithReplicadModels(data.data);
    return {
      models: includeHidden ? merged : merged.filter((m) => !m.hidden),
      mockMode: data.mockMode
    };
  } catch (err) {
    console.warn('Backend API unreachable, using fallback configuration catalog:', err);
    const all = mergeWithReplicadModels(fallbackModels as ModelConfig[]);
    return {
      models: includeHidden ? all : all.filter((m) => !m.hidden),
      mockMode: true
    };
  }
}

export async function fetchModelPreviewMesh(
  model: ModelConfig,
  parameters: Record<string, number | string | boolean>
): Promise<PreviewMeshData> {
  // If model is powered by in-browser Replicad CAD engine
  if (model.engine === 'replicad') {
    return generateReplicadPreviewMesh(model.id, parameters);
  }

  // Otherwise query Cloudflare + Onshape backend API proxy
  const res = await fetch(`${API_BASE}/api/models/${model.id}/preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'model/stl, application/octet-stream'
    },
    body: JSON.stringify({ parameters, format: 'stl' })
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Failed to load 3D preview: ${errText}`);
  }

  return res.arrayBuffer();
}

export async function triggerModelExport(
  model: ModelConfig,
  parameters: Record<string, number | string | boolean>,
  options: ExportOptions
): Promise<void> {
  let blob: Blob;

  // If model is powered by in-browser Replicad CAD engine
  if (model.engine === 'replicad') {
    blob = await exportReplicadFile(model.id, parameters, options);
  } else {
    // Query Cloudflare + Onshape backend API proxy
    const res = await fetch(`${API_BASE}/api/models/${model.id}/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parameters,
        ...options
      })
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`Export failed: ${errText}`);
    }

    blob = await res.blob();
  }

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = `${model.id}-${Date.now()}.${options.format}`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}
