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
    expect(isReplicadModel('flags-keychain')).toBe(true);
    expect(isReplicadModel('unknown-model-xyz')).toBe(false);
  });

  it('registers and retrieves the Flags of the World Keychain model definition under Hex Keychain project', () => {
    const flagsModel = getReplicadModel('flags-keychain');
    expect(flagsModel).toBeDefined();
    expect(flagsModel?.id).toBe('flags-keychain');
    expect(flagsModel?.project).toBe('Hex Keychain');
    expect(flagsModel?.partName).toBe('Flags of the World');
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
      },
      {
        id: 'flags-keychain',
        name: 'Flags of the World Keychain',
        description: 'Test description',
        engine: 'replicad',
        tags: ['Flags'],
        defaultConfiguration: '',
        parameters: []
      }
    ];

    const merged = mergeWithReplicadModels(rawCatalog);
    expect(merged.length).toBe(2);

    const kumiko = merged.find((m) => m.id === 'kumiko-keychain');
    expect(kumiko).toBeDefined();
    expect(kumiko?.parameters.length).toBe(kumikoParameters.length);
    expect(kumiko?.parameters.find((p) => p.id === 'hex_radius')?.default).toBe(20);
    expect(kumiko?.links?.length).toBe(3);
    expect(kumiko?.defaultConfiguration).toContain('hex_radius=20+millimeter');

    const flags = merged.find((m) => m.id === 'flags-keychain');
    expect(flags).toBeDefined();
    expect(flags?.project).toBe('Hex Keychain');
    expect(flags?.partName).toBe('Flags of the World');
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
