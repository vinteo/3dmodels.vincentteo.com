import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="h-8 shrink-0 w-full border-t border-slate-800/80 bg-[#0c0919]/95 px-4 flex items-center justify-between text-[11px] text-slate-500 z-20 select-none">
      <p>© {new Date().getFullYear()} Vincent Teo. All rights reserved.</p>
      <p className="hidden sm:inline">
        Built with React, Tailwind CSS, Three.js & Cloudflare Workers
      </p>
    </footer>
  );
};
