import React, { useState, useEffect } from 'react';
import { ModelConfig, ExportOptions } from '../types/model';
import { trackExport } from '../services/analytics';
import { X, Download, FileCode, Box, CheckCircle2, AlertCircle } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: ModelConfig;
  currentValues: Record<string, number | string | boolean>;
  onTriggerExport: (options: ExportOptions) => Promise<void>;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  model,
  currentValues,
  onTriggerExport
}) => {
  const isOpenscad = model.engine === 'openscad';
  const [format, setFormat] = useState<'stl' | 'step' | 'scad'>('stl');
  const units = 'millimeter';
  const [stlMode, setStlMode] = useState<'binary' | 'ascii'>('binary');
  const [stepVersion, setStepVersion] = useState<'AP203' | 'AP214' | 'AP242'>('AP242');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpenscad && format === 'step') {
      setFormat('stl');
    }
  }, [isOpenscad, format]);

  if (!isOpen) return null;

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    setSuccess(false);

    try {
      await onTriggerExport({
        format,
        units,
        stlMode,
        stepVersion
      });

      // Track export download event in Google Analytics
      trackExport({
        modelId: model.id,
        modelName: model.name,
        format,
        units,
        stlMode: format === 'stl' ? stlMode : undefined,
        stepVersion: format === 'step' ? stepVersion : undefined,
        parameterCount: Object.keys(currentValues).length
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#120e25] border-2 border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-bold uppercase tracking-wider">
            <Download className="w-4 h-4" />
            CAD Model Export
          </div>
          <h3 className="text-xl font-extrabold text-white">Export Customized Model</h3>
          <p className="text-xs text-slate-400">{model.name} with your custom parameter settings</p>
        </div>

        {/* Format Selector Tabs */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => setFormat('stl')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              format === 'stl'
                ? 'bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Box className="w-4 h-4" />
            STL (3D Printing)
          </button>

          {isOpenscad ? (
            <button
              type="button"
              onClick={() => setFormat('scad')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                format === 'scad'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-4 h-4" />
              SCAD (Source Code)
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setFormat('step')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                format === 'step'
                  ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-4 h-4" />
              STEP (CAD / CNC)
            </button>
          )}
        </div>

        {/* Format Specific Options */}
        {format === 'stl' && (
          <div className="space-y-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">STL Encoding</span>
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setStlMode('binary')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                    stlMode === 'binary'
                      ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Binary (Compact)
                </button>
                <button
                  type="button"
                  onClick={() => setStlMode('ascii')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                    stlMode === 'ascii'
                      ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ASCII (Text)
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-slate-800">
              Compatible with slicers including Bambu Studio, PrusaSlicer, Cura, and OrcaSlicer.
            </p>
          </div>
        )}

        {format === 'scad' && (
          <div className="space-y-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 p-4">
            <p className="text-[12px] text-slate-300 leading-relaxed">
              Download the customized OpenSCAD script with your modified parameter values
              pre-configured.
            </p>
            <p className="text-[11px] text-emerald-400 leading-relaxed pt-2 border-t border-slate-800">
              Ready to view and edit in the native OpenSCAD desktop app.
            </p>
          </div>
        )}

        {format === 'step' && (
          <div className="space-y-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">STEP Protocol</span>
              <select
                value={stepVersion}
                onChange={(e) => setStepVersion(e.target.value as 'AP203' | 'AP214' | 'AP242')}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono font-bold text-violet-300"
              >
                <option value="AP242">AP242 (Modern CAD & PMI)</option>
                <option value="AP214">AP214 (Automotive / Assemblies)</option>
                <option value="AP203">AP203 (Legacy Compatibility)</option>
              </select>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-slate-800">
              Preserves exact solid geometry and B-rep boundaries. Ready for SolidWorks, Autodesk
              Fusion 360, FreeCAD, or CNC CAM toolpaths.
            </p>
          </div>
        )}

        {/* Configuration summary */}
        <div className="text-[11px] text-slate-400 bg-slate-900/40 border border-slate-800/60 rounded-xl p-3 max-h-24 overflow-y-auto">
          <span className="font-bold text-slate-300 block mb-1">Export Parameter Snapshot:</span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[10px]">
            {Object.entries(currentValues).map(([k, v]) => (
              <div key={k} className="truncate">
                <span className="text-slate-500">{k}:</span> {String(v)}
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>File successfully generated and downloaded!</span>
          </div>
        )}

        {/* Export Submit Button */}
        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full playful-btn flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white bg-gradient-to-r from-fuchsia-500 to-violet-600 hover:from-fuchsia-400 hover:to-violet-500 shadow-lg shadow-fuchsia-500/25 disabled:opacity-50 transition-all cursor-pointer"
        >
          {exporting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Generating {format.toUpperCase()} File...
            </span>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Download {format.toUpperCase()} Model
            </>
          )}
        </button>
      </div>
    </div>
  );
};
