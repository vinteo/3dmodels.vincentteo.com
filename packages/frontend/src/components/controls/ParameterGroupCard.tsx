import React, { useState, useMemo } from 'react';
import { ParameterDefinition } from '../../types/model';
import { GenericControl } from './GenericControl';
import { CircleDot, Layers, Box, Settings, RotateCw } from 'lucide-react';

export interface ParameterGroupCardProps {
  groupName: string;
  parameters: ParameterDefinition[];
  values: Record<string, number | string | boolean>;
  onChange: (id: string, value: number | string | boolean) => void;
  onChangeBatch?: (newValues: Record<string, number | string | boolean>) => void;
}

interface RepeatedCluster {
  id: string;
  name: string;
  sampleParam: ParameterDefinition;
  params: ParameterDefinition[];
}

/**
 * Gets an icon matching the group name
 */
function getGroupIcon(groupName: string) {
  const lower = groupName.toLowerCase();
  if (lower.includes('ring') || lower.includes('keychain')) {
    return <CircleDot className="w-3.5 h-3.5 text-fuchsia-400" />;
  }
  if (lower.includes('pattern') || lower.includes('section') || lower.includes('lattice')) {
    return <Layers className="w-3.5 h-3.5 text-pink-400" />;
  }
  if (lower.includes('assembly') || lower.includes('output') || lower.includes('fuse')) {
    return <Box className="w-3.5 h-3.5 text-violet-400" />;
  }
  return <Settings className="w-3.5 h-3.5 text-sky-400" />;
}

export const ParameterGroupCard: React.FC<ParameterGroupCardProps> = ({
  groupName,
  parameters,
  values,
  onChange,
  onChangeBatch
}) => {
  const [customizeIndividual, setCustomizeIndividual] = useState<boolean>(false);

  // Check if group has a primary boolean switch (e.g. "include_keychain_ring")
  const primaryToggle = parameters.find((p) => p.type === 'boolean' && !p.dependsOn);
  const isPrimaryEnabled = primaryToggle
    ? Boolean(values[primaryToggle.id] ?? primaryToggle.default)
    : true;

  // Parameters to render in body (excluding the primary toggle if it's rendered in header)
  const bodyParams = primaryToggle
    ? parameters.filter((p) => p.id !== primaryToggle.id)
    : parameters;

  // Filter out dependent parameters when parent condition is false
  const visibleBodyParams = bodyParams.filter((p) => {
    if (!p.dependsOn) return true;
    const parentVal = values[p.dependsOn];
    return parentVal === undefined ? true : Boolean(parentVal);
  });

  // Identify clusters of 3 or more repeated enum parameters (e.g. 6 section patterns or 6 rotations)
  const { clusters, clusterParamIds, standaloneParams } = useMemo(() => {
    const clusterMap = new Map<string, ParameterDefinition[]>();
    const standalone: ParameterDefinition[] = [];

    for (const param of visibleBodyParams) {
      if (param.type === 'enum' && param.options && param.options.length > 0) {
        const sig = `${param.type}:${param.widget || 'default'}:${JSON.stringify(param.options)}`;
        if (!clusterMap.has(sig)) {
          clusterMap.set(sig, []);
        }
        clusterMap.get(sig)!.push(param);
      } else {
        standalone.push(param);
      }
    }

    const clustersList: RepeatedCluster[] = [];
    const clusteredIds = new Set<string>();

    for (const [, params] of clusterMap.entries()) {
      if (params.length >= 3) {
        const sample = params[0];
        for (const p of params) clusteredIds.add(p.id);

        let clusterLabel = sample.name.replace(/\b(1|2|3|4|5|6|\([^\)]*\))\b/g, '').trim();
        if (clusterLabel.toLowerCase().includes('rotation')) {
          clusterLabel = 'Pattern Rotation (All Sections)';
        } else if (clusterLabel.toLowerCase().includes('section')) {
          clusterLabel = 'Lattice Pattern (All Sections)';
        } else {
          clusterLabel = `${clusterLabel} (All)`;
        }

        clustersList.push({
          id: sample.id,
          name: clusterLabel,
          sampleParam: sample,
          params
        });
      } else {
        standalone.push(...params);
      }
    }

    return {
      clusters: clustersList,
      clusterParamIds: clusteredIds,
      standaloneParams: standalone
    };
  }, [visibleBodyParams]);

  // Clustered parameters to render when individual customization is toggled
  const individualClusterParams = visibleBodyParams.filter((p) => clusterParamIds.has(p.id));

  const hasClusters = clusters.length > 0;

  // Master batch update handler
  const handleBatchUpdate = (cluster: RepeatedCluster, newValue: string) => {
    if (onChangeBatch) {
      const updates: Record<string, string> = {};
      for (const p of cluster.params) {
        updates[p.id] = newValue;
      }
      onChangeBatch(updates);
    } else {
      for (const p of cluster.params) {
        onChange(p.id, newValue);
      }
    }
  };

  // Cycle through options for a cluster (e.g. 0° -> 120° -> 240° -> 0°)
  const handleCycleCluster = (cluster: RepeatedCluster) => {
    const options = cluster.sampleParam.options || [];
    if (options.length === 0) return;

    const firstVal = String(values[cluster.params[0].id] ?? cluster.sampleParam.default);
    const currentIdx = options.findIndex((opt) => opt.value === firstVal);
    const nextIdx = (currentIdx + 1) % options.length;
    const nextVal = options[nextIdx].value;

    handleBatchUpdate(cluster, nextVal);
  };

  return (
    <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/90 space-y-3 shadow-inner">
      {/* Group Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getGroupIcon(groupName)}
          <div>
            <span className="text-xs font-bold text-white block">{groupName}</span>
            {primaryToggle && primaryToggle.name !== groupName && (
              <span className="text-[11px] text-slate-300 font-medium block">
                {primaryToggle.name}
              </span>
            )}
          </div>
        </div>

        {/* Primary toggle in header */}
        {primaryToggle && (
          <button
            type="button"
            role="switch"
            aria-checked={isPrimaryEnabled}
            onClick={() => onChange(primaryToggle.id, !isPrimaryEnabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isPrimaryEnabled ? 'bg-fuchsia-500' : 'bg-slate-800'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                isPrimaryEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        )}
      </div>

      {primaryToggle?.description && (
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {primaryToggle.description}
        </p>
      )}

      {/* Body Content */}
      {visibleBodyParams.length > 0 && (
        <div
          className={`space-y-3 ${
            primaryToggle ? 'pt-2.5 border-t border-slate-800/80 animate-in fade-in slide-in-from-top-1 duration-200' : ''
          }`}
        >
          {/* Master Controls for repeated clusters */}
          {hasClusters && (
            <div className="space-y-3">
              {clusters.map((cluster) => {
                const firstVal = String(values[cluster.params[0].id] ?? cluster.sampleParam.default);
                const allSame = cluster.params.every(
                  (p) => String(values[p.id] ?? p.default) === firstVal
                );
                const masterVal = allSame ? firstVal : 'mixed';
                const isSegmented = cluster.sampleParam.widget === 'segmented';
                const selectedOpt = cluster.sampleParam.options?.find((opt) => opt.value === masterVal);

                return (
                  <div key={cluster.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold text-slate-200">
                        {cluster.name}
                      </label>
                      {isSegmented && (
                        <button
                          type="button"
                          onClick={() => handleCycleCluster(cluster)}
                          className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/30 text-[11px] font-bold transition-all cursor-pointer"
                          title="Cycle through rotation options for all sections"
                        >
                          <RotateCw className="w-3 h-3" />
                          <span>Cycle +120°</span>
                        </button>
                      )}
                    </div>

                    {isSegmented ? (
                      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                        {cluster.sampleParam.options?.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            title={opt.description || opt.label}
                            onClick={() => handleBatchUpdate(cluster, opt.value)}
                            className={`py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              masterVal === opt.value
                                ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <select
                        value={masterVal}
                        onChange={(e) => handleBatchUpdate(cluster, e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-fuchsia-500 cursor-pointer"
                      >
                        {!allSame && (
                          <option value="mixed" disabled>
                            — Mixed / Individual Selection —
                          </option>
                        )}
                        {cluster.sampleParam.options?.map((opt) => (
                          <option key={opt.value} value={opt.value} title={opt.description}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {selectedOpt?.description && (
                      <p className="text-[11px] text-slate-400 italic leading-snug">
                        {selectedOpt.description}
                      </p>
                    )}
                  </div>
                );
              })}

              {/* Checkbox toggle to reveal individual repeated parameters */}
              <div className="pt-1">
                <label className="flex items-center space-x-2.5 text-xs font-medium text-slate-300 hover:text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={customizeIndividual}
                    onChange={(e) => setCustomizeIndividual(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-fuchsia-500 focus:ring-fuchsia-400 focus:ring-offset-0 cursor-pointer"
                  />
                  <span>Customize each section individually</span>
                </label>
              </div>

              {/* Individual parameters grid (expanded when checked) */}
              {customizeIndividual && individualClusterParams.length > 0 && (
                <div className="space-y-2.5 pt-2.5 border-t border-slate-800/80 animate-in fade-in slide-in-from-top-1 duration-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Individual Sectors (1–6)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {individualClusterParams.map((param) => {
                      const val = values[param.id] ?? param.default;
                      const isEnabled = param.dependsOn
                        ? Boolean(values[param.dependsOn] ?? true)
                        : true;

                      return (
                        <div
                          key={param.id}
                          className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80"
                        >
                          <GenericControl
                            param={param}
                            value={val}
                            isEnabled={isEnabled}
                            onChange={(newVal) => onChange(param.id, newVal)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Standalone Parameters (e.g. Design Lattice Thickness or non-clustered params) */}
          {standaloneParams.length > 0 && (
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${
                hasClusters ? 'pt-2.5 border-t border-slate-800/80' : ''
              }`}
            >
              {standaloneParams.map((param) => {
                const val = values[param.id] ?? param.default;
                const isEnabled = param.dependsOn
                  ? Boolean(values[param.dependsOn] ?? true)
                  : true;
                const colSpan = param.layout === 'half' ? 'col-span-1' : 'col-span-1 sm:col-span-2';

                return (
                  <div key={param.id} className={colSpan}>
                    <GenericControl
                      param={param}
                      value={val}
                      isEnabled={isEnabled}
                      onChange={(newVal) => onChange(param.id, newVal)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
