import React, { useState, useEffect } from 'react';
import { ModelConfig } from '../types/model';
import {
  Sliders,
  RotateCcw,
  Sparkles,
  Download,
  Check,
  Info,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface ParameterControlsProps {
  model: ModelConfig;
  currentValues: Record<string, number | string | boolean>;
  onChangeValues: (newValues: Record<string, number | string | boolean>) => void;
  onApply: () => void;
  onOpenExport: () => void;
  onOpenModelDrawer: () => void;
  isDirty: boolean;
  loading: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const ParameterControls: React.FC<ParameterControlsProps> = ({
  model,
  currentValues,
  onChangeValues,
  onApply,
  onOpenExport,
  onOpenModelDrawer,
  isDirty,
  loading,
  collapsed = false,
  onToggleCollapse
}) => {
  const [autoUpdate, setAutoUpdate] = useState(false);

  // Debounced auto-update handler
  useEffect(() => {
    if (!autoUpdate || !isDirty) return;
    const timer = setTimeout(() => {
      onApply();
    }, 600);
    return () => clearTimeout(timer);
  }, [currentValues, autoUpdate, isDirty, onApply]);

  const handleChange = (id: string, value: number | string | boolean) => {
    onChangeValues({
      ...currentValues,
      [id]: value
    });
  };

  const handleResetDefaults = () => {
    const defaultVals: Record<string, number | string | boolean> = {};
    for (const p of model.parameters) {
      defaultVals[p.id] = p.default;
    }
    onChangeValues(defaultVals);
  };

  if (collapsed) {
    return (
      <aside className="w-12 h-full bg-slate-900/80 border-r border-slate-800/80 flex flex-col items-center justify-between py-4 z-20">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Expand Customization Sidebar"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="rotate-90 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
          Parameters
        </div>

        <button
          onClick={onOpenExport}
          className="p-2 rounded-xl text-fuchsia-400 hover:bg-slate-800 transition-colors"
          title="Export CAD Files"
        >
          <Download className="w-5 h-5" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-80 sm:w-96 shrink-0 h-full bg-[#120e25]/95 border-r border-slate-800/80 flex flex-col justify-between z-20 backdrop-blur-xl">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/30">
              <Sliders className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white">Parameters</h2>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={handleResetDefaults}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white px-2 py-1 rounded-lg border border-slate-800 hover:bg-slate-800/60 transition-colors"
              title="Reset parameters to initial defaults"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>

            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Model switcher banner in sidebar */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="truncate pr-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Active Model
            </span>
            <span className="text-xs font-bold text-white truncate block">
              {model.name}
            </span>
          </div>

          <button
            onClick={onOpenModelDrawer}
            className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-fuchsia-400 hover:text-fuchsia-300 px-2 py-1 rounded-lg bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/30 transition-all cursor-pointer"
          >
            <Layers className="w-3 h-3" />
            Change
          </button>
        </div>
      </div>

      {/* Scrollable Parameters Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {model.parameters.map((param) => {
          const val = currentValues[param.id] ?? param.default;
          const isEnabled = param.dependsOn ? Boolean(currentValues[param.dependsOn]) : true;
          const isDependent = Boolean(param.dependsOn);

          if (param.type === 'quantity') {
            const numVal = Number(val);
            const min = param.min ?? 1;
            const max = param.max ?? 300;
            const step = param.step ?? 1;

            return (
              <div
                key={param.id}
                className={`space-y-1.5 transition-all duration-200 ${
                  isDependent ? 'ml-3 pl-3 border-l-2 border-slate-800/80' : ''
                } ${!isEnabled ? 'opacity-40 pointer-events-none' : ''}`}
              >
                <div className="flex items-center justify-between text-xs">
                  <label
                    htmlFor={`param-${param.id}`}
                    className={`font-bold flex items-center gap-1.5 ${
                      isEnabled ? 'text-slate-200' : 'text-slate-500'
                    }`}
                  >
                    {param.name}
                    {!isEnabled && (
                      <span className="text-[10px] font-normal text-slate-500 italic">
                        (Disabled)
                      </span>
                    )}
                    {param.description && (
                      <span title={param.description} className="text-slate-500 cursor-help">
                        <Info className="w-3 h-3" />
                      </span>
                    )}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      id={`param-${param.id}`}
                      min={min}
                      max={max}
                      step={step}
                      disabled={!isEnabled}
                      value={numVal}
                      onChange={(e) => handleChange(param.id, parseFloat(e.target.value) || min)}
                      className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5 text-right text-xs font-mono font-bold text-fuchsia-300 focus:outline-none focus:border-fuchsia-500 disabled:text-slate-600 disabled:border-slate-900"
                    />
                    <span className="text-[11px] font-mono text-slate-400 font-semibold">
                      {param.unit === 'millimeter' ? 'mm' : param.unit || ''}
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  disabled={!isEnabled}
                  value={numVal}
                  onChange={(e) => handleChange(param.id, parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                />

                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>{min} {param.unit === 'millimeter' ? 'mm' : ''}</span>
                  <span>{max} {param.unit === 'millimeter' ? 'mm' : ''}</span>
                </div>
              </div>
            );
          }

          if (param.type === 'enum') {
            return (
              <div
                key={param.id}
                className={`space-y-1.5 transition-all duration-200 ${
                  isDependent ? 'ml-3 pl-3 border-l-2 border-slate-800/80' : ''
                } ${!isEnabled ? 'opacity-40 pointer-events-none' : ''}`}
              >
                <label
                  htmlFor={`param-${param.id}`}
                  className="block text-xs font-bold text-slate-200"
                >
                  {param.name}
                  {!isEnabled && (
                    <span className="ml-1.5 text-[10px] font-normal text-slate-500 italic">
                      (Disabled)
                    </span>
                  )}
                </label>
                <select
                  id={`param-${param.id}`}
                  value={String(val)}
                  disabled={!isEnabled}
                  onChange={(e) => handleChange(param.id, e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-fuchsia-500 cursor-pointer disabled:text-slate-600 disabled:border-slate-900"
                >
                  {param.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          if (param.type === 'boolean') {
            const boolVal = Boolean(val);

            return (
              <div
                key={param.id}
                className="flex items-center justify-between py-1"
              >
                <div>
                  <span className="block text-xs font-bold text-white">
                    {param.name}
                  </span>
                  {param.description && (
                    <span className="block text-[11px] text-slate-400">
                      {param.description}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={boolVal}
                  onClick={() => handleChange(param.id, !boolVal)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    boolVal ? 'bg-fuchsia-500' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      boolVal ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Sticky Bottom Actions */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 space-y-2.5">
        {/* Live Auto-Update toggle */}
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            Auto-Update Preview
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={autoUpdate}
            onClick={() => setAutoUpdate(!autoUpdate)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              autoUpdate ? 'bg-violet-500' : 'bg-slate-800'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                autoUpdate ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Update Preview Button */}
        <button
          onClick={onApply}
          disabled={loading || (!isDirty && !loading)}
          className={`w-full playful-btn flex items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold text-white transition-all shadow-md ${
            isDirty
              ? 'bg-fuchsia-500 hover:bg-fuchsia-400 shadow-fuchsia-500/30 cursor-pointer'
              : 'bg-slate-800/70 text-slate-500 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Calculating CAD Geometry...
            </span>
          ) : isDirty ? (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Update 3D Preview
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              Preview Up-to-Date
            </>
          )}
        </button>

        {/* Export CAD Files Button */}
        <button
          onClick={onOpenExport}
          className="w-full playful-btn flex items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 shadow-md transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-violet-400" />
          Export STL / STEP Files
        </button>
      </div>
    </aside>
  );
};
