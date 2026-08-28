import React from 'react';
import { Box, Layers } from 'lucide-react';

interface HeaderProps {
  mockMode?: boolean;
  onOpenModelDrawer: () => void;
  activeModelName: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenModelDrawer,
  activeModelName
}) => {
  return (
    <header className="h-14 shrink-0 z-30 w-full border-b border-slate-800/80 bg-[#120e25]/90 backdrop-blur-md px-4 flex items-center justify-between">
      {/* Left: Model Selector Button + Brand */}
      <div className="flex items-center space-x-3">
        {/* Model Popout Button */}
        <button
          onClick={onOpenModelDrawer}
          className="playful-btn flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 shadow-md hover:text-white transition-all cursor-pointer"
          title="Open Model Catalog"
        >
          <Layers className="w-3.5 h-3.5 text-fuchsia-400" />
          <span className="hidden sm:inline">Models</span>
        </button>

        {/* Logo and Title */}
        <a
          href="https://vincentteo.com/"
          className="group flex items-center space-x-2.5 focus:outline-none"
        >
          <div className="playful-btn flex h-8 w-8 overflow-hidden items-center justify-center rounded-xl border border-slate-700 bg-slate-900 shadow-md group-hover:rotate-6 transition-transform">
            <img
              src="https://vincentteo.com/assets/images/profile.jpg"
              alt="Vincent Teo Logo"
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <span className="text-lg sm:text-xl font-extrabold text-white group-hover:text-violet-400 transition-colors">
            Vin's Space 3D Models
          </span>
        </a>
      </div>

      {/* Right: Active Model Badge */}
      <div className="flex items-center space-x-2">
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-semibold text-slate-300">
          <Box className="w-3.5 h-3.5 text-violet-400" />
          <span className="truncate max-w-[200px]">{activeModelName}</span>
        </div>
      </div>
    </header>
  );
};
