import React from 'react';
import { ModelConfig } from '../types/model';
import { Box, Layers, Tag, X, Check } from 'lucide-react';

interface ModelSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  models: ModelConfig[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  isOpen,
  onClose,
  models,
  selectedModelId,
  onSelectModel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Pop-out Drawer from the Left */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md h-full bg-[#120e25] border-r border-slate-800 shadow-2xl flex flex-col justify-between animate-in slide-in-from-left duration-300">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Model Catalog</h3>
              <p className="text-xs text-slate-400">Select an Onshape CAD Part Studio</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Models List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {models.map((m) => {
            const isSelected = m.id === selectedModelId;

            return (
              <button
                key={m.id}
                onClick={() => {
                  onSelectModel(m.id);
                  onClose();
                }}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 border-fuchsia-500 shadow-lg shadow-fuchsia-500/15 ring-1 ring-fuchsia-400'
                    : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`p-1.5 rounded-lg ${
                          isSelected
                            ? 'bg-fuchsia-500/20 text-fuchsia-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <Box className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-white">
                        {m.name}
                      </span>
                    </div>

                    {isSelected && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-fuchsia-400">
                        <Check className="w-3.5 h-3.5" />
                        Active
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mb-3 line-clamp-2">
                    {m.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/60">
                  {m.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700/50"
                    >
                      <Tag className="w-2.5 h-2.5 text-pink-400" />
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Drawer Footer Info */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 text-[11px] text-slate-400 flex items-center justify-between">
          <span>{models.length} CAD Models Configured</span>
          <span className="font-mono text-slate-500">config/models.config.json</span>
        </div>
      </div>
    </div>
  );
};
