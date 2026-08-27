import { describe, it, expect } from 'vitest';
import app from '../src/index';
import { getAllModels, getModelById, buildConfigurationString, parseConfigurationString } from '../src/config/models';
import { generateMockSTL, generateMockSTEP } from '../src/onshape/mock';

describe('Models Configuration and Parsing', () => {
  it('should load configured models from catalog', () => {
    const models = getAllModels();
    expect(models.length).toBeGreaterThan(0);
    expect(models[0].id).toBe('parametric-desk-organizer');
  });

  it('should retrieve a specific model by ID', () => {
    const model = getModelById('parametric-shelf-bracket');
    expect(model).toBeDefined();
    expect(model?.name).toContain('Shelf Bracket');
    expect(model?.parameters.length).toBeGreaterThan(0);
  });

  it('should serialize parameters into an Onshape configuration string', () => {
    const model = getModelById('parametric-desk-organizer')!;
    const configStr = buildConfigurationString(model, {
      Length: 150,
      Width: 100,
      Dividers: '3',
      ChamferBase: true
    });

    expect(configStr).toContain('Length=150+millimeter');
    expect(configStr).toContain('Width=100+millimeter');
    expect(configStr).toContain('Dividers=3');
    expect(configStr).toContain('ChamferBase=true');
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
    const model = getModelById('parametric-desk-organizer')!;
    const stl = generateMockSTL(model, 'Length=120+millimeter;Width=90+millimeter');
    expect(stl.startsWith('solid ')).toBe(true);
    expect(stl.includes('facet normal')).toBe(true);
    expect(stl.endsWith(`endsolid ${model.id}\n`)).toBe(true);
  });

  it('should generate valid mock STEP file', () => {
    const model = getModelById('parametric-desk-organizer')!;
    const step = generateMockSTEP(model, 'Length=120+millimeter');
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
    const res = await app.request('/api/models/parametric-desk-organizer');
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('parametric-desk-organizer');
  });

  it('POST /api/models/:id/preview should return 3D STL preview data', async () => {
    const res = await app.request('/api/models/parametric-desk-organizer/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parameters: { Length: 130, Width: 85 }
      })
    });
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('solid parametric-desk-organizer');
  });

  it('POST /api/models/:id/export should return downloadable STL file', async () => {
    const res = await app.request('/api/models/parametric-desk-organizer/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        format: 'stl',
        parameters: { Length: 140 }
      })
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Disposition')).toContain('.stl');
  });

  it('POST /api/models/:id/export should return downloadable STEP file', async () => {
    const res = await app.request('/api/models/parametric-desk-organizer/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        format: 'step',
        parameters: { Length: 140 }
      })
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Disposition')).toContain('.step');
  });
});
