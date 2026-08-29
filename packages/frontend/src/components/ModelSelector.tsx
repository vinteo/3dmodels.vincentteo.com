import React, { useState } from 'react';
import { ModelConfig } from '../types/model';
import { Box, Layers, Tag, X, Check, Share2, ExternalLink } from 'lucide-react';

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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyModelLink = (e: React.MouseEvent, modelId: string) => {
    e.stopPropagation();
    const url = `${window.location.origin}/${modelId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(modelId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#120e25]/95 h-full border-r border-slate-800 shadow-2xl flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-fuchsia-400" />
            <h2 className="text-base font-bold text-white">Model Catalog</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Models List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {models
            .filter((m) => !m.hidden)
            .map((m) => {
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

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleCopyModelLink(e, m.id)}
                          className={`p-1 rounded-lg border text-[10px] flex items-center gap-1 transition-all ${
                            copiedId === m.id
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-slate-800/80 text-slate-400 hover:text-white border-slate-700/80'
                          }`}
                          title="Copy direct permalink to this model"
                        >
                          {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3 text-violet-400" />}
                          <span className="hidden sm:inline">{copiedId === m.id ? 'Copied' : 'Link'}</span>
                        </button>

                        {isSelected && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-fuchsia-400">
                            <Check className="w-3.5 h-3.5" />
                            Active
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed mb-3 line-clamp-2">
                      {m.description}
                    </p>

                    {/* External Model Page Links */}
                    {m.links && m.links.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {m.links.map((link) => (
                          <a
                            key={link.url}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition-all border ${
                              link.site === 'printables'
                                ? 'bg-orange-500/15 text-orange-300 border-orange-500/30 hover:bg-orange-500/30'
                                : link.site === 'qidimaker'
                                ? 'bg-sky-500/15 text-sky-300 border-sky-500/30 hover:bg-sky-500/30'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                            }`}
                            title={`Open on ${link.label}`}
                          >
                            <span>{link.label}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                          </a>
                        ))}
                      </div>
                    )}
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
          <span>{models.filter((m) => !m.hidden).length} CAD Models Configured</span>
          <span className="font-mono text-slate-500">config/models.config.json</span>
        </div>
      </div>
    </div>
  );
};
