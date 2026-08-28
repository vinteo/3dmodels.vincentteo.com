import { describe, it, expect } from 'vitest';
import app from '../src/index';
import { getAllModels, getModelById, buildConfigurationString, parseConfigurationString } from '../src/config/models';
import { generateMockSTL, generateMockSTEP } from '../src/onshape/mock';

describe('Models Configuration and Parsing', () => {
  it('should load configured models from catalog', () => {
    const models = getAllModels();
    expect(models.length).toBeGreaterThan(0);
    expect(models[0].id).toBe('kumiko-pattern-keychain');
  });

  it('should retrieve a specific model by ID', () => {
    const model = getModelById('kumiko-pattern-keychain');
    expect(model).toBeDefined();
    expect(model?.name).toContain('Kumiko');
    expect(model?.parameters.length).toBeGreaterThan(0);
  });

  it('should serialize parameters into an Onshape configuration string', () => {
    const model = getModelById('kumiko-pattern-keychain')!;
    const configStr = buildConfigurationString(model, {
      hex_radius: 25,
      hex_thickness: 2.5
    });

    expect(configStr).toContain('hex_radius=25+millimeter');
    expect(configStr).toContain('hex_thickness=2.5+millimeter');
  });

  it('should parse an Onshape configuration string into key-value pairs', () => {
    const parsed = parseConfigurationString('Length=120+millimeter;Width=90+millimeter;Dividers=2');
    expect(parsed['Length']).toBe('120+millimeter');
    expect(parsed['Width']).toBe('90+millimeter');
    expect(parsed['Dividers']).toBe('2');
  });
});

describe('Mock Geometry Generators', () => {
  it('should generate valid ASCII STL file for mock rendering and export', () => {
    const model = getModelById('kumiko-pattern-keychain')!;
    const stl = generateMockSTL(model, 'hex_radius=20+millimeter');
    expect(stl.startsWith('solid ')).toBe(true);
    expect(stl.includes('facet normal')).toBe(true);
    expect(stl.endsWith(`endsolid ${model.id}\n`)).toBe(true);
  });

  it('should generate valid mock STEP file', () => {
    const model = getModelById('kumiko-pattern-keychain')!;
    const step = generateMockSTEP(model, 'hex_radius=20+millimeter');
    expect(step).toContain('ISO-10303-21;');
    expect(step).toContain('FILE_DESCRIPTION');
    expect(step).toContain('END-ISO-10303-21;');
  });
});

describe('Backend API Endpoints (Hono In-Memory Tests)', () => {
  it('GET /api/health should return ok and mockMode indicator', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.status).toBe('ok');
    expect(body.service).toBe('3dmodels-backend');
  });

  it('GET /api/models should return catalog of models', async () => {
    const res = await app.request('/api/models');
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/models/:id should return single model', async () => {
    const res = await app.request('/api/models/kumiko-pattern-keychain');
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('kumiko-pattern-keychain');
  });

  it('POST /api/models/:id/preview should return 3D STL preview data', async () => {
    const res = await app.request('/api/models/kumiko-pattern-keychain/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parameters: { hex_radius: 24, hex_thickness: 2.5 }
      })
    });
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('solid kumiko-pattern-keychain');
  });

  it('POST /api/models/:id/preview should cache subsequent identical requests in memory/edge cache', async () => {
    // First request should be a MISS
    const res1 = await app.request('/api/models/kumiko-pattern-keychain/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parameters: { hex_radius: 35, hex_thickness: 3 }
      })
    });
    expect(res1.status).toBe(200);
    expect(res1.headers.get('X-Cache')).toBe('MISS');

    // Second request with identical configuration should be a HIT
    const res2 = await app.request('/api/models/kumiko-pattern-keychain/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parameters: { hex_radius: 35, hex_thickness: 3 }
      })
    });
    expect(res2.status).toBe(200);
    expect(res2.headers.get('X-Cache')).toBe('HIT-MEMORY');
  });

  it('POST /api/models/:id/export should return downloadable STL file', async () => {
    const res = await app.request('/api/models/kumiko-pattern-keychain/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        format: 'stl',
        parameters: { hex_radius: 25 }
      })
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Disposition')).toContain('.stl');
  });

  it('POST /api/models/:id/export should return downloadable STEP file', async () => {
    const res = await app.request('/api/models/kumiko-pattern-keychain/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        format: 'step',
        parameters: { hex_radius: 25 }
      })
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Disposition')).toContain('.step');
  });
});
