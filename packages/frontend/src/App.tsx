import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ModelConfig, ExportOptions } from './types/model';
import { getModels, fetchModelPreviewMesh, triggerModelExport } from './services/api';
import { Header } from './components/Header';
import { ModelSelector } from './components/ModelSelector';
import { ModelViewer } from './components/ModelViewer';
import { ParameterControls } from './components/ParameterControls';
import { ExportModal } from './components/ExportModal';
import { Footer } from './components/Footer';
import { Sparkles, Box, Cpu } from 'lucide-react';

export const App: React.FC = () => {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [mockMode, setMockMode] = useState<boolean>(false);
  const [selectedModelId, setSelectedModelId] = useState<string>('');

  // Parameter State: user edited vs last previewed
  const [currentValues, setCurrentValues] = useState<Record<string, number | string | boolean>>({});
  const [appliedValues, setAppliedValues] = useState<Record<string, number | string | boolean>>({});

  // 3D Mesh Geometry State
  const [meshData, setMeshData] = useState<ArrayBuffer | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Modal State
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);

  // Load models catalog on mount
  useEffect(() => {
    getModels().then(({ models: loadedModels, mockMode: isMock }) => {
      setModels(loadedModels);
      setMockMode(isMock);
      if (loadedModels.length > 0) {
        setSelectedModelId(loadedModels[0].id);
      }
    });
  }, []);

  // Currently active model
  const activeModel = useMemo(() => {
    return models.find((m) => m.id === selectedModelId) || models[0];
  }, [models, selectedModelId]);

  // Initialize parameters when active model changes
  useEffect(() => {
    if (!activeModel) return;

    const initialValues: Record<string, number | string | boolean> = {};
    for (const p of activeModel.parameters) {
      initialValues[p.id] = p.default;
    }

    setCurrentValues(initialValues);
    setAppliedValues(initialValues);
  }, [activeModel]);

  // Load 3D preview mesh for given model & parameters
  const loadPreview = useCallback(async (model: ModelConfig, params: Record<string, number | string | boolean>) => {
    setLoadingPreview(true);
    setPreviewError(null);

    try {
      const buffer = await fetchModelPreviewMesh(model.id, params);
      setMeshData(buffer);
      setAppliedValues({ ...params });
    } catch (err: unknown) {
      console.error('Failed to load model preview:', err);
      setPreviewError(err instanceof Error ? err.message : 'Failed to generate 3D preview.');
    } finally {
      setLoadingPreview(false);
    }
  }, []);

  // Fetch preview when appliedValues or active model changes initially
  useEffect(() => {
    if (!activeModel || Object.keys(appliedValues).length === 0) return;
    loadPreview(activeModel, appliedValues);
  }, [activeModel?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // User explicitly triggers preview update
  const handleApplyParameters = () => {
    if (!activeModel) return;
    loadPreview(activeModel, currentValues);
  };

  // Switch model handler
  const handleSelectModel = (modelId: string) => {
    setSelectedModelId(modelId);
  };

  // Trigger file download
  const handleExport = async (options: ExportOptions) => {
    if (!activeModel) return;
    await triggerModelExport(activeModel.id, currentValues, options);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#120e25] text-slate-200 antialiased selection:bg-violet-500 selection:text-white">
      {/* Sticky Header */}
      <Header mockMode={mockMode} />

      <main className="flex-grow pb-24">
        {/* Ambient background glow effects */}
        <div className="fixed top-20 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="fixed bottom-20 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

        <div className="mx-auto max-w-7xl px-6 pt-8 space-y-8">
          {/* Hero / Overview Banner */}
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-800/80 pb-8 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/15 border border-fuchsia-500/30 text-fuchsia-300 text-xs font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                Cloud CAD Customizer
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                Parametric 3D Models
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed font-medium">
                Live Onshape CAD document integration. Customize dimensions, inspect full 3D render previews in real-time, and download production-ready STL or STEP files.
              </p>
            </div>

            {/* Quick stats pills */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs font-semibold text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-pink-400" />
                Onshape API V6
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs font-semibold text-slate-300">
                <Box className="w-3.5 h-3.5 text-violet-400" />
                WebGL 3D Studio
              </div>
            </div>
          </div>

          {/* Model Selector Cards */}
          {models.length > 0 && (
            <section aria-label="Available CAD Models">
              <ModelSelector
                models={models}
                selectedModelId={selectedModelId}
                onSelectModel={handleSelectModel}
              />
            </section>
          )}

          {/* Main 3D Viewport & Parameter Controls Layout */}
          {activeModel && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* 3D Viewport Column (8 cols on large screens) */}
              <div className="lg:col-span-8 w-full">
                <ModelViewer
                  meshData={meshData}
                  loading={loadingPreview}
                  error={previewError}
                  modelName={activeModel.name}
                  onRefresh={handleApplyParameters}
                />
              </div>

              {/* Parameter Controls Column (4 cols on large screens) */}
              <div className="lg:col-span-4 w-full">
                <ParameterControls
                  model={activeModel}
                  currentValues={currentValues}
                  onChangeValues={setCurrentValues}
                  onApply={handleApplyParameters}
                  onOpenExport={() => setExportModalOpen(true)}
                  isDirty={isDirty}
                  loading={loadingPreview}
                />
              </div>
            </div>
          )}
        </div>
      </main>

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

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default App;
