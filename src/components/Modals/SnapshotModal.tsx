import React from 'react';
import { Download, X } from 'lucide-react';
import { useLabStore } from '../../store/useLabStore';

export const SnapshotModal: React.FC = () => {
  const snapshotDataUrl = useLabStore((s) => s.snapshotDataUrl);
  const setSnapshotDataUrl = useLabStore((s) => s.setSnapshotDataUrl);

  if (!snapshotDataUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4">
      <div className="aero-glass rounded-3xl max-w-xl w-full p-5 shadow-2xl border border-white/80">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <span className="font-mono-tech text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700">
              GIMBAL OPTICS // TELEMETRY FRAME
            </span>
            <h3 className="text-base font-extrabold text-slate-800 mt-0.5">
              Aerial Recon Snapshot
            </h3>
          </div>
          <button
            onClick={() => setSnapshotDataUrl(null)}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="my-3 rounded-2xl overflow-hidden border border-slate-300 bg-slate-950 shadow-inner">
          <img
            src={snapshotDataUrl}
            alt="Aerial Telemetry Capture"
            className="w-full h-auto block"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => setSnapshotDataUrl(null)}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold"
          >
            Dismiss
          </button>
          <a
            href={snapshotDataUrl}
            download="hadiyatna-sky-lab-recon.png"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save Recon Image (.PNG)</span>
          </a>
        </div>
      </div>
    </div>
  );
};
