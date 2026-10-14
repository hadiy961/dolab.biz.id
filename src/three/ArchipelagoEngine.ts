import * as THREE from 'three';
import { STATIONS } from '../data/stations';
import { WEATHER_PRESETS } from '../data/flightAndWeather';
import { PAYLOAD_MISSIONS } from '../data/cargoMissions';
import { UI_TRANSLATIONS } from '../data/translations';
import { audioSynth } from '../services/audioSynth';
import { EngineBridge, useLabStore } from '../store/useLabStore';
import {
  AtmosphereMode,
  CameraMode,
  DroneLiveryKey,
  FlightPhase,
  FlightProfileKey,
  PayloadMission,
} from '../types/lab';
import {
  AUDIO_CHORDS,
  AUDIO_DURATIONS,
  AUDIO_NOTES,
} from '../constants/audio';
import {
  BIODOME_COLORS,
  BIODOME_EMISSIVES,
  BIODOME_EMISSIVE_INTENSITY_BRIGHT,
  BIODOME_EMISSIVE_INTENSITY_DIM,
  LIVERY_COLORS,
} from '../constants/gameplay';
import {
  CAMERA_FAR,
  CAMERA_FOV,
  CAMERA_NEAR,
  CAMERA_ZOOM_MAX,
  CAMERA_ZOOM_MIN,
  CONTRAIL_OPACITY_MAX,
  CONTRAIL_SPEED_SCALE,
  CONTRAIL_SPEED_THRESHOLD,
  DOWNWASH_AGL_MAX,
  DOWNWASH_THROTTLE_MIN,
  FOG_DENSITY,
  HEMI_GROUND_COLOR,
  HEMI_INTENSITY,
  HEMI_SKY_COLOR,
  ISLAND_PROXIMITY_THRESHOLD,
  LANDING_LASER_AGL_RANGE,
  LIDAR_EXPAND_SPEED,
  LIDAR_MAX_RADIUS,
  RING_GATE_PASS_RADIUS,
  SHADOW_CAMERA_DEPTH,
  SHADOW_MAP_SIZE,
  SKY_DOME_RADIUS,
  SNAPSHOT_BAR_HEIGHT_RATIO,
  SNAPSHOT_BAR_OPACITY,
  SUN_COLOR,
  SUN_INTENSITY,
  TOUR_ORBIT_RATE,
  TOUR_STATION_DWELL_S,
} from '../constants/rendering';
import { createSkyGradientTexture } from './textures';
import { ArchipelagoBuildResult, buildSkyArchipelago } from './islandBuilders';
import { buildAeroSondeDrone, DroneBuildResult } from './droneBuilder';
import {
  BirdFlockItem,
  buildCargoGroundMarkers,
  buildCloudSeaAndWildlife,
  buildLidarRing,
  buildSkyRingChallengeGates,
  buildStormRainSystem,
  CargoMarkersResult,
  rebuildFlightPlan3DVisuals,
  RingGateHandle,
  StormRainResult,
} from './systems/environmentProps';
import {
  applyAtmospherePreset,
  updateStormRainAndLightning,
  WindTelemetryState,
} from './systems/weatherSystem';
import { updateIslandAndWildlifeFX } from './systems/islandAnimations';
import {
  drawRadarMinimapCanvas,
  initSpatialWaypointElements,
  SpatialWaypointMarker,
  updateSpatialWaypointProjections,
} from './systems/radarRenderer';
import {
  CameraOrbitState,
  DronePhysicsState,
  stepCameraSystem,
  stepDronePhysics,
} from './systems/flightPhysicsSystem';
import { InputController } from './systems/InputController';
import { BootSequenceManager } from './systems/BootSequenceManager';

export interface TelemetryDomRefs {
  altitudeEl: HTMLElement | null;
  speedEl: HTMLElement | null;
  batteryEl: HTMLElement | null;
  windEl?: HTMLElement | null;
  headingEl: HTMLElement | null;
  stationDistanceEl: HTMLElement | null;
  radarCanvas: HTMLCanvasElement | null;
  spatialMarkersContainer: HTMLElement | null;
}

export class ArchipelagoEngine implements EngineBridge {
  private container: HTMLElement;
  private domRefs: TelemetryDomRefs;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private clock!: THREE.Clock;
  private animFrameId: number | null = null;

  private skyDomeMesh!: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  private sunDirLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private celestialOrbGroup!: THREE.Group;

  private archipelago!: ArchipelagoBuildResult;
  private drone!: DroneBuildResult;
  private cloudGroups: { group: THREE.Group; speed: number }[] = [];
  private birdFlock: BirdFlockItem[] = [];

  private lidarRingMesh!: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  private lidarScanActive = false;
  private lidarScanRadius = 0;

  private ringGateMeshes: RingGateHandle[] = [];
  private ringCourseActive = false;
  private activeRingIndex = 0;
  private ringCourseStartTime = 0;

  private cargoMarkers!: CargoMarkersResult;
  private stormRain!: StormRainResult;
  private lightningState = { intensity: 0, nextTimer: 4.5 };

  private flightPlanVisualGroup!: THREE.Group;
  private spatialMarkerElements: SpatialWaypointMarker[] = [];

  private guidedTourActive = false;
  private guidedTourTimer = 0;
  private wingmanSwarmActive = false;
  private currentFlightProfile: FlightProfileKey = 'SPORT';

  // Sub-systems (extracted from God Class)
  private input!: InputController;
  private bootManager!: BootSequenceManager;

  private droneState: DronePhysicsState = {
    pos: new THREE.Vector3(STATIONS[0].padPoint.x, STATIONS[0].padPoint.y, STATIONS[0].padPoint.z),
    vel: new THREE.Vector3(0, 0, 0),
    yaw: 0,
    yawRate: 0,
    pitch: 0,
    roll: 0,
    rotorThrottle: 0.0,
    flightPhase: 'LANDED' as FlightPhase,
    autopilot: false,
    targetStationId: 0,
    activeStationId: 0,
    pendingAutopilotStationId: null,
    pendingFlightPlanStart: false,
    takeoffTargetY: STATIONS[0].hoverPoint.y,
    cameraMode: 0 as CameraMode,
    atmosphereMode: 0 as AtmosphereMode,
    battery: 99.4,
  };

  private camOrbit: CameraOrbitState = {
    theta: 0.35,
    phi: 0.32,
    distance: 9.2,
    isDragging: false,
    lastX: 0,
    lastY: 0,
  };

  private windState: WindTelemetryState = {
    angle: 0.6,
    speedKt: 3.2,
    gustFactor: 0,
    turbulenceG: 0.02,
  };

  constructor(container: HTMLElement, domRefs: TelemetryDomRefs) {
    this.container = container;
    this.domRefs = domRefs;
    this.initWebGL();
    this.initInputController();
    this.bootManager = new BootSequenceManager(() => this.initiateAutoTakeoffSequence());
    this.bootManager.start();
    this.animate();
  }

  // ── WebGL Initialisation ──────────────────────────────────────────────────

  private initWebGL(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xc8e0f4);
    this.scene.fog = new THREE.FogExp2(0xd8eaf7, FOG_DENSITY);

    this.camera = new THREE.PerspectiveCamera(
      CAMERA_FOV,
      window.innerWidth / window.innerHeight,
      CAMERA_NEAR,
      CAMERA_FAR
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();

    this.skyDomeMesh = new THREE.Mesh(
      new THREE.SphereGeometry(SKY_DOME_RADIUS, 32, 24),
      new THREE.MeshBasicMaterial({
        map: createSkyGradientTexture('#60a5fa', '#bae6fd', '#f8fafc'),
        side: THREE.BackSide,
        depthWrite: false,
      })
    );
    this.scene.add(this.skyDomeMesh);

    this.celestialOrbGroup = new THREE.Group();
    const sunCore = new THREE.Mesh(
      new THREE.SphereGeometry(18, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xfffbeb, fog: false })
    );
    const sunHalo = new THREE.Mesh(
      new THREE.SphereGeometry(32, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.28, fog: false })
    );
    this.celestialOrbGroup.add(sunCore, sunHalo);
    this.celestialOrbGroup.position.set(220, 240, -290);
    this.scene.add(this.celestialOrbGroup);

    this.hemiLight = new THREE.HemisphereLight(HEMI_SKY_COLOR, HEMI_GROUND_COLOR, HEMI_INTENSITY);
    this.scene.add(this.hemiLight);

    this.sunDirLight = new THREE.DirectionalLight(SUN_COLOR, SUN_INTENSITY);
    this.sunDirLight.position.set(140, 210, 120);
    this.sunDirLight.castShadow = true;
    this.sunDirLight.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE);
    this.sunDirLight.shadow.camera.near = 10;
    this.sunDirLight.shadow.camera.far = 650;
    this.sunDirLight.shadow.camera.left = -SHADOW_CAMERA_DEPTH;
    this.sunDirLight.shadow.camera.right = SHADOW_CAMERA_DEPTH;
    this.sunDirLight.shadow.camera.top = SHADOW_CAMERA_DEPTH;
    this.sunDirLight.shadow.camera.bottom = -SHADOW_CAMERA_DEPTH;
    this.scene.add(this.sunDirLight);

    this.archipelago = buildSkyArchipelago(this.scene);
    this.droneState.pos.set(STATIONS[0].padPoint.x, STATIONS[0].padPoint.y, STATIONS[0].padPoint.z);
    this.droneState.takeoffTargetY = STATIONS[0].hoverPoint.y;

    const wildlife = buildCloudSeaAndWildlife(this.scene);
    this.cloudGroups = wildlife.cloudGroups;
    this.birdFlock = wildlife.birdFlock;

    this.drone = buildAeroSondeDrone(this.scene, this.droneState.pos);
    this.lidarRingMesh = buildLidarRing(this.scene);
    this.ringGateMeshes = buildSkyRingChallengeGates(this.scene);
    this.cargoMarkers = buildCargoGroundMarkers(this.scene);
    this.stormRain = buildStormRainSystem(this.scene);

    this.flightPlanVisualGroup = new THREE.Group();
    this.scene.add(this.flightPlanVisualGroup);
    this.syncFlightPlanVisuals();

    this.spatialMarkerElements = initSpatialWaypointElements(
      this.domRefs.spatialMarkersContainer,
      (stId) => this.engageAutopilot(stId)
    );
  }

  private initInputController(): void {
    this.input = new InputController(
      this.container,
      this.camera,
      this.camOrbit,
      {
        toggleLandingTakeoff: () => this.toggleLandingTakeoff(),
        triggerReturnToHome: () => this.triggerReturnToHome(),
        captureAerialSnapshot: () => this.captureAerialSnapshot(),
        toggleGuidedTour: () => this.toggleGuidedTour(),
        triggerLidarScan: () => this.triggerLidarScan(),
        cycleCameraMode: () => this.cycleCameraMode(),
        cycleAtmosphere: () => this.cycleAtmosphere(),
        toggleRingChallenge: () => this.toggleRingChallenge(),
        engageAutopilot: (stId) => this.engageAutopilot(stId),
        getIslandGroups: () => this.archipelago.stationObjects.map((s) => s.group),
      }
    );

    // Also wire resize to renderer (InputController handles camera aspect)
    window.addEventListener('resize', () =>
      this.renderer.setSize(window.innerWidth, window.innerHeight)
    );
  }

  // ── Public API (EngineBridge) ─────────────────────────────────────────────

  public syncFlightPlanVisuals(): void {
    if (!this.flightPlanVisualGroup) return;
    const store = useLabStore.getState();
    rebuildFlightPlan3DVisuals(
      this.flightPlanVisualGroup,
      store.flightPlanWaypoints,
      store.flightPlanLoop,
      store.flightPlanActive,
      store.activeWaypointIdx
    );
  }

  private getActiveCargoMission(): PayloadMission | null {
    const id = useLabStore.getState().activeCargoMissionId;
    return id ? PAYLOAD_MISSIONS.find((m) => m.id === id) || null : null;
  }

  public startCargoMission(missionId: string, autoFlyToOrigin = true): void {
    const store = useLabStore.getState();
    const mission = PAYLOAD_MISSIONS.find((m) => m.id === missionId);
    if (!mission) return;

    this.drone.cargoPodAccentMat.color.setHex(mission.colorHex);
    this.drone.cargoPodAccentMat.emissive.setHex(mission.colorHex);
    this.cargoMarkers.cargoPickupCrateMat.color.setHex(mission.colorHex);
    this.cargoMarkers.cargoPickupCrateMat.emissive.setHex(mission.colorHex);
    this.cargoMarkers.cargoPickupRingMat.color.setHex(mission.colorHex);

    const originSt = STATIONS[mission.originStationId];
    const destSt = STATIONS[mission.destStationId];

    this.cargoMarkers.cargoPickupCrateGroup.position.set(
      originSt.padPoint.x + 1.8,
      originSt.padPoint.y,
      originSt.padPoint.z - 1.2
    );
    this.cargoMarkers.cargoDropzoneGroup.position.set(
      destSt.padPoint.x,
      destSt.padPoint.y,
      destSt.padPoint.z
    );

    if (
      this.droneState.flightPhase === 'LANDED' &&
      this.droneState.activeStationId === mission.originStationId
    ) {
      this.drone.cargoPodGroup.visible = true;
      this.cargoMarkers.cargoPickupCrateGroup.visible = false;
      this.cargoMarkers.cargoDropzoneGroup.visible = true;
      store.syncFlightStatus({ activeCargoMissionId: mission.id, cargoPhase: 'IN_TRANSIT' });
      audioSynth.playChord(AUDIO_CHORDS.CARGO_PICKUP);
      store.showToast(`${UI_TRANSLATIONS[store.lang].cargoPickedUp} (${mission.weightKg} KG)`);
      if (autoFlyToOrigin) this.engageAutopilot(mission.destStationId);
    } else {
      this.drone.cargoPodGroup.visible = false;
      this.cargoMarkers.cargoPickupCrateGroup.visible = true;
      this.cargoMarkers.cargoDropzoneGroup.visible = false;
      store.syncFlightStatus({ activeCargoMissionId: mission.id, cargoPhase: 'AWAITING_PICKUP' });
      audioSynth.playBeep(AUDIO_NOTES.CARGO_ASSIGN, AUDIO_DURATIONS.MEDIUM);
      store.showToast(`${UI_TRANSLATIONS[store.lang].cargoAssigned}: ${originSt.shortName}`);
      if (autoFlyToOrigin) this.engageAutopilot(mission.originStationId);
    }
  }

  public abortCargoMission(): void {
    const store = useLabStore.getState();
    this.drone.cargoPodGroup.visible = false;
    this.cargoMarkers.cargoPickupCrateGroup.visible = false;
    this.cargoMarkers.cargoDropzoneGroup.visible = false;
    store.syncFlightStatus({ activeCargoMissionId: null, cargoPhase: 'IDLE' });
    audioSynth.playBeep(AUDIO_NOTES.CARGO_ABORT, AUDIO_DURATIONS.MEDIUM);
    store.showToast(
      store.lang === 'id'
        ? 'MISI KARGO DIBATALKAN — BEBAN DILEPAS'
        : 'CARGO MISSION ABORTED — PAYLOAD RELEASED'
    );
  }

  private evaluateCargoPadInteraction(landedStationId: number): void {
    const store = useLabStore.getState();
    const mission = this.getActiveCargoMission();
    if (!mission) return;

    if (store.cargoPhase === 'AWAITING_PICKUP' && landedStationId === mission.originStationId) {
      this.drone.cargoPodGroup.visible = true;
      this.cargoMarkers.cargoPickupCrateGroup.visible = false;
      this.cargoMarkers.cargoDropzoneGroup.visible = true;
      store.syncFlightStatus({ cargoPhase: 'IN_TRANSIT' });
      audioSynth.playChord(AUDIO_CHORDS.CARGO_PICKUP);
      store.showToast(
        `${UI_TRANSLATIONS[store.lang].cargoPickedUp} (${mission.weightKg} KG → ${
          STATIONS[mission.destStationId].shortName
        })`
      );
    } else if (store.cargoPhase === 'IN_TRANSIT' && landedStationId === mission.destStationId) {
      this.drone.cargoPodGroup.visible = false;
      this.cargoMarkers.cargoPickupCrateGroup.visible = false;
      this.cargoMarkers.cargoDropzoneGroup.visible = false;
      this.droneState.battery = 100;
      store.markCargoDelivered(mission.id);
      this.triggerLidarScan();
      store.showToast(`${UI_TRANSLATIONS[store.lang].cargoDelivered} [${mission.code}]`);
    }
  }

  public startFlightPlanPatrol(): void {
    const store = useLabStore.getState();
    if (!store.bootCompleted) return;
    if (store.flightPlanWaypoints.length === 0) {
      store.showToast(
        store.lang === 'id'
          ? 'TAMBAHKAN MINIMAL 1 WAYPOINT DI RADAR!'
          : 'ADD AT LEAST 1 WAYPOINT ON RADAR FIRST!'
      );
      return;
    }

    if (this.guidedTourActive) this.toggleGuidedTour(false);
    store.syncFlightStatus({ flightPlanActive: true, activeWaypointIdx: 0, autopilot: true });
    this.syncFlightPlanVisuals();
    audioSynth.playChord(AUDIO_CHORDS.PATROL_START);
    store.showToast(UI_TRANSLATIONS[store.lang].patrolStarted);

    if (this.droneState.flightPhase === 'LANDED' || this.droneState.flightPhase === 'LANDING') {
      this.droneState.pendingFlightPlanStart = true;
      this.initiateAutoTakeoffSequence();
    } else {
      this.droneState.flightPhase = 'AIRBORNE';
      this.droneState.autopilot = true;
    }
  }

  public stopFlightPlanPatrol(): void {
    const store = useLabStore.getState();
    this.droneState.pendingFlightPlanStart = false;
    this.droneState.autopilot = false;
    store.syncFlightStatus({ flightPlanActive: false, autopilot: false });
    this.syncFlightPlanVisuals();
    audioSynth.playBeep(AUDIO_NOTES.LAND, AUDIO_DURATIONS.SHORT);
    store.showToast(UI_TRANSLATIONS[store.lang].patrolStopped);
  }

  public skipFlightPlanWaypoint(): void {
    const store = useLabStore.getState();
    const len = store.flightPlanWaypoints.length;
    if (!store.flightPlanActive || len === 0) return;
    const nextIdx = (store.activeWaypointIdx + 1) % len;
    store.syncFlightStatus({ activeWaypointIdx: nextIdx });
    this.syncFlightPlanVisuals();
    audioSynth.playBeep(AUDIO_NOTES.WAYPOINT_SKIP, AUDIO_DURATIONS.TINY);
  }

  private initiateAutoTakeoffSequence(): void {
    const st = STATIONS[this.droneState.activeStationId];
    this.droneState.takeoffTargetY = st.hoverPoint.y;
    this.droneState.flightPhase = 'TAKING_OFF';
    const store = useLabStore.getState();
    store.syncFlightStatus({ flightPhase: 'TAKING_OFF' });
    store.showToast(UI_TRANSLATIONS[store.lang].takeoffMsg);
    audioSynth.playBeep(AUDIO_NOTES.TAKEOFF, AUDIO_DURATIONS.MEDIUM);
  }

  public toggleLandingTakeoff(): void {
    const store = useLabStore.getState();
    if (!store.bootCompleted) return;
    if (this.guidedTourActive) this.toggleGuidedTour(false);
    if (store.flightPlanActive) this.stopFlightPlanPatrol();

    if (this.droneState.flightPhase === 'LANDED' || this.droneState.flightPhase === 'LANDING') {
      this.droneState.pendingAutopilotStationId = null;
      this.initiateAutoTakeoffSequence();
    } else {
      this.droneState.autopilot = false;
      this.droneState.targetStationId = this.droneState.activeStationId;
      this.droneState.flightPhase = 'LANDING';
      store.syncFlightStatus({
        flightPhase: 'LANDING',
        autopilot: false,
        targetStationId: this.droneState.activeStationId,
      });
      store.showToast(UI_TRANSLATIONS[store.lang].landingMsg);
      audioSynth.playBeep(AUDIO_NOTES.LAND, AUDIO_DURATIONS.MEDIUM);
    }
  }

  public engageAutopilot(stationId: number): void {
    const store = useLabStore.getState();
    if (!store.bootCompleted) return;
    const target = STATIONS[stationId];
    if (!target) return;

    if (store.flightPlanActive) {
      store.syncFlightStatus({ flightPlanActive: false });
      this.syncFlightPlanVisuals();
    }

    this.droneState.targetStationId = stationId;
    store.showToast(UI_TRANSLATIONS[store.lang].autopilotTo + target.shortName.toUpperCase());
    audioSynth.playBeep(AUDIO_NOTES.AUTOPILOT, AUDIO_DURATIONS.NORMAL);

    if (this.droneState.flightPhase === 'LANDED' || this.droneState.flightPhase === 'LANDING') {
      this.droneState.pendingAutopilotStationId = stationId;
      this.initiateAutoTakeoffSequence();
      return;
    }

    this.droneState.flightPhase = 'AIRBORNE';
    this.droneState.autopilot = true;
    store.syncFlightStatus({
      flightPhase: 'AIRBORNE',
      autopilot: true,
      targetStationId: stationId,
    });
  }

  public navigateNextStation(): void {
    this.engageAutopilot((this.droneState.activeStationId + 1) % STATIONS.length);
  }

  public toggleGuidedTour(forceState: boolean | null = null): void {
    this.guidedTourActive = forceState !== null ? forceState : !this.guidedTourActive;
    this.guidedTourTimer = 0;
    const store = useLabStore.getState();
    store.syncFlightStatus({ guidedTourActive: this.guidedTourActive });

    if (this.guidedTourActive) {
      if (store.flightPlanActive) this.stopFlightPlanPatrol();
      if (!this.droneState.autopilot) {
        this.engageAutopilot((this.droneState.activeStationId + 1) % STATIONS.length);
      }
      store.showToast(
        store.lang === 'id'
          ? 'TUR SINEMATIK OTOMATIS AKTIF'
          : 'HANDS-FREE CINEMATIC TOUR ENGAGED'
      );
    }
  }

  public cycleCameraMode(): void {
    this.droneState.cameraMode = ((this.droneState.cameraMode + 1) % 3) as CameraMode;
    const names = ['CHASE', 'COCKPIT', 'TOP-DOWN'];
    const store = useLabStore.getState();
    store.syncFlightStatus({ cameraMode: this.droneState.cameraMode });
    store.showToast('CAMERA VIEW: ' + names[this.droneState.cameraMode]);
    audioSynth.playBeep(AUDIO_NOTES.CAMERA_CYCLE, AUDIO_DURATIONS.TINY);
  }

  public cycleAtmosphere(targetMode?: AtmosphereMode): void {
    const nextMode =
      targetMode !== undefined
        ? targetMode
        : (((this.droneState.atmosphereMode + 1) % 5) as AtmosphereMode);
    this.droneState.atmosphereMode = nextMode;

    const store = useLabStore.getState();
    const preset = WEATHER_PRESETS[nextMode];
    store.syncFlightStatus({
      atmosphereMode: nextMode,
      autoSpotlightActive: preset.autoSpotlight,
    });

    applyAtmospherePreset(nextMode, {
      scene: this.scene,
      skyDomeMesh: this.skyDomeMesh,
      sunDirLight: this.sunDirLight,
      hemiLight: this.hemiLight,
      celestialOrbGroup: this.celestialOrbGroup,
      drone: this.drone,
      rainSystemGroup: this.stormRain.rainSystemGroup,
      interiorGlowMaterials: this.archipelago.interiorGlowMaterials,
    });

    store.showToast(
      `WEATHER: ${preset.name[store.lang].toUpperCase()} (WIND ${preset.baseWindKt}KT${
        preset.autoSpotlight ? ' • AUTO-SPOTLIGHT ON' : ''
      })`
    );
    audioSynth.playBeep(AUDIO_NOTES.ATMOSPHERE, AUDIO_DURATIONS.NORMAL);
  }

  public triggerLidarScan(): void {
    this.lidarScanActive = true;
    this.lidarScanRadius = 1.0;
    this.lidarRingMesh.position.set(
      this.droneState.pos.x,
      this.droneState.pos.y - 1.0,
      this.droneState.pos.z
    );
    const store = useLabStore.getState();
    store.showToast(UI_TRANSLATIONS[store.lang].scanMsg);
    audioSynth.playBeep(AUDIO_NOTES.LIDAR_SCAN, AUDIO_DURATIONS.LONG);
  }

  public toggleRingChallenge(): void {
    this.ringCourseActive = !this.ringCourseActive;
    this.activeRingIndex = 0;
    this.ringCourseStartTime = performance.now();
    this.ringGateMeshes.forEach((g) => (g.group.visible = this.ringCourseActive));

    const store = useLabStore.getState();
    if (this.ringCourseActive) {
      if (this.droneState.flightPhase === 'LANDED') this.initiateAutoTakeoffSequence();
      store.syncFlightStatus({
        ringCourseActive: true,
        ringGateLabel: `GATE 1/${this.ringGateMeshes.length}`,
      });
      store.showToast('SKY-RING TIME TRIAL STARTED — FLY THROUGH GREEN GATES!');
    } else {
      store.syncFlightStatus({ ringCourseActive: false, ringGateLabel: 'RING TRIAL' });
    }
    audioSynth.playBeep(AUDIO_NOTES.ISLAND_INTERACTION, AUDIO_DURATIONS.MEDIUM);
  }

  public applyDroneLivery(preset: DroneLiveryKey): void {
    const { droneHullMaterial, droneCanopyMaterial } = this.drone;
    const colors = LIVERY_COLORS[preset];
    droneHullMaterial.color.setHex(colors.hull);
    droneCanopyMaterial.color.setHex(colors.canopy);

    const labels: Record<DroneLiveryKey, string> = {
      pearl: 'PEARL WHITE',
      stealth: 'STEALTH CARBON',
      rescue: 'SAR ORANGE',
      royal: 'GOLD SPEC',
    };
    const store = useLabStore.getState();
    store.syncFlightStatus({ activeLivery: preset });
    store.showToast(`DRONE LIVERY: ${labels[preset]}`);
    audioSynth.playBeep(AUDIO_NOTES.LIVERY, AUDIO_DURATIONS.TINY);
  }

  public setFlightProfile(profileKey: FlightProfileKey): void {
    this.currentFlightProfile = profileKey;
    const store = useLabStore.getState();
    store.syncFlightStatus({ flightProfile: profileKey });
    store.showToast(`FLIGHT CONTROLLER: ${profileKey} MODE`);
    audioSynth.playBeep(AUDIO_NOTES.FLIGHT_PROFILE, AUDIO_DURATIONS.NORMAL);
  }

  public toggleWingmanSwarm(): void {
    this.wingmanSwarmActive = !this.wingmanSwarmActive;
    this.drone.wingmanDrones.forEach((w) => {
      w.pos.copy(this.droneState.pos);
      w.group.visible = this.wingmanSwarmActive;
    });
    const store = useLabStore.getState();
    store.syncFlightStatus({ wingmanSwarmActive: this.wingmanSwarmActive });
    store.showToast(
      this.wingmanSwarmActive
        ? '2 WINGMAN DRONES DEPLOYED IN V-FORMATION'
        : 'WINGMAN SWARM RECALLED'
    );
    audioSynth.playBeep(AUDIO_NOTES.WINGMAN, AUDIO_DURATIONS.MEDIUM);
  }

  public triggerReturnToHome(isLowBattery = false): void {
    const store = useLabStore.getState();
    if (!store.bootCompleted) return;
    if (this.guidedTourActive) this.toggleGuidedTour(false);
    if (store.flightPlanActive) this.stopFlightPlanPatrol();

    this.droneState.targetStationId = this.droneState.activeStationId;
    this.droneState.autopilot = false;
    this.droneState.flightPhase = 'LANDING';
    store.syncFlightStatus({
      flightPhase: 'LANDING',
      autopilot: false,
      targetStationId: this.droneState.activeStationId,
    });
    store.showToast(
      isLowBattery
        ? 'LOW BATTERY RTH — AUTO-LANDING ON NEAREST HELIPAD'
        : 'RETURN TO HOME (RTH) — AUTO-LANDING ON HELIPAD'
    );
    audioSynth.playBeep(AUDIO_NOTES.RTH, AUDIO_DURATIONS.LONG);
  }

  public captureAerialSnapshot(): void {
    this.renderer.render(this.scene, this.camera);
    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = this.renderer.domElement.width;
    snapCanvas.height = this.renderer.domElement.height;
    const ctx = snapCanvas.getContext('2d')!;
    ctx.drawImage(this.renderer.domElement, 0, 0);

    const barH = Math.max(44, Math.round(snapCanvas.height * SNAPSHOT_BAR_HEIGHT_RATIO));
    ctx.fillStyle = `rgba(15, 23, 42, ${SNAPSHOT_BAR_OPACITY})`;
    ctx.fillRect(0, snapCanvas.height - barH, snapCanvas.width, barH);

    ctx.fillStyle = '#38bdf8';
    ctx.font = `bold ${Math.max(13, Math.round(barH * 0.36))}px "JetBrains Mono", monospace`;
    const st = STATIONS[this.droneState.activeStationId];
    const wPreset = WEATHER_PRESETS[this.droneState.atmosphereMode];
    const stampText = `HADIYATNA.LAB // ${st.code} • ALT: +${this.droneState.pos.y.toFixed(
      1
    )}m • WX: ${wPreset.code} (${this.windState.speedKt.toFixed(
      1
    )}KT) • ${new Date().toLocaleTimeString()}`;
    ctx.fillText(stampText, 20, snapCanvas.height - barH * 0.36);

    const store = useLabStore.getState();
    store.setSnapshotDataUrl(snapCanvas.toDataURL('image/png'));
    audioSynth.playBeep(AUDIO_NOTES.C6, AUDIO_DURATIONS.MEDIUM);
    store.showToast('AERIAL TELEMETRY PHOTO CAPTURED');
  }

  public setTouchKey(code: string, state: boolean): void {
    this.input.setTouchKey(code, state);
  }

  public setIslandBiodomeMaterial(val: number): void {
    const mat = this.archipelago.islandFX.biodomeCoreMat;
    if (!mat) return;
    mat.color.setHex(BIODOME_COLORS[val] ?? BIODOME_COLORS[0]);
    mat.emissive.setHex(BIODOME_EMISSIVES[val] ?? BIODOME_EMISSIVES[0]);
    mat.emissiveIntensity =
      val === 0 ? BIODOME_EMISSIVE_INTENSITY_DIM : BIODOME_EMISSIVE_INTENSITY_BRIGHT;
  }

  // ── Animation Loop ────────────────────────────────────────────────────────

  private updateEnvironmentAndHUD(dt: number): void {
    const elapsed = this.clock.getElapsedTime();
    const store = useLabStore.getState();

    if (this.droneState.atmosphereMode === 3 && this.stormRain.rainSystemGroup.visible) {
      updateStormRainAndLightning(
        dt,
        this.droneState.pos,
        this.stormRain.rainSystemGroup,
        this.stormRain.rainSegments,
        this.sunDirLight,
        this.lightningState
      );
    }

    const { closestStation, minDistance } = updateIslandAndWildlifeFX({
      dt,
      elapsed,
      archipelago: this.archipelago,
      islandState: store.islandState,
      atmosphereMode: this.droneState.atmosphereMode,
      cloudGroups: this.cloudGroups,
      birdFlock: this.birdFlock,
      cargoPickupCrateGroup: this.cargoMarkers.cargoPickupCrateGroup,
      cargoDropzoneGroup: this.cargoMarkers.cargoDropzoneGroup,
      dronePos: this.droneState.pos,
      flightPhase: this.droneState.flightPhase,
      activeStationId: this.droneState.activeStationId,
      targetStationId: this.droneState.targetStationId,
    });

    if (closestStation.id !== this.droneState.activeStationId && minDistance < ISLAND_PROXIMITY_THRESHOLD) {
      this.droneState.activeStationId = closestStation.id;
      store.syncFlightStatus({ activeStationId: closestStation.id });
      store.markIslandVisited(closestStation.id);
    }

    if (this.guidedTourActive && !this.droneState.autopilot && this.droneState.flightPhase === 'AIRBORNE') {
      this.guidedTourTimer += dt;
      this.camOrbit.theta += dt * TOUR_ORBIT_RATE;
      if (this.guidedTourTimer > TOUR_STATION_DWELL_S) {
        this.guidedTourTimer = 0;
        this.navigateNextStation();
      }
    }

    const deckY = closestStation.padPoint.y;
    const horizToIsland = Math.hypot(
      this.droneState.pos.x - closestStation.position.x,
      this.droneState.pos.z - closestStation.position.z
    );
    const agl = this.droneState.pos.y - deckY;

    if (horizToIsland < closestStation.islandRadius * 0.95 && agl > 0.12 && agl < LANDING_LASER_AGL_RANGE) {
      this.drone.groundTargetGroup.visible = true;
      this.drone.altitudeLaserLine.visible = true;
      this.drone.groundTargetGroup.position.set(this.droneState.pos.x, deckY + 0.02, this.droneState.pos.z);
      this.drone.groundTargetGroup.rotation.y = elapsed * 1.2;

      const posAttr = this.drone.altitudeLaserLine.geometry.attributes.position;
      posAttr.setXYZ(0, this.droneState.pos.x, this.droneState.pos.y - 0.35, this.droneState.pos.z);
      posAttr.setXYZ(1, this.droneState.pos.x, deckY + 0.02, this.droneState.pos.z);
      posAttr.needsUpdate = true;
      this.drone.altitudeLaserLine.computeLineDistances();
    } else {
      this.drone.groundTargetGroup.visible = false;
      this.drone.altitudeLaserLine.visible = false;
    }

    const downwashMat = this.drone.downwashRingMesh.material as THREE.MeshBasicMaterial;
    if (
      horizToIsland < closestStation.islandRadius * 0.9 &&
      agl >= 0 &&
      agl < DOWNWASH_AGL_MAX &&
      this.droneState.rotorThrottle > DOWNWASH_THROTTLE_MIN
    ) {
      this.drone.downwashRingMesh.position.set(this.droneState.pos.x, deckY + 0.03, this.droneState.pos.z);
      const s = 0.8 + (1 - agl / DOWNWASH_AGL_MAX) * 0.9 + Math.sin(elapsed * 14) * 0.08;
      this.drone.downwashRingMesh.scale.set(s, s, 1);
      downwashMat.opacity = (1 - agl / DOWNWASH_AGL_MAX) * 0.38 * this.droneState.rotorThrottle;
    } else {
      downwashMat.opacity = 0;
    }

    const leftTip = new THREE.Vector3(-1.15, 0.1, 1.05).applyMatrix4(this.drone.droneGroup.matrixWorld);
    const rightTip = new THREE.Vector3(1.15, 0.1, 1.05).applyMatrix4(this.drone.droneGroup.matrixWorld);
    this.drone.contrailLeftHistory.pop();
    this.drone.contrailLeftHistory.unshift(leftTip);
    this.drone.contrailRightHistory.pop();
    this.drone.contrailRightHistory.unshift(rightTip);
    this.drone.contrailLeftLine.geometry.setFromPoints(this.drone.contrailLeftHistory);
    this.drone.contrailRightLine.geometry.setFromPoints(this.drone.contrailRightHistory);
    const spd = this.droneState.vel.length();
    (this.drone.contrailLeftLine.material as THREE.LineBasicMaterial).opacity =
      spd > CONTRAIL_SPEED_THRESHOLD
        ? Math.min(CONTRAIL_OPACITY_MAX, (spd - CONTRAIL_SPEED_THRESHOLD) / CONTRAIL_SPEED_SCALE)
        : 0.0;

    if (this.lidarScanActive) {
      this.lidarScanRadius += dt * LIDAR_EXPAND_SPEED;
      this.lidarRingMesh.scale.set(this.lidarScanRadius, this.lidarScanRadius, 1);
      this.lidarRingMesh.material.opacity = Math.max(0, 0.75 - this.lidarScanRadius / LIDAR_MAX_RADIUS);
      if (this.lidarScanRadius > LIDAR_MAX_RADIUS) {
        this.lidarScanActive = false;
        this.lidarRingMesh.material.opacity = 0;
      }
    }

    // Direct 60Hz DOM Telemetry Updates (kept as DOM mutation for max perf)
    const hdgDeg = ((Math.round((-this.droneState.yaw * 180) / Math.PI) % 360) + 360) % 360;
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    if (this.domRefs.headingEl) {
      this.domRefs.headingEl.textContent =
        String(hdgDeg).padStart(3, '0') + '° ' + dirs[Math.round(hdgDeg / 45) % 8];
    }
    if (this.domRefs.altitudeEl) {
      this.domRefs.altitudeEl.textContent =
        (this.droneState.pos.y >= 0 ? '+' : '') + this.droneState.pos.y.toFixed(1) + 'm';
    }
    if (this.domRefs.speedEl) {
      this.domRefs.speedEl.textContent = this.droneState.vel.length().toFixed(1) + ' m/s';
    }
    if (this.domRefs.windEl) {
      const windDeg = ((Math.round((this.windState.angle * 180) / Math.PI) % 360) + 360) % 360;
      this.domRefs.windEl.textContent = `${this.windState.speedKt.toFixed(1)}kt ${
        dirs[Math.round(windDeg / 45) % 8]
      }`;
      this.domRefs.windEl.className =
        this.droneState.atmosphereMode === 3
          ? 'font-bold text-rose-600 animate-pulse'
          : this.droneState.atmosphereMode === 4
          ? 'font-bold text-amber-600'
          : 'font-bold text-indigo-600';
    }
    if (this.domRefs.batteryEl) {
      const batVal = Math.round(this.droneState.battery);
      const isHeavyDrain = store.cargoPhase === 'IN_TRANSIT';
      this.domRefs.batteryEl.textContent = `BAT ${batVal}% ${
        this.droneState.flightPhase === 'LANDED' ? '⚡ CHG' : isHeavyDrain ? '⚡ LOAD' : '⚡'
      }`;
      this.domRefs.batteryEl.className =
        batVal > 35
          ? 'text-emerald-600 font-bold'
          : batVal > 15
          ? 'text-amber-600 font-bold'
          : 'text-rose-600 font-bold animate-pulse';
    }
    if (this.domRefs.stationDistanceEl) {
      this.domRefs.stationDistanceEl.textContent =
        this.droneState.flightPhase === 'LANDED'
          ? 'LANDED ON PAD'
          : minDistance < 6.0
          ? UI_TRANSLATIONS[store.lang].docked
          : `${minDistance.toFixed(0)}m`;
    }

    drawRadarMinimapCanvas({
      canvas: this.domRefs.radarCanvas,
      dronePos: this.droneState.pos,
      droneYaw: this.droneState.yaw,
      activeStationId: this.droneState.activeStationId,
      visitedIslands: store.visitedIslands,
      waypoints: store.flightPlanWaypoints,
      flightPlanActive: store.flightPlanActive,
      flightPlanLoop: store.flightPlanLoop,
      activeWaypointIdx: store.activeWaypointIdx,
      activeMission: this.getActiveCargoMission(),
      cargoPhase: store.cargoPhase,
      windAngle: this.windState.angle,
      atmosphereMode: this.droneState.atmosphereMode,
    });

    updateSpatialWaypointProjections(
      this.spatialMarkerElements,
      this.droneState.pos,
      this.camera,
      this.droneState.activeStationId
    );
    this.updateRingChallengeCourse(elapsed);
  }

  private updateRingChallengeCourse(elapsed: number): void {
    if (!this.ringCourseActive) return;
    this.ringGateMeshes.forEach((g, idx) => {
      g.innerGlow.rotation.z = elapsed * 1.8;
      const isCurrent = idx === this.activeRingIndex;
      g.outerRing.material.color.setHex(isCurrent ? 0x10b981 : 0xf43f5e);
      const s = isCurrent ? 1.0 + Math.sin(elapsed * 6.0) * 0.06 : 0.85;
      g.group.scale.set(s, s, s);
    });

    const currentGate = this.ringGateMeshes[this.activeRingIndex];
    if (currentGate && this.droneState.pos.distanceTo(currentGate.group.position) < RING_GATE_PASS_RADIUS) {
      audioSynth.playBeep(AUDIO_NOTES.RING_GATE, AUDIO_DURATIONS.SHORT);
      this.activeRingIndex++;
      const store = useLabStore.getState();
      if (this.activeRingIndex >= this.ringGateMeshes.length) {
        const totalTime = ((performance.now() - this.ringCourseStartTime) / 1000).toFixed(1);
        store.showToast(`SKY-RING COURSE COMPLETE IN ${totalTime}s!`);
        this.toggleRingChallenge();
      } else {
        store.syncFlightStatus({
          ringGateLabel: `GATE ${this.activeRingIndex + 1}/${this.ringGateMeshes.length}`,
        });
        store.showToast(`GATE ${this.activeRingIndex}/${this.ringGateMeshes.length} CLEARED!`);
      }
    }
  }

  private animate = (): void => {
    this.animFrameId = requestAnimationFrame(this.animate);
    const dt = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();
    const store = useLabStore.getState();

    stepDronePhysics({
      dt,
      elapsed,
      droneState: this.droneState,
      windState: this.windState,
      drone: this.drone,
      keys: this.input.getKeys(),
      boostActive: this.input.boostActive,
      wingmanSwarmActive: this.wingmanSwarmActive,
      currentFlightProfile: this.currentFlightProfile,
      store,
      activeCargo: store.cargoPhase === 'IN_TRANSIT' ? this.getActiveCargoMission() : null,
      onStopGuidedTour: () => { if (this.guidedTourActive) this.toggleGuidedTour(false); },
      onStopFlightPlan: () => this.stopFlightPlanPatrol(),
      onSyncFlightPlanVisuals: () => this.syncFlightPlanVisuals(),
      onInitiateAutoTakeoff: () => this.initiateAutoTakeoffSequence(),
      onEngageAutopilot: (stId) => this.engageAutopilot(stId),
      onTriggerReturnToHome: (isLow) => this.triggerReturnToHome(isLow),
      onEvaluateCargoPad: (stId) => this.evaluateCargoPadInteraction(stId),
    });

    stepCameraSystem({
      dt,
      elapsed,
      camera: this.camera,
      droneState: this.droneState,
      camOrbit: this.camOrbit,
      windState: this.windState,
      boostActive: this.input.boostActive,
    });

    this.updateEnvironmentAndHUD(dt);
    this.renderer.render(this.scene, this.camera);
  };

  // ── Cleanup ───────────────────────────────────────────────────────────────

  public dispose(): void {
    if (this.animFrameId !== null) cancelAnimationFrame(this.animFrameId);
    this.bootManager.dispose();
    this.input.dispose();
    this.renderer.dispose();
  }
}
