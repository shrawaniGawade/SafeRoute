import React from 'react';
import { Cpu, Activity, Lightbulb, Lock, Database } from 'lucide-react';
import type { AcidSquaresPreset } from '../../data/presets';
import { useTheme } from '../../context/ThemeContext';

interface ArchitectureSectionProps {
  currentPreset: AcidSquaresPreset;
}

export const ArchitectureSection: React.FC<ArchitectureSectionProps> = ({ currentPreset }) => {
  const { isDark } = useTheme();

  const card = isDark
    ? 'bg-white/[0.02] border-white/[0.07] hover:border-white/[0.14]'
    : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-sm hover:shadow-md';

  const sub = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const label = isDark ? 'text-zinc-500' : 'text-zinc-400';
  const heading = isDark ? 'text-white' : 'text-zinc-900';

  return (
    <section id="architecture" className="relative py-28 px-4 max-w-6xl mx-auto">
      <div className="flex flex-col items-center text-center mb-16">
        <span className={`text-xs font-mono uppercase tracking-widest mb-3 font-semibold ${label}`}>
          Enterprise Safety Platform Architecture
        </span>
        <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 ${heading}`}>
          Engineered for Certainty. Zero Compromise on Personal Safety.
        </h2>
        <p className={`max-w-2xl text-sm sm:text-base leading-relaxed ${sub}`}>
          SafeRoute replaces generic shortest-distance algorithms with real-time multi-dimensional risk intelligence.
          Built on a dedicated 60-tree Random Forest AI service, a resilient heuristic fallback engine, and enterprise session security.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1 - wide */}
        <div className={`md:col-span-2 p-6 sm:p-8 rounded-2xl border transition-all relative overflow-hidden group ${card}`}>
          <div
            className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-10 pointer-events-none transition-all group-hover:opacity-20"
            style={{ backgroundColor: currentPreset.accentColor }}
          />
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                isDark ? 'bg-white/[0.05] border-white/10' : 'bg-zinc-100 border-zinc-200'
              }`}
            >
              <Cpu className={`w-5 h-5 ${isDark ? 'text-zinc-200' : 'text-zinc-700'}`} />
            </div>
            <div>
              <h3 className={`text-base font-semibold ${heading}`}>
                60-Tree Random Forest Regressor & Scoring Pipeline
              </h3>
              <p className={`text-xs font-mono ${label}`}>
                Python 3.12 &bull; FastAPI @ Port 8000 &bull; Sub-8ms Inference Time
              </p>
            </div>
          </div>
          <p className={`text-sm leading-relaxed mb-6 ${sub}`}>
            Rather than relying on uncalibrated distance shortcuts, our dedicated machine learning microservice continuously models
            municipal streetlamp quality, historical violent and property crime indices, vehicular collision hazard records, and active
            bystander pedestrian density to output a deterministic 0–100 journey safety rating.
          </p>
          <div
            className={`p-3.5 rounded-xl border font-mono text-xs overflow-x-auto ${
              isDark
                ? 'bg-black/60 border-white/[0.06] text-zinc-300'
                : 'bg-zinc-900 border-zinc-700 text-zinc-200'
            }`}
          >
            <div className={isDark ? 'text-zinc-500 mb-1' : 'text-zinc-400 mb-1'}>
              # Random Forest Multi-Factor Safety Prediction
            </div>
            <div>
              <span className="text-zinc-400">features</span> = np.array([[street_lighting, crime_severity, collision_hazard, foot_traffic]])
            </div>
            <div>
              <span className="text-zinc-400">safety_score</span> = float(rf_ensemble.predict(features)[0])
            </div>
            <div>
              <span className="text-white">return</span> SafetyScoreResponse(score=round(safety_score, 1), advisory=<span className="text-zinc-300">"Verified illuminated corridor"</span>)
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className={`p-6 sm:p-8 rounded-2xl border transition-all relative overflow-hidden ${card}`}>
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                isDark ? 'bg-white/[0.05] border-white/10' : 'bg-zinc-100 border-zinc-200'
              }`}
            >
              <Activity className={`w-5 h-5 ${isDark ? 'text-zinc-200' : 'text-zinc-700'}`} />
            </div>
            <div>
              <h3 className={`text-base font-semibold ${heading}`}>Resilient Fallback Engine</h3>
              <p className={`text-xs font-mono ${label}`}>Onboard Gateway Mathematical Continuity</p>
            </div>
          </div>
          <p className={`text-sm leading-relaxed mb-4 ${sub}`}>
            If the Python AI microservice encounters network latency or server maintenance, the Express gateway automatically
            computes an onboard calibrated heuristic formula, guaranteeing 100% service uptime for active commuters.
          </p>
          <div
            className={`mt-auto pt-4 border-t flex items-center justify-between text-xs font-mono ${
              isDark ? 'border-white/[0.06] text-zinc-500' : 'border-zinc-100 text-zinc-400'
            }`}
          >
            <span>Routing Availability</span>
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              99.99% Guaranteed
            </span>
          </div>
        </div>

        {/* Card 3 */}
        <div className={`p-6 sm:p-8 rounded-2xl border transition-all relative overflow-hidden ${card}`}>
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                isDark ? 'bg-white/[0.05] border-white/10' : 'bg-zinc-100 border-zinc-200'
              }`}
            >
              <Lightbulb className={`w-5 h-5 ${isDark ? 'text-zinc-200' : 'text-zinc-700'}`} />
            </div>
            <div>
              <h3 className={`text-base font-semibold ${heading}`}>Photonic Illumination Mapping</h3>
              <p className={`text-xs font-mono ${label}`}>Municipal Streetlamp Lumen Coverage</p>
            </div>
          </div>
          <p className={`text-sm leading-relaxed mb-4 ${sub}`}>
            Evaluates road lighting infrastructure, active lamp-post spacing, and evening shadow corridors to systematically steer
            pedestrians away from dark shortcuts and unlit alleys.
          </p>
          <div
            className={`mt-auto pt-4 border-t flex items-center justify-between text-xs font-mono ${
              isDark ? 'border-white/[0.06] text-zinc-500' : 'border-zinc-100 text-zinc-400'
            }`}
          >
            <span>Night Walk Influence</span>
            <span className={`font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>35% Primary Weight</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className={`p-6 sm:p-8 rounded-2xl border transition-all relative overflow-hidden ${card}`}>
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                isDark ? 'bg-white/[0.05] border-white/10' : 'bg-zinc-100 border-zinc-200'
              }`}
            >
              <Lock className={`w-5 h-5 ${isDark ? 'text-zinc-200' : 'text-zinc-700'}`} />
            </div>
            <div>
              <h3 className={`text-base font-semibold ${heading}`}>Dual-Token Security Architecture</h3>
              <p className={`text-xs font-mono ${label}`}>In-Memory JWT & httpOnly Token Rotation</p>
            </div>
          </div>
          <p className={`text-sm leading-relaxed mb-4 ${sub}`}>
            Access tokens reside strictly in application memory and are never saved to localStorage, eliminating XSS token harvesting.
            Paired with 7-day httpOnly Refresh Token Rotation (RTR) and 6-digit cryptographic numeric OTPs.
          </p>
          <div
            className={`mt-auto pt-4 border-t flex items-center justify-between text-xs font-mono ${
              isDark ? 'border-white/[0.06] text-zinc-500' : 'border-zinc-100 text-zinc-400'
            }`}
          >
            <span>Session Security</span>
            <span className={`font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>15-Min In-Memory TTL</span>
          </div>
        </div>

        {/* Card 5 */}
        <div className={`p-6 sm:p-8 rounded-2xl border transition-all relative overflow-hidden ${card}`}>
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                isDark ? 'bg-white/[0.05] border-white/10' : 'bg-zinc-100 border-zinc-200'
              }`}
            >
              <Database className={`w-5 h-5 ${isDark ? 'text-zinc-200' : 'text-zinc-700'}`} />
            </div>
            <div>
              <h3 className={`text-base font-semibold ${heading}`}>Dual-Layer Data Persistence</h3>
              <p className={`text-xs font-mono ${label}`}>MongoDB Atlas & In-Memory Resilient Store</p>
            </div>
          </div>
          <p className={`text-sm leading-relaxed mb-4 ${sub}`}>
            Strict user ownership prevents unauthorized route viewing. Automated MongoDB TTL indexes purge expired verification
            tokens, while administrative audit logs recursively redact credentials.
          </p>
          <div
            className={`mt-auto pt-4 border-t flex items-center justify-between text-xs font-mono ${
              isDark ? 'border-white/[0.06] text-zinc-500' : 'border-zinc-100 text-zinc-400'
            }`}
          >
            <span>User Route Privacy</span>
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>100% Private & Sanitized</span>
          </div>
        </div>
      </div>
    </section>
  );
};
