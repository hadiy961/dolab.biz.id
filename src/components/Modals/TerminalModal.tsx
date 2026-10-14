import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import { PAYLOAD_MISSIONS } from '../../data/cargoMissions';
import { WEATHER_PRESETS } from '../../data/flightAndWeather';
import { PROJECT_CASE_STUDIES } from '../../data/portfolioContent';
import { STATIONS } from '../../data/stations';
import { useLabStore } from '../../store/useLabStore';
import { AtmosphereMode, DroneLiveryKey } from '../../types/lab';

interface CliLine {
  text: string;
  cls: string;
}

export const TerminalModal: React.FC = () => {
  const open = useLabStore((s) => s.terminalModalOpen);
  const setOpen = useLabStore((s) => s.setTerminalModalOpen);
  const engine = useLabStore((s) => s.engine);
  const showToast = useLabStore((s) => s.showToast);

  const [cliInput, setCliInput] = useState('');
  const [cliHistory, setCliHistory] = useState<CliLine[]>([
    { text: 'AERO-OS CLI v4.6 READY. Type "help" for commands.', cls: 'text-emerald-400' },
    { text: 'Try: cargo 1 | weather storm | weather fog | patrol start | fly 5', cls: 'text-slate-500' },
  ]);

  if (!open) return null;

  const downloadEngineeringDossier = () => {
    const content = [
      '====================================================================',
      'HADIYATNA — PRINCIPAL SPATIAL WEBGL & FULL-STACK SYSTEMS ARCHITECT',
      '====================================================================',
      'Portfolio Lab : Sky Archipelago 3D Research Lab (Aero-Sonde V4)',
      'Core Stack    : Three.js / WebGL / GLSL, TypeScript, React, Next.js, Go, Python',
      '',
      'KEY R&D PROJECTS:',
      ...PROJECT_CASE_STUDIES.map(
        (p, i) => `${i + 1}. ${p.title} [${p.tag}]\n   ${p.descEn}\n   ${p.stack} | ${p.metrics}\n`
      ),
      '====================================================================',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Hadiyatna-Engineering-Dossier-CV.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('ENGINEERING DOSSIER (.TXT) DOWNLOADED');
  };

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = cliInput.trim();
    const cmd = raw.toLowerCase();
    setCliInput('');
    if (!cmd) return;

    const nextLines: CliLine[] = [
      ...cliHistory,
      { text: `$ ${raw}`, cls: 'text-sky-400 font-bold' },
    ];

    if (cmd === 'help') {
      nextLines.push({
        text: 'Commands: fly <0-9> | cargo <1-4|abort> | weather <day|sunset|twilight|storm|fog> | patrol <start|stop|loop> | rth | wingman | photo | livery <pearl|stealth|rescue|royal> | tour | scan | ring | clear',
        cls: 'text-slate-300',
      });
    } else if (cmd.startsWith('fly ')) {
      const idx = parseInt(cmd.split(' ')[1], 10);
      if (idx >= 0 && idx < STATIONS.length) {
        nextLines.push({ text: `Engaging autopilot to ${STATIONS[idx].shortName}...`, cls: 'text-emerald-400' });
        setOpen(false);
        engine?.engageAutopilot(idx);
      } else {
        nextLines.push({ text: 'Invalid station ID. Use: fly 0 .. fly 9', cls: 'text-rose-400' });
      }
    } else if (cmd === 'cargo' || cmd === 'cargo list') {
      PAYLOAD_MISSIONS.forEach((m, idx) => {
        nextLines.push({
          text: `[${idx + 1}] ${m.code}: ${m.title.en} (${m.weightKg}kg, SPD ${Math.round(m.speedMultiplier * 100)}%)`,
          cls: 'text-amber-300',
        });
      });
    } else if (cmd.startsWith('cargo ')) {
      const arg = cmd.split(' ')[1];
      if (arg === 'abort' || arg === 'stop') {
        engine?.abortCargoMission();
        nextLines.push({ text: 'Active cargo mission aborted.', cls: 'text-rose-400' });
      } else {
        const m = PAYLOAD_MISSIONS[parseInt(arg, 10) - 1];
        if (m) {
          nextLines.push({
            text: `Dispatching ${m.code} (${m.weightKg}kg) from ${STATIONS[m.originStationId].code} to ${STATIONS[m.destStationId].code}...`,
            cls: 'text-emerald-400',
          });
          setOpen(false);
          engine?.startCargoMission(m.id, true);
        } else {
          nextLines.push({ text: 'Use: cargo 1..4 | cargo list | cargo abort', cls: 'text-amber-400' });
        }
      }
    } else if (cmd.startsWith('weather')) {
      const arg = cmd.split(' ')[1];
      const map: Record<string, AtmosphereMode> = {
        '0': 0, day: 0, daylight: 0,
        '1': 1, sunset: 1,
        '2': 2, twilight: 2, night: 2,
        '3': 3, storm: 3, wind: 3,
        '4': 4, fog: 4,
      };
      if (arg && map[arg] !== undefined) {
        const mode = map[arg];
        engine?.cycleAtmosphere(mode);
        nextLines.push({
          text: `Weather set to ${WEATHER_PRESETS[mode].code} (Wind ${WEATHER_PRESETS[mode].baseWindKt}kt).`,
          cls: 'text-emerald-400',
        });
      } else {
        engine?.cycleAtmosphere();
        nextLines.push({
          text: 'Cycled atmosphere preset. Try: weather storm | weather fog | weather day',
          cls: 'text-emerald-400',
        });
      }
    } else if (cmd.startsWith('patrol')) {
      const arg = cmd.split(' ')[1] || 'start';
      if (arg === 'stop') {
        engine?.stopFlightPlanPatrol();
        nextLines.push({ text: 'Waypoint patrol stopped.', cls: 'text-amber-400' });
      } else if (arg === 'loop') {
        useLabStore.getState().toggleFlightPlanLoop();
        nextLines.push({
          text: `Patrol loop toggled: ${useLabStore.getState().flightPlanLoop ? 'ON' : 'OFF'}`,
          cls: 'text-emerald-400',
        });
      } else {
        setOpen(false);
        engine?.startFlightPlanPatrol();
      }
    } else if (cmd === 'rth') {
      setOpen(false);
      engine?.triggerReturnToHome();
    } else if (cmd === 'wingman') {
      engine?.toggleWingmanSwarm();
      nextLines.push({ text: 'Wingman swarm toggled.', cls: 'text-emerald-400' });
    } else if (cmd === 'photo') {
      setOpen(false);
      engine?.captureAerialSnapshot();
    } else if (cmd.startsWith('livery ')) {
      const liv = cmd.split(' ')[1] as DroneLiveryKey;
      if (['pearl', 'stealth', 'rescue', 'royal'].includes(liv)) {
        engine?.applyDroneLivery(liv);
        nextLines.push({ text: `Applied hull livery: ${liv.toUpperCase()}`, cls: 'text-emerald-400' });
      } else {
        nextLines.push({ text: 'Valid liveries: pearl | stealth | rescue | royal', cls: 'text-amber-400' });
      }
    } else if (cmd === 'tour') {
      setOpen(false);
      engine?.toggleGuidedTour(true);
    } else if (cmd === 'scan') {
      setOpen(false);
      engine?.triggerLidarScan();
    } else if (cmd === 'ring') {
      setOpen(false);
      engine?.toggleRingChallenge();
    } else if (cmd === 'clear') {
      setCliHistory([]);
      return;
    } else {
      nextLines.push({ text: `Unknown command "${raw}". Type "help" for list.`, cls: 'text-amber-400' });
    }

    setCliHistory(nextLines);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
      <div className="aero-glass-dark text-slate-100 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-sky-500/30 flex flex-col max-h-[82vh]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/80">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono-tech text-xs font-bold tracking-wider text-sky-400">
              HADIYATNA // ARCHITECT CV & AVIONICS SHELL v4.6
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 overflow-y-auto custom-scroll pr-1 flex-1">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs">
            <div className="font-mono-tech text-[11px] text-emerald-400 font-bold">
              // EXECUTIVE ENGINEERING PROFILE
            </div>
            <div>
              <div className="font-bold text-white text-sm">Hadiyatna — Creative Technologist</div>
              <div className="text-slate-400 text-[11px]">
                Spatial WebGL Architect • Full-Stack & Edge AI Systems
              </div>
            </div>
            <div className="space-y-1.5 pt-1 text-[11px] text-slate-300">
              <div>• <strong>2023–Present:</strong> Principal Spatial Web & Digital Twin Architect</div>
              <div>• <strong>2021–2023:</strong> Senior Full-Stack & Real-Time Telemetry Engineer</div>
              <div>• <strong>Core Specialties:</strong> Three.js/GLSL, React/Next.js, Go, Python, WebRTC, IoT Mesh</div>
            </div>
            <div className="pt-2 flex flex-wrap gap-1.5">
              <button
                onClick={() => {
                  setOpen(false);
                  engine?.startCargoMission('fusion-cell', true);
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-mono-tech text-[10px] border border-amber-500/30"
              >
                Run Cargo CRG-01 →
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  engine?.cycleAtmosphere(3);
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-mono-tech text-[10px] border border-rose-500/30"
              >
                Test Storm Mode →
              </button>
              <button
                onClick={downloadEngineeringDossier}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-mono-tech text-[10px] border border-emerald-500/30 flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                <span>Download CV (.TXT)</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex flex-col font-mono-tech text-[11px]">
            <div className="flex-1 overflow-y-auto custom-scroll space-y-1 text-slate-300 max-h-48 pr-1">
              {cliHistory.map((item, idx) => (
                <div key={idx} className={item.cls}>
                  {item.text}
                </div>
              ))}
            </div>
            <form
              onSubmit={handleCommand}
              className="mt-2 pt-2 border-t border-slate-800 flex items-center gap-2"
            >
              <span className="text-emerald-400 font-bold">$</span>
              <input
                type="text"
                autoFocus
                value={cliInput}
                onChange={(e) => setCliInput(e.target.value)}
                placeholder="Type command (e.g. cargo 1, weather storm, patrol start)..."
                className="bg-transparent text-white w-full focus:outline-none text-[11px]"
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
