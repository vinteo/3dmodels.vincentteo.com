import { ExportOptions, ModelConfig, ModelsApiResponse, PreviewMeshData } from '../types/model';
import fallbackModels from '../../../../config/models.config.json';
import { generateReplicadPreviewMesh, exportReplicadFile } from '../engines/replicad';

const API_BASE = import.meta.env.VITE_API_URL || '';

export async function getModels(includeHidden = false): Promise<{ models: ModelConfig[]; mockMode: boolean }> {
  try {
    const url = includeHidden ? `${API_BASE}/api/models?includeHidden=true` : `${API_BASE}/api/models`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = (await res.json()) as ModelsApiResponse;
    return {
      models: data.data,
      mockMode: data.mockMode
    };
  } catch (err) {
    console.warn('Backend API unreachable, using fallback configuration catalog:', err);
    const all = fallbackModels as ModelConfig[];
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
