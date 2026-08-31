import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './types';
import { modelsRouter } from './routes/models';
import { previewRouter } from './routes/preview';
import { exportRouter } from './routes/export';
import { OnshapeClient } from './onshape/client';

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for all routes so frontend on GitHub Pages or localhost can connect freely
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposeHeaders: ['Content-Disposition', 'Content-Length', 'X-Mock-Mode']
  })
);

// Health check and environment probe
app.get('/api/health', (c) => {
  const client = new OnshapeClient(c.env);
  return c.json({
    status: 'ok',
    service: '3dmodels-backend',
    timestamp: new Date().toISOString(),
    mockMode: client.isMock
  });
});

// Mount modular sub-routers
app.route('/api/models', modelsRouter);
app.route('/api/models', previewRouter);
app.route('/api/models', exportRouter);

// Fallback 404 handler
app.notFound((c) => {
  return c.json({ success: false, error: 'Endpoint not found' }, 404);
});

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled worker error:', err);
  return c.json(
    {
      success: false,
      error: err.message || 'Internal Server Error'
    },
    500
  );
});

export default app;
