import React from 'react';
import { STATIONS } from '../data/stations';
import { useLabStore } from '../store/useLabStore';

export const BottomDock: React.FC = () => {
  const activeStationId = useLabStore((s) => s.activeStationId);
  const visitedIslands = useLabStore((s) => s.visitedIslands);
  const engine = useLabStore((s) => s.engine);

  const bindTouchKey = (code: string) => ({
    onTouchStart: () => engine?.setTouchKey(code, true),
    onTouchEnd: () => engine?.setTouchKey(code, false),
    onMouseDown: () => engine?.setTouchKey(code, true),
    onMouseUp: () => engine?.setTouchKey(code, false),
    onMouseLeave: () => engine?.setTouchKey(code, false),
  });

  return (
    <div className="flex flex-col gap-2 w-full items-center">
      {/* Mobile On-Screen Touch Flight Pads */}
      <div className="flex md:hidden items-center justify-between w-full px-1 pointer-events-auto">
        <div className="aero-glass rounded-2xl p-1.5 grid grid-cols-3 gap-1 w-28 h-28">
          <div />
          <button
            {...bindTouchKey('KeyW')}
            className="bg-white/90 active:bg-sky-500 active:text-white rounded-lg font-bold text-xs flex items-center justify-center shadow-sm"
          >
            ▲
          </button>
          <div />
          <button
            {...bindTouchKey('KeyA')}
            className="bg-white/90 active:bg-sky-500 active:text-white rounded-lg font-bold text-xs flex items-center justify-center shadow-sm"
          >
            ◀
          </button>
          <button
            onClick={() => engine?.toggleLandingTakeoff()}
            className="bg-emerald-600 text-white rounded-lg font-bold text-[10px] flex items-center justify-center shadow-sm"
          >
            H
          </button>
          <button
            {...bindTouchKey('KeyD')}
            className="bg-white/90 active:bg-sky-500 active:text-white rounded-lg font-bold text-xs flex items-center justify-center shadow-sm"
          >
            ▶
          </button>
          <div />
          <button
            {...bindTouchKey('KeyS')}
            className="bg-white/90 active:bg-sky-500 active:text-white rounded-lg font-bold text-xs flex items-center justify-center shadow-sm"
          >
            ▼
          </button>
          <div />
        </div>

        <div className="aero-glass rounded-2xl p-1.5 grid grid-cols-2 gap-1 w-28 h-28">
          <button
            {...bindTouchKey('Space')}
            className="bg-white/90 active:bg-emerald-500 active:text-white rounded-lg font-bold text-[10px] flex items-center justify-center shadow-sm"
          >
            UP ▲
          </button>
          <button
            {...bindTouchKey('ShiftLeft')}
            className="bg-white/90 active:bg-amber-500 active:text-white rounded-lg font-bold text-[10px] flex items-center justify-center shadow-sm"
          >
            DN ▼
          </button>
          <button
            {...bindTouchKey('KeyQ')}
            className="bg-white/90 active:bg-indigo-500 active:text-white rounded-lg font-bold text-[10px] flex items-center justify-center shadow-sm"
          >
            ↶ YAW
          </button>
          <button
            {...bindTouchKey('KeyE')}
            className="bg-white/90 active:bg-indigo-500 active:text-white rounded-lg font-bold text-[10px] flex items-center justify-center shadow-sm"
          >
            YAW ↷
          </button>
        </div>
      </div>

      {/* Bottom Dock: 10 Floating Archipelago Stations */}
      <div className="aero-glass rounded-2xl p-1.5 pointer-events-auto flex items-center gap-1.5 overflow-x-auto max-w-full shadow-lg custom-scroll">
        {STATIONS.map((st) => {
          const isActive = st.id === activeStationId;
          const isVisited = visitedIslands.includes(st.id);
          const sign = st.position.y >= 0 ? '+' : '';
          return (
            <button
              key={st.id}
              onClick={() => engine?.engageAutopilot(st.id)}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition flex items-center gap-1 ${
                isActive
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-white/75 hover:bg-white text-slate-700'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isVisited ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              />
              <span>{st.shortName}</span>
              <span className="font-mono-tech text-[9px] opacity-65">
                {sign}
                {st.position.y}m
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
