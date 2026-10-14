import { create } from 'zustand';
import {
  AtmosphereMode,
  CameraMode,
  CommTransmissionLog,
  DroneLiveryKey,
  FlightPhase,
  FlightProfileKey,
  IslandInteractiveState,
  Language,
  ProjectCategory,
} from '../types/lab';
import { STATIONS } from '../data/stations';
import { audioSynth } from '../services/audioSynth';

export interface EngineBridge {
  toggleLandingTakeoff: () => void;
  engageAutopilot: (stationId: number) => void;
  navigateNextStation: () => void;
  toggleGuidedTour: (forceState?: boolean | null) => void;
  cycleCameraMode: () => void;
  cycleAtmosphere: () => void;
  triggerLidarScan: () => void;
  toggleRingChallenge: () => void;
  applyDroneLivery: (livery: DroneLiveryKey) => void;
  setFlightProfile: (profile: FlightProfileKey) => void;
  toggleWingmanSwarm: () => void;
  triggerReturnToHome: (isLowBattery?: boolean) => void;
  captureAerialSnapshot: () => void;
  setTouchKey: (code: string, state: boolean) => void;
  setIslandBiodomeMaterial: (val: number) => void;
}

interface LabStoreState {
  // Core Lifecycle & UI
  lang: Language;
  bootProgress: number;
  bootCompleted: boolean;
  drawerCollapsed: boolean;
  toastMessage: string | null;
  audioEnabled: boolean;

  // Drone & World Low-Frequency State
  activeStationId: number;
  targetStationId: number;
  flightPhase: FlightPhase;
  autopilot: boolean;
  cameraMode: CameraMode;
  atmosphereMode: AtmosphereMode;
  flightProfile: FlightProfileKey;
  activeLivery: DroneLiveryKey;
  wingmanSwarmActive: boolean;
  guidedTourActive: boolean;
  ringCourseActive: boolean;
  ringGateLabel: string;
  visitedIslands: number[];

  // Interactive Portfolio Sub-States
  activeProjectFilter: ProjectCategory;
  selectedTechSkillIdx: number;
  selectedPublicationIdx: number;
  aiBatchLoad: number;
  commLogs: CommTransmissionLog[];
  islandState: IslandInteractiveState;

  // Modals
  activeProjectModalIdx: number | null;
  terminalModalOpen: boolean;
  hangarModalOpen: boolean;
  snapshotDataUrl: string | null;

  // Engine Imperative Bridge
  engine: EngineBridge | null;
  setEngine: (engine: EngineBridge | null) => void;

  // Actions
  setBootState: (progress: number, completed?: boolean) => void;
  toggleLang: () => void;
  toggleDrawer: () => void;
  showToast: (msg: string) => void;
  toggleAudio: () => void;
  syncFlightStatus: (partial: Partial<Pick<LabStoreState, 'activeStationId' | 'targetStationId' | 'flightPhase' | 'autopilot' | 'cameraMode' | 'atmosphereMode' | 'guidedTourActive' | 'ringCourseActive' | 'ringGateLabel' | 'wingmanSwarmActive' | 'flightProfile' | 'activeLivery'>>) => void;
  markIslandVisited: (stationId: number) => void;
  setProjectFilter: (cat: ProjectCategory) => void;
  selectTechSkill: (idx: number) => void;
  selectPublication: (idx: number) => void;
  setAiBatchLoad: (val: number) => void;
  addCommLog: (sender: string, msg: string) => void;
  setIslandInteraction: <K extends keyof IslandInteractiveState>(
    key: K,
    value: IslandInteractiveState[K],
    toastMsg?: string
  ) => void;
  openProjectModal: (idx: number) => void;
  closeProjectModal: () => void;
  setTerminalModalOpen: (open: boolean) => void;
  setHangarModalOpen: (open: boolean) => void;
  setSnapshotDataUrl: (url: string | null) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useLabStore = create<LabStoreState>((set, get) => ({
  lang: 'id',
  bootProgress: 0,
  bootCompleted: false,
  drawerCollapsed: false,
  toastMessage: null,
  audioEnabled: false,

  activeStationId: 0,
  targetStationId: 0,
  flightPhase: 'LANDED',
  autopilot: false,
  cameraMode: 0,
  atmosphereMode: 0,
  flightProfile: 'SPORT',
  activeLivery: 'pearl',
  wingmanSwarmActive: false,
  guidedTourActive: false,
  ringCourseActive: false,
  ringGateLabel: 'RING TRIAL',
  visitedIslands: [0],

  activeProjectFilter: 'ALL',
  selectedTechSkillIdx: 0,
  selectedPublicationIdx: 0,
  aiBatchLoad: 4,
  commLogs: [
    {
      sender: 'GROUND-CTRL',
      msg: 'Uplink telemetry channel initialized on 5.8GHz.',
      time: 'ONLINE',
    },
  ],
  islandState: {
    fountainMode: 1,
    starTarget: 0,
    biodomeSpectrum: 0,
    turbineOverdrive: false,
    waterfallMode: 0,
    rainbowActive: true,
    helixMode: 1,
    solarConverge: true,
    hangarScanner: true,
    lanternsActive: true,
    sonicHarmony: 1,
    uplinkBeam: false,
  },

  activeProjectModalIdx: null,
  terminalModalOpen: false,
  hangarModalOpen: false,
  snapshotDataUrl: null,

  engine: null,
  setEngine: (engine) => set({ engine }),

  setBootState: (bootProgress, bootCompleted) =>
    set((s) => ({
      bootProgress,
      bootCompleted: bootCompleted !== undefined ? bootCompleted : s.bootCompleted,
    })),

  toggleLang: () => {
    const nextLang = get().lang === 'id' ? 'en' : 'id';
    set({ lang: nextLang });
    get().showToast(nextLang === 'id' ? 'BAHASA INDONESIA AKTIF' : 'ENGLISH LANGUAGE ACTIVE');
  },

  toggleDrawer: () => set((s) => ({ drawerCollapsed: !s.drawerCollapsed })),

  showToast: (msg: string) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toastMessage: msg });
    toastTimer = setTimeout(() => {
      set({ toastMessage: null });
    }, 2600);
  },

  toggleAudio: () => {
    const enabled = audioSynth.toggleAudio();
    set({ audioEnabled: enabled });
    get().showToast(enabled ? 'AVIONICS AUDIO: ON' : 'AVIONICS AUDIO: MUTED');
  },

  syncFlightStatus: (partial) => set((state) => ({ ...state, ...partial })),

  markIslandVisited: (stationId) => {
    const current = get().visitedIslands;
    if (!current.includes(stationId)) {
      const updated = [...current, stationId];
      set({ visitedIslands: updated });
      if (updated.length === STATIONS.length) {
        get().showToast('ARCHIPELAGO MASTER: ALL 10 FLOATING ISLANDS EXPLORED!');
        audioSynth.playBeep(1046.5, 0.2);
      }
    }
  },

  setProjectFilter: (cat) => {
    set({ activeProjectFilter: cat });
    audioSynth.playBeep(760, 0.04);
  },

  selectTechSkill: (idx) => {
    set({ selectedTechSkillIdx: idx });
    audioSynth.playBeep(760 + idx * 80, 0.05);
  },

  selectPublication: (idx) => {
    set({ selectedPublicationIdx: idx });
    audioSynth.playBeep(820 + idx * 90, 0.05);
  },

  setAiBatchLoad: (val) => {
    set((s) => ({
      aiBatchLoad: val,
      islandState: {
        ...s.islandState,
        helixMode: val > 10 ? 2 : 1,
      },
    }));
  },

  addCommLog: (sender, msg) => {
    const nowStr = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    set((s) => ({
      commLogs: [...s.commLogs, { sender, msg, time: nowStr }],
      islandState: { ...s.islandState, uplinkBeam: true },
    }));
    const lang = get().lang;
    get().showToast(
      lang === 'id'
        ? `TRANSMISI & SINAR UPLINK DITEMBAKKAN (${sender})`
        : `UPLINK BEAM FIRED FROM ${sender}`
    );
    get().engine?.triggerLidarScan();
  },

  setIslandInteraction: (key, value, toastMsg) => {
    set((s) => ({
      islandState: {
        ...s.islandState,
        [key]: value,
      },
    }));
    if (key === 'biodomeSpectrum' && typeof value === 'number') {
      get().engine?.setIslandBiodomeMaterial(value);
    }
    if (key === 'sonicHarmony' && typeof value === 'number' && value > 0) {
      const chords: Record<number, number[]> = {
        1: [440, 659.25],
        2: [523.25, 659.25, 783.99],
        3: [392, 587.33, 880],
      };
      audioSynth.playChord(chords[value] || [440]);
      set({ audioEnabled: audioSynth.isEnabled() });
    } else {
      audioSynth.playBeep(740, 0.07);
    }
    if (toastMsg) {
      get().showToast(toastMsg);
    }
  },

  openProjectModal: (idx) => {
    set({ activeProjectModalIdx: idx });
    audioSynth.playBeep(880, 0.06);
  },

  closeProjectModal: () => set({ activeProjectModalIdx: null }),
  setTerminalModalOpen: (open) => {
    set({ terminalModalOpen: open });
    if (open) audioSynth.playBeep(890, 0.05);
  },
  setHangarModalOpen: (open) => {
    set({ hangarModalOpen: open });
    if (open) audioSynth.playBeep(840, 0.05);
  },
  setSnapshotDataUrl: (url) => set({ snapshotDataUrl: url }),
}));
