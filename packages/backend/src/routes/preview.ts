import { Hono } from 'hono';
import { Env, PreviewRequest } from '../types';
import { getModelById, buildConfigurationString } from '../config/models';
import { OnshapeClient } from '../onshape/client';

export const previewRouter = new Hono<{ Bindings: Env }>();

// In-Memory Isolate Cache (Fast RAM fallback for local dev and immediate repeat calls)
interface MemoryCacheItem {
  buffer: ArrayBuffer;
  contentType: string;
  timestamp: number;
}

const memoryPreviewCache = new Map<string, MemoryCacheItem>();
const MAX_MEMORY_ITEMS = 60;
const MEMORY_TTL_MS = 24 * 3600 * 1000; // 24 hours

function getMemoryCache(key: string): MemoryCacheItem | null {
  const item = memoryPreviewCache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > MEMORY_TTL_MS) {
    memoryPreviewCache.delete(key);
    return null;
  }
  return item;
}

function setMemoryCache(key: string, buffer: ArrayBuffer, contentType: string) {
  if (memoryPreviewCache.size >= MAX_MEMORY_ITEMS) {
    const oldestKey = memoryPreviewCache.keys().next().value;
    if (oldestKey) memoryPreviewCache.delete(oldestKey);
  }
  memoryPreviewCache.set(key, { buffer, contentType, timestamp: Date.now() });
}

/**
 * POST /api/models/:id/preview
 * Fetches real-time 3D geometry for rendering in the browser viewport
 * Uses Cloudflare Edge Cache (caches.default) + In-Memory LRU Cache for zero-latency repeats and Onshape rate limit protection
 */
previewRouter.post('/:id/preview', async (c) => {
  const id = c.req.param('id');
  const model = getModelById(id);

  if (!model) {
    return c.json({ success: false, error: `Model '${id}' not found` }, 404);
  }

  let body: PreviewRequest = {};
  try {
    body = await c.req.json();
  } catch {
    // defaults to empty
  }

  let configuration = body.configuration;
  if (!configuration && body.parameters) {
    configuration = buildConfigurationString(model, body.parameters);
  }
  if (!configuration) {
    configuration = model.defaultConfiguration;
  }

  const format = body.format?.toLowerCase() || 'stl';
  const cacheKeyUrl = `https://cache.3dmodels.internal/api/models/${id}/preview?format=${format}&config=${encodeURIComponent(configuration)}`;
  const cacheKey = new Request(cacheKeyUrl, { method: 'GET' });

  // 1. Check in-memory isolate cache
  const memoryHit = getMemoryCache(cacheKeyUrl);
  if (memoryHit) {
    return new Response(memoryHit.buffer, {
      status: 200,
      headers: {
        'Content-Type': memoryHit.contentType,
        'Access-Control-Allow-Origin': '*',
        'X-Cache': 'HIT-MEMORY',
        'Cache-Control': 'public, max-age=604800, s-maxage=604800'
      }
    });
  }

  // 2. Check Cloudflare Worker Edge Cache (caches.default)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cfCache = (globalThis as any).caches?.default;
  if (cfCache) {
    try {
      const cached = await cfCache.match(cacheKey);
      if (cached) {
        const headers = new Headers(cached.headers);
        headers.set('X-Cache', 'HIT-EDGE');
        headers.set('Access-Control-Allow-Origin', '*');
        return new Response(cached.body, {
          status: 200,
          headers
        });
      }
    } catch (e) {
      console.warn('Edge cache match error:', e);
    }
  }

  // 3. Cache Miss - Fetch from Onshape
  const client = new OnshapeClient(c.env);

  try {
    let res: Response;
    if (format === 'gltf') {
      res = await client.getGltf(model, configuration);
    } else {
      res = await client.getSTL(model, configuration, 'binary', 'millimeter');
    }

    const contentType =
      res.headers.get('Content-Type') || (format === 'gltf' ? 'model/gltf-binary' : 'model/stl');
    const arrayBuffer = await res.arrayBuffer();

    // Store in in-memory cache
    setMemoryCache(cacheKeyUrl, arrayBuffer, contentType);

    // Store in Cloudflare Edge Cache
    if (cfCache && res.ok) {
      try {
        const edgeHeaders = new Headers({
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=604800, s-maxage=604800',
          'Access-Control-Allow-Origin': '*'
        });
        const edgeResponse = new Response(arrayBuffer, {
          status: 200,
          headers: edgeHeaders
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ctx = (c as any).executionCtx;
        if (ctx?.waitUntil) {
          ctx.waitUntil(cfCache.put(cacheKey, edgeResponse));
        } else {
          await cfCache.put(cacheKey, edgeResponse);
        }
      } catch (e) {
        console.warn('Edge cache put error:', e);
      }
    }

    const headers = new Headers(res.headers);
    headers.set('Cache-Control', 'public, max-age=604800, s-maxage=604800');
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('X-Cache', 'MISS');

    return new Response(arrayBuffer, {
      status: res.status,
      headers
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`Preview generation error for ${id}:`, errorMsg);
    return c.json({ success: false, error: errorMsg }, 500);
  }
});
