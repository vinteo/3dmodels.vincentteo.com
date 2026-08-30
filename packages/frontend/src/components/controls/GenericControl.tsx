import React from 'react';
import { ParameterDefinition } from '../../types/model';
import { Info } from 'lucide-react';

export interface GenericControlProps {
  param: ParameterDefinition;
  value: number | string | boolean;
  isEnabled?: boolean;
  onChange: (value: number | string | boolean) => void;
}

/**
 * Numeric Quantity Control with Slider and Input
 */
export const QuantityControl: React.FC<GenericControlProps> = ({
  param,
  value,
  isEnabled = true,
  onChange
}) => {
  const numVal = Number(value);
  const min = param.min ?? 1;
  const max = param.max ?? 300;
  const step = param.step ?? 1;

  return (
    <div
      className={`space-y-1.5 transition-opacity duration-200 ${
        !isEnabled ? 'opacity-40 pointer-events-none' : ''
      }`}
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
            onChange={(e) => onChange(parseFloat(e.target.value) || min)}
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
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      />

      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
        <span>{min} {param.unit === 'millimeter' ? 'mm' : ''}</span>
        <span>{max} {param.unit === 'millimeter' ? 'mm' : ''}</span>
      </div>
    </div>
  );
};

/**
 * Enum Control supporting both Select Dropdowns and Segmented Buttons
 */
export const EnumControl: React.FC<GenericControlProps> = ({
  param,
  value,
  isEnabled = true,
  onChange
}) => {
  const strVal = String(value);

  // Segmented button pill group (useful for rotation angles or small option sets)
  if (param.widget === 'segmented' && param.options && param.options.length > 0) {
    return (
      <div
        className={`space-y-1.5 transition-opacity duration-200 ${
          !isEnabled ? 'opacity-40 pointer-events-none' : ''
        }`}
      >
        <div className="flex items-center justify-between text-xs">
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
        </div>

        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
          {param.options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={!isEnabled}
              onClick={() => onChange(opt.value)}
              className={`py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                strVal === opt.value
                  ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Standard Select Dropdown
  return (
    <div
      className={`space-y-1.5 transition-opacity duration-200 ${
        !isEnabled ? 'opacity-40 pointer-events-none' : ''
      }`}
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
        value={strVal}
        disabled={!isEnabled}
        onChange={(e) => onChange(e.target.value)}
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
};

/**
 * Boolean Switch Control
 */
export const BooleanControl: React.FC<GenericControlProps> = ({
  param,
  value,
  isEnabled = true,
  onChange
}) => {
  const boolVal = Boolean(value);

  return (
    <div
      className={`flex items-center justify-between py-1 transition-opacity duration-200 ${
        !isEnabled ? 'opacity-40 pointer-events-none' : ''
      }`}
    >
      <div className="pr-2">
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
        disabled={!isEnabled}
        onClick={() => onChange(!boolVal)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
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
};

/**
 * String Text Control
 */
export const StringControl: React.FC<GenericControlProps> = ({
  param,
  value,
  isEnabled = true,
  onChange
}) => {
  return (
    <div
      className={`space-y-1.5 transition-opacity duration-200 ${
        !isEnabled ? 'opacity-40 pointer-events-none' : ''
      }`}
    >
      <label
        htmlFor={`param-${param.id}`}
        className="block text-xs font-bold text-slate-200"
      >
        {param.name}
      </label>
      <input
        type="text"
        id={`param-${param.id}`}
        value={String(value)}
        disabled={!isEnabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-fuchsia-500 disabled:text-slate-600 disabled:border-slate-900"
      />
    </div>
  );
};

/**
 * Unified Generic Control Dispatcher
 */
export const GenericControl: React.FC<GenericControlProps> = (props) => {
  switch (props.param.type) {
    case 'quantity':
      return <QuantityControl {...props} />;
    case 'enum':
      return <EnumControl {...props} />;
    case 'boolean':
      return <BooleanControl {...props} />;
    case 'string':
      return <StringControl {...props} />;
    default:
      return null;
  }
};
