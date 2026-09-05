import { createOpenSCAD } from 'openscad-wasm';
import { injectOpenSCADParameters } from './types';

interface RenderRequest {
  type: 'render';
  requestId: number;
  scadCode: string;
  parameters: Record<string, unknown>;
}

interface ExportRequest {
  type: 'export';
  requestId: number;
  scadCode: string;
  parameters: Record<string, unknown>;
  format: 'stl';
}

type WorkerRequest = RenderRequest | ExportRequest;

// Web Worker global scope helper
const workerScope = self as unknown as {
  postMessage: (message: unknown, transfer?: Transferable[]) => void;
  onmessage: ((e: MessageEvent<WorkerRequest>) => void) | null;
};

async function createFreshOpenSCAD() {
  return createOpenSCAD({
    print: (text: string) => {
      if (import.meta.env.DEV) {
        console.debug('[OpenSCAD]:', text);
      }
    },
    printErr: (text: string) => {
      if (text.toLowerCase().includes('error')) {
        console.error('[OpenSCAD Error]:', text);
      } else {
        console.debug('[OpenSCAD]:', text);
      }
    }
  });
}

function toUint8Array(data: string | Uint8Array): Uint8Array {
  if (typeof data === 'string') {
    return new TextEncoder().encode(data);
  }
  return data;
}

workerScope.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const data = e.data;
  if (!data || !data.type) return;

  const { requestId, type, scadCode, parameters } = data;

  try {
    const injectedCode = injectOpenSCADParameters(scadCode, parameters);
    const openscad = await createFreshOpenSCAD();
    const instance = openscad.getInstance();

    if (type === 'render') {
      instance.FS.writeFile('/input.scad', injectedCode);
      instance.callMain(['/input.scad', '-o', '/output.stl']);

      const rawBytes = instance.FS.readFile('/output.stl');
      const stlBytes = toUint8Array(rawBytes);

      try {
        instance.FS.unlink('/input.scad');
        instance.FS.unlink('/output.stl');
      } catch {
        // Cleanup virtual FS
      }

      // Clone into independent ArrayBuffer so WASM heap memory is not detached on transfer
      const copy = new Uint8Array(stlBytes.byteLength);
      copy.set(stlBytes);
      const buffer = copy.buffer;

      workerScope.postMessage(
        {
          type: 'renderResult',
          requestId,
          success: true,
          buffer
        },
        [buffer]
      );
    } else if (type === 'export') {
      const format = data.format || 'stl';
      const outFilename = `/output.${format}`;

      instance.FS.writeFile('/input.scad', injectedCode);
      instance.callMain(['/input.scad', '-o', outFilename]);

      const rawBytes = instance.FS.readFile(outFilename);
      const fileBytes = toUint8Array(rawBytes);

      try {
        instance.FS.unlink('/input.scad');
        instance.FS.unlink(outFilename);
      } catch {
        // Cleanup virtual FS
      }

      // Clone into independent ArrayBuffer
      const copy = new Uint8Array(fileBytes.byteLength);
      copy.set(fileBytes);
      const buffer = copy.buffer;

      workerScope.postMessage(
        {
          type: 'exportResult',
          requestId,
          success: true,
          buffer,
          format
        },
        [buffer]
      );
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    workerScope.postMessage({
      type: `${type}Result`,
      requestId,
      success: false,
      error: errorMsg
    });
  }
};
