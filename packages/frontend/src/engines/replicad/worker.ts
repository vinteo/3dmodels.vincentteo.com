import { ensureReplicadReady } from './occt';
import { getReplicadModel } from './registry';
import { PreviewPartMesh } from '../../types/model';

interface RenderRequest {
  type: 'render';
  requestId: number;
  modelId: string;
  parameters: Record<string, number | string | boolean>;
}

type WorkerRequest = RenderRequest;

const workerScope = self as unknown as {
  postMessage: (message: unknown, transfer?: Transferable[]) => void;
  onmessage: ((e: MessageEvent<WorkerRequest>) => void) | null;
};

workerScope.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const data = e.data;
  if (!data || data.type !== 'render') return;

  const { requestId, modelId, parameters } = data;

  try {
    await ensureReplicadReady();

    const modelDef = getReplicadModel(modelId);
    if (!modelDef) {
      throw new Error(`Replicad model not found: ${modelId}`);
    }

    const parts = modelDef.buildParts(parameters);
    const previewParts: PreviewPartMesh[] = [];
    const transferBuffers: ArrayBuffer[] = [];

    for (const part of parts) {
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
      transferBuffers.push(buffer);
    }

    workerScope.postMessage(
      {
        type: 'renderResult',
        requestId,
        success: true,
        parts: previewParts
      },
      transferBuffers
    );
  } catch (err: unknown) {
    workerScope.postMessage({
      type: 'renderResult',
      requestId,
      success: false,
      error: err instanceof Error ? err.message : String(err)
    });
  }
};
