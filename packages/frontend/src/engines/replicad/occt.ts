import { setOC, loadFont } from 'replicad';
import opencascade from 'replicad-opencascadejs';
import wasmUrl from 'replicad-opencascadejs/wasm?url';
import fontUrl from '../../../public/fonts/AllertaStencil-Regular.ttf?url';

let occtPromise: Promise<unknown> | null = null;
let isInitialized = false;

/**
 * Lazily loads and initializes the OpenCASCADE.js WebAssembly engine for Replicad
 */
export async function ensureReplicadReady(): Promise<void> {
  if (isInitialized) return;

  if (!occtPromise) {
    occtPromise = (async () => {
      // In real browser, Vite serves the wasm URL via HTTP (/@fs/ in dev, /assets/ in prod)
      // In Node.js / jsdom test environment, strip /@fs so Node fs can read the file directly
      const isRealBrowser =
        (typeof window !== 'undefined' || typeof self !== 'undefined') &&
        typeof navigator !== 'undefined' &&
        !navigator.userAgent?.includes('jsdom');
      const resolvedWasm = isRealBrowser
        ? wasmUrl
        : typeof wasmUrl === 'string' && wasmUrl.startsWith('/@fs/')
          ? wasmUrl.replace('/@fs', '')
          : wasmUrl;

      const OC = await opencascade({
        locateFile: (path: string) => {
          if (path.endsWith('.wasm')) {
            return resolvedWasm;
          }
          return path;
        }
      });
      setOC(OC);

      // Load Stencil Font for text cutouts in browser
      if (isRealBrowser) {
        try {
          await loadFont(fontUrl, 'Stencil');
        } catch (err) {
          console.warn('Failed to load Stencil font:', err);
        }
      }

      isInitialized = true;
    })();
  }

  await occtPromise;
}

export function isReplicadInitialized(): boolean {
  return isInitialized;
}
