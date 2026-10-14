import { create } from 'zustand';
import {
  AtmosphereMode,
  CameraMode,
  CargoMissionPhase,
  CommTransmissionLog,
  DroneLiveryKey,
  FlightPhase,
  FlightPlanWaypoint,
  FlightProfileKey,
  IslandInteractiveState,
  Language,
  ProjectCategory,
} from '../types/lab';
import { STATIONS } from '../data/stations';
import {
  FlightPlanPresetKey,
  PRESET_FLIGHT_PLANS,
} from '../data/flightAndWeather';
import { audioSynth } from '../services/audioSynth';

export interface EngineBridge {
  toggleLandingTakeoff: () => void;
  engageAutopilot: (stationId: number) => void;
  navigateNextStation: () => void;
  toggleGuidedTour: (forceState?: boolean | null) => void;
  cycleCameraMode: () => void;
  cycleAtmosphere: (targetMode?: AtmosphereMode) => void;
  triggerLidarScan: () => void;
  toggleRingChallenge: () => void;
  applyDroneLivery: (livery: DroneLiveryKey) => void;
  setFlightProfile: (profile: FlightProfileKey) => void;
  toggleWingmanSwarm: () => void;
  triggerReturnToHome: (isLowBattery?: boolean) => void;
  captureAerialSnapshot: () => void;
  setTouchKey: (code: string, state: boolean) => void;
  setIslandBiodomeMaterial: (val: number) => void;
  startCargoMission: (missionId: string, autoFlyToOrigin?: boolean) => void;
  abortCargoMission: () => void;
  startFlightPlanPatrol: () => void;
  stopFlightPlanPatrol: () => void;
  skipFlightPlanWaypoint: () => void;
  syncFlightPlanVisuals: () => void;
}

export interface LabStoreState {
  lang: Language;
  bootProgress: number;
  bootCompleted: boolean;
  drawerCollapsed: boolean;
  toastMessage: string | null;
  audioEnabled: boolean;

  activeStationId: number;
  targetStationId: number;
  flightPhase: FlightPhase;
  autopilot: boolean;
  cameraMode: CameraMode;
  atmosphereMode: AtmosphereMode;
  autoSpotlightActive: boolean;
  flightProfile: FlightProfileKey;
  activeLivery: DroneLiveryKey;
  wingmanSwarmActive: boolean;
  guidedTourActive: boolean;
  ringCourseActive: boolean;
  ringGateLabel: string;
  visitedIslands: number[];

  activeCargoMissionId: string | null;
  cargoPhase: CargoMissionPhase;
  completedCargoIds: string[];

  plannerMode: boolean;
  plannerDrawerOpen: boolean;
  flightPlanWaypoints: FlightPlanWaypoint[];
  flightPlanActive: boolean;
  flightPlanLoop: boolean;
  activeWaypointIdx: number;

  activeProjectFilter: ProjectCategory;
  selectedTechSkillIdx: number;
  selectedPublicationIdx: number;
  aiBatchLoad: number;
  commLogs: CommTransmissionLog[];
  islandState: IslandInteractiveState;

  activeProjectModalIdx: number | null;
  terminalModalOpen: boolean;
  hangarModalOpen: boolean;
  snapshotDataUrl: string | null;

  engine: EngineBridge | null;
  setEngine: (engine: EngineBridge | null) => void;

  setBootState: (progress: number, completed?: boolean) => void;
  toggleLang: () => void;
  toggleDrawer: () => void;
  showToast: (msg: string) => void;
  toggleAudio: () => void;
  syncFlightStatus: (
    partial: Partial<
      Pick<
        LabStoreState,
        | 'activeStationId'
        | 'targetStationId'
        | 'flightPhase'
        | 'autopilot'
        | 'cameraMode'
        | 'atmosphereMode'
        | 'autoSpotlightActive'
        | 'guidedTourActive'
        | 'ringCourseActive'
        | 'ringGateLabel'
        | 'wingmanSwarmActive'
        | 'flightProfile'
        | 'activeLivery'
        | 'activeCargoMissionId'
        | 'cargoPhase'
        | 'flightPlanActive'
        | 'activeWaypointIdx'
      >
    >
  ) => void;
  markIslandVisited: (stationId: number) => void;
  markCargoDelivered: (missionId: string) => void;

  setPlannerMode: (enabled?: boolean) => void;
  setPlannerDrawerOpen: (open?: boolean) => void;
  addFlightPlanWaypoint: (wp: Omit<FlightPlanWaypoint, 'id'>) => void;
  updateFlightPlanWaypoint: (
    id: string,
    partial: Partial<Pick<FlightPlanWaypoint, 'cruiseAlt' | 'speedPct'>>
  ) => void;
  removeFlightPlanWaypoint: (id: string) => void;
  clearFlightPlan: () => void;
  toggleFlightPlanLoop: () => void;
  loadPresetFlightPlan: (preset: FlightPlanPresetKey) => void;

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
let wpCounter = 1;

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
  autoSpotlightActive: false,
  flightProfile: 'SPORT',
  activeLivery: 'pearl',
  wingmanSwarmActive: false,
  guidedTourActive: false,
  ringCourseActive: false,
  ringGateLabel: 'RING TRIAL',
  visitedIslands: [0],

  activeCargoMissionId: null,
  cargoPhase: 'IDLE',
  completedCargoIds: [],

  plannerMode: false,
  plannerDrawerOpen: false,
  flightPlanWaypoints: [
    {
      id: 'wp-init-1',
      stationId: 5,
      label: 'ISL-05',
      x: STATIONS[5].hoverPoint.x,
      z: STATIONS[5].hoverPoint.z,
      cruiseAlt: 64,
      speedPct: 100,
    },
    {
      id: 'wp-init-2',
      stationId: 2,
      label: 'ISL-02',
      x: STATIONS[2].hoverPoint.x,
      z: STATIONS[2].hoverPoint.z,
      cruiseAlt: 54,
      speedPct: 115,
    },
    {
      id: 'wp-init-3',
      stationId: 4,
      label: 'ISL-04',
      x: STATIONS[4].hoverPoint.x,
      z: STATIONS[4].hoverPoint.z,
      cruiseAlt: 32,
      speedPct: 90,
    },
  ],
  flightPlanActive: false,
  flightPlanLoop: true,
  activeWaypointIdx: 0,

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
      bootCompleted:
        bootCompleted !== undefined ? bootCompleted : s.bootCompleted,
    })),

  toggleLang: () => {
    const nextLang = get().lang === 'id' ? 'en' : 'id';
    set({ lang: nextLang });
    get().showToast(
      nextLang === 'id' ? 'BAHASA INDONESIA AKTIF' : 'ENGLISH LANGUAGE ACTIVE'
    );
  },

  toggleDrawer: () => set((s) => ({ drawerCollapsed: !s.drawerCollapsed })),

  showToast: (msg: string) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toastMessage: msg });
    toastTimer = setTimeout(() => set({ toastMessage: null }), 2800);
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

  markCargoDelivered: (missionId) => {
    const current = get().completedCargoIds;
    const updated = current.includes(missionId)
      ? current
      : [...current, missionId];
    set({
      completedCargoIds: updated,
      activeCargoMissionId: null,
      cargoPhase: 'IDLE',
    });
    audioSynth.playChord([523.25, 659.25, 783.99, 1046.5]);
  },

  setPlannerMode: (enabled) => {
    const next = enabled !== undefined ? enabled : !get().plannerMode;
    set({
      plannerMode: next,
      plannerDrawerOpen: next ? true : get().plannerDrawerOpen,
    });
    audioSynth.playBeep(next ? 860 : 680, 0.05);
    get().showToast(
      next
        ? get().lang === 'id'
          ? 'MODE FLIGHT PLANNER AKTIF: KLIK RADAR UNTUK TAMBAH WAYPOINT'
          : 'FLIGHT PLANNER MODE: CLICK RADAR TO ADD WAYPOINTS'
        : get().lang === 'id'
        ? 'MODE RADAR LANGSUNG: KLIK PULAU UNTUK AUTOPILOT'
        : 'DIRECT RADAR MODE: CLICK ISLAND TO FLY'
    );
  },

  setPlannerDrawerOpen: (open) =>
    set({ plannerDrawerOpen: open !== undefined ? open : !get().plannerDrawerOpen }),

  addFlightPlanWaypoint: (wp) => {
    const list = get().flightPlanWaypoints;
    if (list.length >= 12) {
      get().showToast('MAX 12 WAYPOINTS IN FLIGHT PLAN');
      return;
    }
    const updated = [...list, { ...wp, id: `wp-${Date.now()}-${wpCounter++}` }];
    set({ flightPlanWaypoints: updated });
    audioSynth.playBeep(780 + updated.length * 35, 0.05);
    get().engine?.syncFlightPlanVisuals();
  },

  updateFlightPlanWaypoint: (id, partial) => {
    const updated = get().flightPlanWaypoints.map((w) =>
      w.id === id ? { ...w, ...partial } : w
    );
    set({ flightPlanWaypoints: updated });
    get().engine?.syncFlightPlanVisuals();
  },

  removeFlightPlanWaypoint: (id) => {
    const updated = get().flightPlanWaypoints.filter((w) => w.id !== id);
    const nextIdx = Math.min(
      get().activeWaypointIdx,
      Math.max(0, updated.length - 1)
    );
    set({ flightPlanWaypoints: updated, activeWaypointIdx: nextIdx });
    audioSynth.playBeep(620, 0.04);
    get().engine?.syncFlightPlanVisuals();
    if (updated.length === 0 && get().flightPlanActive) {
      get().engine?.stopFlightPlanPatrol();
    }
  },

  clearFlightPlan: () => {
    if (get().flightPlanActive) get().engine?.stopFlightPlanPatrol();
    set({ flightPlanWaypoints: [], activeWaypointIdx: 0 });
    audioSynth.playBeep(540, 0.06);
    get().engine?.syncFlightPlanVisuals();
  },

  toggleFlightPlanLoop: () => {
    const next = !get().flightPlanLoop;
    set({ flightPlanLoop: next });
    audioSynth.playBeep(750, 0.04);
    get().engine?.syncFlightPlanVisuals();
    get().showToast(
      next
        ? 'PATROL LOOP: CONTINUOUS REPEAT'
        : 'PATROL LOOP: SINGLE PASS (DOCK AT END)'
    );
  },

  loadPresetFlightPlan: (preset) => {
    const seq = PRESET_FLIGHT_PLANS[preset] || PRESET_FLIGHT_PLANS['energy-loop'];
    const waypoints: FlightPlanWaypoint[] = seq.map((item, idx) => {
      const st = STATIONS[item.id];
      return {
        id: `wp-preset-${Date.now()}-${idx}`,
        stationId: st.id,
        label: st.code,
        x: st.hoverPoint.x,
        z: st.hoverPoint.z,
        cruiseAlt: Math.round(st.hoverPoint.y + item.altOffset),
        speedPct: item.speedPct,
      };
    });
    set({ flightPlanWaypoints: waypoints, activeWaypointIdx: 0 });
    audioSynth.playBeep(880, 0.07);
    get().engine?.syncFlightPlanVisuals();
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

  setAiBatchLoad: (val) =>
    set((s) => ({
      aiBatchLoad: val,
      islandState: { ...s.islandState, helixMode: val > 10 ? 2 : 1 },
    })),

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
    get().showToast(
      get().lang === 'id'
        ? `TRANSMISI & SINAR UPLINK DITEMBAKKAN (${sender})`
        : `UPLINK BEAM FIRED FROM ${sender}`
    );
    get().engine?.triggerLidarScan();
  },

  setIslandInteraction: (key, value, toastMsg) => {
    set((s) => ({ islandState: { ...s.islandState, [key]: value } }));
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
    if (toastMsg) get().showToast(toastMsg);
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
