import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ModelConfig, ExportOptions, PreviewMeshData } from './types/model';
import { getModels, fetchModelPreviewMesh, triggerModelExport } from './services/api';
import { Header } from './components/Header';
import { ModelSelector } from './components/ModelSelector';
import { ModelViewer } from './components/ModelViewer';
import { ParameterControls } from './components/ParameterControls';
import { ExportModal } from './components/ExportModal';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [mockMode, setMockMode] = useState<boolean>(false);
  const [selectedModelId, setSelectedModelId] = useState<string>('');

  // UI state
  const [modelDrawerOpen, setModelDrawerOpen] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);

  // Parameter State: user edited vs last previewed
  const [currentValues, setCurrentValues] = useState<Record<string, number | string | boolean>>({});
  const [appliedValues, setAppliedValues] = useState<Record<string, number | string | boolean>>({});

  // 3D Mesh Geometry State
  const [meshData, setMeshData] = useState<PreviewMeshData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Helper to extract model ID from URL path slug (e.g. /kumiko-pattern-keychain) or query string fallback
  const getModelIdFromUrl = useCallback((loadedModels: ModelConfig[]): string | null => {
    if (loadedModels.length === 0) return null;

    // 1. Check path slug e.g. /kumiko-pattern-keychain or /models/kumiko-pattern-keychain
    const rawPath = window.location.pathname.replace(/^\/+/g, '').replace(/\/+$/g, '');
    if (rawPath) {
      const slug = rawPath.replace(/^models\//, '');
      const matched = loadedModels.find((m) => m.id === slug);
      if (matched) return matched.id;
    }

    // 2. Query parameter fallback e.g. ?model=kumiko-pattern-keychain
    const searchParams = new URLSearchParams(window.location.search);
    const queryModelId = searchParams.get('model');
    if (queryModelId) {
      const matched = loadedModels.find((m) => m.id === queryModelId);
      if (matched) return matched.id;
    }

    return null;
  }, []);

  // Load models catalog on mount and inspect URL path slug for direct model routing
  useEffect(() => {
    getModels(true).then(({ models: loadedModels, mockMode: isMock }) => {
      setModels(loadedModels);
      setMockMode(isMock);
      if (loadedModels.length > 0) {
        const targetModelId = getModelIdFromUrl(loadedModels);
        const visibleModels = loadedModels.filter((m) => !m.hidden);
        setSelectedModelId(targetModelId || visibleModels[0]?.id || loadedModels[0].id);
      }
    });
  }, [getModelIdFromUrl]);

  // Listen to browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const targetModelId = getModelIdFromUrl(models);
      if (targetModelId && targetModelId !== selectedModelId) {
        setSelectedModelId(targetModelId);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [models, selectedModelId, getModelIdFromUrl]);

  // Currently active model
  const activeModel = useMemo(() => {
    return models.find((m) => m.id === selectedModelId) || models[0];
  }, [models, selectedModelId]);

  // Load 3D preview mesh for given model & parameters
  const loadPreview = useCallback(async (model: ModelConfig, params: Record<string, number | string | boolean>) => {
    setLoadingPreview(true);
    setPreviewError(null);

    try {
      const buffer = await fetchModelPreviewMesh(model, params);
      setMeshData(buffer);
      setAppliedValues({ ...params });
    } catch (err: unknown) {
      console.error('Failed to load model preview:', err);
      setPreviewError(err instanceof Error ? err.message : 'Failed to generate 3D preview.');
      setAppliedValues({ ...params });
    } finally {
      setLoadingPreview(false);
    }
  }, []);

  // Initialize parameters from URL (if customized in link) or defaults, then load preview
  useEffect(() => {
    if (!activeModel) return;

    const searchParams = new URLSearchParams(window.location.search);
    const initialValues: Record<string, number | string | boolean> = {};

    for (const p of activeModel.parameters) {
      if (searchParams.has(p.id)) {
        const raw = searchParams.get(p.id)!;
        if (p.type === 'quantity') {
          const parsed = parseFloat(raw);
          initialValues[p.id] = isNaN(parsed) ? p.default : parsed;
        } else if (p.type === 'boolean') {
          initialValues[p.id] = raw === 'true';
        } else {
          initialValues[p.id] = raw;
        }
      } else {
        initialValues[p.id] = p.default;
      }
    }

    setCurrentValues(initialValues);
    setAppliedValues(initialValues);
    loadPreview(activeModel, initialValues);
  }, [activeModel?.id, loadPreview]);

  // Sync browser address bar with clean path slug (e.g. /kumiko-pattern-keychain) and customized parameters
  useEffect(() => {
    if (!activeModel) return;

    const searchParams = new URLSearchParams();

    // Only encode parameters that differ from defaults to keep share links clean
    for (const p of activeModel.parameters) {
      const val = appliedValues[p.id];
      if (val !== undefined && val !== p.default) {
        searchParams.set(p.id, String(val));
      }
    }

    const queryString = searchParams.toString();
    const newUrl = `/${activeModel.id}${queryString ? `?${queryString}` : ''}`;
    const currentRelative = `${window.location.pathname}${window.location.search}`;

    if (currentRelative !== newUrl) {
      window.history.replaceState(null, '', newUrl);
    }
  }, [activeModel?.id, appliedValues]);

  // Determine if there are unapplied parameter edits
  const isDirty = useMemo(() => {
    if (!activeModel) return false;
    for (const p of activeModel.parameters) {
      if (currentValues[p.id] !== appliedValues[p.id]) {
        return true;
      }
    }
    return false;
  }, [activeModel, currentValues, appliedValues]);

  // User triggers preview update
  const handleApplyParameters = () => {
    if (!activeModel) return;
    loadPreview(activeModel, currentValues);
  };

  // Switch model handler with history push for clean navigation
  const handleSelectModel = (modelId: string) => {
    if (modelId === selectedModelId) return;
    setSelectedModelId(modelId);
    window.history.pushState(null, '', `/${modelId}`);
  };

  // Trigger file download
  const handleExport = async (options: ExportOptions) => {
    if (!activeModel) return;
    await triggerModelExport(activeModel, currentValues, options);
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#120e25] text-slate-200 antialiased selection:bg-violet-500 selection:text-white">
      {/* 1. Fixed Top Header */}
      <Header
        mockMode={mockMode}
        onOpenModelDrawer={() => setModelDrawerOpen(true)}
        activeModelName={activeModel?.name || ''}
      />

      {/* 2. Middle Body: Sidebar + Full Viewport 3D Canvas */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar: Customisation Parameters */}
        {activeModel && (
          <ParameterControls
            model={activeModel}
            currentValues={currentValues}
            onChangeValues={setCurrentValues}
            onApply={handleApplyParameters}
            onOpenExport={() => setExportModalOpen(true)}
            onOpenModelDrawer={() => setModelDrawerOpen(true)}
            isDirty={isDirty}
            loading={loadingPreview}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        )}

        {/* 3D Preview Canvas: Takes up all remaining space */}
        <main className="flex-1 h-full min-w-0 relative">
          {activeModel ? (
            <ModelViewer
              meshData={meshData}
              loading={loadingPreview}
              error={previewError}
              modelName={activeModel.name}
              onRefresh={handleApplyParameters}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-slate-500">
              Loading 3D Model...
            </div>
          )}
        </main>

        {/* Left Pop-out Model Selection Drawer */}
        <ModelSelector
          isOpen={modelDrawerOpen}
          onClose={() => setModelDrawerOpen(false)}
          models={models}
          selectedModelId={selectedModelId}
          onSelectModel={handleSelectModel}
        />
      </div>

      {/* 3. Minimal Bottom Footer */}
      <Footer />

      {/* Export Modal Dialog */}
      {activeModel && (
        <ExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          model={activeModel}
          currentValues={currentValues}
          onTriggerExport={handleExport}
        />
      )}
    </div>
  );
};

export default App;
