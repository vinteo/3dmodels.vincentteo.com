import { Hono } from 'hono';
import { Env } from '../types';
import { getAllModels, getModelById } from '../config/models';
import { OnshapeClient } from '../onshape/client';

export const modelsRouter = new Hono<{ Bindings: Env }>();

/**
 * GET /api/models
 * Returns the list of all configured 3D models with their parameters
 */
modelsRouter.get('/', (c) => {
  const client = new OnshapeClient(c.env);
  const models = getAllModels();

  return c.json({
    success: true,
    mockMode: client.isMock,
    data: models
  });
});

/**
 * GET /api/models/:id
 * Returns a specific model with full configuration details and Onshape live schema if connected
 */
modelsRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const model = getModelById(id);

  if (!model) {
    return c.json({ success: false, error: `Model '${id}' not found` }, 404);
  }

  const client = new OnshapeClient(c.env);
  let liveSchema: unknown = null;

  try {
    liveSchema = await client.getElementConfiguration(model);
  } catch (err: unknown) {
    console.warn(`Failed to fetch live Onshape schema for ${id}:`, err);
  }

  return c.json({
    success: true,
    mockMode: client.isMock,
    data: {
      ...model,
      liveOnshapeSchema: liveSchema
    }
  });
});
