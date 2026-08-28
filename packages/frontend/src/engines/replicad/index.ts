import { ensureReplicadReady } from './occt';
import { buildKumikoKeychain } from './models/kumikoKeychain';
import { ExportOptions } from '../../types/model';
import { AnyShape } from 'replicad';

/**
 * Dispatcher mapping model IDs to Replicad geometry generators
 */
function buildModelShape(
  modelId: string,
  parameters: Record<string, number | string | boolean>
): AnyShape {
  switch (modelId) {
    case 'kumiko-keychain-replicad':
    case 'kumiko-pattern-keychain':
      return buildKumikoKeychain(parameters);
    default:
      return buildKumikoKeychain(parameters);
  }
}

/**
 * Generates an STL mesh ArrayBuffer for Three.js viewport rendering
 */
export async function generateReplicadPreviewMesh(
  modelId: string,
  parameters: Record<string, number | string | boolean>
): Promise<ArrayBuffer> {
  await ensureReplicadReady();

  const shape = buildModelShape(modelId, parameters);

  // Export as high-speed binary STL blob for Three.js STLLoader
  const blob = shape.blobSTL({
    tolerance: 0.1,
    angularTolerance: 30
  });

  return blob.arrayBuffer();
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

  const shape = buildModelShape(modelId, parameters);

  if (options.format === 'step') {
    // Generate native AP242 STEP file directly from OpenCASCADE B-Rep solid
    return shape.blobSTEP();
  }

  // Generate STL file
  return shape.blobSTL({
    tolerance: 0.05,
    angularTolerance: 20
  });
}
