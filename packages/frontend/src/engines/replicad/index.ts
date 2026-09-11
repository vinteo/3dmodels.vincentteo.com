import { ensureReplicadReady } from './occt';
import { ExportOptions, MultiPartPreview, PreviewPartMesh } from '../../types/model';
import { AnyShape, exportSTEP, makeCompound } from 'replicad';
import {
  getReplicadModel,
  getAllReplicadModels,
  isReplicadModel,
  registerReplicadModel
} from './registry';
import { ReplicadPart, ReplicadModelDefinition } from './types';

export { getReplicadModel, getAllReplicadModels, isReplicadModel, registerReplicadModel };
export type { ReplicadPart, ReplicadModelDefinition };

/**
 * Dispatcher mapping model IDs to Replicad named part components
 */
function buildModelParts(
  modelId: string,
  parameters: Record<string, number | string | boolean>
): ReplicadPart[] {
  const modelDef = getReplicadModel(modelId);
  if (!modelDef) {
    throw new Error(`Replicad model not found: ${modelId}`);
  }
  return modelDef.buildParts(parameters);
}

/**
 * Dispatcher mapping model IDs to single/composite Replicad solid
 */
function buildModelShape(
  modelId: string,
  parameters: Record<string, number | string | boolean>
): AnyShape {
  const modelDef = getReplicadModel(modelId);
  if (!modelDef) {
    throw new Error(`Replicad model not found: ${modelId}`);
  }
  if (modelDef.buildShape) {
    return modelDef.buildShape(parameters);
  }
  const parts = modelDef.buildParts(parameters);
  if (parts.length === 1) return parts[0].shape;
  return makeCompound(parts.map((p) => p.shape));
}

let worker: Worker | null = null;
let nextRequestId = 1;
const pendingRequests = new Map<
  number,
  { resolve: (parts: PreviewPartMesh[]) => void; reject: (error: Error) => void }
>();

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  if (!worker) {
    try {
      worker = new Worker(new URL('./worker.ts', import.meta.url), {
        type: 'module'
      });
      worker.onmessage = (e: MessageEvent) => {
        const { requestId, success, parts, error } = e.data;
        const pending = pendingRequests.get(requestId);
        if (pending) {
          pendingRequests.delete(requestId);
          if (success) {
            pending.resolve(parts);
          } else {
            pending.reject(new Error(error || 'Replicad processing failed'));
          }
        }
      };
      worker.onerror = (err) => {
        console.error('Replicad worker error:', err);
      };
    } catch (err) {
      console.warn('Could not initialize Replicad worker, falling back to main thread:', err);
      worker = null;
    }
  }
  return worker;
}

/**
 * Generates an STL mesh ArrayBuffer for each distinct part for multi-color Three.js rendering
 */
export async function generateReplicadPreviewMesh(
  modelId: string,
  parameters: Record<string, number | string | boolean>
): Promise<MultiPartPreview> {
  const workerInstance = getWorker();
  if (workerInstance) {
    const requestId = nextRequestId++;
    try {
      const parts = await new Promise<PreviewPartMesh[]>((resolve, reject) => {
        pendingRequests.set(requestId, { resolve, reject });
        workerInstance.postMessage({
          type: 'render',
          requestId,
          modelId,
          parameters
        });
      });
      return { parts };
    } catch (err) {
      console.warn('Worker preview failed, falling back to main thread:', err);
    }
  }

  // Direct main thread execution (fallback or test environments)
  await ensureReplicadReady();

  const parts = buildModelParts(modelId, parameters);
  const previewParts: PreviewPartMesh[] = [];

  for (const part of parts) {
    // Export as high-speed binary STL blob for Three.js STLLoader
    const blob = part.shape.blobSTL({
      tolerance: 0.1,
      angularTolerance: 30
    });
    const buffer = await blob.arrayBuffer();
    previewParts.push({
      name: part.name,
      buffer,
      color: part.color
    });
  }

  return { parts: previewParts };
}

/**
 * Generates a downloadable STL or STEP Blob directly in the browser
 */
export async function exportReplicadFile(
  modelId: string,
  parameters: Record<string, number | string | boolean>,
  options: ExportOptions
): Promise<Blob> {
  await ensureReplicadReady();

  if (options.format === 'step') {
    const parts = buildModelParts(modelId, parameters);
    // Export OpenCASCADE XCAF Multi-Body Assembly STEP file with distinct named components
    return exportSTEP(parts, {
      unit: options.units === 'inch' ? 'INCH' : 'MM'
    });
  }

  const shape = buildModelShape(modelId, parameters);

  // Generate STL file
  return shape.blobSTL({
    tolerance: 0.05,
    angularTolerance: 20
  });
}
