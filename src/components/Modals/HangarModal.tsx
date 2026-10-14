import React from 'react';
import { Home, X } from 'lucide-react';
import { useLabStore } from '../../store/useLabStore';
import { DroneLiveryKey, FlightProfileKey } from '../../types/lab';

export const HangarModal: React.FC = () => {
  const open = useLabStore((s) => s.hangarModalOpen);
  const setOpen = useLabStore((s) => s.setHangarModalOpen);
  const activeLivery = useLabStore((s) => s.activeLivery);
  const flightProfile = useLabStore((s) => s.flightProfile);
  const wingmanSwarmActive = useLabStore((s) => s.wingmanSwarmActive);
  const engine = useLabStore((s) => s.engine);

  if (!open) return null;

  const liveryNames: Record<DroneLiveryKey, string> = {
    pearl: 'PEARL WHITE',
    stealth: 'STEALTH CARBON',
    rescue: 'SAR ORANGE',
    royal: 'GOLD SPEC',
  };

  const profiles: {
    key: FlightProfileKey;
    title: string;
    desc: string;
  }[] = [
    {
      key: 'CINEMA',
      title: 'Cinema',
      desc: 'Ultra-damped gimbal & gentle cruise',
    },
    {
      key: 'SPORT',
      title: 'Sport',
      desc: 'Balanced agility & responsive yaw',
    },
    {
      key: 'ACRO',
      title: 'Acro Pro',
      desc: 'High thrust, steep bank & fast pitch',
    },
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/65 backdrop-blur-md p-4">
      <div className="aero-glass rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-white/80">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <span className="font-mono-tech text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-700">
              AERO-SONDE V4 // ENGINEERING BAY
            </span>
            <h3 className="text-lg font-extrabold text-slate-800 mt-0.5">
              Drone Hangar & Flight Tuning
            </h3>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 my-4 text-xs">
          <div>
            <div className="font-bold text-slate-700 mb-1.5 flex justify-between">
              <span>1. Fuselage Hull Livery</span>
              <span className="font-mono-tech text-[10px] text-sky-600">
                {liveryNames[activeLivery]}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => engine?.applyDroneLivery('pearl')}
                className="p-2 rounded-xl border border-slate-300 bg-slate-50 hover:border-sky-500 font-bold text-[11px] text-slate-700 flex flex-col items-center gap-1"
              >
                <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-400" />
                Pearl
              </button>
              <button
                onClick={() => engine?.applyDroneLivery('stealth')}
                className="p-2 rounded-xl border border-slate-300 bg-slate-900 hover:border-sky-500 font-bold text-[11px] text-white flex flex-col items-center gap-1"
              >
                <span className="w-5 h-5 rounded-full bg-slate-800 border border-sky-400" />
                Stealth
              </button>
              <button
                onClick={() => engine?.applyDroneLivery('rescue')}
                className="p-2 rounded-xl border border-slate-300 bg-orange-50 hover:border-orange-500 font-bold text-[11px] text-orange-800 flex flex-col items-center gap-1"
              >
                <span className="w-5 h-5 rounded-full bg-orange-500 border border-white" />
                SAR Orange
              </button>
              <button
                onClick={() => engine?.applyDroneLivery('royal')}
                className="p-2 rounded-xl border border-slate-300 bg-amber-50 hover:border-amber-500 font-bold text-[11px] text-amber-900 flex flex-col items-center gap-1"
              >
                <span className="w-5 h-5 rounded-full bg-amber-400 border border-slate-800" />
                Gold Spec
              </button>
            </div>
          </div>

          <div>
            <div className="font-bold text-slate-700 mb-1.5 flex justify-between">
              <span>2. Flight Controller PID Profile</span>
              <span className="font-mono-tech text-[10px] text-emerald-600">
                {flightProfile}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {profiles.map((p) => (
                <button
                  key={p.key}
                  onClick={() => engine?.setFlightProfile(p.key)}
                  className={
                    flightProfile === p.key
                      ? 'p-2.5 rounded-xl border-2 border-sky-500 bg-sky-50/80 text-left transition'
                      : 'p-2.5 rounded-xl border border-slate-200 bg-white/80 hover:bg-white text-left transition'
                  }
                >
                  <div className="font-bold text-slate-800">{p.title}</div>
                  <div className="text-[10px] text-slate-500">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 text-white">
            <div>
              <div className="font-bold text-xs text-sky-400">
                Autonomous Wingman Escort Swarm
              </div>
              <div className="text-[11px] text-slate-400">
                Deploy 2 micro-drones flying in V-formation
              </div>
            </div>
            <button
              onClick={() => engine?.toggleWingmanSwarm()}
              className={`px-3.5 py-1.5 rounded-xl text-white font-mono-tech text-xs font-bold transition ${
                wingmanSwarmActive
                  ? 'bg-rose-600 hover:bg-rose-500'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {wingmanSwarmActive ? 'RECALL SWARM' : 'DEPLOY SWARM'}
            </button>
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
