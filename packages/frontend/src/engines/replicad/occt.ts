import { setOC } from 'replicad';
import opencascade from 'replicad-opencascadejs';

let occtPromise: Promise<unknown> | null = null;
let isInitialized = false;

/**
 * Lazily loads and initializes the OpenCASCADE.js WebAssembly engine for Replicad
 */
export async function ensureReplicadReady(): Promise<void> {
  if (isInitialized) return;

  if (!occtPromise) {
    occtPromise = (async () => {
      // Initialize OpenCASCADE WebAssembly
      const OC = await opencascade();
      setOC(OC);
      isInitialized = true;
    })();
  }

  await occtPromise;
}

export function isReplicadInitialized(): boolean {
  return isInitialized;
}
