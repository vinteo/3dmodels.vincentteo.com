// Google Analytics 4 (GA4) Integration & Event Tracking

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const GA_MEASUREMENT_ID: string = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

/**
 * Initializes Google Analytics 4 (gtag.js) by injecting the script tag and configuring dataLayer.
 * Safe to call multiple times (idempotent) and safe when no Measurement ID is set.
 */
export function initGA(measurementId: string = GA_MEASUREMENT_ID): boolean {
  if (!measurementId || typeof window === 'undefined') {
    return false;
  }

  // Prevent duplicate script injection
  const existingScript = document.querySelector(
    `script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`
  );
  if (!existingScript) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
  }

  // Initialize dataLayer and gtag function
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function (...args: unknown[]) {
      window.dataLayer?.push(args);
    };
  }

  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: true,
    page_title: document.title,
    page_location: window.location.href
  });

  return true;
}

/**
 * Safe wrapper to send custom Google Analytics events.
 */
export function trackEvent(eventName: string, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return;

  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  } else if (import.meta.env.DEV) {
    console.debug(`[Analytics] Event '${eventName}':`, params);
  }
}

export interface TrackExportParams {
  modelId: string;
  modelName: string;
  format: 'stl' | 'step';
  units?: string;
  stlMode?: 'binary' | 'ascii';
  stepVersion?: 'AP203' | 'AP214' | 'AP242';
  parameterCount?: number;
}

/**
 * Tracks CAD model file export downloads (STL and STEP).
 */
export function trackExport({
  modelId,
  modelName,
  format,
  units = 'millimeter',
  stlMode,
  stepVersion,
  parameterCount = 0
}: TrackExportParams): void {
  trackEvent('cad_export', {
    model_id: modelId,
    model_name: modelName,
    export_format: format,
    units,
    stl_mode: format === 'stl' ? stlMode || 'binary' : undefined,
    step_version: format === 'step' ? stepVersion || 'AP242' : undefined,
    parameter_count: parameterCount,
    event_category: 'engagement',
    event_label: `${modelName} (${format.toUpperCase()})`
  });
}

/**
 * Tracks SPA virtual page views in Google Analytics 4.
 */
export function trackPageView(pageTitle?: string, pageLocation?: string): void {
  if (typeof window === 'undefined') return;

  const title = pageTitle || document.title;
  const location = pageLocation || window.location.href;
  const path = window.location.pathname + window.location.search;

  trackEvent('page_view', {
    page_title: title,
    page_location: location,
    page_path: path
  });
}

/**
 * Tracks when a user selects or views a 3D model.
 * Automatically synchronizes document.title and triggers SPA virtual pageviews.
 */
export function trackModelView(modelId: string, modelName: string, engine?: string): void {
  const title = `${modelName} | Vincent Teo 3D Models`;
  if (typeof document !== 'undefined') {
    document.title = title;
  }

  trackEvent('model_view', {
    model_id: modelId,
    model_name: modelName,
    cad_engine: engine || 'replicad',
    event_category: 'engagement',
    event_label: modelName
  });

  trackPageView(title, typeof window !== 'undefined' ? window.location.href : undefined);
}
