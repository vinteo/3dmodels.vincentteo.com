import { ensureReplicadReady } from './occt';
import {
  buildKumikoKeychain,
  buildKumikoKeychainParts,
  ReplicadPart
} from './models/kumikoKeychain';
import { ExportOptions } from '../../types/model';
import { AnyShape, exportSTEP } from 'replicad';

/**
 * Dispatcher mapping model IDs to Replicad named part components
 */
function buildModelParts(
  modelId: string,
  parameters: Record<string, number | string | boolean>
): ReplicadPart[] {
  switch (modelId) {
    case 'kumiko-keychain-replicad':
    case 'kumiko-pattern-keychain':
      return buildKumikoKeychainParts(parameters);
    default:
      return buildKumikoKeychainParts(parameters);
  }
}

/**
 * Dispatcher mapping model IDs to single/composite Replicad solid
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
