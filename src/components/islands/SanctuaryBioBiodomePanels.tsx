import React from 'react';
import { Compass, Navigation, Package, Sparkles, Terminal, Wind } from 'lucide-react';
import { PROJECT_CASE_STUDIES } from '../../data/portfolioContent';
import { useLabStore } from '../../store/useLabStore';
import { ProjectCategory } from '../../types/lab';

export const SanctuaryPanel: React.FC = () => {
  const lang = useLabStore((s) => s.lang);
  const fountainMode = useLabStore((s) => s.islandState.fountainMode);
  const setIslandInteraction = useLabStore((s) => s.setIslandInteraction);
  const setHangarModalOpen = useLabStore((s) => s.setHangarModalOpen);
  const setPlannerMode = useLabStore((s) => s.setPlannerMode);
  const setPlannerDrawerOpen = useLabStore((s) => s.setPlannerDrawerOpen);
  const setTerminalModalOpen = useLabStore((s) => s.setTerminalModalOpen);

  return (
    <>
      <div className="p-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/25 mb-2">
        <div className="font-mono-tech text-[10px] font-bold text-sky-700 mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>
            {lang === 'id'
              ? 'INTERAKSI 3D: AIR MANCUR & HOLO-GLOBE'
              : '3D INTERACTION: HYDRO FOUNTAIN & HOLO-ORB'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { val: 0, labelId: 'Tenang', labelEn: 'Calm Pool', toast: 'POOL: CALM MIRROR' },
            { val: 1, labelId: 'Pancuran', labelEn: 'Crown Jets', toast: 'KINETIC FOUNTAIN JETS ACTIVE' },
            { val: 2, labelId: 'Zenith Orb', labelEn: 'Zenith Orb', toast: 'ZENITH HOLO-ORB RESONANCE' },
          ].map((item) => (
            <button
              key={item.val}
              onClick={() => setIslandInteraction('fountainMode', item.val, item.toast)}
              className={`py-1 px-2 rounded-lg font-bold text-[10px] transition ${
                fountainMode === item.val ? 'bg-sky-600 text-white' : 'bg-white/80 text-slate-700'
              }`}
            >
              {lang === 'id' ? item.labelId : item.labelEn}
            </button>
          ))}
        </div>
      </div>

      <p className="leading-relaxed text-slate-700">
        {lang === 'id' ? (
          <>
            Selamat datang di <strong>10-Island Sky Archipelago Lab</strong> milik{' '}
            <strong>Hadiyatna</strong> —{' '}
            <em>Creative Technologist, Full-Stack Architect, & Spatial WebGL Engineer</em>.
          </>
        ) : (
          <>
            Welcome to <strong>Hadiyatna&apos;s 10-Island Sky Archipelago Lab</strong> —
            interactive spatial portfolio of a{' '}
            <em>Creative Technologist, Full-Stack Architect, & WebGL Engineer</em>.
          </>
        )}
      </p>

      <div className="grid grid-cols-3 gap-2 my-2">
        <div className="bg-white/80 p-2 rounded-xl border border-slate-200/80 text-center">
          <div className="font-extrabold text-sky-600 text-sm">
            {lang === 'id' ? '4 Misi' : '4 Cargo'}
          </div>
          <div className="text-[10px] text-slate-500">
            {lang === 'id' ? 'Logistik Kargo' : 'Payload Runs'}
          </div>
        </div>
        <div className="bg-white/80 p-2 rounded-xl border border-slate-200/80 text-center">
          <div className="font-extrabold text-emerald-600 text-sm">5 Cuaca</div>
          <div className="text-[10px] text-slate-500">
            {lang === 'id' ? 'Badai & Kabut' : 'Storm & Fog'}
          </div>
        </div>
        <div className="bg-white/80 p-2 rounded-xl border border-slate-200/80 text-center">
          <div className="font-extrabold text-indigo-600 text-sm">Planner</div>
          <div className="text-[10px] text-slate-500">
            {lang === 'id' ? 'Rute Radar' : 'Radar Patrol'}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 pt-1">
        <button
          onClick={() => setHangarModalOpen(true)}
          className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 transition shadow-sm"
        >
          <Package className="w-3.5 h-3.5" />
          <span>{lang === 'id' ? 'Misi Kargo & Cuaca' : 'Payload Missions & Weather'}</span>
        </button>
        <button
          onClick={() => {
            setPlannerMode(true);
            setPlannerDrawerOpen(true);
          }}
          className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 transition"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>{lang === 'id' ? 'Rute Waypoint' : 'Waypoint Planner'}</span>
        </button>
        <button
          onClick={() => setTerminalModalOpen(true)}
          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono-tech font-bold text-[11px] flex items-center gap-1 transition"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>{lang === 'id' ? 'Buka CV & CLI' : 'Open CV & CLI'}</span>
        </button>
      </div>
    </>
  );
};

export const BioObservatoryPanel: React.FC = () => {
  const lang = useLabStore((s) => s.lang);
  const starTarget = useLabStore((s) => s.islandState.starTarget);
  const setIslandInteraction = useLabStore((s) => s.setIslandInteraction);

  const starTargets = [
    { val: 0, label: 'Standby', toast: 'TELESCOPE STANDBY' },
    { val: 1, label: '✦ Orion', toast: 'LOCKED: ORION NEBULA' },
    { val: 2, label: '✦ Vega', toast: 'LOCKED: VEGA PULSAR' },
    { val: 3, label: '✦ Nebula', toast: 'LOCKED: ANDROMEDA CORE' },
  ];

  return (
    <>
      <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 mb-2">
        <div className="font-mono-tech text-[10px] font-bold text-indigo-700 mb-1.5 flex items-center gap-1">
          <Compass className="w-3 h-3" />
          <span>
            {lang === 'id'
              ? 'INTERAKSI 3D: LASER TELESKOP & ARAH KUBAH'
              : '3D INTERACTION: DOME SLEW & STAR LASER'}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {starTargets.map((st) => (
            <button
              key={st.val}
              onClick={() => setIslandInteraction('starTarget', st.val, st.toast)}
              className={`py-1 rounded-lg font-bold text-[10px] transition ${
                starTarget === st.val ? 'bg-indigo-600 text-white' : 'bg-white/80 text-slate-700'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      <p className="leading-relaxed text-slate-700">
        {lang === 'id'
          ? 'Menggabungkan ketelitian rekayasa perangkat lunak berskala tinggi dengan estetika arsitektur 3D interaktif dan sistem terdistribusi.'
          : 'Bridging high-reliability software architecture with interactive 3D spatial computing and distributed cloud systems.'}
      </p>

      <div className="space-y-2 mt-2">
        <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80">
          <div className="font-bold text-slate-800 text-xs">
            Principal Spatial Web & Digital Twin Architect
          </div>
          <div className="text-[11px] text-slate-500">
            {lang === 'id'
              ? 'Merancang visualisasi WebGL real-time, simulasi fisika kendaraan otonom, dan dashboard telemetri.'
              : 'Designing real-time WebGL simulations, autonomous vehicle physics, and telemetry interfaces.'}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80">
          <div className="font-bold text-slate-800 text-xs">
            Full-Stack Systems & Edge AI Integration
          </div>
          <div className="text-[11px] text-slate-500">
            {lang === 'id'
              ? 'Arsitektur microservices berlatensi rendah dengan Go, TypeScript, dan Python.'
              : 'Low-latency microservices and edge inference pipelines in Go, TypeScript, and Python.'}
          </div>
        </div>
      </div>
    </>
  );
};

export const BiodomeProjectsPanel: React.FC = () => {
  const lang = useLabStore((s) => s.lang);
  const biodomeSpectrum = useLabStore((s) => s.islandState.biodomeSpectrum);
  const turbineOverdrive = useLabStore((s) => s.islandState.turbineOverdrive);
  const setIslandInteraction = useLabStore((s) => s.setIslandInteraction);
  const activeProjectFilter = useLabStore((s) => s.activeProjectFilter);
  const setProjectFilter = useLabStore((s) => s.setProjectFilter);
  const openProjectModal = useLabStore((s) => s.openProjectModal);

  const categories: ProjectCategory[] = ['ALL', 'AEROSPACE', 'AI', 'SPATIAL'];
  const filtered = PROJECT_CASE_STUDIES.map((p, idx) => ({ ...p, origIdx: idx })).filter(
    (p) => activeProjectFilter === 'ALL' || p.category === activeProjectFilter
  );

  return (
    <>
      <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 mb-2">
        <div className="font-mono-tech text-[10px] font-bold text-emerald-700 mb-1.5 flex items-center gap-1">
          <Wind className="w-3 h-3" />
          <span>3D BIODOME FLORA & TURBINE OVERDRIVE</span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => setIslandInteraction('biodomeSpectrum', 0, 'BIODOME SPECTRUM: EMERALD FLORA')}
            className={`py-1 rounded-lg font-bold text-[10px] ${
              biodomeSpectrum === 0 ? 'bg-emerald-600 text-white' : 'bg-white/80 text-slate-700'
            }`}
          >
            Flora
          </button>
          <button
            onClick={() => setIslandInteraction('biodomeSpectrum', 1, 'BIODOME SPECTRUM: BIO-CYAN GLOW')}
            className={`py-1 rounded-lg font-bold text-[10px] ${
              biodomeSpectrum === 1 ? 'bg-cyan-600 text-white' : 'bg-white/80 text-slate-700'
            }`}
          >
            Bio-Glow
          </button>
          <button
            onClick={() => setIslandInteraction('biodomeSpectrum', 2, 'BIODOME SPECTRUM: SOLAR AMBER')}
            className={`py-1 rounded-lg font-bold text-[10px] ${
              biodomeSpectrum === 2 ? 'bg-amber-500 text-white' : 'bg-white/80 text-slate-700'
            }`}
          >
            Solar
          </button>
          <button
            onClick={() =>
              setIslandInteraction(
                'turbineOverdrive',
                !turbineOverdrive,
                !turbineOverdrive ? 'WIND TURBINES: 300% OVERDRIVE' : 'WIND TURBINES: NOMINAL RPM'
              )
            }
            className={`py-1 rounded-lg font-bold text-[10px] ${
              turbineOverdrive ? 'bg-indigo-600 text-white' : 'bg-white/80 text-slate-700'
            }`}
          >
            3x Wind
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-1 mb-2 flex-wrap">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setProjectFilter(c)}
            className={`px-2 py-0.5 rounded-lg font-mono-tech text-[10px] font-bold transition ${
              activeProjectFilter === c
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((p) => (
          <div
            key={p.origIdx}
            onClick={() => openProjectModal(p.origIdx)}
            className="p-2.5 rounded-2xl bg-white/85 hover:bg-white border border-slate-200/90 hover:border-emerald-400 cursor-pointer transition shadow-sm group"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono-tech text-[10px] font-bold text-emerald-600">{p.tag}</span>
              <span className="text-[10px] font-bold text-sky-600 group-hover:translate-x-0.5 transition">
                Blueprint ↗
              </span>
            </div>
            <div className="font-bold text-slate-800 text-xs mt-0.5">{p.title}</div>
            <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
              {lang === 'id' ? p.descId : p.descEn}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
