import React from 'react';
import { FastForward, Navigation, Repeat, Trash2 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useLabStore, selectPlannerState } from '../store/useLabStore';

export const FlightPlannerDrawer: React.FC = () => {
  const lang = useLabStore((s) => s.lang);
  const engine = useLabStore((s) => s.engine);

  const {
    plannerDrawerOpen,
    flightPlanWaypoints: waypoints,
    flightPlanActive,
    flightPlanLoop,
    activeWaypointIdx,
  } = useLabStore(useShallow(selectPlannerState));

  // Actions (stable refs)
  const setPlannerDrawerOpen = useLabStore((s) => s.setPlannerDrawerOpen);
  const updateFlightPlanWaypoint = useLabStore((s) => s.updateFlightPlanWaypoint);
  const removeFlightPlanWaypoint = useLabStore((s) => s.removeFlightPlanWaypoint);
  const clearFlightPlan = useLabStore((s) => s.clearFlightPlan);
  const toggleFlightPlanLoop = useLabStore((s) => s.toggleFlightPlanLoop);
  const loadPresetFlightPlan = useLabStore((s) => s.loadPresetFlightPlan);

  if (!plannerDrawerOpen) return null;

  return (
    <div className="aero-glass rounded-2xl p-3 w-72 max-h-[54vh] flex flex-col shadow-xl border border-indigo-200/80">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <div>
          <div className="font-mono-tech text-[10px] font-bold text-indigo-700 flex items-center gap-1">
            <Navigation className="w-3 h-3" />
            <span>WAYPOINT FLIGHT PLANNER</span>
          </div>
          <div className="text-[10px] text-slate-500">
            {lang === 'id'
              ? 'Klik radar (+ PLAN MODE) & atur Alt/Spd tiap segmen'
              : 'Click radar (+ PLAN MODE) & tune segment Alt/Spd'}
          </div>
        </div>
        <button
          onClick={() => setPlannerDrawerOpen(false)}
          className="text-slate-400 hover:text-slate-700 font-bold text-xs px-1"
        >
          ✕
        </button>
      </div>

      {/* Preset Patrol Routes */}
      <div className="grid grid-cols-3 gap-1 my-2">
        <button
          onClick={() => loadPresetFlightPlan('energy-loop')}
          className="py-1 px-1.5 rounded-lg bg-white/80 hover:bg-white border border-slate-200 text-[9px] font-bold text-slate-700"
        >
          ⚡ Energy Loop
        </button>
        <button
          onClick={() => loadPresetFlightPlan('summit-recon')}
          className="py-1 px-1.5 rounded-lg bg-white/80 hover:bg-white border border-slate-200 text-[9px] font-bold text-slate-700"
        >
          🏔️ Summit Recon
        </button>
        <button
          onClick={() => loadPresetFlightPlan('full-perimeter')}
          className="py-1 px-1.5 rounded-lg bg-white/80 hover:bg-white border border-slate-200 text-[9px] font-bold text-slate-700"
        >
          🌐 10-Island Tour
        </button>
      </div>

      {/* Waypoint Segment List */}
      <div className="flex-1 overflow-y-auto custom-scroll space-y-1.5 pr-1 max-h-48">
        {waypoints.length === 0 ? (
          <div className="p-3 rounded-xl bg-slate-100/80 text-center text-[10px] text-slate-500">
            {lang === 'id'
              ? 'Belum ada waypoint. Aktifkan "+ PLAN MODE" lalu klik titik di radar.'
              : 'No waypoints queued. Enable "+ PLAN MODE" and click on the radar.'}
          </div>
        ) : (
          waypoints.map((wp, idx) => {
            const isActiveSeg = flightPlanActive && idx === activeWaypointIdx;
            return (
              <div
                key={wp.id}
                className={`p-2 rounded-xl border text-[10px] transition ${
                  isActiveSeg
                    ? 'bg-emerald-50/90 border-emerald-400 shadow-sm'
                    : 'bg-white/85 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                  <span className="font-mono-tech flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span>{wp.label}</span>
                    <span className="text-[9px] text-slate-400 font-normal">
                      ({wp.x}, {wp.z})
                    </span>
                  </span>
                  <button
                    onClick={() => removeFlightPlanWaypoint(wp.id)}
                    className="text-slate-400 hover:text-rose-600 px-1"
                    title="Remove Waypoint"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono-tech text-[9px]">
                  <div>
                    <div className="flex justify-between text-slate-500">
                      <span>ALT</span>
                      <span className="font-bold text-emerald-600">
                        {wp.cruiseAlt >= 0 ? `+${wp.cruiseAlt}` : wp.cruiseAlt}m
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-10}
                      max={125}
                      value={wp.cruiseAlt}
                      onChange={(e) =>
                        updateFlightPlanWaypoint(wp.id, {
                          cruiseAlt: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full accent-emerald-600 h-1 bg-slate-200 rounded cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-500">
                      <span>SPD</span>
                      <span className="font-bold text-sky-600">{wp.speedPct}%</span>
                    </div>
                    <input
                      type="range"
                      min={40}
                      max={150}
                      step={5}
                      value={wp.speedPct}
                      onChange={(e) =>
                        updateFlightPlanWaypoint(wp.id, {
                          speedPct: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full accent-sky-600 h-1 bg-slate-200 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Planner Action Bar */}
      <div className="pt-2 mt-2 border-t border-slate-200/80 flex items-center justify-between gap-1">
        <button
          onClick={toggleFlightPlanLoop}
          className={`px-2 py-1 rounded-lg font-mono-tech text-[9px] font-bold flex items-center gap-1 border ${
            flightPlanLoop
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-slate-600 border-slate-200'
          }`}
          title="Toggle Continuous Patrol Loop"
        >
          <Repeat className="w-2.5 h-2.5" />
          <span>{flightPlanLoop ? 'LOOP ON' : '1-WAY'}</span>
        </button>

        {flightPlanActive && (
          <button
            onClick={() => engine?.skipFlightPlanWaypoint()}
            className="px-2 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-mono-tech text-[9px] font-bold flex items-center gap-1"
            title="Skip to Next Waypoint"
          >
            <FastForward className="w-2.5 h-2.5" />
            <span>SKIP</span>
          </button>
        )}

        <button
          onClick={clearFlightPlan}
          className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-600 font-mono-tech text-[9px] font-bold flex items-center gap-1"
          title="Clear All Waypoints"
        >
          <Trash2 className="w-2.5 h-2.5" />
          <span>CLEAR</span>
        </button>
      </div>
    </div>
  );
};
