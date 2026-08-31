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

/**
 * Generates an STL mesh ArrayBuffer for each distinct part for multi-color Three.js rendering
 */
export async function generateReplicadPreviewMesh(
  modelId: string,
  parameters: Record<string, number | string | boolean>
): Promise<MultiPartPreview> {
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
