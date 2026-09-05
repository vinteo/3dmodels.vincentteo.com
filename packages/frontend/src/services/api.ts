import { ExportOptions, ModelConfig, PreviewMeshData } from '../types/model';
import modelsCatalog from '../../../../config/models.config.json';
import {
  generateReplicadPreviewMesh,
  exportReplicadFile,
  getAllReplicadModels
} from '../engines/replicad';
import {
  generateOpenSCADPreviewMesh,
  exportOpenSCADFile,
  getAllOpenSCADModels
} from '../engines/openscad';
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
        project: repDef.project || model.project,
        partName: repDef.partName || model.partName,
        description: repDef.description || model.description,
        engine: 'replicad' as const,
        tags: model.tags?.length ? model.tags : repDef.tags,
        links: repDef.links?.length ? repDef.links : model.links,
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
        project: repDef.project,
        partName: repDef.partName,
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

/**
 * Merges catalog models with registered code-first OpenSCAD model definitions.
 * OpenSCAD models defined in TypeScript are the single source of truth for their parameters and defaults.
 */
export function mergeWithOpenSCADModels(baseModels: ModelConfig[]): ModelConfig[] {
  const openscadDefs = getAllOpenSCADModels();
  const models = [...baseModels];
  const processedIds = new Set<string>();

  // 1. Update existing models in catalog with OpenSCAD definitions
  const updatedModels = models.map((model) => {
    const scadDef = openscadDefs.find((s) => s.id === model.id);
    if (scadDef) {
      processedIds.add(scadDef.id);
      return {
        ...model,
        name: scadDef.name || model.name,
        project: scadDef.project || model.project,
        partName: scadDef.partName || model.partName,
        description: scadDef.description || model.description,
        engine: 'openscad' as const,
        tags: model.tags?.length ? model.tags : scadDef.tags,
        links: scadDef.links?.length ? scadDef.links : model.links,
        parameters: scadDef.parameters,
        defaultConfiguration:
          scadDef.defaultConfiguration || buildDefaultConfigurationString(scadDef.parameters)
      };
    }
    return model;
  });

  // 2. Append any OpenSCAD models that were not in the JSON catalog
  for (const scadDef of openscadDefs) {
    if (!processedIds.has(scadDef.id)) {
      updatedModels.push({
        id: scadDef.id,
        name: scadDef.name,
        project: scadDef.project,
        partName: scadDef.partName,
        description: scadDef.description,
        engine: 'openscad',
        tags: scadDef.tags,
        hidden: scadDef.hidden ?? false,
        thumbnail: scadDef.thumbnail,
        links: scadDef.links || [],
        defaultConfiguration:
          scadDef.defaultConfiguration || buildDefaultConfigurationString(scadDef.parameters),
        parameters: scadDef.parameters
      });
    }
  }

  return updatedModels;
}

/**
 * Merges catalog models with all registered code-first local engine models (Replicad & OpenSCAD).
 */
export function mergeWithLocalEngineModels(baseModels: ModelConfig[]): ModelConfig[] {
  return mergeWithOpenSCADModels(mergeWithReplicadModels(baseModels));
}

/**
 * Retrieves the available 3D models catalog directly from local configuration
 * and registered in-browser models without requiring an active backend connection.
 */
export async function getModels(
  includeHidden = false
): Promise<{ models: ModelConfig[]; mockMode: boolean }> {
  const all = mergeWithLocalEngineModels(modelsCatalog as ModelConfig[]);
  return {
    models: includeHidden ? all : all.filter((m) => !m.hidden),
    mockMode: false
  };
}

export async function fetchModelPreviewMesh(
  model: ModelConfig,
  parameters: Record<string, number | string | boolean>
): Promise<PreviewMeshData> {
  // If model is powered by in-browser Replicad CAD engine
  if (model.engine === 'replicad') {
    return generateReplicadPreviewMesh(model.id, parameters);
  }

  // If model is powered by in-browser OpenSCAD engine
  if (model.engine === 'openscad') {
    return generateOpenSCADPreviewMesh(model.id, parameters);
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
  } else if (model.engine === 'openscad') {
    blob = await exportOpenSCADFile(model.id, parameters, options);
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
