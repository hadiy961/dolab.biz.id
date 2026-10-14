import React from 'react';
import { Cpu, Package, Sun, Waves } from 'lucide-react';
import { TECH_SKILL_BENCHMARKS } from '../../data/portfolioContent';
import { useLabStore } from '../../store/useLabStore';

export const HydroValleyPanel: React.FC = () => {
  const lang = useLabStore((s) => s.lang);
  const waterfallMode = useLabStore((s) => s.islandState.waterfallMode);
  const rainbowActive = useLabStore((s) => s.islandState.rainbowActive);
  const setIslandInteraction = useLabStore((s) => s.setIslandInteraction);
  const selectedTechSkillIdx = useLabStore((s) => s.selectedTechSkillIdx);
  const selectTechSkill = useLabStore((s) => s.selectTechSkill);

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
            onClick={() => setIslandInteraction('waterfallMode', 0, 'WATERFALL: NORMAL FLOW')}
            className={`py-1 rounded-lg font-bold text-[10px] ${
              waterfallMode === 0 ? 'bg-cyan-600 text-white' : 'bg-white/80 text-slate-700'
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => setIslandInteraction('waterfallMode', 1, 'WATERFALL: TORRENTIAL CASCADE')}
            className={`py-1 rounded-lg font-bold text-[10px] ${
              waterfallMode === 1 ? 'bg-cyan-600 text-white' : 'bg-white/80 text-slate-700'
            }`}
          >
            Torrent
          </button>
          <button
            onClick={() =>
              setIslandInteraction('waterfallMode', 2, 'ANTI-GRAVITY REVERSE CASCADE ENGAGED!')
            }
            className={`py-1 rounded-lg font-bold text-[10px] ${
              waterfallMode === 2 ? 'bg-purple-600 text-white' : 'bg-white/80 text-slate-700'
            }`}
          >
            Anti-Grav
          </button>
          <button
            onClick={() =>
              setIslandInteraction(
                'rainbowActive',
                !rainbowActive,
                !rainbowActive ? 'PRISMATIC MIST RAINBOW: ON' : 'PRISMATIC MIST RAINBOW: OFF'
              )
            }
            className={`py-1 rounded-lg font-bold text-[10px] ${
              rainbowActive ? 'bg-amber-500 text-white' : 'bg-white/80 text-slate-700'
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
              <div className={`h-full ${sk.color} rounded-full`} style={{ width: `${sk.pct}%` }} />
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
};

export const HelixAiPanel: React.FC = () => {
  const lang = useLabStore((s) => s.lang);
  const helixMode = useLabStore((s) => s.islandState.helixMode);
  const setIslandInteraction = useLabStore((s) => s.setIslandInteraction);
  const aiBatchLoad = useLabStore((s) => s.aiBatchLoad);
  const setAiBatchLoad = useLabStore((s) => s.setAiBatchLoad);
  const activeCargoMissionId = useLabStore((s) => s.activeCargoMissionId);
  const engine = useLabStore((s) => s.engine);

  return (
    <>
      <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/25 mb-2">
        <div className="font-mono-tech text-[10px] font-bold text-purple-700 mb-1.5 flex items-center gap-1">
          <Cpu className="w-3 h-3" />
          <span>3D DNA NEURAL SYNAPSE & SPIN OVERCLOCK</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { val: 0, label: 'Calm Spin', toast: 'HELIX TOWER: CALM ROTATION' },
            { val: 1, label: 'Synapse Wave', toast: 'NEURAL SYNAPSE WAVE ACTIVE' },
            { val: 2, label: 'Overclock', toast: 'QUANTUM HELIX OVERCLOCK ENGAGED' },
          ].map((item) => (
            <button
              key={item.val}
              onClick={() => setIslandInteraction('helixMode', item.val, item.toast)}
              className={`py-1 rounded-lg font-bold text-[10px] ${
                helixMode === item.val ? 'bg-purple-600 text-white' : 'bg-white/80 text-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-700 leading-relaxed">
        {lang === 'id' ? (
          <>
            Menara arsitektur <strong>Double-Helix</strong> untuk eksperimen{' '}
            <em>Edge Computer Vision</em>, pemrosesan sensor LiDAR, dan agen otonom real-time.
          </>
        ) : (
          <>
            <strong>Double-Helix</strong> architectural tower dedicated to{' '}
            <em>Edge Computer Vision</em>, LiDAR point-cloud fusion, and autonomous neural agents.
          </>
        )}
      </p>

      <div className="p-2.5 rounded-xl bg-white/85 border border-slate-200 mt-2 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
          <span>
            Swarm Neural Stream Batch: <span className="text-purple-600">{aiBatchLoad} UAVs</span>
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

      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 mt-2 flex items-center justify-between">
        <div className="text-[10px]">
          <div className="font-mono-tech font-bold text-amber-800">
            CRG-03 • QUANTUM TRANSPONDER (6.8 KG)
          </div>
          <div className="text-slate-600">
            {lang === 'id'
              ? 'Misi Kargo Berat: ISL-04 → ISL-09 Summit'
              : 'Heavy Payload Run: ISL-04 → ISL-09 Summit'}
          </div>
        </div>
        <button
          onClick={() => engine?.startCargoMission('quantum-uplink', true)}
          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] shrink-0"
        >
          {activeCargoMissionId === 'quantum-uplink' ? 'Active' : 'Dispatch'}
        </button>
      </div>
    </>
  );
};

export const SolarCorePanel: React.FC = () => {
  const lang = useLabStore((s) => s.lang);
  const solarConverge = useLabStore((s) => s.islandState.solarConverge);
  const setIslandInteraction = useLabStore((s) => s.setIslandInteraction);
  const activeCargoMissionId = useLabStore((s) => s.activeCargoMissionId);
  const completedCargoIds = useLabStore((s) => s.completedCargoIds);
  const engine = useLabStore((s) => s.engine);

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
              !solarConverge,
              !solarConverge
                ? '10 HELIOSTAT MIRRORS CONVERGED ON TOKAMAK'
                : 'SOLAR CONVERGENCE STANDBY'
            )
          }
          className={`px-3 py-1.5 rounded-xl font-bold text-[10px] transition ${
            solarConverge ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-slate-800 text-white'
          }`}
        >
          {solarConverge ? 'BEAMS ACTIVE' : 'IGNITE BEAMS'}
        </button>
      </div>

      <p className="text-xs text-slate-700 leading-relaxed">
        {lang === 'id' ? (
          <>
            Pusat energi bersih kepulauan dengan deretan cermin{' '}
            <strong>Heliostat Konsentris</strong> dan reaktor torus magnetik yang menyuplai daya
            komputasi seluruh lab.
          </>
        ) : (
          <>
            Clean-energy nexus featuring a concentric <strong>Heliostat Mirror Array</strong>{' '}
            focusing solar energy onto a levitating magnetic fusion torus.
          </>
        )}
      </p>

      <div className="p-2.5 rounded-2xl bg-slate-900 text-slate-100 border border-amber-500/40 space-y-1.5 mt-2">
        <div className="flex items-center justify-between">
          <span className="font-mono-tech text-[10px] font-bold text-amber-400 flex items-center gap-1">
            <Package className="w-3.5 h-3.5" />
            <span>PAYLOAD MISSION CRG-01 (5.4 KG)</span>
          </span>
          <span className="font-mono-tech text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
            {completedCargoIds.includes('fusion-cell') ? 'DELIVERED ✓' : 'ISL-05 → ISL-04'}
          </span>
        </div>
        <div className="text-[11px] text-slate-300">
          {lang === 'id'
            ? 'Mendarat di Helipad ISL-05 untuk mengunci Sel Fusi 5.4 kg, lalu terbangkan ke menara ISL-04 Helix AI.'
            : 'Land on ISL-05 Helipad to clamp the 5.4 kg Fusion Cell, then deliver it to ISL-04 Helix AI.'}
        </div>
        <button
          onClick={() => engine?.startCargoMission('fusion-cell', true)}
          className="w-full py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition"
        >
          {activeCargoMissionId === 'fusion-cell'
            ? lang === 'id'
              ? 'Misi CRG-01 Sedang Berjalan'
              : 'CRG-01 Mission In Progress'
            : lang === 'id'
            ? 'Mulai Pengiriman Sel Fusi (CRG-01)'
            : 'Launch Fusion Cell Delivery (CRG-01)'}
        </button>
      </div>
    </>
  );
};
