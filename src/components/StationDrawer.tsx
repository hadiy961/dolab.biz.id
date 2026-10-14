import React from 'react';
import { ChevronRight, Minus, Plus } from 'lucide-react';
import { STATIONS } from '../data/stations';
import { useLabStore } from '../store/useLabStore';
import { IslandContentPanels } from './IslandContentPanels';

interface StationDrawerProps {
  stationDistanceRef: React.RefObject<HTMLSpanElement>;
}

export const StationDrawer: React.FC<StationDrawerProps> = ({
  stationDistanceRef,
}) => {
  const activeStationId = useLabStore((s) => s.activeStationId);
  const lang = useLabStore((s) => s.lang);
  const drawerCollapsed = useLabStore((s) => s.drawerCollapsed);
  const toggleDrawer = useLabStore((s) => s.toggleDrawer);
  const engine = useLabStore((s) => s.engine);

  const station = STATIONS[activeStationId] || STATIONS[0];
  const sign = station.position.y >= 0 ? '+' : '';

  return (
    <div className="aero-glass rounded-3xl p-4 sm:p-5 w-full max-w-md ml-auto pointer-events-auto max-h-[62vh] flex flex-col transition-all duration-300 shadow-xl">
      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`font-mono-tech text-[10px] font-bold px-2 py-0.5 rounded-md ${station.badgeColor}`}
            >
              {station.code} • ALT {sign}
              {station.position.y}M
            </span>
            <span
              ref={stationDistanceRef}
              className="font-mono-tech text-[10px] text-emerald-600 font-semibold"
            >
              DOCKED
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-800 mt-0.5">
            {station.title[lang]}
          </h2>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={toggleDrawer}
            className="w-7 h-7 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center transition"
            title="Minimize / Expand Panel"
          >
            {drawerCollapsed ? (
              <Plus className="w-3.5 h-3.5" />
            ) : (
              <Minus className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={() => engine?.navigateNextStation()}
            className="px-2.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-0.5 transition shadow-sm"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!drawerCollapsed && (
        <div className="mt-3 overflow-y-auto custom-scroll pr-1 text-xs sm:text-sm text-slate-600 space-y-3 flex-1">
          <IslandContentPanels stationId={activeStationId} />
        </div>
      )}
    </div>
  );
};
