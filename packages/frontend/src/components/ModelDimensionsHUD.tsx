import React, { useState } from 'react';
import { ModelDimensionItem } from '../engines/replicad/types';
import { Ruler, ChevronDown, ChevronUp, Info } from 'lucide-react';

export interface ModelDimensionsHUDProps {
  dimensions: ModelDimensionItem[];
  defaultCollapsed?: boolean;
}

export const ModelDimensionsHUD: React.FC<ModelDimensionsHUDProps> = ({
  dimensions,
  defaultCollapsed = false
}) => {
  const [collapsed, setCollapsed] = useState<boolean>(defaultCollapsed);

  if (!dimensions || dimensions.length === 0) {
    return null;
  }

  // Generate summary string for collapsed pill (e.g., "40.0 × 34.6 × 3.0 mm")
  const summaryText = dimensions
    .slice(0, 3)
    .map((d) => d.formatted || `${d.value} ${d.unit}`)
    .join(' × ');

  if (collapsed) {
    return (
      <div className="absolute bottom-4 right-4 z-10 pointer-events-auto">
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/85 hover:bg-slate-900/90 border border-slate-800/90 text-slate-300 hover:text-white shadow-lg backdrop-blur-md transition-all text-xs font-semibold cursor-pointer group"
          title="Expand Model Dimensions"
        >
          <Ruler className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span className="font-mono text-[11px] text-cyan-300 font-bold">{summaryText}</span>
          <ChevronUp className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-4 right-4 z-10 pointer-events-auto w-72 sm:w-80 rounded-2xl bg-[#0f0c24]/90 border border-slate-800/90 shadow-2xl backdrop-blur-xl p-3.5 space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <Ruler className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-white tracking-wide">Model Dimensions</span>
        </div>

        <button
          onClick={() => setCollapsed(true)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          title="Minimize dimensions panel"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Dimensions List */}
      <div className="space-y-1.5">
        {dimensions.map((dim) => (
          <div
            key={dim.id}
            className="flex items-center justify-between py-1 px-2 rounded-xl bg-slate-950/60 border border-slate-800/60 hover:border-slate-700/80 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-300">{dim.label}</span>
              {dim.description && (
                <span title={dim.description} className="text-slate-500 cursor-help">
                  <Info className="w-3 h-3" />
                </span>
              )}
            </div>

            <span className="font-mono text-xs font-bold text-cyan-300 tracking-tight">
              {dim.formatted || `${dim.value} ${dim.unit}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
