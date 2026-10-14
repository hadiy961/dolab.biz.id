import React from 'react';
import { PAYLOAD_MISSIONS } from '../data/cargoMissions';
import { STATIONS } from '../data/stations';
import { useLabStore } from '../store/useLabStore';

export const CargoMissionBanner: React.FC = () => {
  const activeCargoMissionId = useLabStore((s) => s.activeCargoMissionId);
  const cargoPhase = useLabStore((s) => s.cargoPhase);
  const flightPhase = useLabStore((s) => s.flightPhase);
  const lang = useLabStore((s) => s.lang);
  const engine = useLabStore((s) => s.engine);

  const activeMission = activeCargoMissionId
    ? PAYLOAD_MISSIONS.find((m) => m.id === activeCargoMissionId)
    : null;

  if (!activeMission || cargoPhase === 'IDLE') return null;

  return (
    <div className="self-center aero-glass-dark text-white px-3.5 py-1.5 rounded-2xl pointer-events-auto flex flex-wrap items-center gap-2.5 text-[11px] font-mono-tech border border-amber-400/40 shadow-lg">
      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-bold">
        {activeMission.code} • {activeMission.weightKg} KG
      </span>
      {cargoPhase === 'AWAITING_PICKUP' ? (
        <span>
          {lang === 'id' ? 'PICKUP DI:' : 'PICKUP AT:'}{' '}
          <strong className="text-amber-300">
            {STATIONS[activeMission.originStationId].shortName}
          </strong>{' '}
          ({lang === 'id' ? 'Mendarat di Helipad' : 'Land on Helipad'})
        </span>
      ) : (
        <span>
          {lang === 'id' ? 'DALAM PENGIRIMAN KE:' : 'IN TRANSIT TO:'}{' '}
          <strong className="text-emerald-300">
            {STATIONS[activeMission.destStationId].shortName}
          </strong>{' '}
          <span className="text-slate-400">
            (SPD {Math.round(activeMission.speedMultiplier * 100)}% • BAT{' '}
            {activeMission.batteryDrainMultiplier}x)
          </span>
        </span>
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={() =>
            engine?.engageAutopilot(
              cargoPhase === 'AWAITING_PICKUP'
                ? activeMission.originStationId
                : activeMission.destStationId
            )
          }
          className="px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px]"
        >
          {lang === 'id' ? 'Autopilot' : 'Fly There'}
        </button>
        <button
          onClick={() => engine?.toggleLandingTakeoff()}
          className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px]"
        >
          {flightPhase === 'LANDED' ? 'Take Off' : 'Land [T]'}
        </button>
        <button
          onClick={() => engine?.abortCargoMission()}
          className="px-2 py-0.5 rounded bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-[10px]"
        >
          Abort
        </button>
      </div>
    </div>
  );
};
