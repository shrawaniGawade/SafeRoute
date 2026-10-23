import React, { useState } from 'react';
import AcidSquares from '../AcidSquares';
import { Play, Pause, ShieldCheck, AlertTriangle, Sparkles } from 'lucide-react';
import type { AcidSquaresPreset } from '../../data/presets';
import { useTheme } from '../../context/ThemeContext';

interface ShowcaseSectionProps {
  currentPreset: AcidSquaresPreset;
}

export const ShowcaseSection: React.FC<ShowcaseSectionProps> = ({ currentPreset }) => {
  const { isDark } = useTheme();
  const [isPaused, setIsPaused] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<'A' | 'B'>('A');

  return (
    <section id="preview" className="relative py-24 px-4 max-w-6xl mx-auto">
      <div className="flex flex-col items-center text-center mb-14">
        <span
          className={`text-xs font-mono uppercase tracking-widest mb-2 font-semibold ${
            isDark ? 'text-zinc-500' : 'text-zinc-400'
          }`}
        >
          Live Corridor Comparative Audit
        </span>
        <h2
          className={`text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 ${
            isDark ? 'text-white' : 'text-zinc-900'
          }`}
        >
          Route Safety vs. Raw Transit Distance
        </h2>
        <p className={`max-w-xl text-sm sm:text-base ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Notice how conventional routing chooses the fastest direct shortcut through deserted backstreets, while
          SafeRoute steers you through active, illuminated boulevards with natural surveillance.
        </p>
      </div>

      <div
        className={`rounded-3xl border shadow-2xl overflow-hidden ${
          isDark
            ? 'bg-[#0e0f14] border-white/[0.08]'
            : 'bg-zinc-100 border-zinc-200 shadow-zinc-200/60'
        }`}
      >
        {/* Fake browser bar */}
        <div
          className={`flex items-center justify-between px-6 py-3.5 border-b ${
            isDark ? 'bg-white/[0.02] border-white/[0.08]' : 'bg-white border-zinc-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-zinc-500/50" />
            <span className="w-3 h-3 rounded-full bg-zinc-400/50" />
            <span className="w-3 h-3 rounded-full bg-zinc-300/50" />
            <span
              className={`ml-3 text-xs font-mono ${
                isDark ? 'text-zinc-500' : 'text-zinc-400'
              }`}
            >
              evaluator.saferoute.app &bull; Route Comparative Studio
            </span>
          </div>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono transition-all cursor-pointer border ${
              isDark
                ? 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300'
                : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-700'
            }`}
          >
            {isPaused ? (
              <Play className={`w-3 h-3 ${isDark ? 'text-zinc-200' : 'text-zinc-700'}`} />
            ) : (
              <Pause className={`w-3 h-3 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`} />
            )}
            {isPaused ? 'Resume Physics' : 'Pause Physics'}
          </button>
        </div>

        {/* Canvas with interactive route comparison overlay */}
        <div className="relative h-[450px] w-full overflow-hidden bg-black">
          <AcidSquares
            color="#08080a"
            accentColor={currentPreset.accentColor}
            secondaryColor={currentPreset.secondaryColor}
            lighting={currentPreset.lighting}
            tileSize={currentPreset.tileSize}
            gap={currentPreset.gap}
            roundness={currentPreset.roundness}
            softness={currentPreset.softness}
            bulge={currentPreset.bulge}
            rotation={currentPreset.rotation}
            gloss={currentPreset.gloss}
            waves={currentPreset.waves}
            waveScale={currentPreset.waveScale}
            speed={currentPreset.speed}
            tilt={currentPreset.tilt}
            grain={currentPreset.grain}
            shape={currentPreset.shape}
            hoverEffect={currentPreset.hoverEffect}
            mouseInteraction={true}
            pulseOnClick={true}
            paused={isPaused}
            detail="medium"
            className="w-full h-full"
          />

          {/* Interactive route overlay card */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4 sm:p-6">
            <div className="pointer-events-auto max-w-lg w-full p-6 rounded-2xl bg-black/75 backdrop-blur-xl border border-white/10 text-left shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-300 flex items-center gap-1.5 font-semibold">
                  <Sparkles className="w-3 h-3" />
                  Comparative Corridor Analysis
                </span>
                <span className="text-xs font-mono text-zinc-400">Click surface to send wave pulses</span>
              </div>

              {/* Route A vs Route B Selector Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <button
                  onClick={() => setSelectedRoute('A')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedRoute === 'A'
                      ? 'bg-white/[0.08] border-white/25 text-white shadow-lg shadow-black/30 ring-1 ring-white/20'
                      : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-white">
                      <ShieldCheck className="w-3.5 h-3.5 text-zinc-200" />
                      Route A: Illuminated
                    </span>
                    <span className="font-mono text-xs font-extrabold text-white">88/100</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-tight">
                    Primary Commercial Avenue &bull; 2.4 km &bull; 24 min
                  </p>
                </button>

                <button
                  onClick={() => setSelectedRoute('B')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedRoute === 'B'
                      ? 'bg-red-500/15 border-red-500/50 text-white shadow-lg shadow-red-500/10 ring-1 ring-red-500/30'
                      : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-white">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      Route B: Dark Shortcut
                    </span>
                    <span className="font-mono text-xs font-extrabold text-red-400">42/100</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-tight">
                    Deserted Alley Corridor &bull; 2.1 km &bull; 21 min
                  </p>
                </button>
              </div>

              {/* Dynamic Advisory Explanation */}
              {selectedRoute === 'A' ? (
                <div className="p-3.5 rounded-xl bg-white/[0.05] border border-white/15 text-xs text-zinc-300 space-y-1.5">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>SafeRoute Recommendation: Safe Journey</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    Adds only 3 minutes (+300m) while increasing streetlamp illumination by <strong>+65%</strong> and active bystander natural surveillance by <strong>+80%</strong>.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-zinc-300 space-y-1.5">
                  <div className="flex items-center gap-2 text-red-400 font-semibold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>High Risk Warning: Low Illumination & Isolation</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    Saves 3 minutes of transit time but routes travelers through unmonitored backstreets with zero public lighting after 20:00 and zero open storefronts.
                  </p>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>Pluggable OSRM / ORS Routing Engine</span>
                <span className="text-zinc-300">GeoJSON Normalization</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
