import React, { useState, useMemo } from 'react';
import { Copy, Check, Code2, Sliders, BookOpen, ShieldCheck } from 'lucide-react';
import type { AcidSquaresPreset } from '../../data/presets';
import { useTheme } from '../../context/ThemeContext';

interface InteractivePlaygroundProps {
  currentPreset: AcidSquaresPreset;
}

export const InteractivePlayground: React.FC<InteractivePlaygroundProps> = ({ currentPreset }) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'simulator' | 'api' | 'schema'>('simulator');
  const [copied, setCopied] = useState(false);

  // Interactive Simulator parameters
  const [lighting, setLighting] = useState<number>(8.8);
  const [crime, setCrime] = useState<number>(1.2);
  const [accidents, setAccidents] = useState<number>(1.8);
  const [crowd, setCrowd] = useState<number>(8.0);

  // Calibrated AI formula matching SafeRoute's backend regressor & heuristic:
  // lighting (35%), crime suppression (35%), accident hazard safety (15%), bystander presence (15%)
  const simulatedScore = useMemo(() => {
    const raw =
      (lighting * 3.5) +
      ((10 - crime) * 3.5) +
      ((10 - accidents) * 1.5) +
      (crowd * 1.5);
    return Math.min(100, Math.max(0, Math.round(raw)));
  }, [lighting, crime, accidents, crowd]);

  const scoreLevel = useMemo(() => {
    if (simulatedScore >= 75) {
      return {
        label: 'Optimal Route Safety',
        color: isDark ? '#f4f4f5' : '#18181b',
        bg: isDark
          ? 'bg-white/10 text-zinc-100 border-white/20'
          : 'bg-zinc-900/5 text-zinc-800 border-zinc-300',
        advisory: 'Recommended for evening and night walking. Well-lit corridor with active storefronts and frequent bystander activity.',
      };
    }
    if (simulatedScore >= 50) {
      return {
        label: 'Moderate Caution Advised',
        color: '#f59e0b',
        bg: isDark
          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
          : 'bg-amber-50 text-amber-700 border-amber-200',
        advisory: 'Acceptable for daytime commutes. Travelers traveling alone after dusk are encouraged to choose a higher-illumination corridor.',
      };
    }
    return {
      label: 'High Risk Hazard Warning',
      color: '#ef4444',
      bg: isDark
        ? 'bg-red-500/20 text-red-300 border-red-500/30'
        : 'bg-red-50 text-red-700 border-red-200',
      advisory: 'Low visibility corridor with unmonitored alleys or elevated incident frequency. SafeRoute strongly recommends choosing an alternative avenue.',
    };
  }, [simulatedScore, isDark]);

  const apiSnippet = `// POST https://saferoute.app/api/safety/score
const response = await fetch('/api/safety/score', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <in_memory_jwt>'
  },
  body: JSON.stringify({
    lighting: ${lighting.toFixed(1)},      // Street Illumination (0-10)
    crime: ${crime.toFixed(1)},         // Historical Crime Index (0-10)
    accidents: ${accidents.toFixed(1)},     // Collision Hazard (0-10)
    crowd: ${crowd.toFixed(1)}          // Pedestrian Density (0-10)
  })
});

const evaluation = await response.json();
// Response:
// {
//   "score": ${simulatedScore},
//   "riskLevel": "${scoreLevel.label}",
//   "advisory": "${scoreLevel.advisory}",
//   "model": "random-forest-v2-60trees",
//   "inferenceLatencyMs": 7.2
// }`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabBtn = (id: typeof activeTab, label: string, Icon: React.ElementType) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
        activeTab === id
          ? isDark
            ? 'bg-white/10 text-white border-white/20 shadow-sm'
            : 'bg-white text-zinc-900 border-zinc-200 shadow-sm'
          : `border-transparent ${
              isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-700'
            }`
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );

  return (
    <section id="simulator" className="relative py-24 px-4 max-w-5xl mx-auto">
      <div className="flex flex-col items-center text-center mb-12">
        <span
          className={`text-xs font-mono uppercase tracking-widest mb-2 font-semibold ${
            isDark ? 'text-zinc-500' : 'text-zinc-400'
          }`}
        >
          Interactive AI Safety Simulator
        </span>
        <h2
          className={`text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 ${
            isDark ? 'text-white' : 'text-zinc-900'
          }`}
        >
          Test Real-Time Machine Learning Inference
        </h2>
        <p className={`max-w-xl text-sm sm:text-base ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Simulate journey safety scores by tuning lighting, crime, collision, and crowd density factors. Inspect the live score,
          risk category, and corresponding REST API payload.
        </p>
      </div>

      <div
        className={`rounded-2xl border shadow-xl overflow-hidden transition-all ${
          isDark
            ? 'bg-[#0d0e12] border-white/[0.08]'
            : 'bg-zinc-50 border-zinc-200 shadow-zinc-200/50'
        }`}
      >
        {/* Tab Selector Header */}
        <div
          className={`flex items-center justify-between px-4 py-3 border-b ${
            isDark ? 'bg-white/[0.02] border-white/[0.08]' : 'bg-white border-zinc-200'
          }`}
        >
          <div className="flex items-center gap-1.5">
            {tabBtn('simulator', 'AI Factor Simulator', Sliders)}
            {tabBtn('api', 'REST API Endpoint', Code2)}
            {tabBtn('schema', 'Parameter Specifications', BookOpen)}
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`hidden sm:inline text-[11px] font-mono ${
                isDark ? 'text-zinc-500' : 'text-zinc-400'
              }`}
            >
              Surface: {currentPreset.name}
            </span>
            <button
              onClick={() => handleCopy(apiSnippet)}
              title="Copy code snippet"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all cursor-pointer border ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300'
                  : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-700'
              }`}
            >
              {copied ? (
                <>
                  <Check className={`w-3.5 h-3.5 ${isDark ? 'text-zinc-200' : 'text-zinc-700'}`} />
                  <span className={isDark ? 'text-zinc-200' : 'text-zinc-700'}>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-6">
          {activeTab === 'simulator' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Factor Control Sliders */}
              <div className="lg:col-span-7 space-y-5">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1.5">
                    <span className={`font-semibold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                      Street Illumination Quality
                    </span>
                    <span className={`font-bold ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>{lighting.toFixed(1)} / 10.0</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={0.1}
                    value={lighting}
                    onChange={(e) => setLighting(parseFloat(e.target.value))}
                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                      isDark ? 'accent-white bg-white/10' : 'accent-zinc-900 bg-zinc-200'
                    }`}
                  />
                  <div className={`flex justify-between text-[10px] font-mono mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    <span>Unlit Alleyway (0.0)</span>
                    <span>Commercial Grade Lighting (10.0)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1.5">
                    <span className={`font-semibold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                      Historical Crime Severity Index
                    </span>
                    <span className="font-bold text-red-400">{crime.toFixed(1)} / 10.0</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={0.1}
                    value={crime}
                    onChange={(e) => setCrime(parseFloat(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-red-500 bg-red-950/40"
                  />
                  <div className={`flex justify-between text-[10px] font-mono mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    <span>Zero Incident History (0.0)</span>
                    <span>High Incident Frequency (10.0)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1.5">
                    <span className={`font-semibold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                      Vehicular Collision Hazard
                    </span>
                    <span className="font-bold text-amber-400">{accidents.toFixed(1)} / 10.0</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={0.1}
                    value={accidents}
                    onChange={(e) => setAccidents(parseFloat(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-amber-500 bg-amber-950/40"
                  />
                  <div className={`flex justify-between text-[10px] font-mono mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    <span>Pedestrian-Only Walkway (0.0)</span>
                    <span>Dangerous Intersection (10.0)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1.5">
                    <span className={`font-semibold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                      Bystander Pedestrian Density
                    </span>
                    <span className={`font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>{crowd.toFixed(1)} / 10.0</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={0.1}
                    value={crowd}
                    onChange={(e) => setCrowd(parseFloat(e.target.value))}
                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                      isDark ? 'accent-zinc-300 bg-white/10' : 'accent-zinc-600 bg-zinc-200'
                    }`}
                  />
                  <div className={`flex justify-between text-[10px] font-mono mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    <span>Deserted Street (0.0)</span>
                    <span>Vibrant Foot Traffic (10.0)</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Score Output Showcase */}
              <div
                className={`lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl border border-inherit text-center backdrop-blur-md ${
                  isDark ? 'bg-black/40' : 'bg-white'
                }`}
              >
                <span className={`text-[11px] font-mono uppercase tracking-wider mb-2 font-semibold ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Predicted Journey Safety Score
                </span>
                <div
                  className="text-6xl font-black font-mono tracking-tight mb-2"
                  style={{ color: scoreLevel.color }}
                >
                  {simulatedScore}
                  <span className="text-xl font-normal font-sans opacity-70">/100</span>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border mb-4 ${scoreLevel.bg}`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {scoreLevel.label}
                </span>
                <p className={`text-xs leading-relaxed max-w-xs ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                  {scoreLevel.advisory}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div
              className={`p-4 rounded-xl border font-mono text-xs overflow-x-auto ${
                isDark ? 'bg-black/70 border-white/[0.06] text-zinc-300' : 'bg-zinc-900 border-zinc-700 text-zinc-200'
              }`}
            >
              <pre>{apiSnippet}</pre>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className={`border-b font-mono ${isDark ? 'border-white/10 text-zinc-400' : 'border-zinc-200 text-zinc-600'}`}>
                    <th className="py-2.5 px-3">Field</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Bounds</th>
                    <th className="py-2.5 px-3">Safety Context & Description</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-white/5 text-zinc-300' : 'divide-zinc-100 text-zinc-700'}`}>
                  <tr>
                    <td className={`py-2.5 px-3 font-mono font-bold ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>lighting</td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400">float</td>
                    <td className="py-2.5 px-3 font-mono">0.0 – 10.0</td>
                    <td className="py-2.5 px-3">Municipal road lighting lumens, lamp-post density, and evening shadow suppression.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-mono font-bold text-red-400">crime</td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400">float</td>
                    <td className="py-2.5 px-3 font-mono">0.0 – 10.0</td>
                    <td className="py-2.5 px-3">Municipal historical violent and property incident rates normalized by street segment.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-400">accidents</td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400">float</td>
                    <td className="py-2.5 px-3 font-mono">0.0 – 10.0</td>
                    <td className="py-2.5 px-3">Vehicular collisions, blind corners, and high-risk pedestrian road intersections.</td>
                  </tr>
                  <tr>
                    <td className={`py-2.5 px-3 font-mono font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>crowd</td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400">float</td>
                    <td className="py-2.5 px-3 font-mono">0.0 – 10.0</td>
                    <td className="py-2.5 px-3">Active bystander foot traffic, operating commercial storefronts, and transit hubs.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
