import React from 'react';
import { Github, Box, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t-2 border-slate-800/60 bg-[#0c0919] py-12 px-6">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
        {/* Brand info */}
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <a
            href="https://vincentteo.com"
            className="flex items-center gap-2 font-bold text-slate-200 hover:text-violet-400 transition-colors"
          >
            <div className="h-6 w-6 rounded-lg bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center border border-fuchsia-500/30">
              <Box className="w-3.5 h-3.5" />
            </div>
            Vin's Space 3D Models
          </a>
          <span className="hidden sm:inline text-slate-700">•</span>
          <span>Parametric CAD Engine powered by Onshape REST API</span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6 font-semibold">
          <a
            href="https://vincentteo.com"
            className="hover:text-pink-400 transition-colors inline-flex items-center gap-1"
          >
            vincentteo.com <ArrowUpRight className="w-3 h-3" />
          </a>
          <a
            href="https://cad.onshape.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1"
          >
            Onshape <ArrowUpRight className="w-3 h-3" />
          </a>
          <a
            href="https://github.com/vinteo"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors inline-flex items-center gap-1"
          >
            <Github className="w-3.5 h-3.5" /> GitHub
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-7xl mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
        <p>© {new Date().getFullYear()} Vincent Teo. All rights reserved.</p>
        <p className="flex items-center gap-1 mt-2 sm:mt-0">
          Built with React, Tailwind CSS, Three.js & Cloudflare Workers
        </p>
      </div>
    </footer>
  );
};
