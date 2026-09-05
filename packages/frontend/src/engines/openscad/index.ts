import { ExportOptions, MultiPartPreview } from '../../types/model';
import {
  getOpenSCADModel,
  getAllOpenSCADModels,
  isOpenSCADModel,
  registerOpenSCADModel
} from './registry';
import { OpenSCADModelDefinition, injectOpenSCADParameters } from './types';

export { getOpenSCADModel, getAllOpenSCADModels, isOpenSCADModel, registerOpenSCADModel };
export type { OpenSCADModelDefinition };

let worker: Worker | null = null;
let nextRequestId = 1;
const pendingRequests = new Map<
  number,
  { resolve: (buffer: ArrayBuffer) => void; reject: (error: Error) => void }
>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./worker.ts', import.meta.url), {
      type: 'module'
    });
    worker.onmessage = (e: MessageEvent) => {
      const { requestId, success, buffer, error } = e.data;
      const pending = pendingRequests.get(requestId);
      if (pending) {
        pendingRequests.delete(requestId);
        if (success) {
          pending.resolve(buffer);
        } else {
          pending.reject(new Error(error || 'OpenSCAD processing failed'));
        }
      }
    };
    worker.onerror = (err) => {
      console.error('OpenSCAD worker error:', err);
    };
  }
  return worker;
}

/**
 * Generates an STL mesh ArrayBuffer for Three.js preview rendering
 */
export async function generateOpenSCADPreviewMesh(
  modelId: string,
  parameters: Record<string, unknown>
): Promise<MultiPartPreview> {
  const modelDef = getOpenSCADModel(modelId);
  if (!modelDef) {
    throw new Error(`OpenSCAD model not found: ${modelId}`);
  }

  const workerInstance = getWorker();
  const requestId = nextRequestId++;

  const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    pendingRequests.set(requestId, { resolve, reject });
    workerInstance.postMessage({
      type: 'render',
      requestId,
      scadCode: modelDef.scadContent,
      parameters
    });
  });

  return {
    parts: [
      {
        name: modelDef.name,
        buffer,
        color: '#60a5fa' // Modern sky-blue accent for OpenSCAD models
      }
    ]
  };
}

/**
 * Generates a downloadable file Blob (STL or raw SCAD) directly in the browser
 */
export async function exportOpenSCADFile(
  modelId: string,
  parameters: Record<string, unknown>,
  options: ExportOptions
): Promise<Blob> {
  const modelDef = getOpenSCADModel(modelId);
  if (!modelDef) {
    throw new Error(`OpenSCAD model not found: ${modelId}`);
  }

  // Handle raw SCAD export
  if (options.format === 'scad') {
    const injectedCode = injectOpenSCADParameters(modelDef.scadContent, parameters);
    return new Blob([injectedCode], { type: 'text/plain;charset=utf-8' });
  }

  if (options.format === 'step') {
    throw new Error(
      'OpenSCAD generates polygon meshes and does not support STEP (B-Rep solid) export. Please export as STL or SCAD.'
    );
  }

  const workerInstance = getWorker();
  const requestId = nextRequestId++;
  const targetFormat = 'stl';

  const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    pendingRequests.set(requestId, { resolve, reject });
    workerInstance.postMessage({
      type: 'export',
      requestId,
      scadCode: modelDef.scadContent,
      parameters,
      format: targetFormat
    });
  });

  return new Blob([buffer], { type: 'model/stl' });
}
