import React from 'react';
import { Sliders, X, RotateCcw, ShieldCheck } from 'lucide-react';
import { PRESETS, type AcidSquaresPreset } from '../../data/presets';
import { useTheme } from '../../context/ThemeContext';

interface TuningDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  preset: AcidSquaresPreset;
  onUpdatePreset: (newPreset: AcidSquaresPreset) => void;
  onSelectPreset: (preset: AcidSquaresPreset) => void;
  fullBackground: boolean;
  onToggleFullBackground: () => void;
}

export const TuningDrawer: React.FC<TuningDrawerProps> = ({
  isOpen,
  onClose,
  preset,
  onUpdatePreset,
  onSelectPreset,
  fullBackground,
  onToggleFullBackground,
}) => {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  const handleChange = <K extends keyof AcidSquaresPreset>(
    key: K,
    value: AcidSquaresPreset[K]
  ) => {
    onUpdatePreset({ ...preset, [key]: value });
  };

  const handleReset = () => {
    const base = PRESETS[preset.id] || PRESETS.saferoute;
    onUpdatePreset({ ...base });
  };

  const SliderRow = ({
    label,
    propKey,
    min,
    max,
    step,
  }: {
    label: string;
    propKey: keyof AcidSquaresPreset;
    min: number;
    max: number;
    step: number;
  }) => {
    const val = preset[propKey] as number;
    return (
      <div>
        <div className="flex justify-between text-[11px] font-mono mb-1">
          <span className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>{label}</span>
          <span className={isDark ? 'text-zinc-200' : 'text-zinc-700'}>{val.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={val}
          onChange={(e) =>
            handleChange(propKey, parseFloat(e.target.value) as AcidSquaresPreset[typeof propKey])
          }
          className={`w-full h-1 rounded appearance-none cursor-pointer ${
            isDark ? 'accent-white bg-white/10' : 'accent-zinc-900 bg-zinc-200'
          }`}
        />
      </div>
    );
  };

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 w-80 sm:w-96 rounded-2xl border shadow-2xl p-5 text-xs transition-all ${
        isDark
          ? 'bg-[#0f1015]/95 backdrop-blur-2xl border-white/10 shadow-black/60 text-zinc-300'
          : 'bg-white/95 backdrop-blur-2xl border-zinc-200 shadow-zinc-300/60 text-zinc-700'
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between pb-3.5 mb-3.5 border-b ${
          isDark ? 'border-white/[0.08]' : 'border-zinc-100'
        }`}
      >
        <div className="flex items-center gap-2">
          <Sliders className={`w-4 h-4 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`} />
          <span className={`font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            Surface & View Control
          </span>
          <span
            className={`rounded border px-1 py-px font-mono text-[8px] tracking-[0.14em] ${
              isDark
                ? 'border-white/15 bg-white/10 text-zinc-300'
                : 'border-zinc-300 bg-zinc-100 text-zinc-600'
            }`}
          >
            ADMIN
          </span>
        </div>
        <div className="flex items-center gap-1">
          <a
            href="#admin"
            title="Switch to Admin Panel"
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-mono transition-colors ${
              isDark
                ? 'text-zinc-400 hover:bg-white/10 hover:text-white'
                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span className="hidden sm:inline">Admin Panel</span>
          </a>
          <button
            onClick={handleReset}
            title="Reset to preset defaults"
            className={`p-1 rounded-md transition-colors cursor-pointer ${
              isDark
                ? 'hover:bg-white/10 text-zinc-400 hover:text-white'
                : 'hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className={`p-1 rounded-md transition-colors cursor-pointer ${
              isDark
                ? 'hover:bg-white/10 text-zinc-400 hover:text-white'
                : 'hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* Preset selector */}
        <div>
          <label
            className={`text-[11px] font-mono uppercase tracking-wider block mb-1.5 font-semibold ${
              isDark ? 'text-zinc-400' : 'text-zinc-500'
            }`}
          >
            Corridor & Radar Palettes
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.values(PRESETS).map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectPreset(p)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all cursor-pointer border ${
                  preset.id === p.id
                    ? isDark
                      ? 'bg-white/10 border-white/20 text-white font-medium ring-1 ring-white/20'
                      : 'bg-zinc-100 border-zinc-300 text-zinc-900 font-medium ring-1 ring-zinc-300'
                    : isDark
                    ? 'border-transparent hover:bg-white/5 text-zinc-400'
                    : 'border-transparent hover:bg-zinc-50 text-zinc-600'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: p.accentColor }}
                />
                <span className="truncate text-[11px]">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Landing view mode */}
        <div
          className={`rounded-xl border p-3 ${
            isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-zinc-50 border-zinc-200'
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold">Landing View Mode</span>
            <span className={`text-[10px] font-mono ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
              {fullBackground ? 'Full backdrop' : 'Hero backdrop'}
            </span>
          </div>
          <div
            className={`grid grid-cols-2 gap-1 rounded-lg p-1 ${
              isDark ? 'bg-black/40' : 'bg-zinc-200/60'
            }`}
          >
            <button
              onClick={() => fullBackground && onToggleFullBackground()}
              className={`rounded-md px-2 py-1.5 text-[11px] font-mono transition-all cursor-pointer ${
                !fullBackground
                  ? isDark
                    ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                    : 'bg-white text-zinc-900 font-semibold shadow-sm'
                  : isDark
                  ? 'text-zinc-500 hover:text-zinc-300'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              Hero View
            </button>
            <button
              onClick={() => !fullBackground && onToggleFullBackground()}
              className={`rounded-md px-2 py-1.5 text-[11px] font-mono transition-all cursor-pointer ${
                fullBackground
                  ? isDark
                    ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                    : 'bg-white text-zinc-900 font-semibold shadow-sm'
                  : isDark
                  ? 'text-zinc-500 hover:text-zinc-300'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              Full View
            </button>
          </div>
          <p className={`mt-2 text-[10px] leading-relaxed ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
            Admin-only. Sets the default landing backdrop saved to this browser.
          </p>
        </div>

        {/* Sliders */}
        <div className="space-y-3 pt-1 border-t border-inherit">
          <SliderRow label="Tile Size" propKey="tileSize" min={0.5} max={2.0} step={0.05} />
          <SliderRow label="Tile Gap" propKey="gap" min={0.02} max={0.3} step={0.01} />
          <SliderRow label="Corner Roundness" propKey="roundness" min={0.0} max={0.5} step={0.02} />
          <SliderRow label="Wave Dynamics" propKey="waves" min={0.0} max={1.5} step={0.05} />
          <SliderRow label="Animation Velocity" propKey="speed" min={0.1} max={1.2} step={0.05} />
          <SliderRow label="Specular Gloss" propKey="gloss" min={0.1} max={1.0} step={0.05} />
          <SliderRow label="Perspective Tilt" propKey="tilt" min={0.2} max={1.0} step={0.02} />
          <SliderRow label="Surface Grain" propKey="grain" min={0.0} max={0.2} step={0.01} />
        </div>
      </div>
    </div>
  );
};
