import React, { useState, useEffect, useMemo } from 'react';
import { ModelConfig, ParameterDefinition } from '../types/model';
import { ParameterGroupCard } from './controls/ParameterGroupCard';
import { GenericControl } from './controls/GenericControl';
import {
  Sliders,
  RotateCcw,
  Sparkles,
  Download,
  Check,
  ChevronLeft,
  ChevronRight,
  Share2,
  Layers,
  ExternalLink,
  FolderKanban,
  Box
} from 'lucide-react';

interface ParameterControlsProps {
  model: ModelConfig;
  models?: ModelConfig[];
  currentValues: Record<string, number | string | boolean>;
  onChangeValues: (newValues: Record<string, number | string | boolean>) => void;
  onApply: () => void;
  onOpenExport: () => void;
  onOpenModelDrawer: () => void;
  onSelectModel?: (modelId: string) => void;
  isDirty: boolean;
  loading: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const ParameterControls: React.FC<ParameterControlsProps> = ({
  model,
  models = [],
  currentValues,
  onChangeValues,
  onApply,
  onOpenExport,
  onOpenModelDrawer,
  onSelectModel,
  isDirty,
  loading,
  collapsed = false,
  onToggleCollapse
}) => {
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sibling models belonging to the same project
  const projectSiblings = useMemo(() => {
    if (!model.project) return [];
    return models.filter((m) => !m.hidden && m.project === model.project);
  }, [models, model.project]);

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

  // Group parameters by their `group` field in ordered sequence
  const { groups, ungrouped } = useMemo(() => {
    const groupMap = new Map<string, ParameterDefinition[]>();
    const withoutGroup: ParameterDefinition[] = [];

    for (const param of model.parameters) {
      if (param.group) {
        if (!groupMap.has(param.group)) {
          groupMap.set(param.group, []);
        }
        groupMap.get(param.group)!.push(param);
      } else {
        withoutGroup.push(param);
      }
    }

    return {
      groups: Array.from(groupMap.entries()),
      ungrouped: withoutGroup
    };
  }, [model.parameters]);

  if (collapsed) {
    return (
      <aside className="w-12 h-full bg-slate-900/80 border-r border-slate-800/80 flex flex-col items-center justify-between py-4 z-20">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Expand Customization Sidebar"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="rotate-90 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
          Parameters
        </div>

        <button
          onClick={onOpenExport}
          className="p-2 rounded-xl text-fuchsia-400 hover:bg-slate-800 transition-colors cursor-pointer"
          title={
            model.engine === 'openscad' ? 'Export STL / SCAD Files' : 'Export STL / STEP Files'
          }
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
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white px-2 py-1 rounded-lg border border-slate-800 hover:bg-slate-800/60 transition-colors cursor-pointer"
              title="Reset parameters to initial defaults"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>

            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Model switcher banner in sidebar */}
        <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="truncate pr-1">
              {model.project ? (
                <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-0.5">
                  <FolderKanban className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span className="truncate">{model.project}</span>
                </div>
              ) : (
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-0.5">
                  Active Model
                </span>
              )}
              <span className="text-xs font-bold text-white truncate block">{model.name}</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleCopyPermalink}
                className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                  copiedLink
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                    : 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/80'
                }`}
                title="Copy direct permalink URL with current parameters"
              >
                {copiedLink ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Share2 className="w-3 h-3 text-violet-400" />
                )}
                <span>{copiedLink ? 'Copied!' : 'Share'}</span>
              </button>

              <button
                type="button"
                onClick={onOpenModelDrawer}
                className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-fuchsia-400 hover:text-fuchsia-300 px-2 py-1 rounded-lg bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/30 transition-all cursor-pointer"
                title="Browse full model catalog"
              >
                <Layers className="w-3 h-3" />
                Change
              </button>
            </div>
          </div>

          {/* Project Part Switcher Tabs (when part of a multi-model project) */}
          {projectSiblings.length > 1 && (
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Switch Part:
              </span>
              <div
                className={`grid gap-1.5 p-1 bg-slate-950/80 border border-slate-800/80 rounded-xl ${
                  projectSiblings.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'
                }`}
              >
                {projectSiblings.map((pm) => {
                  const isCurrent = pm.id === model.id;
                  const partLabel =
                    pm.partName || pm.name.replace(model.project || '', '').trim() || pm.name;

                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => onSelectModel?.(pm.id)}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer truncate ${
                        isCurrent
                          ? 'bg-fuchsia-500 text-white shadow-md shadow-fuchsia-500/25 ring-1 ring-fuchsia-400'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                      title={`Switch to ${pm.name}`}
                    >
                      <Box
                        className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-white' : 'text-slate-500'}`}
                      />
                      <span className="truncate">{partLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Community & Original Model Links */}
        {model.links && model.links.length > 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-800/60 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1">
              Model Pages:
            </span>
            {model.links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border shadow-sm ${
                  link.site === 'printables'
                    ? 'bg-orange-500/15 text-orange-300 border-orange-500/30 hover:bg-orange-500/25 hover:border-orange-500/50'
                    : link.site === 'qidimaker'
                      ? 'bg-sky-500/15 text-sky-300 border-sky-500/30 hover:bg-sky-500/25 hover:border-sky-500/50'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                }`}
                title={`Open model page on ${link.label}`}
              >
                <span>{link.label}</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Scrollable Schema-Driven Parameters Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Render grouped parameter cards */}
        {groups.map(([groupName, params]) => (
          <ParameterGroupCard
            key={groupName}
            groupName={groupName}
            parameters={params}
            values={currentValues}
            onChange={handleChange}
            onChangeBatch={(updates) => onChangeValues({ ...currentValues, ...updates })}
          />
        ))}

        {/* Render ungrouped parameters if any */}
        {ungrouped.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/90 space-y-3 shadow-inner">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ungrouped.map((param) => (
                <div
                  key={param.id}
                  className={param.layout === 'half' ? 'col-span-1' : 'col-span-1 sm:col-span-2'}
                >
                  <GenericControl
                    param={param}
                    value={currentValues[param.id] ?? param.default}
                    isEnabled={
                      param.dependsOn
                        ? param.dependsOn.includes('=')
                          ? String(currentValues[param.dependsOn.split('=')[0]] ?? '') ===
                            param.dependsOn.split('=')[1]
                          : Boolean(currentValues[param.dependsOn] ?? true)
                        : true
                    }
                    onChange={(newVal) => handleChange(param.id, newVal)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
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
          {model.engine === 'openscad' ? 'Export STL / SCAD Files' : 'Export STL / STEP Files'}
        </button>
      </div>
    </aside>
  );
};
