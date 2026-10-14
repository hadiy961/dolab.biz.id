import React from 'react';
import { CloudLightning, Home, Navigation, Package, X } from 'lucide-react';
import { useLabStore } from '../../store/useLabStore';
import {
  AtmosphereMode,
  DroneLiveryKey,
  FlightProfileKey,
} from '../../types/lab';
import { PAYLOAD_MISSIONS } from '../../data/cargoMissions';
import { WEATHER_PRESETS } from '../../data/flightAndWeather';
import { STATIONS } from '../../data/stations';

export const HangarModal: React.FC = () => {
  const open = useLabStore((s) => s.hangarModalOpen);
  const setOpen = useLabStore((s) => s.setHangarModalOpen);
  const lang = useLabStore((s) => s.lang);
  const activeLivery = useLabStore((s) => s.activeLivery);
  const flightProfile = useLabStore((s) => s.flightProfile);
  const atmosphereMode = useLabStore((s) => s.atmosphereMode);
  const wingmanSwarmActive = useLabStore((s) => s.wingmanSwarmActive);
  const activeCargoMissionId = useLabStore((s) => s.activeCargoMissionId);
  const cargoPhase = useLabStore((s) => s.cargoPhase);
  const completedCargoIds = useLabStore((s) => s.completedCargoIds);
  const setPlannerDrawerOpen = useLabStore((s) => s.setPlannerDrawerOpen);
  const setPlannerMode = useLabStore((s) => s.setPlannerMode);
  const engine = useLabStore((s) => s.engine);

  if (!open) return null;

  const liveryNames: Record<DroneLiveryKey, string> = {
    pearl: 'PEARL WHITE',
    stealth: 'STEALTH CARBON',
    rescue: 'SAR ORANGE',
    royal: 'GOLD SPEC',
  };

  const profiles: { key: FlightProfileKey; title: string; desc: string }[] = [
    { key: 'CINEMA', title: 'Cinema', desc: 'Ultra-damped gimbal & gentle cruise' },
    { key: 'SPORT', title: 'Sport', desc: 'Balanced agility & responsive yaw' },
    { key: 'ACRO', title: 'Acro Pro', desc: 'High thrust, steep bank & fast pitch' },
  ];

  const weatherModes: AtmosphereMode[] = [0, 1, 2, 3, 4];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/65 backdrop-blur-md p-4">
      <div className="aero-glass rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-white/80 max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <span className="font-mono-tech text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-700">
              AERO-SONDE V4 // AVIONICS, WEATHER & PAYLOAD DISPATCH
            </span>
            <h3 className="text-lg font-extrabold text-slate-800 mt-0.5">
              Drone Hangar, Cargo Logistics & Weather Lab
            </h3>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 my-3 overflow-y-auto custom-scroll pr-1 text-xs flex-1">
          {/* 1. Payload Delivery Missions Board */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-amber-600" />
                <span>
                  {lang === 'id'
                    ? '1. Misi Kargo & Pengiriman Antar-Pulau (Payload Physics)'
                    : '1. Inter-Island Payload Delivery Missions (Mass Physics)'}
                </span>
              </div>
              {activeCargoMissionId && (
                <button
                  onClick={() => engine?.abortCargoMission()}
                  className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono-tech text-[10px] font-bold"
                >
                  Abort Cargo
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PAYLOAD_MISSIONS.map((m) => {
                const isDone = completedCargoIds.includes(m.id);
                const isActive = activeCargoMissionId === m.id;
                const origSt = STATIONS[m.originStationId];
                const destSt = STATIONS[m.destStationId];
                return (
                  <div
                    key={m.id}
                    className={`p-2.5 rounded-xl border transition flex flex-col justify-between ${
                      isActive
                        ? 'bg-amber-50/95 border-amber-500 ring-2 ring-amber-400/40'
                        : isDone
                        ? 'bg-emerald-50/70 border-emerald-300'
                        : 'bg-white/85 border-slate-200/90'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between font-mono-tech text-[10px] font-bold">
                        <span className="text-amber-700">
                          {m.code} • {m.weightKg} KG
                        </span>
                        <span
                          className={
                            isDone
                              ? 'text-emerald-600'
                              : isActive
                              ? 'text-amber-600 animate-pulse'
                              : 'text-slate-400'
                          }
                        >
                          {isActive
                            ? cargoPhase === 'IN_TRANSIT'
                              ? 'IN TRANSIT'
                              : 'PICKUP PAD'
                            : isDone
                            ? 'DELIVERED ✓'
                            : 'READY'}
                        </span>
                      </div>
                      <div className="font-bold text-slate-800 text-xs mt-0.5">{m.title[lang]}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {origSt.code} → {destSt.code} • SPD {Math.round(m.speedMultiplier * 100)}% •
                        TILT {m.tiltMultiplier}x • BAT {m.batteryDrainMultiplier}x
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        engine?.startCargoMission(m.id, true);
                        setOpen(false);
                      }}
                      className={`mt-2 w-full py-1.5 rounded-lg font-bold text-[10px] transition ${
                        isActive
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 hover:bg-sky-600 text-white'
                      }`}
                    >
                      {isActive
                        ? lang === 'id'
                          ? 'Terbang ke Target Misi →'
                          : 'Fly to Mission Target →'
                        : lang === 'id'
                        ? 'Ambil Misi & Autopilot ke Pickup'
                        : 'Accept & Autopilot to Pickup'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Dynamic Weather & Physical Turbulence Presets */}
          <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/25">
            <div className="font-bold text-slate-800 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CloudLightning className="w-4 h-4 text-sky-600" />
                <span>
                  {lang === 'id'
                    ? '2. Cuaca Dinamis, Turbulensi Angin & Lampu Sorot Otomatis'
                    : '2. Dynamic Weather, Wind Turbulence & Auto-Spotlight'}
                </span>
              </span>
              <span className="font-mono-tech text-[10px] text-sky-700">
                {WEATHER_PRESETS[atmosphereMode].code}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {weatherModes.map((mIdx) => {
                const wp = WEATHER_PRESETS[mIdx];
                const isCurr = atmosphereMode === mIdx;
                return (
                  <button
                    key={mIdx}
                    onClick={() => engine?.cycleAtmosphere(mIdx)}
                    className={`p-2 rounded-xl border text-left transition ${
                      isCurr
                        ? 'bg-slate-900 text-white border-sky-400 shadow-sm'
                        : 'bg-white/85 hover:bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <div className="font-bold text-[11px]">{wp.name[lang]}</div>
                    <div className="font-mono-tech text-[9px] opacity-75 mt-0.5">
                      WND {wp.baseWindKt}kt • VIS {wp.visibilityPct}%
                    </div>
                    {wp.autoSpotlight && (
                      <div className="font-mono-tech text-[8px] text-amber-400 mt-0.5">
                        ⚡ AUTO-SPOTLIGHT
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Fuselage Livery & Flight Controller PID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="font-bold text-slate-700 mb-1.5 flex justify-between">
                <span>3. Fuselage Hull Livery</span>
                <span className="font-mono-tech text-[10px] text-sky-600">
                  {liveryNames[activeLivery]}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  onClick={() => engine?.applyDroneLivery('pearl')}
                  className="p-2 rounded-xl border border-slate-300 bg-slate-50 hover:border-sky-500 font-bold text-[10px] text-slate-700 flex flex-col items-center gap-1"
                >
                  <span className="w-4 h-4 rounded-full bg-slate-100 border border-slate-400" />
                  Pearl
                </button>
                <button
                  onClick={() => engine?.applyDroneLivery('stealth')}
                  className="p-2 rounded-xl border border-slate-300 bg-slate-900 hover:border-sky-500 font-bold text-[10px] text-white flex flex-col items-center gap-1"
                >
                  <span className="w-4 h-4 rounded-full bg-slate-800 border border-sky-400" />
                  Stealth
                </button>
                <button
                  onClick={() => engine?.applyDroneLivery('rescue')}
                  className="p-2 rounded-xl border border-slate-300 bg-orange-50 hover:border-orange-500 font-bold text-[10px] text-orange-800 flex flex-col items-center gap-1"
                >
                  <span className="w-4 h-4 rounded-full bg-orange-500 border border-white" />
                  Orange
                </button>
                <button
                  onClick={() => engine?.applyDroneLivery('royal')}
                  className="p-2 rounded-xl border border-slate-300 bg-amber-50 hover:border-amber-500 font-bold text-[10px] text-amber-900 flex flex-col items-center gap-1"
                >
                  <span className="w-4 h-4 rounded-full bg-amber-400 border border-slate-800" />
                  Gold
                </button>
              </div>
            </div>

            <div>
              <div className="font-bold text-slate-700 mb-1.5 flex justify-between">
                <span>4. Flight Controller PID</span>
                <span className="font-mono-tech text-[10px] text-emerald-600">{flightProfile}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {profiles.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => engine?.setFlightProfile(p.key)}
                    className={
                      flightProfile === p.key
                        ? 'p-2 rounded-xl border-2 border-sky-500 bg-sky-50/80 text-left transition'
                        : 'p-2 rounded-xl border border-slate-200 bg-white/80 hover:bg-white text-left transition'
                    }
                  >
                    <div className="font-bold text-slate-800 text-[11px]">{p.title}</div>
                    <div className="text-[9px] text-slate-500 line-clamp-1">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-900 text-white">
            <div>
              <div className="font-bold text-xs text-sky-400">
                Autonomous Wingman Swarm & Waypoint Route Planner
              </div>
              <div className="text-[11px] text-slate-400">
                Deploy V-formation escort or open custom radar route planner
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setOpen(false);
                  setPlannerMode(true);
                  setPlannerDrawerOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono-tech text-xs font-bold flex items-center gap-1"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Open Flight Planner</span>
              </button>
              <button
                onClick={() => engine?.toggleWingmanSwarm()}
                className={`px-3 py-1.5 rounded-xl text-white font-mono-tech text-xs font-bold transition ${
                  wingmanSwarmActive
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {wingmanSwarmActive ? 'RECALL SWARM' : 'DEPLOY SWARM'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-slate-200/80">
          <button
            onClick={() => {
              setOpen(false);
              engine?.triggerReturnToHome();
            }}
            className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 font-bold text-xs border border-amber-500/30 flex items-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Nearest Pad [H]</span>
          </button>
          <button
            onClick={() => setOpen(false)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
