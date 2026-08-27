import React, { useState, useEffect } from 'react';
import { ModelConfig } from '../types/model';
import {
  Sliders,
  RotateCcw,
  Sparkles,
  Download,
  Check,
  Info
} from 'lucide-react';

interface ParameterControlsProps {
  model: ModelConfig;
  currentValues: Record<string, number | string | boolean>;
  onChangeValues: (newValues: Record<string, number | string | boolean>) => void;
  onApply: () => void;
  onOpenExport: () => void;
  isDirty: boolean;
  loading: boolean;
}

export const ParameterControls: React.FC<ParameterControlsProps> = ({
  model,
  currentValues,
  onChangeValues,
  onApply,
  onOpenExport,
  isDirty,
  loading
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

  return (
    <div className="glow-card flex flex-col justify-between rounded-3xl bg-slate-900/50 border-2 border-slate-800/80 p-6 backdrop-blur-md">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Customization</h3>
              <p className="text-xs text-slate-400">Parametric CAD Dimensions</p>
            </div>
          </div>

          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl border border-slate-800 hover:bg-slate-800/60 transition-colors"
            title="Reset parameters to initial defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        {/* Dynamic Controls List */}
        <div className="space-y-6 max-h-[460px] overflow-y-auto pr-1">
          {model.parameters.map((param) => {
            const val = currentValues[param.id] ?? param.default;

            if (param.type === 'quantity') {
              const numVal = Number(val);
              const min = param.min ?? 1;
              const max = param.max ?? 300;
              const step = param.step ?? 1;

              return (
                <div key={param.id} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label
                      htmlFor={`param-${param.id}`}
                      className="font-bold text-slate-200 flex items-center gap-1.5"
                    >
                      {param.name}
                      {param.description && (
                        <span title={param.description} className="text-slate-500 cursor-help">
                          <Info className="w-3.5 h-3.5" />
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
                        value={numVal}
                        onChange={(e) => handleChange(param.id, parseFloat(e.target.value) || min)}
                        className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5 text-right text-xs font-mono font-bold text-fuchsia-300 focus:outline-none focus:border-fuchsia-500"
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
                    value={numVal}
                    onChange={(e) => handleChange(param.id, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
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
                <div key={param.id} className="space-y-2">
                  <label
                    htmlFor={`param-${param.id}`}
                    className="block text-xs font-bold text-slate-200"
                  >
                    {param.name}
                  </label>
                  <select
                    id={`param-${param.id}`}
                    value={String(val)}
                    onChange={(e) => handleChange(param.id, e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-fuchsia-500 cursor-pointer"
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
                    <span className="block text-xs font-bold text-slate-200">
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
      </div>

      {/* Action Buttons */}
      <div className="mt-8 pt-4 border-t border-slate-800/80 space-y-3">
        {/* Live Auto-Update toggle */}
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            Live Auto-Update Preview
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
          className={`w-full playful-btn flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white transition-all shadow-lg ${
            isDirty
              ? 'bg-fuchsia-500 hover:bg-fuchsia-400 shadow-fuchsia-500/30'
              : 'bg-slate-800/70 text-slate-400 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Calculating CAD Geometry...
            </span>
          ) : isDirty ? (
            <>
              <Sparkles className="w-4 h-4" />
              Update 3D Preview
            </>
          ) : (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              Preview Up-to-Date
            </>
          )}
        </button>

        {/* Export CAD Files Button */}
        <button
          onClick={onOpenExport}
          className="w-full playful-btn flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 shadow-lg shadow-black/40 transition-all"
        >
          <Download className="w-4 h-4 text-violet-400" />
          Export STL / STEP Files
        </button>
      </div>
    </div>
  );
};
