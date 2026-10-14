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
import { AUDIO_CHORDS, AUDIO_DURATIONS, AUDIO_NOTES } from '../constants/audio';
import {
  AI_HELIX_OVERCLOCK_THRESHOLD,
  BIODOME_COLORS,
  BIODOME_EMISSIVES,
  BIODOME_EMISSIVE_INTENSITY_BRIGHT,
  BIODOME_EMISSIVE_INTENSITY_DIM,
  MAX_FLIGHT_PLAN_WAYPOINTS,
  TOAST_DURATION_MS,
  WAYPOINT_AUDIO_BASE_FREQ,
  WAYPOINT_AUDIO_STEP,
} from '../constants/gameplay';

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

// --- Synced flight fields (updated by engine every frame) ---
export type FlightStatusFields = Pick<
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
>;

export interface LabStoreState {
  // --- Session ---
  lang: Language;
  bootProgress: number;
  bootCompleted: boolean;
  audioEnabled: boolean;

  // --- UI ---
  drawerCollapsed: boolean;
  toastMessage: string | null;

  // --- Flight ---
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

  // --- Cargo ---
  activeCargoMissionId: string | null;
  cargoPhase: CargoMissionPhase;
  completedCargoIds: string[];

  // --- Flight Planner ---
  plannerMode: boolean;
  plannerDrawerOpen: boolean;
  flightPlanWaypoints: FlightPlanWaypoint[];
  flightPlanActive: boolean;
  flightPlanLoop: boolean;
  activeWaypointIdx: number;

  // --- Portfolio / Island content ---
  activeProjectFilter: ProjectCategory;
  selectedTechSkillIdx: number;
  selectedPublicationIdx: number;
  aiBatchLoad: number;
  commLogs: CommTransmissionLog[];
  islandState: IslandInteractiveState;

  // --- Modals ---
  activeProjectModalIdx: number | null;
  terminalModalOpen: boolean;
  hangarModalOpen: boolean;
  snapshotDataUrl: string | null;

  // --- Engine bridge ---
  engine: EngineBridge | null;
  setEngine: (engine: EngineBridge | null) => void;

  // --- Session actions ---
  setBootState: (progress: number, completed?: boolean) => void;
  toggleLang: () => void;
  toggleDrawer: () => void;
  showToast: (msg: string) => void;
  toggleAudio: () => void;

  // --- Flight sync (called by engine) ---
  syncFlightStatus: (partial: Partial<FlightStatusFields>) => void;
  markIslandVisited: (stationId: number) => void;
  markCargoDelivered: (missionId: string) => void;

  // --- Flight Planner actions ---
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

  // --- Portfolio / content actions ---
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

  // --- Modal actions ---
  openProjectModal: (idx: number) => void;
  closeProjectModal: () => void;
  setTerminalModalOpen: (open: boolean) => void;
  setHangarModalOpen: (open: boolean) => void;
  setSnapshotDataUrl: (url: string | null) => void;
}

// Module-level singletons (not in React state — side-effect-only)
let toastTimer: ReturnType<typeof setTimeout> | null = null;
let wpCounter = 1;

export const useLabStore = create<LabStoreState>((set, get) => ({
  // ── Session ──────────────────────────────────────────────────────────────
  lang: 'id',
  bootProgress: 0,
  bootCompleted: false,
  audioEnabled: false,

  // ── UI ───────────────────────────────────────────────────────────────────
  drawerCollapsed: false,
  toastMessage: null,

  // ── Flight ───────────────────────────────────────────────────────────────
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

  // ── Cargo ────────────────────────────────────────────────────────────────
  activeCargoMissionId: null,
  cargoPhase: 'IDLE',
  completedCargoIds: [],

  // ── Flight Planner ────────────────────────────────────────────────────────
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

  // ── Portfolio / Island content ────────────────────────────────────────────
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

  // ── Modals ────────────────────────────────────────────────────────────────
  activeProjectModalIdx: null,
  terminalModalOpen: false,
  hangarModalOpen: false,
  snapshotDataUrl: null,

  // ── Engine bridge ─────────────────────────────────────────────────────────
  engine: null,
  setEngine: (engine) => set({ engine }),

  // ── Session actions ───────────────────────────────────────────────────────

  setBootState: (bootProgress, bootCompleted) =>
    set((s) => ({
      bootProgress,
      bootCompleted: bootCompleted !== undefined ? bootCompleted : s.bootCompleted,
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
    toastTimer = setTimeout(() => set({ toastMessage: null }), TOAST_DURATION_MS);
  },

  toggleAudio: () => {
    const enabled = audioSynth.toggleAudio();
    set({ audioEnabled: enabled });
    get().showToast(enabled ? 'AVIONICS AUDIO: ON' : 'AVIONICS AUDIO: MUTED');
  },

  // ── Flight sync ───────────────────────────────────────────────────────────

  /**
   * Called by the engine every animation frame to push flight telemetry into the
   * store. Only the provided fields are updated — no full-state spread needed.
   */
  syncFlightStatus: (partial) => set(partial),

  markIslandVisited: (stationId) => {
    const current = get().visitedIslands;
    if (!current.includes(stationId)) {
      const updated = [...current, stationId];
      set({ visitedIslands: updated });
      if (updated.length === STATIONS.length) {
        get().showToast('ARCHIPELAGO MASTER: ALL 10 FLOATING ISLANDS EXPLORED!');
        audioSynth.playBeep(AUDIO_NOTES.C6, AUDIO_DURATIONS.TINY * 5);
      }
    }
  },

  markCargoDelivered: (missionId) => {
    const current = get().completedCargoIds;
    const updated = current.includes(missionId) ? current : [...current, missionId];
    set({ completedCargoIds: updated, activeCargoMissionId: null, cargoPhase: 'IDLE' });
    audioSynth.playChord(AUDIO_CHORDS.CARGO_DELIVERED);
  },

  // ── Flight Planner actions ────────────────────────────────────────────────

  setPlannerMode: (enabled) => {
    const next = enabled !== undefined ? enabled : !get().plannerMode;
    set({
      plannerMode: next,
      plannerDrawerOpen: next ? true : get().plannerDrawerOpen,
    });
    audioSynth.playBeep(next ? AUDIO_NOTES.PLANNER_ON : AUDIO_NOTES.PLANNER_OFF, AUDIO_DURATIONS.TINY);
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
    if (list.length >= MAX_FLIGHT_PLAN_WAYPOINTS) {
      get().showToast(`MAX ${MAX_FLIGHT_PLAN_WAYPOINTS} WAYPOINTS IN FLIGHT PLAN`);
      return;
    }
    const updated = [...list, { ...wp, id: `wp-${Date.now()}-${wpCounter++}` }];
    set({ flightPlanWaypoints: updated });
    audioSynth.playBeep(WAYPOINT_AUDIO_BASE_FREQ + updated.length * WAYPOINT_AUDIO_STEP, AUDIO_DURATIONS.TINY);
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
    const nextIdx = Math.min(get().activeWaypointIdx, Math.max(0, updated.length - 1));
    set({ flightPlanWaypoints: updated, activeWaypointIdx: nextIdx });
    audioSynth.playBeep(AUDIO_NOTES.WAYPOINT_REMOVE, AUDIO_DURATIONS.TINY);
    get().engine?.syncFlightPlanVisuals();
    if (updated.length === 0 && get().flightPlanActive) {
      get().engine?.stopFlightPlanPatrol();
    }
  },

  clearFlightPlan: () => {
    if (get().flightPlanActive) get().engine?.stopFlightPlanPatrol();
    set({ flightPlanWaypoints: [], activeWaypointIdx: 0 });
    audioSynth.playBeep(AUDIO_NOTES.WAYPOINT_CLEAR, AUDIO_DURATIONS.SHORT);
    get().engine?.syncFlightPlanVisuals();
  },

  toggleFlightPlanLoop: () => {
    const next = !get().flightPlanLoop;
    set({ flightPlanLoop: next });
    audioSynth.playBeep(AUDIO_NOTES.WAYPOINT_LOOP, AUDIO_DURATIONS.TINY);
    get().engine?.syncFlightPlanVisuals();
    get().showToast(
      next ? 'PATROL LOOP: CONTINUOUS REPEAT' : 'PATROL LOOP: SINGLE PASS (DOCK AT END)'
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
    audioSynth.playBeep(AUDIO_NOTES.WAYPOINT_PRESET, AUDIO_DURATIONS.SHORT);
    get().engine?.syncFlightPlanVisuals();
  },

  // ── Portfolio / content actions ───────────────────────────────────────────

  setProjectFilter: (cat) => {
    set({ activeProjectFilter: cat });
    audioSynth.playBeep(AUDIO_NOTES.PROJECT_FILTER, AUDIO_DURATIONS.TINY);
  },

  selectTechSkill: (idx) => {
    set({ selectedTechSkillIdx: idx });
    audioSynth.playBeep(AUDIO_NOTES.NEXT_STATION + idx * 80, AUDIO_DURATIONS.TINY);
  },

  selectPublication: (idx) => {
    set({ selectedPublicationIdx: idx });
    audioSynth.playBeep(820 + idx * 90, AUDIO_DURATIONS.TINY);
  },

  setAiBatchLoad: (val) =>
    set((s) => ({
      aiBatchLoad: val,
      islandState: {
        ...s.islandState,
        helixMode: val > AI_HELIX_OVERCLOCK_THRESHOLD ? 2 : 1,
      },
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
        1: AUDIO_CHORDS.SONIC_ETHEREAL,
        2: AUDIO_CHORDS.SONIC_SOLAR,
        3: AUDIO_CHORDS.SONIC_COSMOS,
      };
      audioSynth.playChord(chords[value] || [AUDIO_NOTES.A4]);
      set({ audioEnabled: audioSynth.isEnabled() });
    } else {
      audioSynth.playBeep(AUDIO_NOTES.ISLAND_INTERACTION, AUDIO_DURATIONS.SHORT);
    }

    if (toastMsg) get().showToast(toastMsg);
  },

  // ── Modal actions ─────────────────────────────────────────────────────────

  openProjectModal: (idx) => {
    set({ activeProjectModalIdx: idx });
    audioSynth.playBeep(AUDIO_NOTES.PROJECT_MODAL, AUDIO_DURATIONS.NORMAL);
  },

  closeProjectModal: () => set({ activeProjectModalIdx: null }),

  setTerminalModalOpen: (open) => {
    set({ terminalModalOpen: open });
    if (open) audioSynth.playBeep(AUDIO_NOTES.MODAL_TERMINAL, AUDIO_DURATIONS.TINY);
  },

  setHangarModalOpen: (open) => {
    set({ hangarModalOpen: open });
    if (open) audioSynth.playBeep(AUDIO_NOTES.MODAL_HANGAR, AUDIO_DURATIONS.TINY);
  },

  setSnapshotDataUrl: (url) => set({ snapshotDataUrl: url }),
}));

// ── Grouped selectors (for use with useShallow) ───────────────────────────────

/** Selects UI-only fields — avoids re-renders from flight state churn */
export const selectUIState = (s: LabStoreState) => ({
  lang: s.lang,
  drawerCollapsed: s.drawerCollapsed,
  toastMessage: s.toastMessage,
  audioEnabled: s.audioEnabled,
  bootCompleted: s.bootCompleted,
});

/** Selects flight telemetry fields */
export const selectFlightState = (s: LabStoreState) => ({
  flightPhase: s.flightPhase,
  autopilot: s.autopilot,
  cameraMode: s.cameraMode,
  atmosphereMode: s.atmosphereMode,
  autoSpotlightActive: s.autoSpotlightActive,
  guidedTourActive: s.guidedTourActive,
  flightPlanActive: s.flightPlanActive,
  wingmanSwarmActive: s.wingmanSwarmActive,
  activeStationId: s.activeStationId,
  flightProfile: s.flightProfile,
  activeLivery: s.activeLivery,
  ringCourseActive: s.ringCourseActive,
  ringGateLabel: s.ringGateLabel,
});

/** Selects cargo mission fields */
export const selectCargoState = (s: LabStoreState) => ({
  activeCargoMissionId: s.activeCargoMissionId,
  cargoPhase: s.cargoPhase,
  completedCargoIds: s.completedCargoIds,
});

/** Selects flight planner fields */
export const selectPlannerState = (s: LabStoreState) => ({
  plannerMode: s.plannerMode,
  plannerDrawerOpen: s.plannerDrawerOpen,
  flightPlanWaypoints: s.flightPlanWaypoints,
  flightPlanActive: s.flightPlanActive,
  flightPlanLoop: s.flightPlanLoop,
  activeWaypointIdx: s.activeWaypointIdx,
});
