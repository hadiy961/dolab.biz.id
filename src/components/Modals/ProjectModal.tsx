import React from 'react';
import { X } from 'lucide-react';
import { PROJECT_CASE_STUDIES } from '../../data/projects';
import { useLabStore } from '../../store/useLabStore';

export const ProjectModal: React.FC = () => {
  const activeIdx = useLabStore((s) => s.activeProjectModalIdx);
  const lang = useLabStore((s) => s.lang);
  const closeProjectModal = useLabStore((s) => s.closeProjectModal);

  if (activeIdx === null) return null;
  const project = PROJECT_CASE_STUDIES[activeIdx];
  if (!project) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4">
      <div className="aero-glass rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-white/80">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <span className="font-mono-tech text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-700">
              {project.tag}
            </span>
            <h3 className="text-lg font-extrabold text-slate-800 mt-1">
              {project.title}
            </h3>
          </div>
          <button
            onClick={closeProjectModal}
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-bold text-sm flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
          {lang === 'id' ? project.descId : project.descEn}
        </p>

        <div className="bg-slate-900 text-slate-200 rounded-2xl p-3.5 font-mono-tech text-[11px] space-y-1.5 mb-4">
          <div className="text-sky-400 font-bold">
            // TECHNICAL TELEMETRY & STACK
          </div>
          <div>{project.stack}</div>
          <div className="text-emerald-400 pt-1">{project.metrics}</div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={closeProjectModal}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
          >
            Close Blueprint
          </button>
        </div>
      </div>
    </div>
  );
};
