import React, { useState } from 'react';
import {
  Shield,
  Sun,
  Moon,
  LogIn,
  LogOut,
  User,
  ShieldCheck,
  ChevronDown,
  Navigation,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onSignIn: () => void;
  onNavigateApp?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSignIn, onNavigateApp }) => {
  const { isDark, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 py-4">
      <nav
        className={`pointer-events-auto flex h-12 w-full max-w-3xl items-center justify-between gap-3 rounded-full border pl-3 pr-2 backdrop-blur-2xl transition-all duration-300 ${
          isDark
            ? 'border-white/[0.08] bg-[#0b0c0f]/80 text-zinc-200 shadow-[0_12px_48px_-16px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.05)]'
            : 'border-zinc-200/80 bg-white/80 text-zinc-800 shadow-[0_12px_48px_-20px_rgba(0,0,0,0.18),inset_0_1px_0_#ffffff]'
        }`}
      >
        {/* Brand */}
        <a href="#home" className="group flex min-w-0 items-center gap-2.5">
          <div
            className={`h-8 w-8 shrink-0 rounded-[10px] p-px transition-transform duration-300 group-hover:scale-[1.04] ${
              isDark
                ? 'bg-gradient-to-br from-white/50 via-white/15 to-white/5 shadow-[0_4px_16px_-6px_rgba(255,255,255,0.35)]'
                : 'bg-gradient-to-br from-zinc-900/40 via-zinc-900/15 to-zinc-900/5 shadow-[0_4px_16px_-8px_rgba(0,0,0,0.4)]'
            }`}
          >
            <div className="flex h-full w-full items-center justify-center rounded-[9px] bg-gradient-to-b from-zinc-800 to-zinc-950">
              <Shield className="h-3.5 w-3.5 text-white" strokeWidth={2.2} />
            </div>
          </div>
          <div className="flex min-w-0 flex-col">
            <span
              className={`bg-gradient-to-b bg-clip-text text-[15px] font-extrabold leading-none tracking-[-0.035em] text-transparent ${
                isDark ? 'from-white via-zinc-100 to-zinc-400' : 'from-zinc-950 via-zinc-800 to-zinc-500'
              }`}
            >
              SafeRoute
            </span>
            <span
              className={`mt-1 hidden font-mono text-[7.5px] uppercase leading-none tracking-[0.3em] sm:block ${
                isDark ? 'text-zinc-500' : 'text-zinc-400'
              }`}
            >
              AI Navigation
            </span>
          </div>
        </a>

        {/* Controls */}
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border transition-all duration-200 active:scale-95 ${
              isDark
                ? 'border-white/10 bg-white/[0.04] text-zinc-300 hover:border-white/20 hover:bg-white/[0.08] hover:text-white'
                : 'border-zinc-200 bg-zinc-100/80 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-200/80 hover:text-zinc-900'
            }`}
          >
            {isDark ? (
              <Sun className="h-3.5 w-3.5" strokeWidth={1.8} />
            ) : (
              <Moon className="h-3.5 w-3.5" strokeWidth={1.8} />
            )}
          </button>

          <span className={`mx-0.5 h-5 w-px ${isDark ? 'bg-white/10' : 'bg-zinc-200'}`} />

          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={`flex h-8 cursor-pointer items-center gap-2 rounded-full border pl-1 pr-2 text-[11px] font-semibold transition-all ${
                  isDark
                    ? 'border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08]'
                    : 'border-zinc-200 bg-zinc-100/80 text-zinc-800 hover:bg-zinc-200/80'
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold ${
                    isDark
                      ? 'bg-gradient-to-b from-white to-zinc-300 text-zinc-950'
                      : 'bg-gradient-to-b from-zinc-800 to-zinc-950 text-white'
                  }`}
                >
                  {user.name ? user.name.slice(0, 2).toUpperCase() : 'SR'}
                </span>
                <span className="hidden max-w-[72px] truncate md:inline">
                  {user.name?.split(' ')[0] || 'User'}
                </span>
                {isAdmin && (
                  <span
                    className={`hidden rounded border px-1 py-px font-mono text-[8px] tracking-[0.14em] sm:inline ${
                      isDark
                        ? 'border-white/15 bg-white/10 text-zinc-300'
                        : 'border-zinc-300 bg-zinc-200/70 text-zinc-600'
                    }`}
                  >
                    ADMIN
                  </span>
                )}
                <ChevronDown className={`h-3 w-3 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
              </button>

              {userMenuOpen && (
                <div
                  className={`absolute right-0 z-50 mt-2.5 w-56 overflow-hidden rounded-2xl border py-1.5 text-xs shadow-2xl backdrop-blur-2xl ${
                    isDark
                      ? 'border-white/10 bg-[#0c0d10]/95 text-zinc-300 shadow-black/70'
                      : 'border-zinc-200 bg-white/95 text-zinc-700 shadow-zinc-300/50'
                  }`}
                >
                  <div className={`border-b px-3.5 py-2.5 ${isDark ? 'border-white/[0.06]' : 'border-zinc-100'}`}>
                    <p className={`truncate font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                      {user.name}
                    </p>
                    <p className="truncate font-mono text-[10px] text-zinc-500">{user.email}</p>
                  </div>
                  <a
                    href="#app"
                    onClick={() => {
                      setUserMenuOpen(false);
                      if (onNavigateApp) onNavigateApp();
                    }}
                    className={`flex items-center gap-2.5 px-3.5 py-2 transition-colors ${
                      isDark
                        ? 'hover:bg-white/[0.06] hover:text-white'
                        : 'hover:bg-zinc-100 hover:text-zinc-900'
                    }`}
                  >
                    <Navigation className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Launch Navigation App</span>
                  </a>
                  {isAdmin && (
                    <a
                      href="#admin"
                      onClick={() => setUserMenuOpen(false)}
                      className={`flex items-center gap-2.5 px-3.5 py-2 transition-colors ${
                        isDark
                          ? 'hover:bg-white/[0.06] hover:text-white'
                          : 'hover:bg-zinc-100 hover:text-zinc-900'
                      }`}
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-zinc-400" />
                      <span>Admin Command Center</span>
                    </a>
                  )}
                  <a
                    href="#profile"
                    onClick={() => setUserMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3.5 py-2 transition-colors ${
                      isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-zinc-100'
                    }`}
                  >
                    <User className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Profile & Preferences</span>
                  </a>
                  <div className={`my-1 border-t ${isDark ? 'border-white/[0.06]' : 'border-zinc-100'}`} />
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className={`flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2 text-red-400 transition-colors ${
                      isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'
                    }`}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className={`flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-[11px] font-semibold tracking-wide transition-all duration-200 active:scale-[0.97] ${
                isDark
                  ? 'bg-white text-zinc-950 shadow-[0_4px_20px_-6px_rgba(255,255,255,0.45)] hover:bg-zinc-200'
                  : 'bg-zinc-950 text-white shadow-[0_4px_20px_-8px_rgba(0,0,0,0.55)] hover:bg-zinc-800'
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};
