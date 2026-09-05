import { describe, it, expect } from 'vitest';
import { createOpenSCAD } from 'openscad-wasm';
import {
  formatOpenSCADValue,
  injectOpenSCADParameters,
  extractDefaultOpenSCADParameters
} from '../engines/openscad/types';
import {
  getOpenSCADModel,
  getAllOpenSCADModels,
  isOpenSCADModel
} from '../engines/openscad/registry';
import {
  openGridDisplayCaseShellParameters,
  calculateOpenGridDimensions
} from '../engines/openscad/models/openGridDisplayCaseShell';
import {
  openGridDisplayCaseCoverParameters,
  calculateOpenGridCoverDimensions
} from '../engines/openscad/models/openGridDisplayCaseCover';
import {
  openGridDisplayCaseConnectorParameters,
  calculateOpenGridConnectorDimensions
} from '../engines/openscad/models/openGridDisplayCaseConnector';
import { mergeWithOpenSCADModels, mergeWithLocalEngineModels } from '../services/api';
import { ModelConfig } from '../types/model';

describe('OpenSCAD Value Formatting & Parameter Injection', () => {
  it('formats booleans into OpenSCAD boolean literals', () => {
    expect(formatOpenSCADValue(true)).toBe('true');
    expect(formatOpenSCADValue(false)).toBe('false');
  });

  it('formats numbers and numeric strings accurately', () => {
    expect(formatOpenSCADValue(112)).toBe('112');
    expect(formatOpenSCADValue(0.1)).toBe('0.1');
    expect(formatOpenSCADValue('168')).toBe('168');
  });

  it('formats strings with escaping', () => {
    expect(formatOpenSCADValue('hello')).toBe('"hello"');
    expect(formatOpenSCADValue('hello "world"')).toBe('"hello \\"world\\""');
  });

  it('replaces existing top-level variable definitions in SCAD code', () => {
    const rawScad = `height = 112;\nwidth = 168;\ndepth = 32;\n\ncube([width, height, depth]);\n`;
    const customized = injectOpenSCADParameters(rawScad, {
      height: 150,
      width: 200,
      depth: 45
    });

    expect(customized).toContain('height = 150;');
    expect(customized).toContain('width = 200;');
    expect(customized).toContain('depth = 45;');
    expect(customized).not.toContain('height = 112;');
    expect(customized).not.toContain('width = 168;');
  });

  it('prepends unhandled variables at the top of the SCAD file', () => {
    const rawScad = `cube([width, height, depth]);\n`;
    const customized = injectOpenSCADParameters(rawScad, {
      extra_feature: true,
      custom_text: 'sample'
    });

    expect(customized).toContain('extra_feature = true;');
    expect(customized).toContain('custom_text = "sample";');
    expect(customized).toContain('cube([width, height, depth]);');
  });

  it('supports multiple sequential OpenSCAD WASM render invocations without state corruption', async () => {
    const oscad1 = await createOpenSCAD();
    const inst1 = oscad1.getInstance();
    inst1.FS.writeFile('/input.scad', 'cube([10, 10, 10]);');
    inst1.callMain(['/input.scad', '-o', '/output.stl']);
    const stl1 = inst1.FS.readFile('/output.stl');
    expect(stl1.length).toBeGreaterThan(0);
    inst1.FS.unlink('/input.scad');
    inst1.FS.unlink('/output.stl');

    const oscad2 = await createOpenSCAD();
    const inst2 = oscad2.getInstance();
    inst2.FS.writeFile('/input.scad', 'cube([20, 20, 20]);');
    inst2.callMain(['/input.scad', '-o', '/output.stl']);
    const stl2 = inst2.FS.readFile('/output.stl');
    expect(stl2.length).toBeGreaterThan(0);
    inst2.FS.unlink('/input.scad');
    inst2.FS.unlink('/output.stl');
  });
});

describe('OpenSCAD Model Registry & OpenGrid Case Model', () => {
  it('registers and retrieves the OpenGrid Display Case Shell model', () => {
    const allModels = getAllOpenSCADModels();
    expect(allModels.length).toBeGreaterThan(0);

    const model = getOpenSCADModel('opengrid-display-case-shell');
    expect(model).toBeDefined();
    expect(model?.id).toBe('opengrid-display-case-shell');
    expect(model?.name).toBe('OpenGrid Display Case Shell');
    expect(model?.parameters.length).toBe(9);
    expect(isOpenSCADModel('opengrid-display-case-shell')).toBe(true);
    expect(isOpenSCADModel('unknown-model')).toBe(false);
  });

  it('extracts default parameters from OpenGrid model', () => {
    const defaults = extractDefaultOpenSCADParameters(openGridDisplayCaseShellParameters);
    expect(defaults.dimension_mode).toBe('grid');
    expect(defaults.grid_width).toBe(6);
    expect(defaults.grid_height).toBe(4);
    expect(defaults.custom_width).toBe(168);
    expect(defaults.custom_height).toBe(112);
    expect(defaults.depth).toBe(32);
    expect(defaults.wall_thickness).toBe(5);
    expect(defaults.back_thickness).toBe(1);
    expect(defaults.connector_offset).toBe(0.1);
  });

  it('calculates display case dimensions in OpenGrid units mode', () => {
    const dims = calculateOpenGridDimensions({
      dimension_mode: 'grid',
      grid_width: 6,
      grid_height: 4,
      depth: 32,
      wall_thickness: 5,
      back_thickness: 1
    });

    const outerWidth = dims.find((d) => d.id === 'outer_width');
    const outerHeight = dims.find((d) => d.id === 'outer_height');
    const totalDepth = dims.find((d) => d.id === 'total_depth');
    const innerOpening = dims.find((d) => d.id === 'inner_opening');

    expect(outerWidth?.formatted).toBe('168.0 mm (6u)');
    expect(outerHeight?.formatted).toBe('112.0 mm (4u)');
    expect(totalDepth?.formatted).toBe('33.0 mm');
    expect(innerOpening?.formatted).toBe('158.0 × 102.0 mm');
  });

  it('calculates display case dimensions in custom millimeter mode', () => {
    const dims = calculateOpenGridDimensions({
      dimension_mode: 'custom',
      custom_width: 200,
      custom_height: 150,
      depth: 30,
      wall_thickness: 5,
      back_thickness: 2
    });

    const outerWidth = dims.find((d) => d.id === 'outer_width');
    const outerHeight = dims.find((d) => d.id === 'outer_height');
    const totalDepth = dims.find((d) => d.id === 'total_depth');
    const innerOpening = dims.find((d) => d.id === 'inner_opening');

    expect(outerWidth?.formatted).toBe('200.0 mm');
    expect(outerHeight?.formatted).toBe('150.0 mm');
    expect(totalDepth?.formatted).toBe('32.0 mm');
    expect(innerOpening?.formatted).toBe('190.0 × 140.0 mm');
  });

  it('registers and retrieves the OpenGrid Display Case Cover model', () => {
    const model = getOpenSCADModel('opengrid-display-case-cover');
    expect(model).toBeDefined();
    expect(model?.id).toBe('opengrid-display-case-cover');
    expect(model?.name).toBe('OpenGrid Display Case Cover');
    expect(model?.parameters.length).toBe(12);
    expect(isOpenSCADModel('opengrid-display-case-cover')).toBe(true);
  });

  it('extracts default parameters from OpenGrid Cover model', () => {
    const defaults = extractDefaultOpenSCADParameters(openGridDisplayCaseCoverParameters);
    expect(defaults.dimension_mode).toBe('grid');
    expect(defaults.grid_width).toBe(6);
    expect(defaults.grid_height).toBe(4);
    expect(defaults.custom_width).toBe(168);
    expect(defaults.custom_height).toBe(112);
    expect(defaults.base_thickness).toBe(1);
    expect(defaults.arcylic_width).toBe(150);
    expect(defaults.arcylic_height).toBe(100);
    expect(defaults.arcylic_thickness).toBe(1);
    expect(defaults.connector_offset).toBe(0.05);
    expect(defaults.connector_depth).toBe(8);
    expect(defaults.connector_fillet).toBe(0.2);
  });

  it('calculates display case cover dimensions accurately', () => {
    const dims = calculateOpenGridCoverDimensions({
      dimension_mode: 'grid',
      grid_width: 6,
      grid_height: 4,
      base_thickness: 1,
      arcylic_width: 150,
      arcylic_height: 100,
      arcylic_thickness: 1
    });

    const outerWidth = dims.find((d) => d.id === 'outer_width');
    const outerHeight = dims.find((d) => d.id === 'outer_height');
    const acrylicSize = dims.find((d) => d.id === 'acrylic_sheet_size');
    const frameThickness = dims.find((d) => d.id === 'frame_thickness');

    expect(outerWidth?.formatted).toBe('168.0 mm (6u)');
    expect(outerHeight?.formatted).toBe('112.0 mm (4u)');
    expect(acrylicSize?.formatted).toBe('150.0 × 100.0 mm (1.0mm thk)');
    expect(frameThickness?.formatted).toBe('2.5 mm');
  });

  it('registers and retrieves the OpenGrid Display Case Connector model', () => {
    const model = getOpenSCADModel('opengrid-display-case-connector');
    expect(model).toBeDefined();
    expect(model?.id).toBe('opengrid-display-case-connector');
    expect(model?.name).toBe('OpenGrid Display Case Connector');
    expect(model?.parameters.length).toBe(11);
    expect(isOpenSCADModel('opengrid-display-case-connector')).toBe(true);
  });

  it('extracts default parameters from OpenGrid Connector model', () => {
    const defaults = extractDefaultOpenSCADParameters(openGridDisplayCaseConnectorParameters);
    expect(defaults.opengrid_snap).toBe(true);
    expect(defaults.connector_offset).toBe(0.05);
    expect(defaults.connector_fillet).toBe(0.2);
    expect(defaults.corner_1).toBe(true);
    expect(defaults.corner_1_depth).toBe(25);
    expect(defaults.corner_2).toBe(true);
    expect(defaults.corner_2_depth).toBe(25);
    expect(defaults.corner_3).toBe(true);
    expect(defaults.corner_3_depth).toBe(25);
    expect(defaults.corner_4).toBe(true);
    expect(defaults.corner_4_depth).toBe(25);
  });

  it('calculates display case connector dimensions accurately', () => {
    const dims = calculateOpenGridConnectorDimensions({
      opengrid_snap: true,
      corner_1: true,
      corner_1_depth: 30,
      corner_2: true,
      corner_2_depth: 25,
      corner_3: false,
      corner_4: true,
      corner_4_depth: 20
    });

    const activeCorners = dims.find((d) => d.id === 'active_corners');
    const maxDepth = dims.find((d) => d.id === 'max_depth');
    const snapBase = dims.find((d) => d.id === 'snap_base');

    expect(activeCorners?.formatted).toBe('3 of 4 Active');
    expect(maxDepth?.formatted).toBe('30.0 mm');
    expect(snapBase?.formatted).toBe('Mounted');
  });

  it('merges OpenSCAD models into the catalog seamlessly', () => {
    const rawCatalog: ModelConfig[] = [
      {
        id: 'opengrid-display-case-shell',
        name: 'OpenGrid Display Case Shell',
        description: 'Raw description',
        engine: 'openscad',
        tags: ['OpenGrid'],
        defaultConfiguration: '',
        parameters: []
      },
      {
        id: 'opengrid-display-case-cover',
        name: 'OpenGrid Display Case Cover',
        description: 'Raw description',
        engine: 'openscad',
        tags: ['OpenGrid'],
        defaultConfiguration: '',
        parameters: []
      },
      {
        id: 'opengrid-display-case-connector',
        name: 'OpenGrid Display Case Connector',
        description: 'Raw description',
        engine: 'openscad',
        tags: ['OpenGrid'],
        defaultConfiguration: '',
        parameters: []
      }
    ];

    const merged = mergeWithOpenSCADModels(rawCatalog);
    expect(merged.length).toBe(3);
    expect(merged[0].engine).toBe('openscad');
    expect(merged[0].parameters.length).toBe(openGridDisplayCaseShellParameters.length);
    expect(merged[1].engine).toBe('openscad');
    expect(merged[1].parameters.length).toBe(openGridDisplayCaseCoverParameters.length);
    expect(merged[2].engine).toBe('openscad');
    expect(merged[2].parameters.length).toBe(openGridDisplayCaseConnectorParameters.length);

    const allLocal = mergeWithLocalEngineModels(rawCatalog);
    const connector = allLocal.find((m) => m.id === 'opengrid-display-case-connector');
    expect(connector).toBeDefined();
    expect(connector?.parameters.length).toBe(openGridDisplayCaseConnectorParameters.length);
  });
});
