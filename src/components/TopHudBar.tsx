import React from 'react';
import {
  ArrowUpCircle,
  Camera,
  Clapperboard,
  CloudLightning,
  CloudSun,
  Package,
  PlaneLanding,
  PlaneTakeoff,
  Settings,
  Trophy,
} from 'lucide-react';
import { useLabStore } from '../store/useLabStore';
import { STATIONS } from '../data/stations';
import { PAYLOAD_MISSIONS } from '../data/cargoMissions';
import { WEATHER_PRESETS } from '../data/flightAndWeather';
import { CargoMissionBanner } from './CargoMissionBanner';

interface TopHudBarProps {
  altitudeRef: React.RefObject<HTMLSpanElement>;
  speedRef: React.RefObject<HTMLSpanElement>;
  batteryRef: React.RefObject<HTMLSpanElement>;
  windRef: React.RefObject<HTMLSpanElement>;
}

export const TopHudBar: React.FC<TopHudBarProps> = ({
  altitudeRef,
  speedRef,
  batteryRef,
  windRef,
}) => {
  const flightPhase = useLabStore((s) => s.flightPhase);
  const autopilot = useLabStore((s) => s.autopilot);
  const flightPlanActive = useLabStore((s) => s.flightPlanActive);
  const guidedTourActive = useLabStore((s) => s.guidedTourActive);
  const cameraMode = useLabStore((s) => s.cameraMode);
  const atmosphereMode = useLabStore((s) => s.atmosphereMode);
  const autoSpotlightActive = useLabStore((s) => s.autoSpotlightActive);
  const completedCargoCount = useLabStore((s) => s.completedCargoIds.length);
  const lang = useLabStore((s) => s.lang);
  const visitedCount = useLabStore((s) => s.visitedIslands.length);
  const engine = useLabStore((s) => s.engine);
  const toggleLang = useLabStore((s) => s.toggleLang);
  const setHangarModalOpen = useLabStore((s) => s.setHangarModalOpen);

  const cameraNames = ['CHASE', 'COCKPIT', 'TOP-DOWN'];
  const wxPreset = WEATHER_PRESETS[atmosphereMode];

  const getBadgeConfig = () => {
    if (flightPhase === 'LANDED') {
      return {
        text: 'GROUNDED • 0 RPM',
        cls: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
      };
    }
    if (flightPhase === 'TAKING_OFF') {
      return {
        text: 'SPOOLING UP',
        cls: 'bg-sky-500/15 text-sky-700 border-sky-500/30',
      };
    }
    if (flightPhase === 'LANDING') {
      return {
        text: 'LANDING SEQ',
        cls: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
      };
    }
    if (flightPlanActive) {
      return {
        text: 'WAYPOINT PATROL',
        cls: 'bg-indigo-500/15 text-indigo-700 border-indigo-500/30',
      };
    }
    return {
      text: autopilot ? 'AUTOPILOT' : 'STANDBY HOVER',
      cls: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
    };
  };

  const badge = getBadgeConfig();

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between gap-2 w-full">
        {/* Left: Brand Identity + Flight Status */}
        <div className="aero-glass rounded-2xl px-3.5 py-2 pointer-events-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            HY
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm text-slate-800 tracking-tight">
                HADIYATNA.LAB
              </span>
              <span
                className={`font-mono-tech text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}
              >
                {badge.text}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 hidden sm:block">
              10-Island Sky Archipelago • Aero-Sonde V4
            </p>
          </div>
        </div>

        {/* Center: 60Hz Direct-Ref Telemetry Pill (ALT, SPD, WND, BAT, EXP, CRG) */}
        <div className="hidden lg:flex items-center gap-3.5 aero-glass rounded-full px-4 py-2 pointer-events-auto font-mono-tech text-xs text-slate-700">
          <div>
            <span className="text-slate-400">ALT </span>
            <span ref={altitudeRef} className="font-bold text-emerald-600">
              +6.0m
            </span>
          </div>
          <div className="h-3 w-[1px] bg-slate-300" />
          <div>
            <span className="text-slate-400">SPD </span>
            <span ref={speedRef} className="font-bold text-sky-600">
              0.0 m/s
            </span>
          </div>
          <div className="h-3 w-[1px] bg-slate-300" />
          <div title="Real-Time Wind Vector & Turbulence">
            <span className="text-slate-400">WND </span>
            <span ref={windRef} className="font-bold text-indigo-600">
              3.2kt NE
            </span>
          </div>
          <div className="h-3 w-[1px] bg-slate-300" />
          <div>
            <span ref={batteryRef} className="text-emerald-600 font-bold">
              BAT 99% ⚡
            </span>
          </div>
          <div className="h-3 w-[1px] bg-slate-300" />
          <div className="flex items-center gap-1" title="Islands Explored">
            <span className="text-slate-400">EXP</span>
            <span className="font-bold text-indigo-600 flex items-center gap-1">
              {visitedCount}/{STATIONS.length}
              <Trophy className="w-3.5 h-3.5 text-amber-500 inline" />
            </span>
          </div>
          <div className="h-3 w-[1px] bg-slate-300" />
          <button
            onClick={() => setHangarModalOpen(true)}
            className="flex items-center gap-1 hover:text-amber-600 transition"
            title="Payload Missions Completed — Click to Open Mission & Hangar Bay"
          >
            <Package className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-bold text-slate-700">
              {completedCargoCount}/{PAYLOAD_MISSIONS.length}
            </span>
          </button>
        </div>

        {/* Right: Streamlined Essential Controls */}
        <div className="aero-glass rounded-2xl p-1.5 pointer-events-auto flex items-center gap-1.5">
          <button
            onClick={() => engine?.toggleLandingTakeoff()}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition shadow-sm ${
              flightPhase === 'LANDED'
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : flightPhase === 'LANDING'
                ? 'bg-amber-600 hover:bg-amber-500'
                : 'bg-slate-800 hover:bg-slate-700'
            }`}
            title="Auto Land / Take Off [T]"
          >
            {flightPhase === 'LANDED' ? (
              <>
                <PlaneTakeoff className="w-3.5 h-3.5" />
                <span>TAKE OFF [T]</span>
              </>
            ) : flightPhase === 'TAKING_OFF' ? (
              <>
                <ArrowUpCircle className="w-3.5 h-3.5" />
                <span>ASCENDING...</span>
              </>
            ) : flightPhase === 'LANDING' ? (
              <>
                <PlaneLanding className="w-3.5 h-3.5" />
                <span>ABORT LAND [T]</span>
              </>
            ) : (
              <>
                <PlaneLanding className="w-3.5 h-3.5" />
                <span>LAND [T]</span>
              </>
            )}
          </button>

          <button
            onClick={() => engine?.cycleAtmosphere()}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition border ${
              atmosphereMode === 3
                ? 'bg-rose-600 text-white border-rose-400 shadow-sm'
                : atmosphereMode === 4
                ? 'bg-amber-500/20 text-amber-800 border-amber-500/40'
                : 'bg-white/80 hover:bg-white text-slate-700 border-slate-200/80'
            }`}
            title="Cycle Dynamic Weather & Turbulence [V]"
          >
            {atmosphereMode === 3 ? (
              <CloudLightning className="w-3.5 h-3.5" />
            ) : (
              <CloudSun className="w-3.5 h-3.5 text-amber-500" />
            )}
            <span className="hidden sm:inline">{wxPreset.code}</span>
            {autoSpotlightActive && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping"
                title="Auto Navigation Spotlight Active"
              />
            )}
          </button>

          <button
            onClick={() => engine?.toggleGuidedTour()}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              guidedTourActive
                ? 'bg-sky-600 text-white border border-sky-400 shadow-md animate-pulse'
                : 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 border border-sky-500/30'
            }`}
            title="10-Island Cinematic Tour [G]"
          >
            <Clapperboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {guidedTourActive ? 'STOP TOUR' : 'TOUR'}
            </span>
          </button>

          <button
            onClick={() => setHangarModalOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-xs font-bold text-indigo-700 border border-indigo-500/30 flex items-center gap-1 transition"
            title="Open Hangar, Payload Missions & Weather Bay [M]"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">HANGAR & CARGO</span>
          </button>

          <button
            onClick={() => engine?.cycleCameraMode()}
            className="px-2.5 py-1.5 rounded-xl bg-white/80 hover:bg-white text-xs font-semibold text-slate-700 border border-slate-200/80 flex items-center gap-1 transition"
            title="Switch Camera View [C]"
          >
            <Camera className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden xl:inline">{cameraNames[cameraMode]}</span>
          </button>

          <button
            onClick={toggleLang}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-bold transition"
          >
            {lang.toUpperCase()}
          </button>
        </div>
      </div>

      <CargoMissionBanner />
    </div>
  );
};
