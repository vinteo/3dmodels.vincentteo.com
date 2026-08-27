import { Env, ModelConfig, TranslationStatus } from '../types';
import { generateMockSTL, generateMockSTEP } from './mock';

export class OnshapeClient {
  private accessKey?: string;
  private secretKey?: string;
  private baseUrl: string;
  private isMockMode: boolean;

  constructor(env: Env = {}) {
    this.accessKey = env?.ONSHAPE_ACCESS_KEY;
    this.secretKey = env?.ONSHAPE_SECRET_KEY;
    this.baseUrl = env?.ONSHAPE_BASE_URL || 'https://cad.onshape.com';

    // Auto-detect mock mode: if keys are missing or MOCK_MODE === 'true', enable mock mode
    if (env?.MOCK_MODE === 'true') {
      this.isMockMode = true;
    } else if (env?.MOCK_MODE === 'false') {
      this.isMockMode = false;
    } else {
      // auto
      this.isMockMode = !this.accessKey || !this.secretKey;
    }
  }

  public get isMock(): boolean {
    return this.isMockMode;
  }

  private getAuthHeader(): Record<string, string> {
    if (!this.accessKey || !this.secretKey) {
      throw new Error('Onshape API keys (ONSHAPE_ACCESS_KEY and OSHAPE_SECRET_KEY) are required.');
    }
    const credentials = btoa(`${this.accessKey}:${this.secretKey}`);
    return {
      Authorization: `Basic ${credentials}`,
      Accept: 'application/json;charset=UTF-8;qs=0.09',
      'Content-Type': 'application/json'
    };
  }

  /**
   * Fetches the dynamic configuration schema directly from the Onshape Part Studio element
   */
  async getElementConfiguration(model: ModelConfig): Promise<unknown> {
    if (this.isMockMode) {
      return {
        configurationParameters: model.parameters.map((p) => ({
          typeName: 'BTMConfigurationParameter',
          message: {
            parameterId: p.id,
            parameterName: p.name,
            typeName: p.type === 'quantity' ? 'BTMConfigurationParameterQuantity' : 'BTMConfigurationParameterEnum',
            rangeAndDefault: {
              minValue: p.min,
              maxValue: p.max,
              defaultValue: typeof p.default === 'number' ? p.default : undefined,
              units: p.unit
            }
          }
        }))
      };
    }

    const url = `${this.baseUrl}/api/v6/elements/d/${model.documentId}/w/${model.workspaceId}/e/${model.elementId}/configuration`;
    const res = await fetch(url, {
      headers: this.getAuthHeader()
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to fetch Onshape configuration (${res.status}): ${errText}`);
    }

    return res.json();
  }

  /**
   * Fetches an STL 3D mesh for the configured model
   */
  async getSTL(
    model: ModelConfig,
    configuration: string,
    mode: 'binary' | 'ascii' = 'binary',
    units: 'millimeter' | 'inch' = 'millimeter'
  ): Promise<Response> {
    if (this.isMockMode) {
      const stl = generateMockSTL(model, configuration);
      return new Response(stl, {
        headers: {
          'Content-Type': 'model/stl',
          'Content-Disposition': `attachment; filename="${model.id}.stl"`,
          'X-Mock-Mode': 'true'
        }
      });
    }

    const encConfig = encodeURIComponent(configuration);
    const url = `${this.baseUrl}/api/v6/partstudios/d/${model.documentId}/w/${model.workspaceId}/e/${model.elementId}/stl?configuration=${encConfig}&mode=${mode}&units=${units}`;

    const res = await fetch(url, {
      headers: {
        Authorization: this.getAuthHeader().Authorization,
        Accept: 'application/octet-stream'
      }
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Onshape STL export failed (${res.status}): ${err}`);
    }

    return res;
  }

  /**
   * Fetches glTF geometry for 3D render preview (if available directly)
   */
  async getGltf(model: ModelConfig, configuration: string): Promise<Response> {
    if (this.isMockMode) {
      // Return mock STL with model/stl header which the frontend viewer natively supports
      const stl = generateMockSTL(model, configuration);
      return new Response(stl, {
        headers: {
          'Content-Type': 'model/stl',
          'X-Mock-Mode': 'true'
        }
      });
    }

    const encConfig = encodeURIComponent(configuration);
    const url = `${this.baseUrl}/api/v6/partstudios/d/${model.documentId}/w/${model.workspaceId}/e/${model.elementId}/gltf?configuration=${encConfig}`;

    const res = await fetch(url, {
      headers: {
        Authorization: this.getAuthHeader().Authorization,
        Accept: 'model/gltf-binary, model/gltf+json, application/octet-stream'
      }
    });

    // If direct gltf is not supported for this element, fall back to STL preview
    if (!res.ok) {
      return this.getSTL(model, configuration, 'binary', 'millimeter');
    }

    return res;
  }

  /**
   * Initiates an asynchronous STEP translation export in Onshape and polls until completion.
   */
  async exportStep(
    model: ModelConfig,
    configuration: string,
    stepVersion: 'AP203' | 'AP214' | 'AP242' = 'AP242'
  ): Promise<Response> {
    if (this.isMockMode) {
      const step = generateMockSTEP(model, configuration);
      return new Response(step, {
        headers: {
          'Content-Type': 'application/step',
          'Content-Disposition': `attachment; filename="${model.id}.step"`,
          'X-Mock-Mode': 'true'
        }
      });
    }

    // Initiate translation
    const translationUrl = `${this.baseUrl}/api/v6/partstudios/d/${model.documentId}/w/${model.workspaceId}/e/${model.elementId}/translations`;
    const initRes = await fetch(translationUrl, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify({
        formatName: 'STEP',
        version: stepVersion,
        configuration,
        storeInDocument: false,
        grouping: true
      })
    });

    if (!initRes.ok) {
      const err = await initRes.text();
      throw new Error(`Failed to initiate STEP translation (${initRes.status}): ${err}`);
    }

    const initData = (await initRes.json()) as TranslationStatus;
    const translationId = initData.id;

    // Poll until DONE (max 30 seconds, 1.5s interval)
    let attempts = 0;
    const maxAttempts = 20;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      attempts++;

      const statusRes = await fetch(`${this.baseUrl}/api/v6/translations/${translationId}`, {
        headers: this.getAuthHeader()
      });

      if (!statusRes.ok) continue;

      const statusData = (await statusRes.json()) as TranslationStatus;
      if (statusData.requestState === 'DONE' && statusData.resultExternalDataIds?.[0]) {
        const externalDataId = statusData.resultExternalDataIds[0];
        const downloadUrl = `${this.baseUrl}/api/v6/documents/d/${model.documentId}/externaldata/${externalDataId}`;

        const fileRes = await fetch(downloadUrl, {
          headers: {
            Authorization: this.getAuthHeader().Authorization,
            Accept: 'application/octet-stream'
          }
        });

        return new Response(fileRes.body, {
          headers: {
            'Content-Type': 'application/step',
            'Content-Disposition': `attachment; filename="${model.id}.step"`
          }
        });
      }

      if (statusData.requestState === 'FAILED') {
        throw new Error(`Onshape translation failed: ${statusData.failureReason || 'Unknown error'}`);
      }
    }

    throw new Error('STEP translation timed out while waiting for Onshape.');
  }
}
