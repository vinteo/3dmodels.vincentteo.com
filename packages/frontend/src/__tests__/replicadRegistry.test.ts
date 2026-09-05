import { describe, it, expect } from 'vitest';
import {
  getReplicadModel,
  getAllReplicadModels,
  isReplicadModel,
  registerReplicadModel
} from '../engines/replicad';
import {
  extractDefaultParameters,
  buildDefaultConfigurationString,
  ReplicadModelDefinition
} from '../engines/replicad/types';
import {
  defaultKumikoParameters,
  kumikoParameters
} from '../engines/replicad/models/kumikoKeychain';
import { mergeWithReplicadModels } from '../services/api';
import { ModelConfig } from '../types/model';

describe('Replicad Model Registry & Parameter Management', () => {
  it('registers and retrieves the Kumiko Keychain model definition', () => {
    const allModels = getAllReplicadModels();
    expect(allModels.length).toBeGreaterThan(0);

    const model = getReplicadModel('kumiko-keychain');
    expect(model).toBeDefined();
    expect(model?.id).toBe('kumiko-keychain');
    expect(model?.name).toBe('Kumiko Keychain');
    expect(model?.parameters.length).toBeGreaterThan(15);

    // Alias lookup
    expect(getReplicadModel('kumiko-keychain-replicad')).toBeDefined();
  });

  it('identifies registered models via isReplicadModel', () => {
    expect(isReplicadModel('kumiko-keychain')).toBe(true);
    expect(isReplicadModel('kumiko-keychain-replicad')).toBe(true);
    expect(isReplicadModel('kumiko-pattern-keychain')).toBe(true);
    expect(isReplicadModel('unknown-model-xyz')).toBe(false);
  });

  it('extracts default parameters from parameter definitions accurately', () => {
    const defaults = extractDefaultParameters(kumikoParameters);
    expect(defaults.hex_radius).toBe(20);
    expect(defaults.include_keychain_ring).toBe(true);
    expect(defaults.section_1).toBe('1');
    expect(defaults.height).toBe(3);
    expect(defaults).toEqual(defaultKumikoParameters);
  });

  it('builds a default configuration string from parameters', () => {
    const configStr = buildDefaultConfigurationString(kumikoParameters);
    expect(configStr).toContain('hex_radius=20+millimeter');
    expect(configStr).toContain('include_keychain_ring=true');
    expect(configStr).toContain('section_1=1');
  });

  it('merges Replicad model parameters into catalog models seamlessly', () => {
    const rawCatalog: ModelConfig[] = [
      {
        id: 'kumiko-keychain',
        name: 'Kumiko Keychain',
        description: 'Test description',
        engine: 'replicad',
        tags: ['Kumiko'],
        defaultConfiguration: '',
        parameters: [], // Empty in raw catalog JSON
        links: [{ label: 'Printables', url: 'https://printables.com' }]
      }
    ];

    const merged = mergeWithReplicadModels(rawCatalog);
    expect(merged.length).toBe(1);
    expect(merged[0].parameters.length).toBe(kumikoParameters.length);
    expect(merged[0].parameters.find((p) => p.id === 'hex_radius')?.default).toBe(20);
    expect(merged[0].links?.length).toBe(3);
    expect(merged[0].defaultConfiguration).toContain('hex_radius=20+millimeter');
  });

  it('allows registering custom Replicad models dynamically', () => {
    const mockModel: ReplicadModelDefinition = {
      id: 'custom-cube-test',
      name: 'Custom Cube',
      description: 'A test parametric cube',
      tags: ['Test'],
      parameters: [
        {
          id: 'size',
          name: 'Cube Size',
          type: 'quantity',
          unit: 'millimeter',
          default: 15,
          min: 5,
          max: 50
        }
      ],
      buildParts: (_params: any) => []
    };

    registerReplicadModel(mockModel);

    expect(isReplicadModel('custom-cube-test')).toBe(true);
    const retrieved = getReplicadModel('custom-cube-test');
    expect(retrieved?.name).toBe('Custom Cube');
    expect(retrieved?.parameters[0].default).toBe(15);

    // Verify auto-inclusion in mergeWithReplicadModels even if not in JSON catalog
    const catalogWithoutCustom: ModelConfig[] = [];
    const merged = mergeWithReplicadModels(catalogWithoutCustom);
    const found = merged.find((m) => m.id === 'custom-cube-test');
    expect(found).toBeDefined();
    expect(found?.engine).toBe('replicad');
    expect(found?.parameters[0].id).toBe('size');
  });
});
