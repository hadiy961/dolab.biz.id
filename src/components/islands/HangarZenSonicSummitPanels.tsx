import React, { useState } from 'react';
import {
  Camera,
  Flame,
  Globe,
  Layers,
  Music,
  Navigation,
  Package,
  Radio,
  Radar,
  Send,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { PAYLOAD_MISSIONS } from '../../data/cargoMissions';
import { WEATHER_PRESETS } from '../../data/flightAndWeather';
import { PUBLICATIONS_DATA } from '../../data/portfolioContent';
import { useLabStore } from '../../store/useLabStore';
import { AtmosphereMode, DroneLiveryKey, FlightProfileKey } from '../../types/lab';

export const SettingsHangarPanel: React.FC = () => {
  const hangarScanner = useLabStore((s) => s.islandState.hangarScanner);
  const setIslandInteraction = useLabStore((s) => s.setIslandInteraction);
  const engine = useLabStore((s) => s.engine);
  const setHangarModalOpen = useLabStore((s) => s.setHangarModalOpen);
  const setPlannerMode = useLabStore((s) => s.setPlannerMode);
  const setPlannerDrawerOpen = useLabStore((s) => s.setPlannerDrawerOpen);
  const flightProfile = useLabStore((s) => s.flightProfile);
  const activeLivery = useLabStore((s) => s.activeLivery);
  const atmosphereMode = useLabStore((s) => s.atmosphereMode);
  const wingmanSwarmActive = useLabStore((s) => s.wingmanSwarmActive);
  const completedCargoIds = useLabStore((s) => s.completedCargoIds);
  const audioEnabled = useLabStore((s) => s.audioEnabled);
  const toggleAudio = useLabStore((s) => s.toggleAudio);

  const liveries: { key: DroneLiveryKey; label: string; cls: string }[] = [
    { key: 'pearl', label: 'Pearl', cls: 'border-slate-300 bg-white hover:border-sky-500 text-slate-700' },
    { key: 'stealth', label: 'Stealth', cls: 'border-slate-700 bg-slate-900 hover:border-sky-400 text-white' },
    { key: 'rescue', label: 'Orange', cls: 'border-orange-300 bg-orange-500 hover:bg-orange-400 text-white' },
    { key: 'royal', label: 'Gold', cls: 'border-amber-400 bg-amber-400 hover:bg-amber-300 text-slate-900' },
  ];
  const profiles: FlightProfileKey[] = ['CINEMA', 'SPORT', 'ACRO'];
  const weatherModes: AtmosphereMode[] = [0, 1, 2, 3, 4];

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
              !hangarScanner,
              !hangarScanner ? 'HANGAR CALIBRATION LASER: ACTIVE' : 'HANGAR CALIBRATION LASER: STANDBY'
            )
          }
          className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${
            hangarScanner ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'
          }`}
        >
          {hangarScanner ? 'SCANNING ON' : 'SCANNER OFF'}
        </button>
      </div>

      <div>
        <div className="font-bold text-slate-700 mb-1 text-[11px]">
          1. Dynamic Weather & Turbulence Presets [V]
        </div>
        <div className="grid grid-cols-5 gap-1">
          {weatherModes.map((mIdx) => {
            const wp = WEATHER_PRESETS[mIdx];
            return (
              <button
                key={mIdx}
                onClick={() => engine?.cycleAtmosphere(mIdx)}
                className={`py-1.5 px-1 rounded-lg border font-bold text-[9px] text-center transition ${
                  atmosphereMode === mIdx
                    ? 'bg-slate-900 text-white border-sky-400'
                    : 'bg-white/85 text-slate-700 border-slate-200'
                }`}
              >
                {wp.code === 'DAYLIGHT'
                  ? 'Day'
                  : wp.code === 'SUNSET'
                  ? 'Sunset'
                  : wp.code === 'TWILIGHT'
                  ? 'Night'
                  : wp.code === 'STORM'
                  ? '⚡Storm'
                  : '🌫️Fog'}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="font-bold text-slate-700 mb-1 text-[11px]">
          2. Drone Fuselage Livery & Flight PID
        </div>
        <div className="grid grid-cols-4 gap-1.5 mb-1.5">
          {liveries.map((liv) => (
            <button
              key={liv.key}
              onClick={() => engine?.applyDroneLivery(liv.key)}
              className={`py-1 px-2 rounded-xl border font-bold text-[10px] transition ${liv.cls} ${
                activeLivery === liv.key ? 'ring-2 ring-sky-500' : ''
              }`}
            >
              {liv.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {profiles.map((prof) => (
            <button
              key={prof}
              onClick={() => engine?.setFlightProfile(prof)}
              className={`py-1 px-2 rounded-xl border font-bold text-[10px] transition ${
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
          3. Avionics, Cargo Board & Waypoint Planner
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setHangarModalOpen(true)}
            className="py-1.5 px-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 font-bold text-[11px] text-amber-900 flex items-center justify-between"
          >
            <span className="flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-amber-600" />
              Cargo Board
            </span>
            <span className="font-mono-tech text-[9px]">
              {completedCargoIds.length}/{PAYLOAD_MISSIONS.length}
            </span>
          </button>
          <button
            onClick={() => {
              setPlannerMode(true);
              setPlannerDrawerOpen(true);
            }}
            className="py-1.5 px-2.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 font-bold text-[11px] text-indigo-700 flex items-center justify-between"
          >
            <span className="flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5" />
              Flight Plan
            </span>
            <span className="font-mono-tech text-[9px]">RADAR</span>
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
              Wingman
            </span>
            <span className="font-mono-tech text-[9px]">{wingmanSwarmActive ? 'ON' : 'OFF'}</span>
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
            className="col-span-2 py-1.5 px-2.5 rounded-xl bg-slate-800 text-white font-bold text-[11px] flex items-center justify-between"
          >
            <span className="flex items-center gap-1">
              {audioEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
              )}
              Avionics Synth Audio
            </span>
            <span className="font-mono-tech text-[9px]">{audioEnabled ? 'ON' : 'MUTE'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const ZenGardenPanel: React.FC = () => {
  const lang = useLabStore((s) => s.lang);
  const lanternsActive = useLabStore((s) => s.islandState.lanternsActive);
  const setIslandInteraction = useLabStore((s) => s.setIslandInteraction);

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
              !lanternsActive,
              !lanternsActive ? 'FLOATING SKY LANTERNS RELEASED' : 'SKY LANTERNS RECALLED'
            )
          }
          className={`px-3 py-1.5 rounded-xl font-bold text-[10px] transition ${
            lanternsActive ? 'bg-pink-600 text-white shadow-sm' : 'bg-white text-slate-700'
          }`}
        >
          {lanternsActive ? 'LANTERNS LIT' : 'RELEASE'}
        </button>
      </div>

      <p className="text-xs text-slate-700 leading-relaxed">
        {lang === 'id' ? (
          <>
            Taman ketenangan di ketinggian <strong>+68m</strong> dengan paviliun pagoda modernis
            bertingkat dan pohon Sakura. Mencerminkan filosofi desain antarmuka yang tenang,
            humanis, dan presisi.
          </>
        ) : (
          <>
            High-altitude sanctuary at <strong>+68m</strong> featuring a tiered modernist pagoda
            and blooming Sakura trees—embodying calm, human-centric spatial UI/UX design.
          </>
        )}
      </p>
    </>
  );
};

export const SonicStagePanel: React.FC = () => {
  const lang = useLabStore((s) => s.lang);
  const sonicHarmony = useLabStore((s) => s.islandState.sonicHarmony);
  const setIslandInteraction = useLabStore((s) => s.setIslandInteraction);
  const selectedPublicationIdx = useLabStore((s) => s.selectedPublicationIdx);
  const selectPublication = useLabStore((s) => s.selectPublication);

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
            { val: 1, label: 'Fifths', toast: '3D AUDIO EQUALIZER & HARMONIC SYNTH ACTIVE' },
            { val: 2, label: 'Solar Arp', toast: '3D AUDIO EQUALIZER & HARMONIC SYNTH ACTIVE' },
            { val: 3, label: 'Cosmos', toast: '3D AUDIO EQUALIZER & HARMONIC SYNTH ACTIVE' },
          ].map((item) => (
            <button
              key={item.val}
              onClick={() => setIslandInteraction('sonicHarmony', item.val, item.toast)}
              className={`py-1 rounded-lg font-bold text-[10px] ${
                sonicHarmony === item.val ? 'bg-teal-600 text-white' : 'bg-white/80 text-slate-700'
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
            <div className="text-[10px] text-teal-600 font-mono-tech">{pub.venue}</div>
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
};

export const SummitSpirePanel: React.FC = () => {
  const lang = useLabStore((s) => s.lang);
  const uplinkBeam = useLabStore((s) => s.islandState.uplinkBeam);
  const setIslandInteraction = useLabStore((s) => s.setIslandInteraction);
  const commLogs = useLabStore((s) => s.commLogs);
  const addCommLog = useLabStore((s) => s.addCommLog);
  const [commName, setCommName] = useState('');
  const [commMsg, setCommMsg] = useState('');

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
              !uplinkBeam,
              !uplinkBeam ? 'STRATOSPHERIC DEEP-SPACE UPLINK BEAM FIRED!' : 'UPLINK BEAM STANDBY'
            )
          }
          className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${
            uplinkBeam ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-white'
          }`}
        >
          {uplinkBeam ? 'BEAM LOCKED' : 'FIRE UPLINK BEAM'}
        </button>
      </div>

      <form onSubmit={handleCommSubmit} className="space-y-2 mt-1">
        <input
          type="text"
          required
          value={commName}
          onChange={(e) => setCommName(e.target.value)}
          placeholder={lang === 'id' ? 'Nama / Instansi Anda' : 'Your Name / Organization'}
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
          <span>{lang === 'id' ? 'Kirim Transmisi Satelit' : 'Transmit Uplink Message'}</span>
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
