import { OpenSCADModelDefinition } from './types';
import { openGridDisplayCaseShellModel } from './models/openGridDisplayCaseShell';
import { openGridDisplayCaseCoverModel } from './models/openGridDisplayCaseCover';
import { openGridDisplayCaseConnectorModel } from './models/openGridDisplayCaseConnector';

const modelRegistry = new Map<string, OpenSCADModelDefinition<any>>();

// Register built-in models
registerOpenSCADModel(openGridDisplayCaseShellModel);
registerOpenSCADModel(openGridDisplayCaseCoverModel);
registerOpenSCADModel(openGridDisplayCaseConnectorModel);

/**
 * Registers an OpenSCAD model definition into the registry
 */
export function registerOpenSCADModel(model: OpenSCADModelDefinition<any>): void {
  modelRegistry.set(model.id, model);
}

/**
 * Retrieves an OpenSCAD model definition by ID
 */
export function getOpenSCADModel(id: string): OpenSCADModelDefinition<any> | undefined {
  return modelRegistry.get(id);
}

/**
 * Checks if a given model ID corresponds to a registered OpenSCAD model
 */
export function isOpenSCADModel(id: string): boolean {
  return modelRegistry.has(id);
}

/**
 * Returns all registered OpenSCAD model definitions
 */
export function getAllOpenSCADModels(): OpenSCADModelDefinition<any>[] {
  return Array.from(modelRegistry.values());
}
