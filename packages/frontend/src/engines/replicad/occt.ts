import { setOC } from 'replicad';
import opencascade from 'replicad-opencascadejs';
import wasmUrl from 'replicad-opencascadejs/wasm?url';

let occtPromise: Promise<unknown> | null = null;
let isInitialized = false;

/**
 * Lazily loads and initializes the OpenCASCADE.js WebAssembly engine for Replicad
 */
export async function ensureReplicadReady(): Promise<void> {
  if (isInitialized) return;

  if (!occtPromise) {
    occtPromise = (async () => {
      // Initialize OpenCASCADE WebAssembly with explicit Vite wasm asset URL
      const OC = await opencascade({
        locateFile: (path: string) => {
          if (path.endsWith('.wasm')) {
            return wasmUrl;
          }
          return path;
        }
      });
      setOC(OC);
      isInitialized = true;
    })();
  }

  await occtPromise;
}

export function isReplicadInitialized(): boolean {
  return isInitialized;
}
