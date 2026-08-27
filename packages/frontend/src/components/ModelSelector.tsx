import React from 'react';
import { ModelConfig } from '../types/model';
import { Box, Layers, Tag } from 'lucide-react';

interface ModelSelectorProps {
  models: ModelConfig[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModelId,
  onSelectModel
}) => {
  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-fuchsia-400" />
            Configurable Models
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Select an Onshape Part Studio to customize dimensions and export
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-400 border border-slate-800 rounded-xl bg-slate-900/80 px-3 py-1 self-start sm:self-auto">
          {models.length} Models Available
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map((m) => {
          const isSelected = m.id === selectedModelId;

          return (
            <button
              key={m.id}
              onClick={() => onSelectModel(m.id)}
              className={`glow-card text-left p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900/90 border-fuchsia-500 shadow-lg shadow-fuchsia-500/20 ring-1 ring-fuchsia-400'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
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
                    <span className="text-sm font-bold text-white truncate max-w-[180px]">
                      {m.name}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="inline-block w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse" />
                  )}
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                  {m.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/60">
                {m.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800/80 text-slate-300 border border-slate-700/50"
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
    </div>
  );
};
