import { Hono } from 'hono';
import { Env, PreviewRequest } from '../types';
import { getModelById, buildConfigurationString } from '../config/models';
import { OnshapeClient } from '../onshape/client';

export const previewRouter = new Hono<{ Bindings: Env }>();

/**
 * POST /api/models/:id/preview
 * Fetches real-time 3D geometry for rendering in the browser viewport
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

  const client = new OnshapeClient(c.env);

  try {
    let res: Response;
    if (body.format === 'gltf') {
      res = await client.getGltf(model, configuration);
    } else {
      // STL preview is fast and widely supported for 3D printing workflows
      res = await client.getSTL(model, configuration, 'binary', 'millimeter');
    }

    // Set caching headers: caching by configuration string to optimize repeat queries
    const headers = new Headers(res.headers);
    headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(res.body, {
      status: res.status,
      headers
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`Preview generation error for ${id}:`, errorMsg);
    return c.json({ success: false, error: errorMsg }, 500);
  }
});
