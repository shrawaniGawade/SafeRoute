import React, { useState, useEffect } from 'react';
import AcidSquares from './AcidSquares';
import { Navbar } from './landing/Navbar';
import { Hero } from './landing/Hero';
import { ArchitectureSection } from './landing/ArchitectureSection';
import { ShowcaseSection } from './landing/ShowcaseSection';
import { InteractivePlayground } from './landing/InteractivePlayground';
import { TelemetrySection } from './landing/TelemetrySection';
import { FaqSection } from './landing/FaqSection';
import { CtaSection } from './landing/CtaSection';
import { Footer } from './landing/Footer';
import { TuningDrawer } from './landing/TuningDrawer';
import { getDefaultPreset, type AcidSquaresPreset } from '../data/presets';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sliders } from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
  onSignUp: () => void;
  onNavigateApp?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignIn,
  onSignUp,
  onNavigateApp,
}) => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Default preset is Titanium Monolith (graphite) unless customized by admin
  const [currentPreset, setCurrentPreset] = useState<AcidSquaresPreset>(getDefaultPreset);
  const [isTunerOpen, setIsTunerOpen] = useState<boolean>(false);
  const [fullBackground, setFullBackground] = useState<boolean>(() => {
    try {
      return localStorage.getItem('saferoute_landing_full_view') === 'true';
    } catch {
      return false;
    }
  });

  const toggleFullBackground = () => {
    setFullBackground((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('saferoute_landing_full_view', String(next));
      } catch {
        // Storage can be unavailable in private browsing; the in-memory toggle still works.
      }
      window.dispatchEvent(
        new CustomEvent('saferoute_landing_view_changed', { detail: next })
      );
      return next;
    });
  };

  // Keep the landing view mode in sync with admin controls
  useEffect(() => {
    const handleViewChange = (e: Event) => {
      const detail = (e as CustomEvent<boolean>).detail;
      if (typeof detail === 'boolean') {
        setFullBackground(detail);
      }
    };
    window.addEventListener('saferoute_landing_view_changed', handleViewChange);
    return () =>
      window.removeEventListener('saferoute_landing_view_changed', handleViewChange);
  }, []);

  // Listen for admin default preset updates in real time
  useEffect(() => {
    const handlePresetChange = (e: Event) => {
      const customEvent = e as CustomEvent<AcidSquaresPreset>;
      if (customEvent.detail) {
        setCurrentPreset(customEvent.detail);
      }
    };
    window.addEventListener('saferoute_default_preset_changed', handlePresetChange);
    return () =>
      window.removeEventListener('saferoute_default_preset_changed', handlePresetChange);
  }, []);

  // In light mode, reduce surface opacity so it's subtle against the white background
  const bgOpacity = isDark ? 0.9 : 0.45;
  const overlayColor = isDark ? 'rgba(8,8,10,0.55)' : 'rgba(255,255,255,0.65)';

  return (
    <div
      className={`relative min-h-screen transition-colors duration-300 ${
        isDark
          ? 'bg-[#08080a] text-zinc-300 selection:bg-white/20 selection:text-white'
          : 'bg-white text-zinc-700 selection:bg-zinc-900/10 selection:text-zinc-950'
      }`}
    >
      {/* ──────────── WebGL Background Layer ──────────── */}
      {fullBackground ? (
        <div className="fixed inset-0 z-0 pointer-events-auto">
          <AcidSquares
            color={isDark ? currentPreset.color : '#f8f8f8'}
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
            lightMode={!isDark}
            mouseInteraction
            pulseOnClick
            detail="medium"
            style={{ opacity: bgOpacity }}
            className="w-full h-full"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: overlayColor }}
          />
        </div>
      ) : (
        <div className="absolute top-0 left-0 right-0 h-[110vh] z-0 overflow-hidden pointer-events-auto">
          <div
            className="w-full h-full"
            style={{
              maskImage:
                'radial-gradient(ellipse 90% 80% at 50% 30%, black 35%, transparent 95%), linear-gradient(to bottom, black 50%, transparent 100%)',
              WebkitMaskImage:
                'radial-gradient(ellipse 90% 80% at 50% 30%, black 35%, transparent 95%), linear-gradient(to bottom, black 50%, transparent 100%)',
            }}
          >
            <AcidSquares
              color={isDark ? currentPreset.color : '#f4f4f6'}
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
              lightMode={!isDark}
              mouseInteraction
              pulseOnClick
              detail="medium"
              style={{ opacity: bgOpacity }}
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* ──────────── Foreground Content ──────────── */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar onSignIn={onSignIn} onNavigateApp={onNavigateApp} />

        <main className="flex-1">
          <Hero onSignUp={onSignUp} onNavigateApp={onNavigateApp} />
          <ArchitectureSection currentPreset={currentPreset} />
          <ShowcaseSection currentPreset={currentPreset} />
          <InteractivePlayground currentPreset={currentPreset} />
          <TelemetrySection />
          <FaqSection />
          <CtaSection
            currentPreset={currentPreset}
            onSignUp={onSignUp}
            onSignIn={onSignIn}
            onNavigateApp={onNavigateApp}
          />
        </main>

        <Footer onSignIn={onSignIn} onSignUp={onSignUp} />
      </div>

      {/* ──────────── Tuner Drawer (Admin Only) ──────────── */}
      {isAdmin && (
        <TuningDrawer
          isOpen={isTunerOpen}
          onClose={() => setIsTunerOpen(false)}
          preset={currentPreset}
          onUpdatePreset={setCurrentPreset}
          onSelectPreset={setCurrentPreset}
          fullBackground={fullBackground}
          onToggleFullBackground={toggleFullBackground}
        />
      )}

      {/* ──────────── Floating Tuner FAB (Admin Only) ──────────── */}
      {isAdmin && !isTunerOpen && (
        <button
          onClick={() => setIsTunerOpen(true)}
          title="Open Surface & Corridor Tuner (Admin Only)"
          className={`fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-3.5 py-2.5 rounded-full text-xs font-mono shadow-2xl backdrop-blur-xl transition-all cursor-pointer hover:scale-105 active:scale-95 border ${
            isDark
              ? 'bg-[#121318]/90 hover:bg-[#181920] border-white/10 text-zinc-300 hover:border-white/20 shadow-black/60'
              : 'bg-white/90 hover:bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 shadow-zinc-200/60'
          }`}
        >
          <Sliders className={`w-3.5 h-3.5 ${isDark ? 'text-zinc-200' : 'text-zinc-700'}`} />
          <span className="hidden sm:inline font-semibold">Admin Controls</span>
          <span
            className="w-2 h-2 rounded-full ring-2 ring-transparent"
            style={{ backgroundColor: currentPreset.accentColor }}
          />
        </button>
      )}
    </div>
  );
};

export default LandingPage;
