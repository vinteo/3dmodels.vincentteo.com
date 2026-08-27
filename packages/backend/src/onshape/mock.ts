import { ModelConfig } from '../types';
import { parseConfigurationString } from '../config/models';

/**
 * Generates an ASCII STL representation for a box/tray model based on parametric values.
 */
export function generateMockSTL(model: ModelConfig, configStr: string): string {
  const parsed = parseConfigurationString(configStr);

  let length = 120;
  let width = 90;
  let height = 45;

  if (model.id === 'parametric-desk-organizer') {
    length = parseFloat(parsed['Length'] || '120') || 120;
    width = parseFloat(parsed['Width'] || '90') || 90;
    height = parseFloat(parsed['Height'] || '45') || 45;
  } else if (model.id === 'parametric-shelf-bracket') {
    length = parseFloat(parsed['ArmLength'] || '140') || 140;
    width = parseFloat(parsed['Width'] || '32') || 32;
    height = parseFloat(parsed['Height'] || '110') || 110;
  } else if (model.id === 'parametric-cable-comb') {
    const slots = parseInt(parsed['WireSlots'] || '8', 10) || 8;
    length = slots * 8;
    width = 12;
    height = parseFloat(parsed['CombThickness'] || '4') || 4;
  }

  // Create simple 3D bounding geometry (triangulated cuboid / tray)
  const x0 = -length / 2;
  const x1 = length / 2;
  const y0 = -width / 2;
  const y1 = width / 2;
  const z0 = 0;
  const z1 = height;

  const triangles: Array<[[number, number, number], [number, number, number], [number, number, number]]> = [
    // Bottom face (z0)
    [[x0, y0, z0], [x1, y1, z0], [x1, y0, z0]],
    [[x0, y0, z0], [x0, y1, z0], [x1, y1, z0]],
    // Top face (z1)
    [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1]],
    [[x0, y0, z1], [x1, y1, z1], [x0, y1, z1]],
    // Front face (y0)
    [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1]],
    [[x0, y0, z0], [x1, y0, z1], [x0, y0, z1]],
    // Back face (y1)
    [[x0, y1, z0], [x1, y1, z1], [x1, y1, z0]],
    [[x0, y1, z0], [x0, y1, z1], [x1, y1, z1]],
    // Left face (x0)
    [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1]],
    [[x0, y0, z0], [x0, y1, z1], [x0, y1, z0]],
    // Right face (x1)
    [[x1, y0, z0], [x1, y1, z1], [x1, y0, z1]],
    [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1]]
  ];

  let stl = `solid ${model.id}\n`;
  for (const tri of triangles) {
    stl += `  facet normal 0 0 0\n    outer loop\n`;
    stl += `      vertex ${tri[0][0].toFixed(3)} ${tri[0][1].toFixed(3)} ${tri[0][2].toFixed(3)}\n`;
    stl += `      vertex ${tri[1][0].toFixed(3)} ${tri[1][1].toFixed(3)} ${tri[1][2].toFixed(3)}\n`;
    stl += `      vertex ${tri[2][0].toFixed(3)} ${tri[2][1].toFixed(3)} ${tri[2][2].toFixed(3)}\n`;
    stl += `    endloop\n  endfacet\n`;
  }
  stl += `endsolid ${model.id}\n`;

  return stl;
}

/**
 * Generates a mock STEP file content for offline testing.
 */
export function generateMockSTEP(model: ModelConfig, configStr: string): string {
  const timestamp = new Date().toISOString();
  return `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('Mock STEP CAD export from 3dmodels.vincentteo.com'), '2;1');
FILE_NAME('${model.id}.step', '${timestamp}', ('Vincent Teo'), ('Vin Space 3D Models'), 'Onshape API Mock Engine', 'Cloudflare Workers', '');
FILE_SCHEMA(('CONFIG_CONTROL_DESIGN'));
ENDSEC;
DATA;
/* Configuration: ${configStr} */
#1 = PRODUCT('${model.name}', '${model.id}', 'Parametric 3D Model', (#2));
#2 = PRODUCT_CONTEXT('', #3, 'mechanical');
#3 = APPLICATION_CONTEXT('configuration controlled 3d model');
ENDSEC;
END-ISO-10303-21;
`;
}
