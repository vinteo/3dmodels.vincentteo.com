import { Hono } from 'hono';
import { Env, ExportRequest } from '../types';
import { getModelById, buildConfigurationString } from '../config/models';
import { OnshapeClient } from '../onshape/client';

export const exportRouter = new Hono<{ Bindings: Env }>();

// In-Memory Export Cache
interface MemoryExportItem {
  buffer: ArrayBuffer;
  contentType: string;
  timestamp: number;
}

const memoryExportCache = new Map<string, MemoryExportItem>();
const MAX_EXPORT_CACHE_ITEMS = 40;
const EXPORT_TTL_MS = 24 * 3600 * 1000; // 24 hours

function getExportMemoryCache(key: string): MemoryExportItem | null {
  const item = memoryExportCache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > EXPORT_TTL_MS) {
    memoryExportCache.delete(key);
    return null;
  }
  return item;
}

function setExportMemoryCache(key: string, buffer: ArrayBuffer, contentType: string) {
  if (memoryExportCache.size >= MAX_EXPORT_CACHE_ITEMS) {
    const oldestKey = memoryExportCache.keys().next().value;
    if (oldestKey) memoryExportCache.delete(oldestKey);
  }
  memoryExportCache.set(key, { buffer, contentType, timestamp: Date.now() });
}

/**
 * POST /api/models/:id/export
 * Generates an STL or STEP file for the configured parameters and triggers browser file download
 * Uses Cloudflare Edge Cache (caches.default) + In-Memory LRU Cache for zero-cost repeat downloads
 */
exportRouter.post('/:id/export', async (c) => {
  const id = c.req.param('id');
  const model = getModelById(id);

  if (!model) {
    return c.json({ success: false, error: `Model '${id}' not found` }, 404);
  }

  let body: ExportRequest;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: 'Invalid JSON request body' }, 400);
  }

  let configuration = body.configuration;
  if (!configuration && body.parameters) {
    configuration = buildConfigurationString(model, body.parameters);
  }
  if (!configuration) {
    configuration = model.defaultConfiguration;
  }

  const format = body.format?.toLowerCase() || 'stl';
  const extension = format === 'step' ? 'step' : 'stl';
  const defaultContentType = format === 'step' ? 'application/step' : 'model/stl';
  const cacheKeyUrl = `https://cache.3dmodels.internal/api/models/${id}/export?format=${format}&version=${body.stepVersion || ''}&mode=${body.stlMode || ''}&units=${body.units || ''}&config=${encodeURIComponent(configuration)}`;
  const cacheKey = new Request(cacheKeyUrl, { method: 'GET' });

  // 1. Check in-memory isolate cache
  const memoryHit = getExportMemoryCache(cacheKeyUrl);
  if (memoryHit) {
    return new Response(memoryHit.buffer, {
      status: 200,
      headers: {
        'Content-Type': memoryHit.contentType,
        'Access-Control-Allow-Origin': '*',
        'Content-Disposition': `attachment; filename="${model.id}-${Date.now()}.${extension}"`,
        'X-Cache': 'HIT-MEMORY'
      }
    });
  }

  // 2. Check Cloudflare Worker Edge Cache
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cfCache = (globalThis as any).caches?.default;
  if (cfCache) {
    try {
      const cached = await cfCache.match(cacheKey);
      if (cached) {
        const headers = new Headers(cached.headers);
        headers.set('X-Cache', 'HIT-EDGE');
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set(
          'Content-Disposition',
          `attachment; filename="${model.id}-${Date.now()}.${extension}"`
        );
        return new Response(cached.body, {
          status: 200,
          headers
        });
      }
    } catch (e) {
      console.warn('Edge export cache match error:', e);
    }
  }

  // 3. Cache Miss - Fetch from Onshape
  const client = new OnshapeClient(c.env);

  try {
    let res: Response;

    if (format === 'step') {
      res = await client.exportStep(model, configuration, body.stepVersion || 'AP242');
    } else {
      // Default to STL
      res = await client.getSTL(
        model,
        configuration,
        body.stlMode || 'binary',
        body.units || 'millimeter'
      );
    }

    const contentType = res.headers.get('Content-Type') || defaultContentType;
    const arrayBuffer = await res.arrayBuffer();

    // Store in in-memory cache
    setExportMemoryCache(cacheKeyUrl, arrayBuffer, contentType);

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
        console.warn('Edge export cache put error:', e);
      }
    }

    const headers = new Headers(res.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('X-Cache', 'MISS');
    headers.set(
      'Content-Disposition',
      `attachment; filename="${model.id}-${Date.now()}.${extension}"`
    );

    return new Response(arrayBuffer, {
      status: res.status,
      headers
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`Export error for ${id}:`, errorMsg);
    return c.json({ success: false, error: errorMsg }, 500);
  }
});
