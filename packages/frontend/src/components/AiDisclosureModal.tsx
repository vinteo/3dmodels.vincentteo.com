import React, { useEffect } from 'react';
import { X, Bot, Code2, Sparkles } from 'lucide-react';

interface AiDisclosureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiDisclosureModal: React.FC<AiDisclosureModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-disclosure-title"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-[#120e25] border-2 border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5 text-slate-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1 pr-6">
          <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Transparency Notice</span>
          </div>
          <h3 id="ai-disclosure-title" className="text-xl font-extrabold text-white">
            AI Disclosure
          </h3>
        </div>

        {/* Informative Cards */}
        <div className="space-y-3 text-xs leading-relaxed">
          <div className="rounded-2xl bg-cyan-950/20 border border-cyan-800/40 p-4 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-cyan-300">
              <Bot className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Customiser & Framework</span>
            </div>
            <p className="text-slate-300">
              This interactive customiser web application and its supporting frontend framework
              were created with AI assistance.
            </p>
          </div>

          <div className="rounded-2xl bg-violet-950/20 border border-violet-800/40 p-4 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-violet-300">
              <Code2 className="w-4 h-4 text-violet-400 shrink-0" />
              <span>3D Model Generation</span>
            </div>
            <p className="text-slate-300">
              All 3D model generation code, parametric geometry definitions, and CAD algorithms
              are manually written.
            </p>
          </div>
        </div>

        {/* Footer Action */}
        <button
          type="button"
          onClick={onClose}
          className="w-full playful-btn flex items-center justify-center rounded-2xl py-3 text-xs
            font-bold text-slate-200 bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80
            hover:text-white transition-all cursor-pointer shadow-md"
        >
          Close
        </button>
      </div>
    </div>
  );
};
