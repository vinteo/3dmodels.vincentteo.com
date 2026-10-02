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
  calculateOpenGridDimensions,
  calculateOpenGridDisplayCaseShellDynamicConstraints
} from '../engines/openscad/models/openGridDisplayCaseShell';
import {
  openGridDisplayCaseCoverParameters,
  calculateOpenGridCoverDimensions
} from '../engines/openscad/models/openGridDisplayCaseCover';
import {
  openGridDisplayCaseConnectorParameters,
  calculateOpenGridConnectorDimensions
} from '../engines/openscad/models/openGridDisplayCaseConnector';
import {
  openGridDeskOrganiserBinParameters,
  calculateOpenGridDeskOrganiserBinDimensions,
  calculateOpenGridDeskOrganiserBinDynamicConstraints
} from '../engines/openscad/models/openGridDeskOrganiserBin';
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
    expect(model?.parameters.length).toBe(openGridDisplayCaseShellParameters.length);
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
    expect(defaults.h_divider_count).toBe(0);
    expect(defaults.h_divider_position_mode).toBe('auto');
    expect(defaults.h_divider_thickness).toBe(3);
    expect(defaults.h_divider_1_pos).toBe(0);
    expect(defaults.h_divider_1_depth).toBe(32);
    expect(defaults.v_divider_count).toBe(0);
    expect(defaults.v_divider_position_mode).toBe('auto');
    expect(defaults.v_divider_thickness).toBe(3);
    expect(defaults.v_divider_1_pos).toBe(0);
    expect(defaults.v_divider_1_depth).toBe(32);
  });

  it('calculates display case dimensions in OpenGrid units mode with dividers', () => {
    const dims = calculateOpenGridDimensions({
      dimension_mode: 'grid',
      grid_width: 6,
      grid_height: 4,
      depth: 32,
      wall_thickness: 5,
      back_thickness: 1,
      h_divider_count: 2,
      v_divider_count: 1
    });

    const outerWidth = dims.find((d) => d.id === 'outer_width');
    const outerHeight = dims.find((d) => d.id === 'outer_height');
    const totalDepth = dims.find((d) => d.id === 'total_depth');
    const innerOpening = dims.find((d) => d.id === 'inner_opening');
    const compartments = dims.find((d) => d.id === 'compartments');

    expect(outerWidth?.formatted).toBe('168.0 mm (6u)');
    expect(outerHeight?.formatted).toBe('112.0 mm (4u)');
    expect(totalDepth?.formatted).toBe('33.0 mm');
    expect(innerOpening?.formatted).toBe('158.0 × 102.0 mm');
    expect(compartments?.value).toBe(6);
    expect(compartments?.formatted).toBe('6 cells (2 col × 3 row)');
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

  it('registers and retrieves the OpenGrid Desk Organiser Bin model', () => {
    const model = getOpenSCADModel('opengrid-desk-organiser-bin');
    expect(model).toBeDefined();
    expect(model?.id).toBe('opengrid-desk-organiser-bin');
    expect(model?.name).toBe('OpenGrid Desk Organiser Bin');
    expect(model?.project).toBe('OpenGrid Desk Organiser');
    expect(model?.partName).toBe('Bin');
    expect(model?.parameters.length).toBe(openGridDeskOrganiserBinParameters.length);
    expect(model?.links?.length).toBe(3);
    expect(model?.links?.[0].site).toBe('blog');
    expect(model?.links?.[1].site).toBe('printables');
    expect(model?.links?.[2].site).toBe('qidimaker');
    expect(model?.aiDisclosure?.modelingAiAssisted).toBe(true);
    expect(model?.aiDisclosure?.modelNotice).toContain('AI assistance');
    expect(isOpenSCADModel('opengrid-desk-organiser-bin')).toBe(true);
  });

  it('extracts default parameters from OpenGrid Desk Organiser Bin model', () => {
    const defaults = extractDefaultOpenSCADParameters(openGridDeskOrganiserBinParameters);
    expect(defaults.grid_width).toBe(2);
    expect(defaults.grid_depth).toBe(2);
    expect(defaults.height).toBe(100);
    expect(defaults.wall_thickness).toBe(1.6);
    expect(defaults.bottom_thickness).toBe(2.0);
    expect(defaults.corner_chamfer).toBe(4.2);
    expect(defaults.inner_base_radius).toBe(2.5);
    expect(defaults.tolerance).toBe(0.5);
    expect(defaults.snap_type).toBe('lite');
    expect(defaults.dividers_x).toBe(0);
    expect(defaults.divider_x_position_mode).toBe('auto');
    expect(defaults.dividers_y).toBe(0);
    expect(defaults.divider_y_position_mode).toBe('auto');
    expect(defaults.divider_thickness).toBe(1.2);
  });

  it('calculates desk organiser bin dimensions accurately', () => {
    const dims = calculateOpenGridDeskOrganiserBinDimensions({
      grid_width: 2,
      grid_depth: 2,
      height: 100,
      wall_thickness: 1.6,
      bottom_thickness: 2.0,
      corner_chamfer: 4.2,
      inner_base_radius: 2.5,
      tolerance: 0.5,
      snap_type: 'lite',
      dividers_x: 0,
      dividers_y: 0
    });

    const outerW = dims.find((d) => d.id === 'outer_width');
    const outerD = dims.find((d) => d.id === 'outer_depth');
    const binH = dims.find((d) => d.id === 'bin_height');
    const totalH = dims.find((d) => d.id === 'total_height');
    const snapCount = dims.find((d) => d.id === 'snap_count');
    const compartments = dims.find((d) => d.id === 'compartments');
    const chamfer = dims.find((d) => d.id === 'corner_chamfer');
    const baseR = dims.find((d) => d.id === 'inner_base_radius');

    expect(outerW?.formatted).toBe('55.5 mm (2u)');
    expect(outerD?.formatted).toBe('55.5 mm (2u)');
    expect(binH?.formatted).toBe('100.0 mm');
    expect(totalH?.formatted).toBe('103.4 mm');
    expect(snapCount?.formatted).toBe('4 snaps (2 × 2, Lite)');
    expect(compartments?.formatted).toBe('1 cell (open bin)');
    expect(chamfer?.formatted).toBe('4.2 mm (45°)');
    expect(baseR?.formatted).toBe('2.5 mm');

    // Test with Normal Snap and dividers
    const normalDims = calculateOpenGridDeskOrganiserBinDimensions({
      grid_width: 3,
      grid_depth: 2,
      height: 50,
      snap_type: 'normal',
      dividers_x: 2,
      dividers_y: 1
    });

    const divCompartments = normalDims.find((d) => d.id === 'compartments');
    const divSnaps = normalDims.find((d) => d.id === 'snap_count');
    const divTotalH = normalDims.find((d) => d.id === 'total_height');
    expect(divCompartments?.formatted).toBe('6 cells (3 col × 2 row)');
    expect(divSnaps?.formatted).toBe('6 snaps (3 × 2, Normal)');
    expect(divTotalH?.formatted).toBe('56.8 mm');

    // Test with no outer walls (flat base plate with dividers)
    const noWallsDims = calculateOpenGridDeskOrganiserBinDimensions({
      grid_width: 2,
      grid_depth: 2,
      height: 30,
      outer_walls: false,
      dividers_x: 1,
      dividers_y: 1
    });
    const noWallsHeight = noWallsDims.find((d) => d.id === 'bin_height');
    expect(noWallsHeight?.label).toBe('Divider Height');
    expect(noWallsHeight?.formatted).toBe('30.0 mm');
  });

  it('dynamically limits divider positions based on grid width and depth', () => {
    // 2x2 grid (outer = 56 - 0.5 = 55.5mm, inner = 55.5 - 3.2 = 52.3mm -> max 52)
    const constraints2x2 = calculateOpenGridDeskOrganiserBinDynamicConstraints({
      grid_width: 2,
      grid_depth: 2,
      wall_thickness: 1.6,
      tolerance: 0.5
    });

    expect(constraints2x2.divider_x_1_pos.max).toBe(52);
    expect(constraints2x2.divider_x_10_pos.max).toBe(52);
    expect(constraints2x2.divider_y_1_pos.max).toBe(52);
    expect(constraints2x2.divider_y_10_pos.max).toBe(52);
    expect(constraints2x2.divider_x_1_pos.min).toBe(0);
    expect(constraints2x2.divider_x_10_pos.min).toBe(0);

    // 4x1 grid (X inner = 111.5 - 3.2 = 108.3mm -> 108, Y inner = 27.5 - 3.2 = 24.3mm -> 24)
    const constraints4x1 = calculateOpenGridDeskOrganiserBinDynamicConstraints({
      grid_width: 4,
      grid_depth: 1,
      wall_thickness: 1.6,
      tolerance: 0.5
    });

    expect(constraints4x1.divider_x_1_pos.max).toBe(108);
    expect(constraints4x1.divider_y_1_pos.max).toBe(24);
  });

  it('dynamically limits display case divider positions based on shell dimensions', () => {
    // Grid mode: 6x4 units (168x112 mm nominal, wall 5mm -> inner 158x102 mm)
    const gridConstraints = calculateOpenGridDisplayCaseShellDynamicConstraints({
      dimension_mode: 'grid',
      grid_width: 6,
      grid_height: 4,
      wall_thickness: 5
    });

    expect(gridConstraints.v_divider_1_pos.max).toBe(158);
    expect(gridConstraints.h_divider_1_pos.max).toBe(102);
    expect(gridConstraints.v_divider_1_pos.min).toBe(0);

    // Custom mode: 200x150 mm (wall 5mm -> inner 190x140 mm)
    const customConstraints = calculateOpenGridDisplayCaseShellDynamicConstraints({
      dimension_mode: 'custom',
      custom_width: 200,
      custom_height: 150,
      wall_thickness: 5
    });

    expect(customConstraints.v_divider_1_pos.max).toBe(190);
    expect(customConstraints.h_divider_1_pos.max).toBe(140);
  });

  it('renders OpenGrid Desk Organiser Bin to valid STL via OpenSCAD WASM', async () => {
    const model = getOpenSCADModel('opengrid-desk-organiser-bin');
    expect(model).toBeDefined();

    const injectedCode = injectOpenSCADParameters(model!.scadContent, {
      grid_width: 1,
      grid_depth: 1,
      height: 20
    });

    const oscad = await createOpenSCAD();
    const inst = oscad.getInstance();
    inst.FS.writeFile('/input.scad', injectedCode);
    inst.callMain(['/input.scad', '-o', '/output.stl']);
    const stl = inst.FS.readFile('/output.stl');
    expect(stl.length).toBeGreaterThan(1000);
    inst.FS.unlink('/input.scad');
    inst.FS.unlink('/output.stl');
  });

  it('renders OpenGrid Desk Organiser Bin with custom divider positions', async () => {
    const model = getOpenSCADModel('opengrid-desk-organiser-bin');
    expect(model).toBeDefined();

    const injectedCode = injectOpenSCADParameters(model!.scadContent, {
      grid_width: 2,
      grid_depth: 2,
      height: 25,
      dividers_x: 2,
      divider_x_position_mode: 'custom',
      divider_x_1_pos: 12,
      divider_x_2_pos: 35,
      dividers_y: 1,
      divider_y_position_mode: 'custom',
      divider_y_1_pos: 20
    });

    const oscad = await createOpenSCAD();
    const inst = oscad.getInstance();
    inst.FS.writeFile('/input.scad', injectedCode);
    inst.callMain(['/input.scad', '-o', '/output.stl']);
    const stl = inst.FS.readFile('/output.stl');
    expect(stl.length).toBeGreaterThan(1000);
    inst.FS.unlink('/input.scad');
    inst.FS.unlink('/output.stl');
  });

  it('renders OpenGrid Desk Organiser Bin without outer walls', async () => {
    const model = getOpenSCADModel('opengrid-desk-organiser-bin');
    expect(model).toBeDefined();

    const injectedCode = injectOpenSCADParameters(model!.scadContent, {
      grid_width: 2,
      grid_depth: 2,
      height: 20,
      outer_walls: false,
      dividers_x: 1,
      divider_x_position_mode: 'custom',
      divider_x_1_pos: 25,
      dividers_y: 0
    });

    const oscad = await createOpenSCAD();
    const inst = oscad.getInstance();
    inst.FS.writeFile('/input.scad', injectedCode);
    inst.callMain(['/input.scad', '-o', '/output.stl']);
    const stl = inst.FS.readFile('/output.stl');
    expect(stl.length).toBeGreaterThan(1000);
    inst.FS.unlink('/input.scad');
    inst.FS.unlink('/output.stl');
  });

  it('renders OpenGrid Desk Organiser Bin with divider at position 0 in custom mode', async () => {
    const model = getOpenSCADModel('opengrid-desk-organiser-bin');
    expect(model).toBeDefined();

    const injectedCode = injectOpenSCADParameters(model!.scadContent, {
      grid_width: 2,
      grid_depth: 2,
      height: 20,
      dividers_x: 1,
      divider_x_position_mode: 'custom',
      divider_x_1_pos: 0,
      dividers_y: 0
    });

    const oscad = await createOpenSCAD();
    const inst = oscad.getInstance();
    inst.FS.writeFile('/input.scad', injectedCode);
    inst.callMain(['/input.scad', '-o', '/output.stl']);
    const stl = inst.FS.readFile('/output.stl');
    expect(stl.length).toBeGreaterThan(1000);
    inst.FS.unlink('/input.scad');
    inst.FS.unlink('/output.stl');
  });

  it('ignores custom position values when switching back to even spacing', async () => {
    const model = getOpenSCADModel('opengrid-desk-organiser-bin');
    expect(model).toBeDefined();

    const injectedCode = injectOpenSCADParameters(model!.scadContent, {
      grid_width: 2,
      grid_depth: 2,
      height: 20,
      dividers_x: 1,
      divider_x_position_mode: 'auto',
      divider_x_1_pos: 45,
      dividers_y: 0
    });

    const oscad = await createOpenSCAD();
    const inst = oscad.getInstance();
    inst.FS.writeFile('/input.scad', injectedCode);
    inst.callMain(['/input.scad', '-o', '/output.stl']);
    const stl = inst.FS.readFile('/output.stl');
    expect(stl.length).toBeGreaterThan(1000);
    inst.FS.unlink('/input.scad');
    inst.FS.unlink('/output.stl');
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
      },
      {
        id: 'opengrid-desk-organiser-bin',
        name: 'OpenGrid Desk Organiser Bin',
        description: 'Raw description',
        engine: 'openscad',
        tags: ['OpenGrid'],
        defaultConfiguration: '',
        parameters: []
      }
    ];

    const merged = mergeWithOpenSCADModels(rawCatalog);
    expect(merged.length).toBe(4);
    expect(merged[0].engine).toBe('openscad');
    expect(merged[0].parameters.length).toBe(openGridDisplayCaseShellParameters.length);
    expect(merged[1].engine).toBe('openscad');
    expect(merged[1].parameters.length).toBe(openGridDisplayCaseCoverParameters.length);
    expect(merged[2].engine).toBe('openscad');
    expect(merged[2].parameters.length).toBe(openGridDisplayCaseConnectorParameters.length);
    expect(merged[3].engine).toBe('openscad');
    expect(merged[3].parameters.length).toBe(openGridDeskOrganiserBinParameters.length);

    const allLocal = mergeWithLocalEngineModels(rawCatalog);
    const bin = allLocal.find((m) => m.id === 'opengrid-desk-organiser-bin');
    expect(bin).toBeDefined();
    expect(bin?.parameters.length).toBe(openGridDeskOrganiserBinParameters.length);
    expect(bin?.aiDisclosure?.modelingAiAssisted).toBe(true);
  });
});
