import React, { useState } from 'react';
import { Menu, X, Box, Github, ExternalLink, Sparkles } from 'lucide-react';

interface HeaderProps {
  mockMode?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ mockMode }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-slate-800/60 bg-[#120e25]/85 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo / Brand */}
        <div className="flex items-center space-x-3">
          <a
            href="https://vincentteo.com/"
            className="group flex items-center space-x-3 focus:outline-none"
          >
            <div className="playful-btn flex h-10 w-10 overflow-hidden items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 shadow-lg shadow-pink-500/10 group-hover:rotate-6 transition-transform duration-300">
              <img
                src="https://vincentteo.com/assets/images/profile.jpg"
                alt="Vincent Teo Logo"
                className="h-full w-full object-cover"
                onError={(e) => {
                  // Fallback icon if remote image fails
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white group-hover:text-violet-400 transition-colors duration-300">
                Vin's Space
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs font-bold text-violet-300 border border-violet-500/30">
                <Box className="w-3 h-3" />
                3D Models
              </span>
            </div>
          </a>

          {mockMode && (
            <span
              title="Running in local simulation mode with procedural CAD models"
              className="hidden lg:inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-300 border border-amber-500/30"
            >
              <Sparkles className="w-3 h-3" />
              Demo / Mock Mode
            </span>
          )}
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold">
          <a
            href="https://vincentteo.com/#software"
            className="nav-reset-link text-slate-400 hover:text-pink-400 hover:scale-105 transition-all duration-200"
          >
            Open Source
          </a>
          <a
            href="https://vincentteo.com/#games"
            className="nav-reset-link text-slate-400 hover:text-lime-400 hover:scale-105 transition-all duration-200"
          >
            Games
          </a>
          <a
            href="https://vincentteo.com/blog/"
            className="nav-reset-link text-slate-400 hover:text-fuchsia-400 hover:scale-105 transition-all duration-200"
          >
            Blog
          </a>
          <a
            href="https://vincentteo.com/travel/"
            className="nav-reset-link text-slate-400 hover:text-pink-400 hover:scale-105 transition-all duration-200"
          >
            Travel
          </a>
        </nav>

        {/* CTA & Actions */}
        <div className="flex items-center space-x-3">
          <a
            href="https://github.com/vinteo"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            title="GitHub Profile"
          >
            <Github className="w-5 h-5" />
          </a>

          <a
            href="https://vincentteo.com/#about"
            className="playful-btn inline-flex items-center justify-center rounded-2xl bg-fuchsia-500 hover:bg-fuchsia-400 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-fuchsia-500/25 transition-all duration-300 border-0"
          >
            Get in Touch
          </a>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden items-center justify-center p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 focus:outline-none transition-all duration-300"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800/60 bg-[#120e25]/95 backdrop-blur-md px-6 py-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Site Navigation
            </span>
            {mockMode && (
              <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                Demo Mode
              </span>
            )}
          </div>
          <a
            href="https://vincentteo.com/#software"
            className="block text-sm font-semibold text-slate-400 hover:text-pink-400 transition-colors duration-200 py-1.5"
          >
            Open Source
          </a>
          <a
            href="https://vincentteo.com/#games"
            className="block text-sm font-semibold text-slate-400 hover:text-lime-400 transition-colors duration-200 py-1.5"
          >
            Games
          </a>
          <a
            href="https://vincentteo.com/blog/"
            className="block text-sm font-semibold text-slate-400 hover:text-fuchsia-400 transition-colors duration-200 py-1.5"
          >
            Blog
          </a>
          <a
            href="https://vincentteo.com/travel/"
            className="block text-sm font-semibold text-slate-400 hover:text-pink-400 transition-colors duration-200 py-1.5"
          >
            Travel
          </a>
          <div className="pt-2 border-t border-slate-800 flex gap-4">
            <a
              href="https://github.com/vinteo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white"
            >
              <Github className="w-4 h-4" /> GitHub
            </a>
            <a
              href="https://cad.onshape.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white"
            >
              <ExternalLink className="w-4 h-4" /> Onshape CAD
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
