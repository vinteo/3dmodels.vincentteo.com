import React, { useEffect } from 'react';
import { X, BookOpen, ExternalLink, FileText, Globe } from 'lucide-react';
import { ModelSource } from '../types/model';

interface SourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelName: string;
  sources?: ModelSource[];
}

export const SourcesModal: React.FC<SourcesModalProps> = ({
  isOpen,
  onClose,
  modelName,
  sources = []
}) => {
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
      aria-labelledby="sources-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-[#120e25] border-2 border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5 text-slate-200 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1 pr-6 shrink-0">
          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>Academic & Design References</span>
          </div>
          <h3 id="sources-modal-title" className="text-xl font-extrabold text-white">
            Sources & References
          </h3>
          <p className="text-xs text-slate-400">
            Original publications, papers, and algorithms referenced by {modelName}.
          </p>
        </div>

        {/* Sources List */}
        <div className="space-y-3 text-xs leading-relaxed overflow-y-auto pr-1 flex-1">
          {sources.length === 0 ? (
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-5 text-center text-slate-400">
              No external sources documented for this model.
            </div>
          ) : (
            sources.map((source, idx) => {
              const isPdf =
                source.type?.toLowerCase() === 'pdf' ||
                (!source.type &&
                  Boolean(source.url && source.url.toLowerCase().split('?')[0].includes('.pdf')));

              const badgeLabel = source.type
                ? source.type.toLowerCase() === 'pdf'
                  ? 'PDF'
                  : source.type.charAt(0).toUpperCase() + source.type.slice(1)
                : isPdf
                  ? 'PDF'
                  : 'Website';

              const actionLabel = isPdf ? 'View Reference PDF' : 'Visit Website';
              const IconComponent = isPdf ? FileText : Globe;

              return (
                <div
                  key={source.url || idx}
                  className="rounded-2xl bg-slate-900/80 border border-slate-800/90 p-4 space-y-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm text-white leading-snug">{source.title}</h4>
                      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold text-amber-300">
                        <IconComponent className="w-3 h-3" />
                        {badgeLabel}
                      </span>
                    </div>

                    {source.authors && (
                      <p className="text-slate-300 text-xs font-medium">
                        Authors: {source.authors}
                      </p>
                    )}

                    {(source.publication || source.year) && (
                      <p className="text-slate-400 text-[11px] italic">
                        {[source.publication, source.year ? `(${source.year})` : null]
                          .filter(Boolean)
                          .join(' ')}
                      </p>
                    )}
                  </div>

                  {source.description && (
                    <p className="text-slate-300 text-xs leading-relaxed bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
                      {source.description}
                    </p>
                  )}

                  <div className="pt-1">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 hover:border-amber-500/50 text-xs font-bold text-amber-300 hover:text-amber-200 transition-all cursor-pointer shadow-sm group"
                    >
                      <IconComponent className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                      <span>{actionLabel}</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Action */}
        <div className="shrink-0 pt-1">
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
    </div>
  );
};
