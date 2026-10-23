import React from 'react';
import { Shield } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface FooterProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onSignIn, onSignUp }) => {
  const { isDark } = useTheme();

  return (
    <footer
      className={`relative border-t py-14 px-4 transition-colors ${
        isDark ? 'bg-[#070709] border-white/[0.06]' : 'bg-zinc-50 border-zinc-200'
      }`}
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs">
        <div className="flex items-center gap-3">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
              isDark
                ? 'bg-white/[0.05] border-white/10'
                : 'bg-zinc-100 border-zinc-200 shadow-sm'
            }`}
          >
            <Shield className={`w-4 h-4 ${isDark ? 'text-zinc-200' : 'text-zinc-700'}`} />
          </div>
          <div>
            <span className={`font-semibold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
              SafeRoute Navigation Platform
            </span>
            <span className={`mx-2 ${isDark ? 'text-zinc-600' : 'text-zinc-300'}`}>•</span>
            <span className={isDark ? 'text-zinc-500' : 'text-zinc-500'}>
              Smarter Journeys. Safer Choices.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className={`w-2 h-2 rounded-full animate-pulse ${isDark ? 'bg-white' : 'bg-zinc-900'}`} />
          <span className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>
            AI Scoring Microservice & WebGL 2.0 Surface: Operational
          </span>
        </div>

        <div
          className={`flex items-center gap-4 ${
            isDark ? 'text-zinc-500' : 'text-zinc-500'
          }`}
        >
          <button
            onClick={onSignIn}
            className={`cursor-pointer transition-colors ${
              isDark ? 'hover:text-zinc-300' : 'hover:text-zinc-900'
            }`}
          >
            Sign In
          </button>
          <span className={isDark ? 'text-zinc-700' : 'text-zinc-300'}>•</span>
          <button
            onClick={onSignUp}
            className={`cursor-pointer transition-colors ${
              isDark ? 'hover:text-white' : 'hover:text-zinc-900'
            }`}
          >
            Register
          </button>
          <span className={isDark ? 'text-zinc-700' : 'text-zinc-300'}>•</span>
          <a
            href="#architecture"
            className={`transition-colors ${
              isDark ? 'hover:text-zinc-300' : 'hover:text-zinc-900'
            }`}
          >
            Architecture
          </a>
          <span className={isDark ? 'text-zinc-700' : 'text-zinc-300'}>•</span>
          <a
            href="#simulator"
            className={`transition-colors ${
              isDark ? 'hover:text-zinc-300' : 'hover:text-zinc-900'
            }`}
          >
            Simulator
          </a>
          <span className={isDark ? 'text-zinc-700' : 'text-zinc-300'}>•</span>
          <a
            href="#faq"
            className={`transition-colors ${
              isDark ? 'hover:text-zinc-300' : 'hover:text-zinc-900'
            }`}
          >
            FAQ
          </a>
          <span className={isDark ? 'text-zinc-700' : 'text-zinc-300'}>•</span>
          <a
            href="#/admin-login"
            className={`transition-colors ${
              isDark ? 'hover:text-white' : 'hover:text-zinc-900'
            }`}
          >
            Admin
          </a>
        </div>
      </div>
    </footer>
  );
};
