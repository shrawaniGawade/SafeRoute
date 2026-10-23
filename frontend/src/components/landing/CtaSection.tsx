import React from 'react';
import { Sparkles, ArrowRight, Shield, LogIn } from 'lucide-react';
import type { AcidSquaresPreset } from '../../data/presets';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface CtaSectionProps {
  currentPreset: AcidSquaresPreset;
  onSignUp: () => void;
  onSignIn: () => void;
  onNavigateApp?: () => void;
}

export const CtaSection: React.FC<CtaSectionProps> = ({
  currentPreset,
  onSignUp,
  onSignIn,
  onNavigateApp,
}) => {
  const { isDark } = useTheme();
  const { isAuthenticated } = useAuth();

  const handleLaunch = () => {
    if (isAuthenticated) {
      if (onNavigateApp) onNavigateApp();
      else window.location.hash = '#/app';
    } else {
      onSignUp();
    }
  };

  return (
    <section className="relative py-28 px-4 max-w-5xl mx-auto">
      <div
        className={`relative rounded-3xl p-8 sm:p-14 border text-center overflow-hidden transition-all ${
          isDark
            ? 'bg-gradient-to-b from-white/[0.04] to-white/[0.01] border-white/10 backdrop-blur-2xl'
            : 'bg-gradient-to-b from-zinc-50 to-white border-zinc-200 shadow-xl shadow-zinc-200/60'
        }`}
      >
        {/* Ambient glow */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-[100px] opacity-15 pointer-events-none"
          style={{ backgroundColor: currentPreset.accentColor }}
        />

        <div className="relative z-10 max-w-2xl mx-auto">
          <div
            className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border text-xs font-mono mb-6 font-semibold ${
              isDark
                ? 'bg-white/[0.06] border-white/15 text-zinc-200'
                : 'bg-zinc-100 border-zinc-200 text-zinc-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smarter Journeys. Safer Choices. &bull; SafeRoute v2.0</span>
          </div>

          <h2
            className={`text-3xl sm:text-5xl font-extrabold tracking-tight mb-5 leading-tight ${
              isDark ? 'text-white' : 'text-zinc-900'
            }`}
          >
            Never walk in the dark again.
          </h2>

          <p
            className={`text-sm sm:text-base mb-8 leading-relaxed ${
              isDark ? 'text-zinc-400' : 'text-zinc-600'
            }`}
          >
            Join thousands of pedestrians, night commuters, and solo travelers who plan every journey with verified streetlamp
            illumination, multi-factor crime risk analysis, and real-time AI scoring.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleLaunch}
              className={`w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full font-semibold text-sm transition-all cursor-pointer shadow-lg active:scale-95 ${
                isDark
                  ? 'bg-white text-zinc-950 shadow-white/15 hover:bg-zinc-200'
                  : 'bg-zinc-950 text-white shadow-zinc-900/20 hover:bg-zinc-800'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{isAuthenticated ? 'Launch Route Planner' : 'Create Free Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {!isAuthenticated && (
              <button
                onClick={onSignIn}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-sm font-medium transition-all cursor-pointer border ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-200'
                    : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700 shadow-sm'
                }`}
              >
                <LogIn className="w-4 h-4 text-zinc-400" />
                <span>Traveler Sign In</span>
              </button>
            )}

            <a
              href="#/admin-login"
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-full text-xs font-mono transition-all cursor-pointer border ${
                isDark
                  ? 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 text-zinc-300'
                  : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-600'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
