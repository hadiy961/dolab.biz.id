import React from 'react';
import { STATIONS } from '../data/stations';
import { useLabStore } from '../store/useLabStore';

interface RadarWidgetProps {
  radarCanvasRef: React.RefObject<HTMLCanvasElement>;
  headingRef: React.RefObject<HTMLSpanElement>;
}

export const RadarWidget: React.FC<RadarWidgetProps> = ({
  radarCanvasRef,
  headingRef,
}) => {
  const engine = useLabStore((s) => s.engine);
  const setHangarModalOpen = useLabStore((s) => s.setHangarModalOpen);

  const handleRadarClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = radarCanvasRef.current;
    if (!canvas || !engine) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const scale = 0.42;

    let nearestId = -1;
    let bestDist = 14;
    STATIONS.forEach((st) => {
      const ix = cx + st.position.x * scale;
      const iy = cy + st.position.z * scale;
      const d = Math.hypot(clickX - ix, clickY - iy);
      if (d < bestDist) {
        bestDist = d;
        nearestId = st.id;
      }
    });
    if (nearestId !== -1) {
      engine.engageAutopilot(nearestId);
    }
  };

  return (
    <div className="hidden md:flex flex-col gap-2 pointer-events-auto self-end">
      <div className="aero-glass rounded-2xl p-2.5 w-44">
        <div className="flex items-center justify-between mb-1 px-0.5">
          <span className="font-mono-tech text-[9px] font-bold uppercase tracking-wider text-slate-500">
            CLICK RADAR TO FLY
          </span>
          <span
            ref={headingRef}
            className="font-mono-tech text-[9px] font-bold text-sky-600"
          >
            000° N
          </span>
        </div>
        <div
          className="relative w-full aspect-square rounded-xl bg-slate-900/90 border border-slate-700/60 overflow-hidden cursor-crosshair"
          title="Click any island dot on radar to engage Autopilot"
        >
          <canvas
            ref={radarCanvasRef}
            onClick={handleRadarClick}
            width={160}
            height={160}
            className="w-full h-full"
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between font-mono-tech text-[9px] text-slate-500 px-0.5">
          <span>WASD + SPACE/SHIFT</span>
          <button
            onClick={() => setHangarModalOpen(true)}
            className="text-indigo-600 font-bold hover:underline"
          >
            Quick Tune
          </button>
        </div>
      </div>
    </div>
  );
};
