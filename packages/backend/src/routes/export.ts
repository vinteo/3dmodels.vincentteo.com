import { Hono } from 'hono';
import { Env, ExportRequest } from '../types';
import { getModelById, buildConfigurationString } from '../config/models';
import { OnshapeClient } from '../onshape/client';

export const exportRouter = new Hono<{ Bindings: Env }>();

/**
 * POST /api/models/:id/export
 * Generates an STL or STEP file for the configured parameters and triggers browser file download
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

  const client = new OnshapeClient(c.env);

  try {
    let res: Response;
    const format = body.format?.toLowerCase();

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

    const headers = new Headers(res.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set(
      'Content-Disposition',
      `attachment; filename="${model.id}-${Date.now()}.${format === 'step' ? 'step' : 'stl'}"`
    );

    return new Response(res.body, {
      status: res.status,
      headers
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`Export error for ${id}:`, errorMsg);
    return c.json({ success: false, error: errorMsg }, 500);
  }
});
