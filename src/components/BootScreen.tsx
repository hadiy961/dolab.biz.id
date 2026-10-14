import React from 'react';
import { useLabStore } from '../store/useLabStore';

export const BootScreen: React.FC = () => {
  const bootProgress = useLabStore((s) => s.bootProgress);
  const bootCompleted = useLabStore((s) => s.bootCompleted);

  if (bootCompleted) return null;

  const steps = [
    { id: 1, label: '[01] TERRAIN & ARCHITECTURAL MESHES', threshold: 24 },
    { id: 2, label: '[02] 6-AXIS GYRO & ALTIMETER LASER', threshold: 52 },
    { id: 3, label: '[03] HELIPAD PAD-00 GROUND LOCK', threshold: 76 },
    { id: 4, label: '[04] ROTOR SPOOL-UP & AUTO TAKEOFF', threshold: 100 },
  ];

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-xl text-white transition-opacity duration-700 ${
        bootProgress >= 100 ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="w-full max-w-md px-6 py-8 rounded-3xl bg-slate-900/90 border border-sky-500/30 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-sky-400 animate-ping" />
            <span className="font-mono-tech text-xs tracking-widest text-sky-400 uppercase">
              AERO-SONDE V4 // AVIONICS OS
            </span>
          </div>
          <span className="font-mono-tech text-sm font-bold text-emerald-400">
            {bootProgress}%
          </span>
        </div>

        <h1 className="text-xl font-bold tracking-tight text-white mb-1">
          Sky Archipelago Research Lab
        </h1>
        <p className="text-xs text-slate-400 mb-5">
          Initializing 3D Floating Islands, 6-Axis IMU & Brushless Rotors...
        </p>

        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-5">
          <div
            className="h-full bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 transition-all duration-150"
            style={{ width: `${bootProgress}%` }}
          />
        </div>

        <div className="space-y-2 font-mono-tech text-[11px] text-slate-300 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
          {steps.map((step) => {
            const isOnline = bootProgress >= step.threshold;
            return (
              <div
                key={step.id}
                className={`flex items-center justify-between transition-opacity ${
                  isOnline ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <span>{step.label}</span>
                <span className={isOnline ? 'text-emerald-400 font-bold' : 'text-sky-400'}>
                  {isOnline ? 'ONLINE ✓' : 'WAITING'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
