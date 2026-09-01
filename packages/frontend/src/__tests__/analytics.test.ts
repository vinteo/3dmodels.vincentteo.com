import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initGA, trackEvent, trackExport, trackModelView } from '../services/analytics';

describe('Google Analytics 4 Service', () => {
  beforeEach(() => {
    // Reset DOM scripts and window properties
    document.head.innerHTML = '';
    delete window.dataLayer;
    delete window.gtag;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return false if measurement ID is empty', () => {
    const initialized = initGA('');
    expect(initialized).toBe(false);
    expect(document.querySelector('script[src*="googletagmanager.com"]')).toBeNull();
  });

  it('should inject gtag.js script and initialize dataLayer with valid measurement ID using Arguments objects', () => {
    const testId = 'G-TEST123456';
    const initialized = initGA(testId);

    expect(initialized).toBe(true);

    const script = document.querySelector(
      `script[src*="googletagmanager.com/gtag/js?id=${testId}"]`
    ) as HTMLScriptElement | null;
    expect(script).not.toBeNull();
    expect(script?.async).toBe(true);

    expect(window.dataLayer).toBeDefined();
    expect(typeof window.gtag).toBe('function');

    // Verify that dataLayer contains arguments objects, not plain arrays
    expect(window.dataLayer?.length).toBeGreaterThanOrEqual(2);
    const firstItem = window.dataLayer?.[0];
    // In JavaScript, arguments object has callee property and [object Arguments] toString tag
    expect(Object.prototype.toString.call(firstItem)).toBe('[object Arguments]');
  });

  it('should not inject duplicate scripts when initGA is called multiple times', () => {
    const testId = 'G-TESTDUPE';
    initGA(testId);
    initGA(testId);

    const scripts = document.querySelectorAll(
      `script[src*="googletagmanager.com/gtag/js?id=${testId}"]`
    );
    expect(scripts.length).toBe(1);
  });

  it('should dispatch custom events via window.gtag', () => {
    initGA('G-TESTEVENT');
    const gtagSpy = vi.fn();
    window.gtag = gtagSpy;

    trackEvent('custom_interaction', { button_id: 'sample_btn' });

    expect(gtagSpy).toHaveBeenCalledWith('event', 'custom_interaction', {
      button_id: 'sample_btn'
    });
  });

  it('should track STL and STEP exports with cad_export event schema', () => {
    initGA('G-TESTEXPORT');
    const gtagSpy = vi.fn();
    window.gtag = gtagSpy;

    trackExport({
      modelId: 'kumiko-keychain',
      modelName: 'Kumiko Keychain',
      format: 'stl',
      units: 'millimeter',
      stlMode: 'binary',
      parameterCount: 5
    });

    expect(gtagSpy).toHaveBeenCalledWith('event', 'cad_export', {
      model_id: 'kumiko-keychain',
      model_name: 'Kumiko Keychain',
      export_format: 'stl',
      units: 'millimeter',
      stl_mode: 'binary',
      step_version: undefined,
      parameter_count: 5,
      event_category: 'engagement',
      event_label: 'Kumiko Keychain (STL)'
    });
  });

  it('should track model views with model_view and page_view schemas and update document.title', () => {
    initGA('G-TESTVIEW');
    const gtagSpy = vi.fn();
    window.gtag = gtagSpy;

    trackModelView('custom-enclosure', 'Parametric Enclosure', 'onshape');

    expect(document.title).toBe('Parametric Enclosure | Vincent Teo 3D Models');

    expect(gtagSpy).toHaveBeenCalledWith('event', 'model_view', {
      model_id: 'custom-enclosure',
      model_name: 'Parametric Enclosure',
      cad_engine: 'onshape',
      event_category: 'engagement',
      event_label: 'Parametric Enclosure'
    });

    expect(gtagSpy).toHaveBeenCalledWith(
      'event',
      'page_view',
      expect.objectContaining({
        page_title: 'Parametric Enclosure | Vincent Teo 3D Models'
      })
    );
  });
});
