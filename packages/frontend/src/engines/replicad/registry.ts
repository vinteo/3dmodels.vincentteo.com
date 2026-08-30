import { ReplicadModelDefinition } from './types';
import { kumikoKeychainModel } from './models/kumikoKeychain';

const modelRegistry = new Map<string, ReplicadModelDefinition<any>>();

// Register built-in models
registerReplicadModel(kumikoKeychainModel);

/**
 * Registers a Replicad model definition into the registry
 */
export function registerReplicadModel(model: ReplicadModelDefinition<any>): void {
  modelRegistry.set(model.id, model);
}

/**
 * Retrieves a Replicad model definition by ID (with fallback alias mapping if needed)
 */
export function getReplicadModel(id: string): ReplicadModelDefinition<any> | undefined {
  if (modelRegistry.has(id)) {
    return modelRegistry.get(id);
  }

  // Support legacy / alias ID mapping if needed
  if (id === 'kumiko-keychain-replicad' || id === 'kumiko-pattern-keychain') {
    return modelRegistry.get('kumiko-keychain');
  }

  return undefined;
}

/**
 * Checks if a given model ID corresponds to a registered Replicad model
 */
export function isReplicadModel(id: string): boolean {
  return (
    modelRegistry.has(id) ||
    id === 'kumiko-keychain' ||
    id === 'kumiko-keychain-replicad' ||
    id === 'kumiko-pattern-keychain'
  );
}

/**
 * Returns all registered Replicad model definitions
 */
export function getAllReplicadModels(): ReplicadModelDefinition<any>[] {
  return Array.from(modelRegistry.values());
}
