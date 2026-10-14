import React from 'react';
import { Play, Route, Square } from 'lucide-react';
import { STATIONS } from '../data/stations';
import { useLabStore } from '../store/useLabStore';
import { FlightPlannerDrawer } from './FlightPlannerDrawer';

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
  const plannerMode = useLabStore((s) => s.plannerMode);
  const setPlannerMode = useLabStore((s) => s.setPlannerMode);
  const plannerDrawerOpen = useLabStore((s) => s.plannerDrawerOpen);
  const setPlannerDrawerOpen = useLabStore((s) => s.setPlannerDrawerOpen);
  const waypoints = useLabStore((s) => s.flightPlanWaypoints);
  const flightPlanActive = useLabStore((s) => s.flightPlanActive);
  const addFlightPlanWaypoint = useLabStore((s) => s.addFlightPlanWaypoint);

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

    if (plannerMode) {
      if (nearestId !== -1) {
        const st = STATIONS[nearestId];
        addFlightPlanWaypoint({
          stationId: st.id,
          label: st.code,
          x: st.hoverPoint.x,
          z: st.hoverPoint.z,
          cruiseAlt: Math.round(st.hoverPoint.y + 8),
          speedPct: 100,
        });
      } else {
        const worldX = Math.round((clickX - cx) / scale);
        const worldZ = Math.round((clickY - cy) / scale);
        addFlightPlanWaypoint({
          stationId: null,
          label: `WP-${waypoints.length + 1}`,
          x: Math.max(-240, Math.min(240, worldX)),
          z: Math.max(-220, Math.min(220, worldZ)),
          cruiseAlt: 38,
          speedPct: 100,
        });
      }
      return;
    }

    if (nearestId !== -1) {
      engine.engageAutopilot(nearestId);
    }
  };

  return (
    <div className="hidden md:flex items-end gap-2.5 pointer-events-auto self-end">
      <div className="aero-glass rounded-2xl p-2.5 w-48 shadow-lg">
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <button
            onClick={() => setPlannerMode(!plannerMode)}
            className={`font-mono-tech text-[9px] font-bold px-2 py-0.5 rounded-md transition flex items-center gap-1 ${
              plannerMode
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-200/80 hover:bg-slate-300 text-slate-700'
            }`}
            title="Toggle between Direct Autopilot Click and Multi-Waypoint Route Planner"
          >
            <Route className="w-2.5 h-2.5" />
            <span>{plannerMode ? '+ PLAN MODE' : 'DIRECT FLY'}</span>
          </button>
          <span ref={headingRef} className="font-mono-tech text-[9px] font-bold text-sky-600">
            000° N
          </span>
        </div>

        <div
          className={`relative w-full aspect-square rounded-xl bg-slate-900/90 border overflow-hidden cursor-crosshair ${
            plannerMode
              ? 'border-indigo-400 ring-2 ring-indigo-500/30'
              : 'border-slate-700/60'
          }`}
          title={
            plannerMode
              ? 'Click any island or air coordinate to append a patrol waypoint'
              : 'Click any island dot on radar to engage Autopilot'
          }
        >
          <canvas
            ref={radarCanvasRef}
            onClick={handleRadarClick}
            width={160}
            height={160}
            className="w-full h-full"
          />
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-1">
          {flightPlanActive ? (
            <button
              onClick={() => engine?.stopFlightPlanPatrol()}
              className="flex-1 py-1 px-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono-tech text-[9px] font-bold flex items-center justify-center gap-1"
            >
              <Square className="w-2.5 h-2.5" />
              <span>STOP PATROL</span>
            </button>
          ) : (
            <button
              onClick={() => engine?.startFlightPlanPatrol()}
              className="flex-1 py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono-tech text-[9px] font-bold flex items-center justify-center gap-1"
              title="Start automated patrol along planned waypoints"
            >
              <Play className="w-2.5 h-2.5" />
              <span>PATROL ({waypoints.length})</span>
            </button>
          )}
          <button
            onClick={() => setPlannerDrawerOpen(!plannerDrawerOpen)}
            className={`py-1 px-2 rounded-lg font-mono-tech text-[9px] font-bold border transition ${
              plannerDrawerOpen
                ? 'bg-slate-800 text-white border-slate-700'
                : 'bg-white/80 hover:bg-white text-slate-700 border-slate-300'
            }`}
            title="Configure Waypoint Altitudes & Speeds"
          >
            {plannerDrawerOpen ? 'Hide' : 'Edit'}
          </button>
        </div>

        <div className="mt-1 flex items-center justify-between font-mono-tech text-[9px] text-slate-500 px-0.5">
          <span>WASD + SPACE/SHIFT</span>
          <button
            onClick={() => setHangarModalOpen(true)}
            className="text-indigo-600 font-bold hover:underline"
          >
            Hangar & Cargo
          </button>
        </div>
      </div>

      <FlightPlannerDrawer />
    </div>
  );
};
