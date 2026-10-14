import React, { useState } from 'react';
import {
  Camera,
  CloudSun,
  Compass,
  Cpu,
  Flame,
  Globe,
  Layers,
  Music,
  Radio,
  Radar,
  Send,
  Settings,
  Sparkles,
  Sun,
  Terminal,
  Volume2,
  VolumeX,
  Waves,
  Wind,
  Zap,
} from 'lucide-react';
import {
  PROJECT_CASE_STUDIES,
  PUBLICATIONS_DATA,
  TECH_SKILL_BENCHMARKS,
} from '../data/projects';
import { useLabStore } from '../store/useLabStore';
import { DroneLiveryKey, FlightProfileKey, ProjectCategory } from '../types/lab';

interface IslandContentPanelsProps {
  stationId: number;
}

export const IslandContentPanels: React.FC<IslandContentPanelsProps> = ({
  stationId,
}) => {
  const lang = useLabStore((s) => s.lang);
  const islandState = useLabStore((s) => s.islandState);
  const setIslandInteraction = useLabStore((s) => s.setIslandInteraction);
  const engine = useLabStore((s) => s.engine);
  const setTerminalModalOpen = useLabStore((s) => s.setTerminalModalOpen);

  const activeProjectFilter = useLabStore((s) => s.activeProjectFilter);
  const setProjectFilter = useLabStore((s) => s.setProjectFilter);
  const openProjectModal = useLabStore((s) => s.openProjectModal);

  const selectedTechSkillIdx = useLabStore((s) => s.selectedTechSkillIdx);
  const selectTechSkill = useLabStore((s) => s.selectTechSkill);

  const selectedPublicationIdx = useLabStore((s) => s.selectedPublicationIdx);
  const selectPublication = useLabStore((s) => s.selectPublication);

  const aiBatchLoad = useLabStore((s) => s.aiBatchLoad);
  const setAiBatchLoad = useLabStore((s) => s.setAiBatchLoad);

  const flightProfile = useLabStore((s) => s.flightProfile);
  const activeLivery = useLabStore((s) => s.activeLivery);
  const wingmanSwarmActive = useLabStore((s) => s.wingmanSwarmActive);
  const audioEnabled = useLabStore((s) => s.audioEnabled);
  const toggleAudio = useLabStore((s) => s.toggleAudio);

  const commLogs = useLabStore((s) => s.commLogs);
  const addCommLog = useLabStore((s) => s.addCommLog);
  const [commName, setCommName] = useState('');
  const [commMsg, setCommMsg] = useState('');

  // ISL-00: Sanctuary Rotunda
  if (stationId === 0) {
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
              {
                val: 1,
                labelId: 'Pancuran',
                labelEn: 'Crown Jets',
                toast: 'KINETIC FOUNTAIN JETS ACTIVE',
              },
              {
                val: 2,
                labelId: 'Zenith Orb',
                labelEn: 'Zenith Orb',
                toast: 'ZENITH HOLO-ORB RESONANCE',
              },
            ].map((item) => (
              <button
                key={item.val}
                onClick={() =>
                  setIslandInteraction('fountainMode', item.val, item.toast)
                }
                className={`py-1 px-2 rounded-lg font-bold text-[10px] transition ${
                  islandState.fountainMode === item.val
                    ? 'bg-sky-600 text-white'
                    : 'bg-white/80 text-slate-700'
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
              {lang === 'id' ? '10 Pulau' : '10 Islands'}
            </div>
            <div className="text-[10px] text-slate-500">
              {lang === 'id' ? 'Interaksi Unik' : 'Live 3D FX'}
            </div>
          </div>
          <div className="bg-white/80 p-2 rounded-xl border border-slate-200/80 text-center">
            <div className="font-extrabold text-emerald-600 text-sm">35+</div>
            <div className="text-[10px] text-slate-500">
              {lang === 'id' ? 'Sistem R&D' : 'R&D Systems'}
            </div>
          </div>
          <div className="bg-white/80 p-2 rounded-xl border border-slate-200/80 text-center">
            <div className="font-extrabold text-indigo-600 text-sm">ISL-06</div>
            <div className="text-[10px] text-slate-500">
              {lang === 'id' ? 'Pulau Settings' : 'Settings Island'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          <button
            onClick={() => engine?.engageAutopilot(6)}
            className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 transition"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>
              {lang === 'id'
                ? 'Terbang ke Pulau Settings (06)'
                : 'Fly to Settings Island (06)'}
            </span>
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
  }

  // ISL-01: Cantilevered Bio & Observatory
  if (stationId === 1) {
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
                  islandState.starTarget === st.val
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/80 text-slate-700'
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
  }

  // ISL-02: Geodesic R&D Biodome & Wind Lab
  if (stationId === 2) {
    const categories: ProjectCategory[] = ['ALL', 'AEROSPACE', 'AI', 'SPATIAL'];
    const filtered = PROJECT_CASE_STUDIES.map((p, idx) => ({
      ...p,
      origIdx: idx,
    })).filter(
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
              onClick={() =>
                setIslandInteraction(
                  'biodomeSpectrum',
                  0,
                  'BIODOME SPECTRUM: EMERALD FLORA'
                )
              }
              className={`py-1 rounded-lg font-bold text-[10px] ${
                islandState.biodomeSpectrum === 0
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white/80 text-slate-700'
              }`}
            >
              Flora
            </button>
            <button
              onClick={() =>
                setIslandInteraction(
                  'biodomeSpectrum',
                  1,
                  'BIODOME SPECTRUM: BIO-CYAN GLOW'
                )
              }
              className={`py-1 rounded-lg font-bold text-[10px] ${
                islandState.biodomeSpectrum === 1
                  ? 'bg-cyan-600 text-white'
                  : 'bg-white/80 text-slate-700'
              }`}
            >
              Bio-Glow
            </button>
            <button
              onClick={() =>
                setIslandInteraction(
                  'biodomeSpectrum',
                  2,
                  'BIODOME SPECTRUM: SOLAR AMBER'
                )
              }
              className={`py-1 rounded-lg font-bold text-[10px] ${
                islandState.biodomeSpectrum === 2
                  ? 'bg-amber-500 text-white'
                  : 'bg-white/80 text-slate-700'
              }`}
            >
              Solar
            </button>
            <button
              onClick={() =>
                setIslandInteraction(
                  'turbineOverdrive',
                  !islandState.turbineOverdrive,
                  !islandState.turbineOverdrive
                    ? 'WIND TURBINES: 300% OVERDRIVE'
                    : 'WIND TURBINES: NOMINAL RPM'
                )
              }
              className={`py-1 rounded-lg font-bold text-[10px] ${
                islandState.turbineOverdrive
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/80 text-slate-700'
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
                <span className="font-mono-tech text-[10px] font-bold text-emerald-600">
                  {p.tag}
                </span>
                <span className="text-[10px] font-bold text-sky-600 group-hover:translate-x-0.5 transition">
                  Blueprint ↗
                </span>
              </div>
              <div className="font-bold text-slate-800 text-xs mt-0.5">
                {p.title}
              </div>
              <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                {lang === 'id' ? p.descId : p.descEn}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  // ISL-03: Hydro-Cascade Waterfall Terrace
  if (stationId === 3) {
    const activeSkill = TECH_SKILL_BENCHMARKS[selectedTechSkillIdx];
    return (
      <>
        <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 mb-2">
          <div className="font-mono-tech text-[10px] font-bold text-cyan-700 mb-1.5 flex items-center gap-1">
            <Waves className="w-3 h-3" />
            <span>3D WATERFALL GRAVITY & MIST RAINBOW</span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            <button
              onClick={() =>
                setIslandInteraction('waterfallMode', 0, 'WATERFALL: NORMAL FLOW')
              }
              className={`py-1 rounded-lg font-bold text-[10px] ${
                islandState.waterfallMode === 0
                  ? 'bg-cyan-600 text-white'
                  : 'bg-white/80 text-slate-700'
              }`}
            >
              Normal
            </button>
            <button
              onClick={() =>
                setIslandInteraction(
                  'waterfallMode',
                  1,
                  'WATERFALL: TORRENTIAL CASCADE'
                )
              }
              className={`py-1 rounded-lg font-bold text-[10px] ${
                islandState.waterfallMode === 1
                  ? 'bg-cyan-600 text-white'
                  : 'bg-white/80 text-slate-700'
              }`}
            >
              Torrent
            </button>
            <button
              onClick={() =>
                setIslandInteraction(
                  'waterfallMode',
                  2,
                  'ANTI-GRAVITY REVERSE CASCADE ENGAGED!'
                )
              }
              className={`py-1 rounded-lg font-bold text-[10px] ${
                islandState.waterfallMode === 2
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/80 text-slate-700'
              }`}
            >
              Anti-Grav
            </button>
            <button
              onClick={() =>
                setIslandInteraction(
                  'rainbowActive',
                  !islandState.rainbowActive,
                  !islandState.rainbowActive
                    ? 'PRISMATIC MIST RAINBOW: ON'
                    : 'PRISMATIC MIST RAINBOW: OFF'
                )
              }
              className={`py-1 rounded-lg font-bold text-[10px] ${
                islandState.rainbowActive
                  ? 'bg-amber-500 text-white'
                  : 'bg-white/80 text-slate-700'
              }`}
            >
              Rainbow
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-600 mb-2">
          {lang === 'id'
            ? 'Klik bar teknologi di bawah untuk menguji benchmark arsitektur:'
            : 'Click any technology bar below to inspect production benchmarks:'}
        </p>

        <div className="space-y-2">
          {TECH_SKILL_BENCHMARKS.map((sk, sIdx) => (
            <div
              key={sk.name}
              onClick={() => selectTechSkill(sIdx)}
              className={`p-2 rounded-xl cursor-pointer transition border ${
                selectedTechSkillIdx === sIdx
                  ? 'bg-white border-cyan-400 shadow-sm'
                  : 'bg-white/60 border-slate-200/70 hover:bg-white'
              }`}
            >
              <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                <span>{sk.name}</span>
                <span className={sk.textCol}>{sk.pct}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${sk.color} rounded-full`}
                  style={{ width: `${sk.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 p-2.5 rounded-xl bg-slate-900 text-slate-200 font-mono-tech text-[10px] space-y-1">
          <div className="text-cyan-400 font-bold">// {activeSkill.name}</div>
          <div className="text-slate-300 font-sans text-[11px]">
            {lang === 'id' ? activeSkill.detailId : activeSkill.detailEn}
          </div>
          <div className="text-emerald-400 pt-0.5">{activeSkill.bench}</div>
        </div>
      </>
    );
  }

  // ISL-04: Helix Neural AI & Vision Spire
  if (stationId === 4) {
    return (
      <>
        <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/25 mb-2">
          <div className="font-mono-tech text-[10px] font-bold text-purple-700 mb-1.5 flex items-center gap-1">
            <Cpu className="w-3 h-3" />
            <span>3D DNA NEURAL SYNAPSE & SPIN OVERCLOCK</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() =>
                setIslandInteraction(
                  'helixMode',
                  0,
                  'HELIX TOWER: CALM ROTATION'
                )
              }
              className={`py-1 rounded-lg font-bold text-[10px] ${
                islandState.helixMode === 0
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/80 text-slate-700'
              }`}
            >
              Calm Spin
            </button>
            <button
              onClick={() =>
                setIslandInteraction(
                  'helixMode',
                  1,
                  'NEURAL SYNAPSE WAVE ACTIVE'
                )
              }
              className={`py-1 rounded-lg font-bold text-[10px] ${
                islandState.helixMode === 1
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/80 text-slate-700'
              }`}
            >
              Synapse Wave
            </button>
            <button
              onClick={() =>
                setIslandInteraction(
                  'helixMode',
                  2,
                  'QUANTUM HELIX OVERCLOCK ENGAGED'
                )
              }
              className={`py-1 rounded-lg font-bold text-[10px] ${
                islandState.helixMode === 2
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/80 text-slate-700'
              }`}
            >
              Overclock
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed">
          {lang === 'id' ? (
            <>
              Menara arsitektur <strong>Double-Helix</strong> untuk eksperimen{' '}
              <em>Edge Computer Vision</em>, pemrosesan sensor LiDAR, dan agen
              otonom real-time.
            </>
          ) : (
            <>
              <strong>Double-Helix</strong> architectural tower dedicated to{' '}
              <em>Edge Computer Vision</em>, LiDAR point-cloud fusion, and
              autonomous neural agents.
            </>
          )}
        </p>

        <div className="p-2.5 rounded-xl bg-white/85 border border-slate-200 mt-2 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
            <span>
              Swarm Neural Stream Batch:{' '}
              <span className="text-purple-600">{aiBatchLoad} UAVs</span>
            </span>
            <span className="font-mono-tech text-[10px] text-emerald-600">
              {(8.2 + aiBatchLoad * 0.7).toFixed(1)}ms Latency
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={16}
            value={aiBatchLoad}
            onChange={(e) => setAiBatchLoad(parseInt(e.target.value, 10))}
            className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
          />
          <div className="text-[10px] text-slate-500 flex justify-between font-mono-tech">
            <span>THROUGHPUT: {aiBatchLoad * 60} FPS</span>
            <span>ACCURACY: 98.4% mAP</span>
          </div>
        </div>
      </>
    );
  }

  // ISL-05: Heliostat Solar Array & Fusion Core
  if (stationId === 5) {
    return (
      <>
        <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 mb-2 flex items-center justify-between">
          <div>
            <div className="font-mono-tech text-[10px] font-bold text-amber-800 flex items-center gap-1">
              <Sun className="w-3 h-3" />
              <span>10-HELIOSTAT SOLAR CONVERGENCE</span>
            </div>
            <div className="text-[10px] text-slate-600">
              {lang === 'id'
                ? 'Fokuskan 10 sinar cermin ke inti Tokamak'
                : 'Focus 10 mirror lasers onto the Fusion Torus'}
            </div>
          </div>
          <button
            onClick={() =>
              setIslandInteraction(
                'solarConverge',
                !islandState.solarConverge,
                !islandState.solarConverge
                  ? '10 HELIOSTAT MIRRORS CONVERGED ON TOKAMAK'
                  : 'SOLAR CONVERGENCE STANDBY'
              )
            }
            className={`px-3 py-1.5 rounded-xl font-bold text-[10px] transition ${
              islandState.solarConverge
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-white'
            }`}
          >
            {islandState.solarConverge ? 'BEAMS ACTIVE' : 'IGNITE BEAMS'}
          </button>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed">
          {lang === 'id' ? (
            <>
              Pusat energi bersih kepulauan dengan deretan cermin{' '}
              <strong>Heliostat Konsentris</strong> dan reaktor torus magnetik yang
              menyuplai daya komputasi seluruh lab.
            </>
          ) : (
            <>
              Clean-energy nexus featuring a concentric{' '}
              <strong>Heliostat Mirror Array</strong> focusing solar energy onto a
              levitating magnetic fusion torus.
            </>
          )}
        </p>

        <div className="p-2.5 rounded-xl bg-slate-900 text-slate-200 font-mono-tech text-[11px] space-y-1">
          <div className="text-amber-400 font-bold">
            // CLOUD & TELEMETRY BENCHMARKS
          </div>
          <div>
            • Core Output:{' '}
            {islandState.solarConverge
              ? '480 MW (PLASMA LOCK)'
              : '120 MW (STANDBY)'}
          </div>
          <div>• Throughput: 1.4M msg/sec (WebSockets/Go)</div>
        </div>
      </>
    );
  }

  // ISL-06: Avionics Hangar & Customizer Lab
  if (stationId === 6) {
    const liveries: { key: DroneLiveryKey; label: string; cls: string }[] = [
      {
        key: 'pearl',
        label: 'Pearl',
        cls: 'border-slate-300 bg-white hover:border-sky-500 text-slate-700',
      },
      {
        key: 'stealth',
        label: 'Stealth',
        cls: 'border-slate-700 bg-slate-900 hover:border-sky-400 text-white',
      },
      {
        key: 'rescue',
        label: 'Orange',
        cls: 'border-orange-300 bg-orange-500 hover:bg-orange-400 text-white',
      },
      {
        key: 'royal',
        label: 'Gold',
        cls: 'border-amber-400 bg-amber-400 hover:bg-amber-300 text-slate-900',
      },
    ];
    const profiles: FlightProfileKey[] = ['CINEMA', 'SPORT', 'ACRO'];

    return (
      <div className="space-y-2.5 text-xs">
        <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-between">
          <span className="font-mono-tech text-[10px] font-bold text-blue-700">
            3D HANGAR CALIBRATION LASER
          </span>
          <button
            onClick={() =>
              setIslandInteraction(
                'hangarScanner',
                !islandState.hangarScanner,
                !islandState.hangarScanner
                  ? 'HANGAR CALIBRATION LASER: ACTIVE'
                  : 'HANGAR CALIBRATION LASER: STANDBY'
              )
            }
            className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${
              islandState.hangarScanner
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700'
            }`}
          >
            {islandState.hangarScanner ? 'SCANNING ON' : 'SCANNER OFF'}
          </button>
        </div>

        <div>
          <div className="font-bold text-slate-700 mb-1 text-[11px]">
            1. Drone Fuselage Livery
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {liveries.map((liv) => (
              <button
                key={liv.key}
                onClick={() => engine?.applyDroneLivery(liv.key)}
                className={`py-1.5 px-2 rounded-xl border font-bold text-[10px] transition ${
                  liv.cls
                } ${activeLivery === liv.key ? 'ring-2 ring-sky-500' : ''}`}
              >
                {liv.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="font-bold text-slate-700 mb-1 text-[11px]">
            2. Flight Physics PID Mode
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {profiles.map((prof) => (
              <button
                key={prof}
                onClick={() => engine?.setFlightProfile(prof)}
                className={`py-1.5 px-2 rounded-xl border font-bold text-[10px] transition ${
                  flightProfile === prof
                    ? 'border-sky-500 bg-sky-500 text-white'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                {prof}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="font-bold text-slate-700 mb-1 text-[11px]">
            3. World Weather, Radar & Swarm
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => engine?.cycleAtmosphere()}
              className="py-1.5 px-2.5 rounded-xl bg-white/90 hover:bg-white border border-slate-200 font-bold text-[11px] text-slate-700 flex items-center justify-between"
            >
              <span className="flex items-center gap-1">
                <CloudSun className="w-3.5 h-3.5 text-amber-500" />
                Sky Weather
              </span>
              <span className="font-mono-tech text-[9px] text-sky-600">[V]</span>
            </button>
            <button
              onClick={() => engine?.triggerLidarScan()}
              className="py-1.5 px-2.5 rounded-xl bg-white/90 hover:bg-white border border-slate-200 font-bold text-[11px] text-slate-700 flex items-center justify-between"
            >
              <span className="flex items-center gap-1">
                <Radar className="w-3.5 h-3.5 text-sky-600" />
                LiDAR Pulse
              </span>
              <span className="font-mono-tech text-[9px] text-sky-600">[F]</span>
            </button>
            <button
              onClick={() => engine?.toggleWingmanSwarm()}
              className="py-1.5 px-2.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 font-bold text-[11px] text-indigo-700 flex items-center justify-between"
            >
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                Wingman Swarm
              </span>
              <span className="font-mono-tech text-[9px]">
                {wingmanSwarmActive ? 'ON' : 'OFF'}
              </span>
            </button>
            <button
              onClick={() => engine?.toggleRingChallenge()}
              className="py-1.5 px-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 font-bold text-[11px] text-rose-700 flex items-center justify-between"
            >
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                Sky-Ring Trial
              </span>
              <span className="font-mono-tech text-[9px]">[R]</span>
            </button>
            <button
              onClick={() => engine?.captureAerialSnapshot()}
              className="py-1.5 px-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 font-bold text-[11px] text-emerald-700 flex items-center justify-between"
            >
              <span className="flex items-center gap-1">
                <Camera className="w-3.5 h-3.5" />
                Aerial Photo
              </span>
              <span className="font-mono-tech text-[9px]">[P]</span>
            </button>
            <button
              onClick={toggleAudio}
              className="py-1.5 px-2.5 rounded-xl bg-slate-800 text-white font-bold text-[11px] flex items-center justify-between"
            >
              <span className="flex items-center gap-1">
                {audioEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                )}
                Synth Audio
              </span>
              <span className="font-mono-tech text-[9px]">
                {audioEnabled ? 'ON' : 'MUTE'}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ISL-07: Zen Pagoda & Sakura Sky-Garden
  if (stationId === 7) {
    return (
      <>
        <div className="p-2.5 rounded-2xl bg-pink-500/15 border border-pink-500/30 mb-2 flex items-center justify-between">
          <div>
            <div className="font-mono-tech text-[10px] font-bold text-pink-700 flex items-center gap-1">
              <Flame className="w-3 h-3" />
              <span>3D SKY LANTERNS & SAKURA BREEZE</span>
            </div>
            <div className="text-[10px] text-slate-600">
              {lang === 'id'
                ? 'Terbangkan lampion hangat dari pagoda'
                : 'Release glowing sky lanterns into the clouds'}
            </div>
          </div>
          <button
            onClick={() =>
              setIslandInteraction(
                'lanternsActive',
                !islandState.lanternsActive,
                !islandState.lanternsActive
                  ? 'FLOATING SKY LANTERNS RELEASED'
                  : 'SKY LANTERNS RECALLED'
              )
            }
            className={`px-3 py-1.5 rounded-xl font-bold text-[10px] transition ${
              islandState.lanternsActive
                ? 'bg-pink-600 text-white shadow-sm'
                : 'bg-white text-slate-700'
            }`}
          >
            {islandState.lanternsActive ? 'LANTERNS LIT' : 'RELEASE'}
          </button>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed">
          {lang === 'id' ? (
            <>
              Taman ketenangan di ketinggian <strong>+68m</strong> dengan
              paviliun pagoda modernis bertingkat dan pohon Sakura. Mencerminkan
              filosofi desain antarmuka yang tenang, humanis, dan presisi.
            </>
          ) : (
            <>
              High-altitude sanctuary at <strong>+68m</strong> featuring a tiered
              modernist pagoda and blooming Sakura trees—embodying calm,
              human-centric spatial UI/UX design.
            </>
          )}
        </p>
      </>
    );
  }

  // ISL-08: Acoustic Amphitheater & Kinetic Stage
  if (stationId === 8) {
    const activePub = PUBLICATIONS_DATA[selectedPublicationIdx];
    return (
      <>
        <div className="p-2.5 rounded-2xl bg-teal-500/10 border border-teal-500/25 mb-2">
          <div className="font-mono-tech text-[10px] font-bold text-teal-700 mb-1.5 flex items-center gap-1">
            <Music className="w-3 h-3" />
            <span>3D AUDIO EQUALIZER STAGE & HARMONIC CHORD</span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {[
              { val: 0, label: 'Mute', toast: 'ACOUSTIC STAGE MUTED' },
              {
                val: 1,
                label: 'Fifths',
                toast: '3D AUDIO EQUALIZER & HARMONIC SYNTH ACTIVE',
              },
              {
                val: 2,
                label: 'Solar Arp',
                toast: '3D AUDIO EQUALIZER & HARMONIC SYNTH ACTIVE',
              },
              {
                val: 3,
                label: 'Cosmos',
                toast: '3D AUDIO EQUALIZER & HARMONIC SYNTH ACTIVE',
              },
            ].map((item) => (
              <button
                key={item.val}
                onClick={() =>
                  setIslandInteraction('sonicHarmony', item.val, item.toast)
                }
                className={`py-1 rounded-lg font-bold text-[10px] ${
                  islandState.sonicHarmony === item.val
                    ? 'bg-teal-600 text-white'
                    : 'bg-white/80 text-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed">
          {lang === 'id'
            ? 'Amfiteater terbuka melingkar dengan 12 pilar equalizer 3D dan patung gelombang akustik kinetik. Klik kartu riset di bawah:'
            : 'Circular marble amphitheater with 12 kinetic 3D equalizer pillars. Click any talk or SDK below to inspect:'}
        </p>

        <div className="space-y-1.5 text-[11px] mt-1.5">
          {PUBLICATIONS_DATA.map((pub, pIdx) => (
            <div
              key={pub.title}
              onClick={() => selectPublication(pIdx)}
              className={`p-2 rounded-xl cursor-pointer transition border ${
                selectedPublicationIdx === pIdx
                  ? 'bg-white border-teal-500 shadow-sm'
                  : 'bg-white/75 border-slate-200 hover:bg-white'
              }`}
            >
              <div className="font-semibold text-slate-800">{pub.title}</div>
              <div className="text-[10px] text-teal-600 font-mono-tech">
                {pub.venue}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 p-2.5 rounded-xl bg-slate-900 text-slate-200 text-[11px] space-y-1">
          <div className="text-slate-300">
            {lang === 'id' ? activePub.summaryId : activePub.summaryEn}
          </div>
          <div className="font-mono-tech text-[10px] text-teal-400 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
            {activePub.code}
          </div>
        </div>
      </>
    );
  }

  // ISL-09: Stratosphere Summit & Deep-Space Array
  const handleCommSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sender = (commName || 'VISITOR').trim().toUpperCase();
    const msg = commMsg.trim();
    if (!msg) return;
    addCommLog(sender, msg);
    setCommName('');
    setCommMsg('');
  };

  return (
    <>
      <div className="p-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 mb-2 flex items-center justify-between">
        <span className="font-mono-tech text-[10px] font-bold text-amber-800 flex items-center gap-1">
          <Radio className="w-3 h-3" />
          <span>ORBITAL UPLINK LIGHT PILLAR</span>
        </span>
        <button
          onClick={() =>
            setIslandInteraction(
              'uplinkBeam',
              !islandState.uplinkBeam,
              !islandState.uplinkBeam
                ? 'STRATOSPHERIC DEEP-SPACE UPLINK BEAM FIRED!'
                : 'UPLINK BEAM STANDBY'
            )
          }
          className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${
            islandState.uplinkBeam
              ? 'bg-amber-500 text-slate-950'
              : 'bg-slate-800 text-white'
          }`}
        >
          {islandState.uplinkBeam ? 'BEAM LOCKED' : 'FIRE UPLINK BEAM'}
        </button>
      </div>

      <form onSubmit={handleCommSubmit} className="space-y-2 mt-1">
        <input
          type="text"
          required
          value={commName}
          onChange={(e) => setCommName(e.target.value)}
          placeholder={
            lang === 'id' ? 'Nama / Instansi Anda' : 'Your Name / Organization'
          }
          className="w-full px-3 py-1.5 rounded-xl bg-white/90 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
        />
        <input
          type="text"
          required
          value={commMsg}
          onChange={(e) => setCommMsg(e.target.value)}
          placeholder={
            lang === 'id'
              ? 'Pesan singkat atau rincian proyek...'
              : 'Brief message or project inquiry...'
          }
          className="w-full px-3 py-1.5 rounded-xl bg-white/90 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition"
        >
          <Send className="w-3.5 h-3.5" />
          <span>
            {lang === 'id'
              ? 'Kirim Transmisi Satelit'
              : 'Transmit Uplink Message'}
          </span>
        </button>
      </form>

      <div className="mt-2 p-2 rounded-xl bg-slate-900 text-slate-200 font-mono-tech text-[10px] space-y-1 max-h-20 overflow-y-auto custom-scroll">
        <div className="text-amber-400 font-bold flex items-center gap-1">
          <Globe className="w-3 h-3" />
          <span>// SATELLITE UPLINK LOG ({commLogs.length})</span>
        </div>
        {commLogs
          .slice()
          .reverse()
          .map((item, idx) => (
            <div key={idx} className="truncate">
              <span className="text-emerald-400">[{item.time}]</span>{' '}
              <strong>{item.sender}:</strong> {item.msg}
            </div>
          ))}
      </div>
    </>
  );
};
