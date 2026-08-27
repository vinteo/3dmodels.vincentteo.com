import { ExportOptions, ModelConfig, ModelsApiResponse } from '../types/model';
import fallbackModels from '../../../../config/models.config.json';

const API_BASE = import.meta.env.VITE_API_URL || '';

export async function getModels(): Promise<{ models: ModelConfig[]; mockMode: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/api/models`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = (await res.json()) as ModelsApiResponse;
    return {
      models: data.data,
      mockMode: data.mockMode
    };
  } catch (err) {
    console.warn('Backend API unreachable, using fallback configuration catalog:', err);
    return {
      models: fallbackModels as ModelConfig[],
      mockMode: true
    };
  }
}

export async function fetchModelPreviewMesh(
  modelId: string,
  parameters: Record<string, number | string | boolean>
): Promise<ArrayBuffer> {
  const res = await fetch(`${API_BASE}/api/models/${modelId}/preview`, {
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
  modelId: string,
  parameters: Record<string, number | string | boolean>,
  options: ExportOptions
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/models/${modelId}/export`, {
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

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = `${modelId}-${Date.now()}.${options.format}`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}
