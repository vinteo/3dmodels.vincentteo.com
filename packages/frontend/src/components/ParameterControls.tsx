import React, { useState, useEffect } from 'react';
import { ModelConfig } from '../types/model';
import {
  Sliders,
  RotateCcw,
  RotateCw,
  Sparkles,
  Download,
  Check,
  Info,
  Layers,
  ChevronLeft,
  ChevronRight,
  Share2,
  CircleDot
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
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyPermalink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

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

  const [customizeIndividual, setCustomizeIndividual] = useState<boolean>(false);

  // Check if model has section parameters (section_1 to section_6)
  const sectionParams = model.parameters.filter((p) => /^section_[1-6]$/.test(p.id));
  const hasSections = sectionParams.length > 0;
  const sectionOptions = sectionParams[0]?.options || [];
  const designThicknessParam = model.parameters.find((p) => p.id === 'hex_design_thickness');

  // Check if all 6 sections share the exact same value
  const firstSectionVal = String(currentValues['section_1'] ?? sectionOptions[0]?.value ?? '1');
  const allSectionsSame = hasSections && sectionParams.every(
    (sp) => String(currentValues[sp.id] ?? sp.default) === firstSectionVal
  );
  const masterSectionValue = allSectionsSame ? firstSectionVal : 'mixed';

  const handleSetAllSections = (designValue: string) => {
    const updated = { ...currentValues };
    for (let i = 1; i <= 6; i++) {
      updated[`section_${i}`] = designValue;
    }
    onChangeValues(updated);
  };

  // Section rotation state and cycling handlers (0° -> 120° -> 240° -> 0°)
  const firstRotationVal = String(currentValues['section_1_rotation'] ?? '0');
  const allRotationsSame = [1, 2, 3, 4, 5, 6].every(
    (i) => String(currentValues[`section_${i}_rotation`] ?? '0') === firstRotationVal
  );
  const masterRotationValue = allRotationsSame ? firstRotationVal : 'mixed';

  const handleSetAllRotations = (rotValue: string) => {
    const updated = { ...currentValues };
    for (let i = 1; i <= 6; i++) {
      updated[`section_${i}_rotation`] = rotValue;
    }
    onChangeValues(updated);
  };

  const cycleAllRotations = () => {
    const currentRot = allRotationsSame ? firstRotationVal : '0';
    let nextRot = '0';
    if (currentRot === '0') nextRot = '120';
    else if (currentRot === '120') nextRot = '240';
    else nextRot = '0';

    handleSetAllRotations(nextRot);
  };

  const cycleSectionRotation = (sectionIdx: number) => {
    const currentRot = String(currentValues[`section_${sectionIdx}_rotation`] ?? '0');
    let nextRot = '0';
    if (currentRot === '0') nextRot = '120';
    else if (currentRot === '120') nextRot = '240';
    else nextRot = '0';

    handleChange(`section_${sectionIdx}_rotation`, nextRot);
  };

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

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleCopyPermalink}
              className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                copiedLink
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/80'
              }`}
              title="Copy direct permalink URL with current parameters"
            >
              {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3 text-violet-400" />}
              <span>{copiedLink ? 'Copied!' : 'Share'}</span>
            </button>

            <button
              onClick={onOpenModelDrawer}
              className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-fuchsia-400 hover:text-fuchsia-300 px-2 py-1 rounded-lg bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/30 transition-all cursor-pointer"
            >
              <Layers className="w-3 h-3" />
              Change
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Parameters Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {model.parameters.map((param) => {
          // Render Keychain Ring group in a dedicated styled card at include_keychain_ring
          if (param.id === 'include_keychain_ring') {
            const isRingIncluded = Boolean(currentValues['include_keychain_ring'] ?? param.default);
            const ringThicknessParam = model.parameters.find((p) => p.id === 'ring_thickness');
            const ringFilletParam = model.parameters.find((p) => p.id === 'ring_fillet');

            return (
              <div
                key="keychain-ring-group"
                className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/90 space-y-3 shadow-inner"
              >
                {/* Header with Title and Toggle Switch */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CircleDot className="w-3.5 h-3.5 text-fuchsia-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">Keychain Ring</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={isRingIncluded}
                    onClick={() => handleChange(param.id, !isRingIncluded)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isRingIncluded ? 'bg-fuchsia-500' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        isRingIncluded ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {param.description && (
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {param.description}
                  </p>
                )}

                {/* Sub-parameters: Ring Thickness & Ring Fillet (Hidden when Keychain Ring is unchecked) */}
                {isRingIncluded && (ringThicknessParam || ringFilletParam) && (
                  <div className="space-y-3 pt-2.5 border-t border-slate-800/80 animate-in fade-in slide-in-from-top-1 duration-200">
                    {ringThicknessParam && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <label
                            htmlFor={`param-${ringThicknessParam.id}`}
                            className="font-bold flex items-center gap-1.5 text-slate-200"
                          >
                            {ringThicknessParam.name}
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              id={`param-${ringThicknessParam.id}`}
                              min={ringThicknessParam.min ?? 1}
                              max={ringThicknessParam.max ?? 10}
                              step={ringThicknessParam.step ?? 0.5}
                              value={Number(currentValues[ringThicknessParam.id] ?? ringThicknessParam.default)}
                              onChange={(e) => handleChange(ringThicknessParam.id, parseFloat(e.target.value) || (ringThicknessParam.min ?? 1))}
                              className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5 text-right text-xs font-mono font-bold text-fuchsia-300 focus:outline-none focus:border-fuchsia-500"
                            />
                            <span className="text-[11px] font-mono text-slate-400 font-semibold">
                              {ringThicknessParam.unit === 'millimeter' ? 'mm' : ringThicknessParam.unit || ''}
                            </span>
                          </div>
                        </div>

                        <input
                          type="range"
                          min={ringThicknessParam.min ?? 1}
                          max={ringThicknessParam.max ?? 10}
                          step={ringThicknessParam.step ?? 0.5}
                          value={Number(currentValues[ringThicknessParam.id] ?? ringThicknessParam.default)}
                          onChange={(e) => handleChange(ringThicknessParam.id, parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                        />

                        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                          <span>{ringThicknessParam.min ?? 1} mm</span>
                          <span>{ringThicknessParam.max ?? 10} mm</span>
                        </div>
                      </div>
                    )}

                    {ringFilletParam && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <label
                            htmlFor={`param-${ringFilletParam.id}`}
                            className="font-bold flex items-center gap-1.5 text-slate-200"
                          >
                            {ringFilletParam.name}
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              id={`param-${ringFilletParam.id}`}
                              min={ringFilletParam.min ?? 0}
                              max={ringFilletParam.max ?? 1}
                              step={ringFilletParam.step ?? 0.05}
                              value={Number(currentValues[ringFilletParam.id] ?? ringFilletParam.default)}
                              onChange={(e) => handleChange(ringFilletParam.id, parseFloat(e.target.value) || (ringFilletParam.min ?? 0))}
                              className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5 text-right text-xs font-mono font-bold text-fuchsia-300 focus:outline-none focus:border-fuchsia-500"
                            />
                            <span className="text-[11px] font-mono text-slate-400 font-semibold">
                              {ringFilletParam.unit === 'millimeter' ? 'mm' : ringFilletParam.unit || ''}
                            </span>
                          </div>
                        </div>

                        <input
                          type="range"
                          min={ringFilletParam.min ?? 0}
                          max={ringFilletParam.max ?? 1}
                          step={ringFilletParam.step ?? 0.05}
                          value={Number(currentValues[ringFilletParam.id] ?? ringFilletParam.default)}
                          onChange={(e) => handleChange(ringFilletParam.id, parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                        />

                        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                          <span>{ringFilletParam.min ?? 0} mm</span>
                          <span>{ringFilletParam.max ?? 1} mm</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          }

          // If this is a section parameter, render all 6 in a unified Section Patterns card at section_1
          if (param.id === 'section_1' && hasSections) {
            return (
              <div
                key="section-patterns-group"
                className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/90 space-y-3 shadow-inner"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-3.5 h-3.5 text-pink-400" />
                    <span className="text-xs font-bold text-white">Section Patterns (6 Wedges)</span>
                  </div>
                </div>

                {/* Default: All Sections Pattern Dropdown */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="all-sections-pattern-select"
                    className="block text-xs font-bold text-slate-200"
                  >
                    Lattice Pattern (All Sections)
                  </label>
                  <select
                    id="all-sections-pattern-select"
                    value={masterSectionValue}
                    onChange={(e) => handleSetAllSections(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-fuchsia-500 cursor-pointer"
                  >
                    {!allSectionsSame && (
                      <option value="mixed" disabled>
                        — Mixed / Individual Pattern Selection —
                      </option>
                    )}
                    {sectionOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* All Sections: Pattern Rotation Cycle & Selector */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-200">
                      Pattern Rotation (All Sections)
                    </label>
                    <button
                      type="button"
                      onClick={cycleAllRotations}
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/30 text-[11px] font-bold transition-all cursor-pointer"
                      title="Cycle rotation by 120° around inner triangle center"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>Cycle +120°</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                    {['0', '120', '240'].map((deg) => (
                      <button
                        key={deg}
                        type="button"
                        onClick={() => handleSetAllRotations(deg)}
                        className={`py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          masterRotationValue === deg
                            ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>

                {/* Checkbox Toggle to Customize Sections Individually */}
                <div className="pt-1">
                  <label
                    htmlFor="customize-individual-checkbox"
                    className="flex items-center space-x-2.5 text-xs font-medium text-slate-300 hover:text-white cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      id="customize-individual-checkbox"
                      checked={customizeIndividual}
                      onChange={(e) => setCustomizeIndividual(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-fuchsia-500 focus:ring-fuchsia-400 focus:ring-offset-0 cursor-pointer"
                    />
                    <span>Customize each section individually</span>
                  </label>
                </div>

                {/* Individual 6 Sections (Hidden if checkbox is unchecked) */}
                {customizeIndividual && (
                  <div className="space-y-2.5 pt-2.5 border-t border-slate-800/80 animate-in fade-in slide-in-from-top-1 duration-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Individual Sectors (1–6)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {sectionParams.map((sp, idx) => {
                        const secIdx = idx + 1;
                        const currentRot = String(currentValues[`section_${secIdx}_rotation`] ?? '0');

                        return (
                          <div
                            key={sp.id}
                            className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-slate-300 truncate block">
                                S{secIdx} ({idx * 60}°–{secIdx * 60}°)
                              </label>
                              <button
                                type="button"
                                onClick={() => cycleSectionRotation(secIdx)}
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/30 text-[10px] font-bold transition-all cursor-pointer"
                                title={`Cycle S${secIdx} rotation (+120°)`}
                              >
                                <RotateCw className="w-2.5 h-2.5" />
                                <span>{currentRot}°</span>
                              </button>
                            </div>

                            <select
                              value={String(currentValues[sp.id] ?? sp.default)}
                              onChange={(e) => handleChange(sp.id, e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-200 focus:outline-none focus:border-fuchsia-500 cursor-pointer"
                            >
                              {sp.options?.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>

                            <div className="grid grid-cols-3 gap-1">
                              {['0', '120', '240'].map((deg) => (
                                <button
                                  key={deg}
                                  type="button"
                                  onClick={() => handleChange(`section_${secIdx}_rotation`, deg)}
                                  className={`py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                                    currentRot === deg
                                      ? 'bg-pink-500/25 text-pink-300 border border-pink-500/50'
                                      : 'bg-slate-900 text-slate-500 hover:text-slate-300 border border-slate-800/60'
                                  }`}
                                >
                                  {deg}°
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Design Lattice Thickness */}
                {designThicknessParam && (
                  <div className="pt-2.5 border-t border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label
                        htmlFor={`param-${designThicknessParam.id}`}
                        className="font-bold flex items-center gap-1.5 text-slate-200"
                      >
                        {designThicknessParam.name}
                        {designThicknessParam.description && (
                          <span title={designThicknessParam.description} className="text-slate-500 cursor-help">
                            <Info className="w-3 h-3" />
                          </span>
                        )}
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          id={`param-${designThicknessParam.id}`}
                          min={designThicknessParam.min ?? 0.5}
                          max={designThicknessParam.max ?? 10}
                          step={designThicknessParam.step ?? 0.5}
                          value={Number(currentValues[designThicknessParam.id] ?? designThicknessParam.default)}
                          onChange={(e) => handleChange(designThicknessParam.id, parseFloat(e.target.value) || (designThicknessParam.min ?? 0.5))}
                          className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5 text-right text-xs font-mono font-bold text-fuchsia-300 focus:outline-none focus:border-fuchsia-500"
                        />
                        <span className="text-[11px] font-mono text-slate-400 font-semibold">
                          {designThicknessParam.unit === 'millimeter' ? 'mm' : designThicknessParam.unit || ''}
                        </span>
                      </div>
                    </div>

                    <input
                      type="range"
                      min={designThicknessParam.min ?? 0.5}
                      max={designThicknessParam.max ?? 10}
                      step={designThicknessParam.step ?? 0.5}
                      value={Number(currentValues[designThicknessParam.id] ?? designThicknessParam.default)}
                      onChange={(e) => handleChange(designThicknessParam.id, parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />

                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>{designThicknessParam.min ?? 0.5} mm</span>
                      <span>{designThicknessParam.max ?? 10} mm</span>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // Skip parameters rendered inside cards
          if (
            (param.id.startsWith('section_') && param.id !== 'section_1') ||
            (param.id === 'hex_design_thickness' && hasSections) ||
            param.id === 'ring_thickness' ||
            param.id === 'ring_fillet'
          ) {
            return null;
          }

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
