import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  Copy,
  Sparkles,
  ShieldCheck,
  MapPin,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface HeroProps {
  onSignUp: () => void;
  onNavigateApp?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onSignUp, onNavigateApp }) => {
  const { isDark } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const [copied, setCopied] = useState(false);

  const isAdmin = user?.role === 'admin';

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(
      'curl -X POST https://saferoute.app/api/safety/score -H "Content-Type: application/json" -d \'{"lighting":9.2,"crime":1.0,"accidents":1.8,"crowd":8.6}\''
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrimaryClick = () => {
    if (isAuthenticated) {
      if (onNavigateApp) onNavigateApp();
      else window.location.hash = '#/app';
    } else {
      onSignUp();
    }
  };

  const primaryLabel = isAuthenticated
    ? isAdmin
      ? 'Open Admin Console'
      : 'Launch Route Planner'
    : 'Explore Safe Navigation';

  const hairline = isDark ? 'border-white/[0.08]' : 'border-zinc-200';
  const muted = isDark ? 'text-zinc-500' : 'text-zinc-500';
  const strong = isDark ? 'text-white' : 'text-zinc-950';

  const factors = [
    { label: 'Street Illumination Quality', score: '92%', width: '92%' },
    { label: 'Crime Risk Suppression', score: '90%', width: '90%' },
    { label: 'Traffic Collision Safety', score: '82%', width: '82%' },
    { label: 'Bystander Pedestrian Density', score: '86%', width: '86%' },
  ];
  const barColors = isDark
    ? ['#fafafa', '#d4d4d8', '#a1a1aa', '#71717a']
    : ['#18181b', '#3f3f46', '#71717a', '#a1a1aa'];

  return (
    <section
      id="home"
      className="relative flex min-h-screen flex-col items-center justify-center px-4 pb-20 pt-32 text-center select-none"
    >
      {/* Authenticated Welcome Banner */}
      {isAuthenticated && user && (
        <div
          className={`mb-6 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-medium backdrop-blur-md ${
            isDark
              ? 'border-white/10 bg-white/[0.04] text-zinc-300'
              : 'border-zinc-200 bg-white/70 text-zinc-700'
          }`}
        >
          <ShieldCheck className={`h-3.5 w-3.5 ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`} />
          <span>
            Signed in as <strong className={strong}>{user.name?.split(' ')[0] || 'Traveler'}</strong>
            {isAdmin ? ' — Admin console active' : ' — Route intelligence ready'}
          </span>
        </div>
      )}

      {/* Eyebrow */}
      <div
        className={`mb-8 inline-flex items-center gap-2.5 rounded-full border px-3.5 py-1.5 backdrop-blur-md ${
          isDark
            ? 'border-white/[0.08] bg-white/[0.03]'
            : 'border-zinc-200 bg-white/70 shadow-sm shadow-zinc-200/50'
        }`}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${
              isDark ? 'bg-white' : 'bg-zinc-900'
            }`}
          />
          <span
            className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
              isDark ? 'bg-white' : 'bg-zinc-900'
            }`}
          />
        </span>
        <span
          className={`font-mono text-[10px] font-semibold uppercase tracking-[0.2em] ${
            isDark ? 'text-zinc-300' : 'text-zinc-600'
          }`}
        >
          AI-Powered Safety Navigation
        </span>
        <span className={`hidden h-3 w-px sm:block ${isDark ? 'bg-white/15' : 'bg-zinc-300'}`} />
        <span className={`hidden font-mono text-[10px] sm:inline ${muted}`}>
          60-Tree Ensemble &bull; <span className={isDark ? 'text-zinc-300' : 'text-zinc-700'}>&lt;8ms</span>
        </span>
      </div>

      {/* Headline */}
      <h1
        className={`mb-6 max-w-4xl text-balance text-4xl font-extrabold leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-7xl ${
          isDark ? 'text-white' : 'text-zinc-950'
        }`}
      >
        The safest path,
        <br />
        <span
          className={`bg-gradient-to-b bg-clip-text text-transparent ${
            isDark
              ? 'from-white via-zinc-200 to-zinc-500'
              : 'from-zinc-950 via-zinc-700 to-zinc-400'
          }`}
        >
          illuminated in real time.
        </span>
      </h1>

      {/* Subtitle */}
      <p
        className={`mx-auto mb-9 max-w-xl text-sm font-normal leading-relaxed sm:text-base ${
          isDark ? 'text-zinc-400' : 'text-zinc-600'
        }`}
      >
        Most apps optimize for the shortest route.{' '}
        <span className={isDark ? 'text-zinc-200' : 'text-zinc-900'}>SafeRoute</span> optimizes for
        the safest one — weighing street illumination, crime risk, collision hazards and live foot
        traffic on every journey.
      </p>

      {/* Actions */}
      <div className="mb-10 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={handlePrimaryClick}
          className={`group flex items-center gap-2.5 rounded-full px-6 py-3 text-[13px] font-semibold transition-all duration-200 active:scale-[0.98] ${
            isDark
              ? 'bg-white text-zinc-950 shadow-[0_8px_32px_-10px_rgba(255,255,255,0.45)] hover:bg-zinc-200'
              : 'bg-zinc-950 text-white shadow-[0_8px_32px_-12px_rgba(0,0,0,0.55)] hover:bg-zinc-800'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>{primaryLabel}</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>

        <button
          onClick={handleCopyCommand}
          title="Copy AI scoring API cURL"
          className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-3 font-mono text-[11px] backdrop-blur-md transition-all ${
            isDark
              ? 'border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20 hover:bg-white/[0.06]'
              : 'border-zinc-200 bg-white/70 text-zinc-700 hover:border-zinc-300 hover:bg-white'
          }`}
        >
          <span className={muted}>$</span>
          <span>curl -X POST /api/safety/score</span>
          {copied ? (
            <Check className="h-3.5 w-3.5 text-zinc-200" />
          ) : (
            <Copy className={`h-3.5 w-3.5 ${muted}`} />
          )}
        </button>
      </div>

      {/* Proof Points */}
      <div className="mb-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
        {[
          { value: '60', label: 'Tree AI Ensemble' },
          { value: '<8ms', label: 'Inference Latency' },
          { value: '24/7', label: 'Corridor Coverage' },
        ].map((stat) => (
          <div key={stat.label} className="flex items-baseline gap-2">
            <span className={`font-mono text-base font-semibold ${strong}`}>{stat.value}</span>
            <span className={`font-mono text-[9px] uppercase tracking-[0.16em] ${muted}`}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Live Evaluation Card */}
      <div className="w-full max-w-3xl">
        <div
          className={`rounded-2xl border p-5 text-left shadow-2xl backdrop-blur-2xl sm:p-6 ${
            isDark
              ? 'border-white/[0.08] bg-[#0c0d10]/80 shadow-black/60'
              : 'border-zinc-200 bg-white/90 shadow-zinc-300/40'
          }`}
        >
          <div className={`mb-5 flex flex-col justify-between gap-3 border-b pb-4 sm:flex-row sm:items-center ${hairline}`}>
            <div className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${isDark ? 'bg-white' : 'bg-zinc-900'}`} />
              <span
                className={`font-mono text-[10px] font-semibold uppercase tracking-[0.18em] ${
                  isDark ? 'text-zinc-300' : 'text-zinc-600'
                }`}
              >
                Live Journey Safety Evaluation
              </span>
            </div>
            <div className={`flex items-center gap-2 font-mono text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              <MapPin className={`h-3 w-3 shrink-0 ${muted}`} />
              <span>Deccan Gymkhana</span>
              <span className={muted}>&rarr;</span>
              <span>Koregaon Park, Pune</span>
            </div>
          </div>

          <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-12">
            {/* Score */}
            <div
              className={`flex flex-col items-center justify-center rounded-xl border p-5 text-center md:col-span-4 ${
                isDark ? 'border-white/[0.07] bg-white/[0.03]' : 'border-zinc-200 bg-zinc-50'
              }`}
            >
              <div className={`mb-1 font-mono text-4xl font-black tracking-tight ${strong}`}>
                88
                <span className={`font-sans text-base font-normal ${muted}`}>/100</span>
              </div>
              <span
                className={`mb-2.5 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                  isDark
                    ? 'border-white/15 bg-white/[0.06] text-zinc-200'
                    : 'border-zinc-300 bg-white text-zinc-700'
                }`}
              >
                <ShieldCheck className="h-3 w-3" /> High Safety Rating
              </span>
              <p className={`text-[11px] leading-tight ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Verified illuminated corridor with continuous storefronts and pedestrian foot traffic.
              </p>
            </div>

            {/* Factor meters */}
            <div className="space-y-3 md:col-span-8">
              {factors.map((factor, index) => (
                <div key={factor.label} className="text-xs">
                  <div className="mb-1 flex items-center justify-between">
                    <span className={`font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                      {factor.label}
                    </span>
                    <span className={`font-mono font-semibold ${isDark ? 'text-zinc-200' : 'text-zinc-700'}`}>
                      {factor.score}
                    </span>
                  </div>
                  <div
                    className={`h-1 w-full overflow-hidden rounded-full ${
                      isDark ? 'bg-white/[0.08]' : 'bg-zinc-200'
                    }`}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: factor.width, backgroundColor: barColors[index] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
