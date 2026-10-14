import * as THREE from 'three';
import { STATIONS } from '../data/stations';
import { FLIGHT_PROFILES } from '../data/projects';
import { UI_TRANSLATIONS } from '../data/translations';
import { audioSynth } from '../services/audioSynth';
import { EngineBridge, useLabStore } from '../store/useLabStore';
import {
  AtmosphereMode,
  CameraMode,
  DroneLiveryKey,
  FlightPhase,
  FlightProfileKey,
} from '../types/lab';
import { createSkyGradientTexture } from './textures';
import {
  ArchipelagoBuildResult,
  buildSkyArchipelago,
  StationSceneObject,
} from './islandBuilders';
import { buildAeroSondeDrone, DroneBuildResult } from './droneBuilder';

export interface TelemetryDomRefs {
  altitudeEl: HTMLElement | null;
  speedEl: HTMLElement | null;
  batteryEl: HTMLElement | null;
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
  private birdFlock: {
    group: THREE.Group;
    leftWing: THREE.Mesh;
    rightWing: THREE.Mesh;
    angle: number;
    orbitRadius: number;
    baseAlt: number;
    speed: number;
    phase: number;
  }[] = [];

  private lidarRingMesh!: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  private lidarScanActive = false;
  private lidarScanRadius = 0;

  private ringGateMeshes: {
    group: THREE.Group;
    outerRing: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
    innerGlow: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  }[] = [];
  private ringCourseActive = false;
  private activeRingIndex = 0;
  private ringCourseStartTime = 0;

  private spatialMarkerElements: {
    station: (typeof STATIONS)[0];
    el: HTMLDivElement;
    distEl: HTMLElement | null;
  }[] = [];

  private raycaster = new THREE.Raycaster();
  private pointerNDC = new THREE.Vector2();
  private keys: Record<string, boolean> = {};
  private boostActive = false;
  private guidedTourActive = false;
  private guidedTourTimer = 0;
  private wingmanSwarmActive = false;
  private currentFlightProfile: FlightProfileKey = 'SPORT';

  private droneState = {
    pos: new THREE.Vector3(
      STATIONS[0].padPoint.x,
      STATIONS[0].padPoint.y,
      STATIONS[0].padPoint.z
    ),
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
    pendingAutopilotStationId: null as number | null,
    takeoffTargetY: STATIONS[0].hoverPoint.y,
    cameraMode: 0 as CameraMode,
    atmosphereMode: 0 as AtmosphereMode,
    battery: 99.4,
  };

  private camOrbit = {
    theta: 0.35,
    phi: 0.32,
    distance: 9.2,
    isDragging: false,
    lastX: 0,
    lastY: 0,
  };

  private windState = { angle: 0.6, speedKt: 3.4 };

  constructor(container: HTMLElement, domRefs: TelemetryDomRefs) {
    this.container = container;
    this.domRefs = domRefs;
    this.initWebGL();
    this.setupEventListeners();
    this.startBootSequence();
    this.animate();
  }

  private initWebGL(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xc8e0f4);
    this.scene.fog = new THREE.FogExp2(0xd8eaf7, 0.0014);

    this.camera = new THREE.PerspectiveCamera(
      58,
      window.innerWidth / window.innerHeight,
      0.2,
      1600
    );
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();

    const skyGeo = new THREE.SphereGeometry(950, 32, 24);
    const skyMat = new THREE.MeshBasicMaterial({
      map: createSkyGradientTexture('#60a5fa', '#bae6fd', '#f8fafc'),
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.skyDomeMesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyDomeMesh);

    this.celestialOrbGroup = new THREE.Group();
    const sunCore = new THREE.Mesh(
      new THREE.SphereGeometry(18, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xfffbeb, fog: false })
    );
    const sunHalo = new THREE.Mesh(
      new THREE.SphereGeometry(32, 24, 24),
      new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.28,
        fog: false,
      })
    );
    this.celestialOrbGroup.add(sunCore, sunHalo);
    this.celestialOrbGroup.position.set(220, 240, -290);
    this.scene.add(this.celestialOrbGroup);

    this.hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x94a3b8, 0.95);
    this.scene.add(this.hemiLight);

    this.sunDirLight = new THREE.DirectionalLight(0xfffbeb, 1.35);
    this.sunDirLight.position.set(140, 210, 120);
    this.sunDirLight.castShadow = true;
    this.sunDirLight.shadow.mapSize.width = 2048;
    this.sunDirLight.shadow.mapSize.height = 2048;
    this.sunDirLight.shadow.camera.near = 10;
    this.sunDirLight.shadow.camera.far = 650;
    const d = 220;
    this.sunDirLight.shadow.camera.left = -d;
    this.sunDirLight.shadow.camera.right = d;
    this.sunDirLight.shadow.camera.top = d;
    this.sunDirLight.shadow.camera.bottom = -d;
    this.scene.add(this.sunDirLight);

    this.archipelago = buildSkyArchipelago(this.scene);
    this.droneState.pos.set(
      STATIONS[0].padPoint.x,
      STATIONS[0].padPoint.y,
      STATIONS[0].padPoint.z
    );
    this.droneState.takeoffTargetY = STATIONS[0].hoverPoint.y;

    this.buildCloudSeaAndWildlife();
    this.drone = buildAeroSondeDrone(this.scene, this.droneState.pos);
    this.buildLidarRing();
    this.buildSkyRingChallengeGates();
    this.initSpatialWaypointElements();
  }

  private buildCloudSeaAndWildlife(): void {
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.95,
      metalness: 0.0,
      transparent: true,
      opacity: 0.88,
    });

    for (let c = 0; c < 36; c++) {
      const cGroup = new THREE.Group();
      const puffs = 3 + (c % 4);
      for (let p = 0; p < puffs; p++) {
        const puffRadius = 4.5 + Math.random() * 5.5;
        const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(puffRadius, 1), cloudMat);
        puff.position.set(
          (p - 1.5) * 5.2,
          (Math.random() - 0.5) * 2.0,
          (Math.random() - 0.5) * 4.0
        );
        puff.scale.y = 0.52;
        cGroup.add(puff);
      }
      cGroup.position.set(
        (Math.random() - 0.5) * 280,
        -18 + Math.random() * 58,
        (Math.random() - 0.5) * 260
      );
      this.scene.add(cGroup);
      this.cloudGroups.push({
        group: cGroup,
        speed: 0.6 + Math.random() * 1.1,
      });
    }

    const birdMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc, side: THREE.DoubleSide });
    for (let b = 0; b < 18; b++) {
      const bGroup = new THREE.Group();
      const leftWing = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.24), birdMat);
      leftWing.position.x = -0.32;
      const rightWing = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.24), birdMat);
      rightWing.position.x = 0.32;
      bGroup.add(leftWing, rightWing);

      const orbitRadius = 35 + (b % 5) * 16;
      const baseAlt = 18 + (b % 4) * 11;
      this.scene.add(bGroup);
      this.birdFlock.push({
        group: bGroup,
        leftWing,
        rightWing,
        angle: (b / 18) * Math.PI * 2,
        orbitRadius,
        baseAlt,
        speed: 0.18 + (b % 3) * 0.06,
        phase: b * 0.9,
      });
    }
  }

  private buildLidarRing(): void {
    this.lidarRingMesh = new THREE.Mesh(
      new THREE.RingGeometry(1.0, 1.8, 48),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    this.lidarRingMesh.rotation.x = -Math.PI / 2;
    this.scene.add(this.lidarRingMesh);
  }

  private buildSkyRingChallengeGates(): void {
    const gateWaypoints = [
      { x: -28, y: 18, z: -18, rotY: 0.6 },
      { x: -64, y: 29, z: -38, rotY: 0.2 },
      { x: 0, y: 34, z: -46, rotY: -1.4 },
      { x: 68, y: 43, z: -32, rotY: 0.0 },
      { x: 64, y: 54, z: 38, rotY: 0.4 },
      { x: 0, y: 22, z: 32, rotY: 1.5 },
    ];

    gateWaypoints.forEach((gw, idx) => {
      const gateGroup = new THREE.Group();
      gateGroup.position.set(gw.x, gw.y, gw.z);
      gateGroup.rotation.y = gw.rotY;

      const outerRing = new THREE.Mesh(
        new THREE.TorusGeometry(3.6, 0.16, 12, 36),
        new THREE.MeshBasicMaterial({
          color: idx === 0 ? 0x10b981 : 0xf43f5e,
          transparent: true,
          opacity: 0.82,
        })
      );
      const innerGlow = new THREE.Mesh(
        new THREE.RingGeometry(3.1, 3.4, 32),
        new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.28,
          side: THREE.DoubleSide,
        })
      );
      gateGroup.add(outerRing, innerGlow);
      gateGroup.visible = false;
      this.scene.add(gateGroup);
      this.ringGateMeshes.push({ group: gateGroup, outerRing, innerGlow });
    });
  }

  private initSpatialWaypointElements(): void {
    const container = this.domRefs.spatialMarkersContainer;
    if (!container) return;
    container.innerHTML = '';
    this.spatialMarkerElements = STATIONS.map((st) => {
      const el = document.createElement('div');
      el.className = 'spatial-waypoint cursor-pointer select-none';
      el.onclick = () => this.engageAutopilot(st.id);
      el.innerHTML = `
        <div class="px-2 py-0.5 rounded-full bg-slate-900/75 hover:bg-sky-600 text-white border border-white/30 backdrop-blur-md shadow-md flex items-center gap-1.5 text-[10px] font-mono-tech transition">
          <span class="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
          <span class="font-bold">${st.code}</span>
          <span class="opacity-80 waypoint-dist">0m</span>
        </div>
      `;
      container.appendChild(el);
      return { station: st, el, distEl: el.querySelector('.waypoint-dist') };
    });
  }

  private startBootSequence(): void {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 4;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        useLabStore.getState().setBootState(100);
        setTimeout(() => {
          useLabStore.getState().setBootState(100, true);
          setTimeout(() => {
            this.initiateAutoTakeoffSequence();
          }, 450);
        }, 350);
      } else {
        useLabStore.getState().setBootState(progress);
      }
    }, 45);
  }

  private initiateAutoTakeoffSequence(): void {
    const st = STATIONS[this.droneState.activeStationId];
    this.droneState.takeoffTargetY = st.hoverPoint.y;
    this.droneState.flightPhase = 'TAKING_OFF';
    const store = useLabStore.getState();
    store.syncFlightStatus({ flightPhase: 'TAKING_OFF' });
    store.showToast(UI_TRANSLATIONS[store.lang].takeoffMsg);
    audioSynth.playBeep(660, 0.08);
  }

  public toggleLandingTakeoff(): void {
    const store = useLabStore.getState();
    if (!store.bootCompleted) return;
    if (this.guidedTourActive) this.toggleGuidedTour(false);

    if (
      this.droneState.flightPhase === 'LANDED' ||
      this.droneState.flightPhase === 'LANDING'
    ) {
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
      audioSynth.playBeep(520, 0.08);
    }
  }

  public engageAutopilot(stationId: number): void {
    const store = useLabStore.getState();
    if (!store.bootCompleted) return;
    const target = STATIONS[stationId];
    if (!target) return;

    this.droneState.targetStationId = stationId;
    store.showToast(
      UI_TRANSLATIONS[store.lang].autopilotTo + target.shortName.toUpperCase()
    );
    audioSynth.playBeep(780, 0.06);

    if (
      this.droneState.flightPhase === 'LANDED' ||
      this.droneState.flightPhase === 'LANDING'
    ) {
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
    const nextId = (this.droneState.activeStationId + 1) % STATIONS.length;
    this.engageAutopilot(nextId);
  }

  public toggleGuidedTour(forceState: boolean | null = null): void {
    this.guidedTourActive = forceState !== null ? forceState : !this.guidedTourActive;
    this.guidedTourTimer = 0;
    const store = useLabStore.getState();
    store.syncFlightStatus({ guidedTourActive: this.guidedTourActive });

    if (this.guidedTourActive) {
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
    audioSynth.playBeep(700, 0.05);
  }

  public cycleAtmosphere(): void {
    this.droneState.atmosphereMode = ((this.droneState.atmosphereMode + 1) %
      3) as AtmosphereMode;
    const store = useLabStore.getState();
    store.syncFlightStatus({ atmosphereMode: this.droneState.atmosphereMode });

    const bg = this.scene.background as THREE.Color;
    const fog = this.scene.fog as THREE.FogExp2;

    if (this.droneState.atmosphereMode === 0) {
      bg.setHex(0xc8e0f4);
      fog.color.setHex(0xd8eaf7);
      this.skyDomeMesh.material.map = createSkyGradientTexture(
        '#60a5fa',
        '#bae6fd',
        '#f8fafc'
      );
      this.sunDirLight.color.setHex(0xfffbeb);
      this.sunDirLight.intensity = 1.35;
      this.hemiLight.color.setHex(0xe0f2fe);
      this.celestialOrbGroup.position.set(140, 165, -180);
      (this.celestialOrbGroup.children[0] as THREE.Mesh<
        THREE.BufferGeometry,
        THREE.MeshBasicMaterial
      >).material.color.setHex(0xfffbeb);
      (this.celestialOrbGroup.children[1] as THREE.Mesh<
        THREE.BufferGeometry,
        THREE.MeshBasicMaterial
      >).material.color.setHex(0xfef08a);
      this.drone.droneLandingSpotLight.intensity = 1.2;
      this.archipelago.interiorGlowMaterials.forEach((m) => {
        m.emissiveIntensity = 0.45;
      });
      store.showToast('ATMOSPHERE: SERENE DAYLIGHT');
    } else if (this.droneState.atmosphereMode === 1) {
      bg.setHex(0xfed7aa);
      fog.color.setHex(0xffedd5);
      this.skyDomeMesh.material.map = createSkyGradientTexture(
        '#4f46e5',
        '#fb923c',
        '#fef3c7'
      );
      this.sunDirLight.color.setHex(0xfdba74);
      this.sunDirLight.intensity = 1.5;
      this.hemiLight.color.setHex(0xfde68a);
      this.celestialOrbGroup.position.set(-165, 58, -190);
      (this.celestialOrbGroup.children[0] as THREE.Mesh<
        THREE.BufferGeometry,
        THREE.MeshBasicMaterial
      >).material.color.setHex(0xffedd5);
      (this.celestialOrbGroup.children[1] as THREE.Mesh<
        THREE.BufferGeometry,
        THREE.MeshBasicMaterial
      >).material.color.setHex(0xf97316);
      this.drone.droneLandingSpotLight.intensity = 2.0;
      this.archipelago.interiorGlowMaterials.forEach((m) => {
        m.emissiveIntensity = 0.85;
      });
      store.showToast('ATMOSPHERE: GOLDEN SUNSET');
    } else {
      bg.setHex(0x0f172a);
      fog.color.setHex(0x0f172a);
      this.skyDomeMesh.material.map = createSkyGradientTexture(
        '#020617',
        '#1e3a8a',
        '#334155'
      );
      this.sunDirLight.color.setHex(0x93c5fd);
      this.sunDirLight.intensity = 0.78;
      this.hemiLight.color.setHex(0x38bdf8);
      this.celestialOrbGroup.position.set(110, 145, -185);
      (this.celestialOrbGroup.children[0] as THREE.Mesh<
        THREE.BufferGeometry,
        THREE.MeshBasicMaterial
      >).material.color.setHex(0xe0f2fe);
      (this.celestialOrbGroup.children[1] as THREE.Mesh<
        THREE.BufferGeometry,
        THREE.MeshBasicMaterial
      >).material.color.setHex(0x38bdf8);
      this.drone.droneLandingSpotLight.intensity = 3.6;
      this.archipelago.interiorGlowMaterials.forEach((m) => {
        m.emissiveIntensity = 1.35;
      });
      store.showToast('ATMOSPHERE: CALM TWILIGHT');
    }
    this.skyDomeMesh.material.needsUpdate = true;
    audioSynth.playBeep(820, 0.06);
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
    audioSynth.playBeep(960, 0.12);
  }

  public toggleRingChallenge(): void {
    this.ringCourseActive = !this.ringCourseActive;
    this.activeRingIndex = 0;
    this.ringCourseStartTime = performance.now();
    this.ringGateMeshes.forEach((g) => {
      g.group.visible = this.ringCourseActive;
    });

    const store = useLabStore.getState();
    if (this.ringCourseActive) {
      if (this.droneState.flightPhase === 'LANDED') {
        this.initiateAutoTakeoffSequence();
      }
      store.syncFlightStatus({
        ringCourseActive: true,
        ringGateLabel: `GATE 1/${this.ringGateMeshes.length}`,
      });
      store.showToast('SKY-RING TIME TRIAL STARTED — FLY THROUGH GREEN GATES!');
    } else {
      store.syncFlightStatus({
        ringCourseActive: false,
        ringGateLabel: 'RING TRIAL',
      });
    }
    audioSynth.playBeep(740, 0.08);
  }

  public applyDroneLivery(preset: DroneLiveryKey): void {
    const { droneHullMaterial, droneCanopyMaterial } = this.drone;
    const labels: Record<DroneLiveryKey, string> = {
      pearl: 'PEARL WHITE',
      stealth: 'STEALTH CARBON',
      rescue: 'SAR ORANGE',
      royal: 'GOLD SPEC',
    };
    if (preset === 'stealth') {
      droneHullMaterial.color.setHex(0x1e293b);
      droneCanopyMaterial.color.setHex(0x38bdf8);
    } else if (preset === 'rescue') {
      droneHullMaterial.color.setHex(0xf97316);
      droneCanopyMaterial.color.setHex(0x0f172a);
    } else if (preset === 'royal') {
      droneHullMaterial.color.setHex(0xfbbf24);
      droneCanopyMaterial.color.setHex(0x1e293b);
    } else {
      droneHullMaterial.color.setHex(0xf8fafc);
      droneCanopyMaterial.color.setHex(0x0284c7);
    }
    const store = useLabStore.getState();
    store.syncFlightStatus({ activeLivery: preset });
    store.showToast(`DRONE LIVERY: ${labels[preset]}`);
    audioSynth.playBeep(880, 0.05);
  }

  public setFlightProfile(profileKey: FlightProfileKey): void {
    this.currentFlightProfile = profileKey;
    const store = useLabStore.getState();
    store.syncFlightStatus({ flightProfile: profileKey });
    store.showToast(`FLIGHT CONTROLLER: ${profileKey} MODE`);
    audioSynth.playBeep(790, 0.06);
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
    audioSynth.playBeep(920, 0.08);
  }

  public triggerReturnToHome(isLowBattery = false): void {
    const store = useLabStore.getState();
    if (!store.bootCompleted) return;
    if (this.guidedTourActive) this.toggleGuidedTour(false);
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
    audioSynth.playBeep(540, 0.12);
  }

  public captureAerialSnapshot(): void {
    this.renderer.render(this.scene, this.camera);
    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = this.renderer.domElement.width;
    snapCanvas.height = this.renderer.domElement.height;
    const ctx = snapCanvas.getContext('2d')!;
    ctx.drawImage(this.renderer.domElement, 0, 0);

    const barH = Math.max(44, Math.round(snapCanvas.height * 0.065));
    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
    ctx.fillRect(0, snapCanvas.height - barH, snapCanvas.width, barH);

    ctx.fillStyle = '#38bdf8';
    ctx.font = `bold ${Math.max(13, Math.round(barH * 0.36))}px "JetBrains Mono", monospace`;
    const st = STATIONS[this.droneState.activeStationId];
    const stampText = `HADIYATNA.LAB // ${st.code} (${st.title.en}) • ALT: +${this.droneState.pos.y.toFixed(1)}m • POS: (${this.droneState.pos.x.toFixed(0)}, ${this.droneState.pos.z.toFixed(0)}) • ${new Date().toLocaleTimeString()}`;
    ctx.fillText(stampText, 20, snapCanvas.height - barH * 0.36);

    const dataUrl = snapCanvas.toDataURL('image/png');
    const store = useLabStore.getState();
    store.setSnapshotDataUrl(dataUrl);
    audioSynth.playBeep(1040, 0.08);
    store.showToast('AERIAL TELEMETRY PHOTO CAPTURED');
  }

  public setTouchKey(code: string, state: boolean): void {
    this.keys[code] = state;
  }

  public setIslandBiodomeMaterial(val: number): void {
    const mat = this.archipelago.islandFX.biodomeCoreMat;
    if (!mat) return;
    const colors = [0x4ade80, 0x22d3ee, 0xfacc15];
    const emissives = [0x10b981, 0x06b6d4, 0xeab308];
    mat.color.setHex(colors[val] ?? 0x4ade80);
    mat.emissive.setHex(emissives[val] ?? 0x10b981);
    mat.emissiveIntensity = val === 0 ? 0.35 : 0.85;
  }

  private updateDronePhysics(dt: number): void {
    const delta = Math.min(dt, 0.05);
    const elapsed = this.clock.getElapsedTime();
    const store = useLabStore.getState();

    const manualForward =
      (this.keys['KeyW'] || this.keys['ArrowUp'] ? 1 : 0) -
      (this.keys['KeyS'] || this.keys['ArrowDown'] ? 1 : 0);
    const manualStrafe =
      (this.keys['KeyD'] || this.keys['ArrowRight'] ? 1 : 0) -
      (this.keys['KeyA'] || this.keys['ArrowLeft'] ? 1 : 0);
    const manualAlt =
      (this.keys['Space'] ? 1 : 0) -
      (this.keys['ShiftLeft'] || this.keys['ShiftRight'] ? 1 : 0);
    const manualYaw = (this.keys['KeyQ'] ? 1 : 0) - (this.keys['KeyE'] ? 1 : 0);
    const hasManualInput =
      manualForward !== 0 || manualStrafe !== 0 || manualAlt !== 0 || manualYaw !== 0;

    if (hasManualInput && this.droneState.autopilot) {
      this.droneState.autopilot = false;
      if (this.guidedTourActive) this.toggleGuidedTour(false);
      store.syncFlightStatus({ autopilot: false });
      store.showToast(UI_TRANSLATIONS[store.lang].manualMode);
    }

    let localForwardInput = 0;
    let localRightInput = 0;

    if (this.droneState.flightPhase === 'LANDED') {
      this.droneState.rotorThrottle = THREE.MathUtils.lerp(
        this.droneState.rotorThrottle,
        0.0,
        delta * 3.5
      );
      this.droneState.vel.set(0, 0, 0);
      this.droneState.battery = Math.min(100, this.droneState.battery + delta * 4.5);

      if (
        store.bootCompleted &&
        (this.keys['Space'] || manualForward !== 0 || manualStrafe !== 0)
      ) {
        this.initiateAutoTakeoffSequence();
      }
    } else if (this.droneState.flightPhase === 'TAKING_OFF') {
      this.droneState.rotorThrottle = THREE.MathUtils.lerp(
        this.droneState.rotorThrottle,
        1.0,
        delta * 3.2
      );
      if (this.droneState.rotorThrottle > 0.65) {
        const dy = this.droneState.takeoffTargetY - this.droneState.pos.y;
        this.droneState.vel.y = THREE.MathUtils.clamp(dy * 2.4, 1.2, 6.5);
        this.droneState.pos.y += this.droneState.vel.y * delta;

        if (Math.abs(this.droneState.takeoffTargetY - this.droneState.pos.y) < 0.25) {
          this.droneState.pos.y = this.droneState.takeoffTargetY;
          this.droneState.vel.set(0, 0, 0);
          this.droneState.flightPhase = 'AIRBORNE';
          if (this.droneState.pendingAutopilotStationId !== null) {
            const nextId = this.droneState.pendingAutopilotStationId;
            this.droneState.pendingAutopilotStationId = null;
            this.engageAutopilot(nextId);
          } else {
            store.syncFlightStatus({ flightPhase: 'AIRBORNE' });
            store.showToast(
              store.lang === 'id'
                ? 'STANDBY HOVER AKTIF — SIAP TERBANG'
                : 'STANDBY HOVER LOCKED — READY FOR FLIGHT'
            );
          }
        }
      }
    } else if (this.droneState.flightPhase === 'LANDING') {
      this.droneState.rotorThrottle = THREE.MathUtils.lerp(
        this.droneState.rotorThrottle,
        0.85,
        delta * 3.0
      );
      const st = STATIONS[this.droneState.targetStationId];
      const padVec = new THREE.Vector3(st.padPoint.x, st.padPoint.y, st.padPoint.z);
      const horizDist = Math.hypot(
        padVec.x - this.droneState.pos.x,
        padVec.z - this.droneState.pos.z
      );

      if (horizDist > 0.45) {
        const approachTarget = new THREE.Vector3(
          padVec.x,
          Math.max(this.droneState.pos.y, padVec.y + 3.2),
          padVec.z
        );
        const toApproach = approachTarget.sub(this.droneState.pos);
        const stepVel = toApproach
          .normalize()
          .multiplyScalar(Math.min(14.0, horizDist * 2.6));
        this.droneState.vel.lerp(stepVel, delta * 5.0);
        this.droneState.pos.addScaledVector(this.droneState.vel, delta);
      } else {
        this.droneState.pos.x = THREE.MathUtils.lerp(
          this.droneState.pos.x,
          padVec.x,
          delta * 6.0
        );
        this.droneState.pos.z = THREE.MathUtils.lerp(
          this.droneState.pos.z,
          padVec.z,
          delta * 6.0
        );
        this.droneState.vel.set(0, -2.4, 0);
        this.droneState.pos.y += this.droneState.vel.y * delta;

        if (this.droneState.pos.y <= padVec.y + 0.04) {
          this.droneState.pos.set(padVec.x, padVec.y, padVec.z);
          this.droneState.vel.set(0, 0, 0);
          this.droneState.flightPhase = 'LANDED';
          this.droneState.activeStationId = st.id;
          store.syncFlightStatus({
            flightPhase: 'LANDED',
            activeStationId: st.id,
          });
          store.markIslandVisited(st.id);
          store.showToast(UI_TRANSLATIONS[store.lang].landedMsg);
          audioSynth.playBeep(440, 0.12);
        }
      }

      const lookDx = st.lookAtPoint.x - this.droneState.pos.x;
      const lookDz = st.lookAtPoint.z - this.droneState.pos.z;
      const targetYaw = Math.atan2(-lookDx, -lookDz);
      let yawDiff = targetYaw - this.droneState.yaw;
      while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
      while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
      this.droneState.yaw += yawDiff * delta * 4.5;
    } else if (this.droneState.flightPhase === 'AIRBORNE') {
      this.droneState.rotorThrottle = THREE.MathUtils.lerp(
        this.droneState.rotorThrottle,
        1.0,
        delta * 4.0
      );

      if (this.droneState.autopilot) {
        const targetSt = STATIONS[this.droneState.targetStationId];
        const hoverDest = new THREE.Vector3(
          targetSt.hoverPoint.x,
          targetSt.hoverPoint.y,
          targetSt.hoverPoint.z
        );
        const horizDist = Math.hypot(
          hoverDest.x - this.droneState.pos.x,
          hoverDest.z - this.droneState.pos.z
        );

        const arcHeightBoost = Math.min(18.0, horizDist * 0.22);
        const waypoint = new THREE.Vector3(
          hoverDest.x,
          hoverDest.y + arcHeightBoost,
          hoverDest.z
        );
        const toTarget = waypoint.sub(this.droneState.pos);
        const dist = toTarget.length();

        if (dist > 0.65) {
          const desiredSpeed = Math.min(28.0, Math.max(3.5, dist * 1.45));
          const desiredVel = toTarget.normalize().multiplyScalar(desiredSpeed);
          this.droneState.vel.lerp(desiredVel, delta * 3.8);

          let targetYaw: number;
          if (horizDist > 7.0) {
            targetYaw = Math.atan2(-this.droneState.vel.x, -this.droneState.vel.z);
          } else {
            const ldx = targetSt.lookAtPoint.x - this.droneState.pos.x;
            const ldz = targetSt.lookAtPoint.z - this.droneState.pos.z;
            targetYaw = Math.atan2(-ldx, -ldz);
          }
          let yawDiff = targetYaw - this.droneState.yaw;
          while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
          while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
          this.droneState.yaw += yawDiff * delta * 4.2;

          localForwardInput = Math.min(1.0, this.droneState.vel.length() / 18.0);
        } else {
          this.droneState.vel.multiplyScalar(0.82);
          this.droneState.autopilot = false;
          this.droneState.activeStationId = targetSt.id;
          store.syncFlightStatus({
            autopilot: false,
            activeStationId: targetSt.id,
          });
          store.markIslandVisited(targetSt.id);
          store.showToast(`${UI_TRANSLATIONS[store.lang].docked}: ${targetSt.shortName}`);
        }
      } else {
        const prof =
          FLIGHT_PROFILES[this.currentFlightProfile] || FLIGHT_PROFILES.SPORT;
        const yawAccel = prof.yaw;
        this.droneState.yawRate = THREE.MathUtils.lerp(
          this.droneState.yawRate,
          manualYaw * yawAccel,
          delta * 7.0
        );
        this.droneState.yaw += this.droneState.yawRate * delta;

        const speedMult = this.boostActive ? prof.boost : prof.speed;
        const forwardVec = new THREE.Vector3(
          -Math.sin(this.droneState.yaw),
          0,
          -Math.cos(this.droneState.yaw)
        );
        const rightVec = new THREE.Vector3(
          Math.cos(this.droneState.yaw),
          0,
          -Math.sin(this.droneState.yaw)
        );

        const accel = new THREE.Vector3();
        accel.addScaledVector(forwardVec, manualForward * speedMult);
        accel.addScaledVector(rightVec, manualStrafe * speedMult);
        accel.y = manualAlt * 18.0;

        this.droneState.vel.addScaledVector(accel, delta);
        this.droneState.vel.multiplyScalar(Math.pow(prof.damping, delta));

        localForwardInput = manualForward * (this.boostActive ? 1.35 : 1.0);
        localRightInput = manualStrafe;
      }

      const drainRate = this.boostActive
        ? 1.15
        : 0.18 + this.droneState.vel.length() * 0.012;
      this.droneState.battery = Math.max(
        5.0,
        this.droneState.battery - drainRate * delta
      );
      if (
        this.droneState.battery <= 12.0 &&
        this.droneState.flightPhase === 'AIRBORNE' &&
        !this.droneState.autopilot
      ) {
        this.triggerReturnToHome(true);
      }

      this.windState.angle = elapsed * 0.12;
      this.windState.speedKt = 2.8 + Math.sin(elapsed * 0.45) * 1.4;
      if (!this.droneState.autopilot) {
        this.droneState.vel.x += Math.cos(this.windState.angle) * 0.35 * delta;
        this.droneState.vel.z += Math.sin(this.windState.angle) * 0.35 * delta;
      }

      this.droneState.pos.addScaledVector(this.droneState.vel, delta);

      this.droneState.pos.x = THREE.MathUtils.clamp(this.droneState.pos.x, -260, 260);
      this.droneState.pos.z = THREE.MathUtils.clamp(this.droneState.pos.z, -240, 240);
      this.droneState.pos.y = THREE.MathUtils.clamp(this.droneState.pos.y, -28, 138);

      STATIONS.forEach((st) => {
        const dx = this.droneState.pos.x - st.position.x;
        const dz = this.droneState.pos.z - st.position.z;
        const distHoriz = Math.hypot(dx, dz);
        const deckTopY = st.padPoint.y;
        const cliffBottomY = st.position.y - st.islandDepth;

        if (
          distHoriz < st.islandRadius * 0.96 &&
          this.droneState.pos.y > cliffBottomY &&
          this.droneState.pos.y < deckTopY
        ) {
          if (this.droneState.pos.y > deckTopY - 2.6) {
            this.droneState.pos.y = deckTopY;
            if (this.droneState.vel.y < 0) this.droneState.vel.y = 0;
            if (manualAlt < 0 && !this.droneState.autopilot) {
              this.droneState.activeStationId = st.id;
              this.droneState.vel.set(0, 0, 0);
              this.droneState.flightPhase = 'LANDED';
              store.syncFlightStatus({
                flightPhase: 'LANDED',
                activeStationId: st.id,
              });
              store.markIslandVisited(st.id);
              store.showToast(UI_TRANSLATIONS[store.lang].landedMsg);
            }
          } else {
            const pushAngle = Math.atan2(dz, dx);
            this.droneState.pos.x =
              st.position.x + Math.cos(pushAngle) * (st.islandRadius * 0.97);
            this.droneState.pos.z =
              st.position.z + Math.sin(pushAngle) * (st.islandRadius * 0.97);
          }
        }

        const bldX = st.position.x;
        const bldZ = st.position.z - 5.5;
        const distToBld = Math.hypot(
          this.droneState.pos.x - bldX,
          this.droneState.pos.z - bldZ
        );
        const bldRoofY = st.position.y + (st.id === 9 ? 31.0 : 12.5);
        const bldRadius = 6.8;
        if (
          distToBld < bldRadius &&
          this.droneState.pos.y >= deckTopY &&
          this.droneState.pos.y < bldRoofY
        ) {
          const pushAng = Math.atan2(
            this.droneState.pos.z - bldZ,
            this.droneState.pos.x - bldX
          );
          this.droneState.pos.x = bldX + Math.cos(pushAng) * bldRadius;
          this.droneState.pos.z = bldZ + Math.sin(pushAng) * bldRadius;
        }
      });
    }

    const hoverBob =
      this.droneState.flightPhase === 'LANDED' ? 0 : Math.sin(elapsed * 3.2) * 0.09;
    this.drone.droneGroup.position.set(
      this.droneState.pos.x,
      this.droneState.pos.y + hoverBob,
      this.droneState.pos.z
    );

    const profTilt = (
      FLIGHT_PROFILES[this.currentFlightProfile] || FLIGHT_PROFILES.SPORT
    ).tilt;
    const targetPitch =
      this.droneState.flightPhase === 'LANDED' ? 0 : -localForwardInput * profTilt;
    const targetRoll =
      this.droneState.flightPhase === 'LANDED' ? 0 : -localRightInput * profTilt;
    this.droneState.pitch = THREE.MathUtils.lerp(
      this.droneState.pitch,
      targetPitch,
      delta * 8.0
    );
    this.droneState.roll = THREE.MathUtils.lerp(
      this.droneState.roll,
      targetRoll,
      delta * 8.0
    );

    this.drone.droneGroup.rotation.order = 'YXZ';
    this.drone.droneGroup.rotation.y = this.droneState.yaw;
    this.drone.droneGroup.rotation.x = this.droneState.pitch;
    this.drone.droneGroup.rotation.z = this.droneState.roll;

    this.drone.gimbalGroup.rotation.x = -this.droneState.pitch * 0.85;
    this.drone.gimbalGroup.rotation.z = -this.droneState.roll * 0.85;

    const spinSpeed = this.droneState.rotorThrottle * (this.boostActive ? 55.0 : 38.0);
    this.drone.droneRotors.forEach((r) => {
      r.group.rotation.y += spinSpeed * r.dir * delta;
    });
    this.drone.droneBlurDiscs.forEach((disc) => {
      (disc.material as THREE.MeshBasicMaterial).opacity =
        this.droneState.rotorThrottle * 0.32;
    });

    audioSynth.updateRotorSound(
      this.droneState.rotorThrottle,
      this.droneState.vel.length()
    );

    if (this.wingmanSwarmActive && this.drone.wingmanDrones.length) {
      const rightVec = new THREE.Vector3(
        Math.cos(this.droneState.yaw),
        0,
        -Math.sin(this.droneState.yaw)
      );
      const backVec = new THREE.Vector3(
        Math.sin(this.droneState.yaw),
        0,
        Math.cos(this.droneState.yaw)
      );
      this.drone.wingmanDrones.forEach((w, idx) => {
        const targetPos = this.droneState.pos
          .clone()
          .addScaledVector(rightVec, w.side * 2.5)
          .addScaledVector(backVec, 2.2)
          .add(new THREE.Vector3(0, 0.35 + Math.sin(elapsed * 4.0 + idx) * 0.15, 0));
        w.pos.lerp(targetPos, delta * 5.5);
        w.group.position.copy(w.pos);
        w.group.rotation.y = this.droneState.yaw;
        w.group.rotation.z = this.droneState.roll * 0.85;
        w.group.rotation.x = this.droneState.pitch * 0.85;
        w.prop.rotation.y += delta * 42.0;
      });
    }
  }

  private updateCameraSystem(dt: number): void {
    const delta = Math.min(dt, 0.05);
    const targetFov = this.boostActive ? 68 : 58;
    if (Math.abs(this.camera.fov - targetFov) > 0.1) {
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, delta * 6.0);
      this.camera.updateProjectionMatrix();
    }

    if (this.droneState.cameraMode === 0) {
      const totalYaw = this.droneState.yaw + this.camOrbit.theta;
      const dist =
        this.droneState.flightPhase === 'LANDED' ? 6.8 : this.camOrbit.distance;
      const heightOffset = Math.sin(this.camOrbit.phi) * dist;
      const horizRadius = Math.cos(this.camOrbit.phi) * dist;

      const desiredCamPos = new THREE.Vector3(
        this.droneState.pos.x + Math.sin(totalYaw) * horizRadius,
        this.droneState.pos.y + heightOffset + 1.1,
        this.droneState.pos.z + Math.cos(totalYaw) * horizRadius
      );
      this.camera.position.lerp(desiredCamPos, delta * 7.5);

      const lookTarget = new THREE.Vector3(
        this.droneState.pos.x - Math.sin(this.droneState.yaw) * 2.4,
        this.droneState.pos.y + 0.45,
        this.droneState.pos.z - Math.cos(this.droneState.yaw) * 2.4
      );
      this.camera.lookAt(lookTarget);
    } else if (this.droneState.cameraMode === 1) {
      const fpvOffset = new THREE.Vector3(0, -0.1, -1.15).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        this.droneState.yaw
      );
      this.camera.position.copy(this.droneState.pos).add(fpvOffset);
      const forwardLook = new THREE.Vector3(
        this.droneState.pos.x - Math.sin(this.droneState.yaw) * 25,
        this.droneState.pos.y - 1.5,
        this.droneState.pos.z - Math.cos(this.droneState.yaw) * 25
      );
      this.camera.lookAt(forwardLook);
    } else {
      const topPos = new THREE.Vector3(
        this.droneState.pos.x,
        this.droneState.pos.y + 32,
        this.droneState.pos.z + 10
      );
      this.camera.position.lerp(topPos, delta * 5.0);
      this.camera.lookAt(this.droneState.pos);
    }
  }

  private updateEnvironmentAndHUD(dt: number): void {
    const elapsed = this.clock.getElapsedTime();
    const store = useLabStore.getState();
    const islandState = store.islandState;
    const { islandFX } = this.archipelago;

    this.cloudGroups.forEach((c) => {
      c.group.position.x += c.speed * dt;
      if (c.group.position.x > 160) c.group.position.x = -160;
    });

    this.archipelago.windTurbineRotors.forEach((r) => {
      const mult = islandState.turbineOverdrive ? 3.4 : 1.15;
      r.rotation.z -= dt * mult;
    });

    islandFX.fountainJets.forEach((j) => {
      if (islandState.fountainMode === 0) {
        j.mesh.visible = false;
      } else {
        j.mesh.visible = true;
        const pulse = islandState.fountainMode === 2 ? 1.55 : 1.0;
        const sy = (0.65 + 0.45 * Math.sin(elapsed * 5.0 + j.phase)) * pulse;
        j.mesh.scale.set(1, sy, 1);
        j.mesh.position.y = 0.2 + sy * 1.6;
      }
    });

    if (islandFX.rotundaGlobe) {
      islandFX.rotundaGlobe.rotation.y = elapsed * 0.8;
      const gScale =
        islandState.fountainMode === 2
          ? 1.45 + Math.sin(elapsed * 3.0) * 0.12
          : 0.85;
      islandFX.rotundaGlobe.scale.set(gScale, gScale, gScale);
      (islandFX.rotundaGlobe.material as THREE.MeshBasicMaterial).opacity =
        islandState.fountainMode === 2 ? 0.68 : 0.25;
    }

    if (islandFX.obsPivot && islandFX.obsLaser) {
      if (islandState.starTarget === 0) {
        islandFX.obsLaser.visible = false;
        islandFX.obsPivot.rotation.y += dt * 0.15;
      } else {
        islandFX.obsLaser.visible = true;
        const targetAngles = [0, 0.45, -1.15, 2.1];
        const targetYaw = targetAngles[islandState.starTarget] || 0;
        islandFX.obsPivot.rotation.y = THREE.MathUtils.lerp(
          islandFX.obsPivot.rotation.y,
          targetYaw,
          dt * 3.5
        );
      }
    }

    if (islandFX.rainbowMesh) {
      islandFX.rainbowMesh.visible = islandState.rainbowActive;
      (islandFX.rainbowMesh.material as THREE.MeshBasicMaterial).opacity =
        0.35 + 0.15 * Math.sin(elapsed * 2.0);
    }

    islandFX.helixNodes.forEach((mat, idx) => {
      if (islandState.helixMode === 0) {
        mat.emissiveIntensity = 0.3;
      } else {
        const waveSpeed = islandState.helixMode === 2 ? 9.0 : 4.2;
        const wave = 0.5 + 0.5 * Math.sin(elapsed * waveSpeed - idx * 0.55);
        mat.emissiveIntensity = 0.25 + wave * 1.45;
      }
    });

    islandFX.solarBeams.forEach((line) => {
      line.visible = islandState.solarConverge;
    });

    if (islandFX.hangarScanRing) {
      islandFX.hangarScanRing.visible = islandState.hangarScanner;
      islandFX.hangarScanRing.position.y = 2.6 + Math.sin(elapsed * 2.4) * 2.1;
    }

    islandFX.skyLanterns.forEach((l) => {
      l.mesh.visible = islandState.lanternsActive;
      if (islandState.lanternsActive) {
        l.mesh.position.y += l.speed * dt;
        l.mesh.position.x = Math.cos(l.baseAngle + elapsed * 0.3) * l.rad;
        l.mesh.position.z = Math.sin(l.baseAngle + elapsed * 0.3) * l.rad;
        if (l.mesh.position.y > 22.0) l.mesh.position.y = 1.5;
      }
    });

    islandFX.eqBars.forEach((bar) => {
      if (islandState.sonicHarmony === 0) {
        bar.mesh.scale.y = THREE.MathUtils.lerp(bar.mesh.scale.y, 0.25, dt * 5.0);
      } else {
        const freq = 3.5 + islandState.sonicHarmony * 1.8;
        const hScale = 0.4 + 1.65 * Math.abs(Math.sin(elapsed * freq + bar.index * 0.55));
        bar.mesh.scale.y = hScale;
        bar.mesh.position.y = hScale;
      }
    });

    if (islandFX.uplinkPillar) {
      islandFX.uplinkPillar.visible = islandState.uplinkBeam;
      if (islandState.uplinkBeam) {
        const pScale = 0.85 + 0.25 * Math.sin(elapsed * 8.0);
        islandFX.uplinkPillar.scale.set(pScale, 1, pScale);
      }
    }

    this.archipelago.dynamicArchParts.forEach((part, idx) => {
      if (part.type === 'spinY') {
        const hMult =
          islandState.helixMode === 2 ? 2.8 : islandState.helixMode === 0 ? 0.2 : 1.0;
        part.mesh.rotation.y += dt * part.speed * hMult;
      } else if (part.type === 'tokamak') {
        const sMult = islandState.solarConverge ? 2.4 : 0.7;
        part.mesh.rotation.y += dt * part.speed * sMult;
        part.mesh.position.y = 7.2 + Math.sin(elapsed * 2.2) * 0.45;
      } else if (part.type === 'sonic') {
        const aMult =
          islandState.sonicHarmony === 0 ? 0.15 : 0.8 + islandState.sonicHarmony * 0.45;
        part.mesh.children.forEach((ring, rIdx) => {
          ring.rotation.x += dt * (0.5 + rIdx * 0.25) * aMult;
          ring.rotation.y -= dt * (0.4 + rIdx * 0.2) * aMult;
        });
      } else if (part.type === 'dish') {
        part.mesh.rotation.y = islandState.uplinkBeam
          ? 0
          : Math.sin(elapsed * part.speed + idx) * 0.65;
      }
    });

    this.archipelago.waterfallDroplets.forEach((d) => {
      if (islandState.waterfallMode === 2) {
        d.mesh.position.y += d.speed * 0.85 * dt;
        if (d.mesh.position.y > d.topY + 6.0) d.mesh.position.y = d.bottomY;
      } else {
        const spdMult = islandState.waterfallMode === 1 ? 2.2 : 1.0;
        d.mesh.position.y -= d.speed * spdMult * dt;
        if (d.mesh.position.y < d.bottomY) d.mesh.position.y = d.topY;
      }
    });

    this.birdFlock.forEach((b) => {
      b.angle += b.speed * dt;
      const bx = Math.cos(b.angle) * b.orbitRadius;
      const bz = Math.sin(b.angle) * b.orbitRadius;
      b.group.position.set(
        bx,
        b.baseAlt + Math.sin(elapsed * 1.5 + b.phase) * 1.8,
        bz
      );
      b.group.rotation.y = -b.angle;
      const flap = Math.sin(elapsed * 9.0 + b.phase) * 0.45;
      b.leftWing.rotation.z = flap;
      b.rightWing.rotation.z = -flap;
    });

    let closestStation = STATIONS[0];
    let minDistance = Infinity;

    this.archipelago.stationObjects.forEach((obj: StationSceneObject, idx: number) => {
      obj.artifactMesh.rotation.y = elapsed * 0.7;
      obj.artifactMesh.position.y = obj.beaconY + Math.sin(elapsed * 1.8 + idx) * 0.35;
      obj.holoRing.position.y = obj.beaconY;
      obj.holoRing.rotation.z = -elapsed * 0.45;

      const padMat = obj.padBeaconRing.material as THREE.MeshBasicMaterial;
      if (
        this.droneState.flightPhase === 'LANDED' &&
        this.droneState.activeStationId === obj.data.id
      ) {
        padMat.color.setHex(0x10b981);
        padMat.opacity = 0.9;
      } else if (
        this.droneState.flightPhase === 'LANDING' &&
        this.droneState.targetStationId === obj.data.id
      ) {
        padMat.color.setHex(0xf59e0b);
        padMat.opacity = 0.45 + 0.45 * Math.sin(elapsed * 8.0);
      } else {
        padMat.color.setHex(obj.data.colorHex);
        padMat.opacity = 0.55;
      }

      const dist3D = this.droneState.pos.distanceTo(
        new THREE.Vector3(
          obj.data.hoverPoint.x,
          obj.data.hoverPoint.y,
          obj.data.hoverPoint.z
        )
      );
      if (dist3D < minDistance) {
        minDistance = dist3D;
        closestStation = obj.data;
      }
    });

    if (closestStation.id !== this.droneState.activeStationId && minDistance < 28.0) {
      this.droneState.activeStationId = closestStation.id;
      store.syncFlightStatus({ activeStationId: closestStation.id });
      store.markIslandVisited(closestStation.id);
    }

    this.archipelago.skyPathLines.forEach((sp) => {
      const isTarget =
        sp.stationId === this.droneState.activeStationId ||
        sp.stationId === this.droneState.targetStationId;
      (sp.line.material as THREE.LineDashedMaterial).opacity = isTarget ? 0.78 : 0.25;
    });

    this.archipelago.gravityRingMeshes.forEach((g, idx) => {
      (g.ring.material as THREE.MeshBasicMaterial).opacity =
        0.6 + 0.28 * Math.sin(elapsed * 2.4 + idx);
      g.core.scale.y = 0.9 + 0.15 * Math.sin(elapsed * 3.2 + idx);
    });

    if (
      this.guidedTourActive &&
      !this.droneState.autopilot &&
      this.droneState.flightPhase === 'AIRBORNE'
    ) {
      this.guidedTourTimer += dt;
      this.camOrbit.theta += dt * 0.24;
      if (this.guidedTourTimer > 6.0) {
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

    if (
      horizToIsland < closestStation.islandRadius * 0.95 &&
      agl > 0.12 &&
      agl < 28.0
    ) {
      this.drone.groundTargetGroup.visible = true;
      this.drone.altitudeLaserLine.visible = true;
      this.drone.groundTargetGroup.position.set(
        this.droneState.pos.x,
        deckY + 0.02,
        this.droneState.pos.z
      );
      this.drone.groundTargetGroup.rotation.y = elapsed * 1.2;

      const posAttr = this.drone.altitudeLaserLine.geometry.attributes.position;
      posAttr.setXYZ(
        0,
        this.droneState.pos.x,
        this.droneState.pos.y - 0.35,
        this.droneState.pos.z
      );
      posAttr.setXYZ(1, this.droneState.pos.x, deckY + 0.02, this.droneState.pos.z);
      posAttr.needsUpdate = true;
      this.drone.altitudeLaserLine.computeLineDistances();
    } else {
      this.drone.groundTargetGroup.visible = false;
      this.drone.altitudeLaserLine.visible = false;
    }

    const downwashMat = this.drone.downwashRingMesh
      .material as THREE.MeshBasicMaterial;
    if (
      horizToIsland < closestStation.islandRadius * 0.9 &&
      agl >= 0 &&
      agl < 7.5 &&
      this.droneState.rotorThrottle > 0.15
    ) {
      this.drone.downwashRingMesh.position.set(
        this.droneState.pos.x,
        deckY + 0.03,
        this.droneState.pos.z
      );
      const s = 0.8 + (1 - agl / 7.5) * 0.9 + Math.sin(elapsed * 14) * 0.08;
      this.drone.downwashRingMesh.scale.set(s, s, 1);
      downwashMat.opacity = (1 - agl / 7.5) * 0.38 * this.droneState.rotorThrottle;
    } else {
      downwashMat.opacity = 0;
    }

    const leftTip = new THREE.Vector3(-1.15, 0.1, 1.05).applyMatrix4(
      this.drone.droneGroup.matrixWorld
    );
    const rightTip = new THREE.Vector3(1.15, 0.1, 1.05).applyMatrix4(
      this.drone.droneGroup.matrixWorld
    );
    this.drone.contrailLeftHistory.pop();
    this.drone.contrailLeftHistory.unshift(leftTip);
    this.drone.contrailRightHistory.pop();
    this.drone.contrailRightHistory.unshift(rightTip);
    this.drone.contrailLeftLine.geometry.setFromPoints(this.drone.contrailLeftHistory);
    this.drone.contrailRightLine.geometry.setFromPoints(this.drone.contrailRightHistory);
    const spd = this.droneState.vel.length();
    (this.drone.contrailLeftLine.material as THREE.LineBasicMaterial).opacity =
      spd > 5.0 ? Math.min(0.55, (spd - 5.0) / 22.0) : 0.0;

    if (this.lidarScanActive) {
      this.lidarScanRadius += dt * 55;
      this.lidarRingMesh.scale.set(this.lidarScanRadius, this.lidarScanRadius, 1);
      this.lidarRingMesh.material.opacity = Math.max(
        0,
        0.75 - this.lidarScanRadius / 95
      );
      if (this.lidarScanRadius > 95) {
        this.lidarScanActive = false;
        this.lidarRingMesh.material.opacity = 0;
      }
    }

    // Direct 60Hz DOM Telemetry Updates (Zero React Re-Renders)
    const hdgDeg =
      ((Math.round((-this.droneState.yaw * 180) / Math.PI) % 360) + 360) % 360;
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const dirStr = dirs[Math.round(hdgDeg / 45) % 8];

    if (this.domRefs.headingEl) {
      this.domRefs.headingEl.textContent =
        String(hdgDeg).padStart(3, '0') + '° ' + dirStr;
    }
    if (this.domRefs.altitudeEl) {
      this.domRefs.altitudeEl.textContent =
        (this.droneState.pos.y >= 0 ? '+' : '') +
        this.droneState.pos.y.toFixed(1) +
        'm';
    }
    if (this.domRefs.speedEl) {
      this.domRefs.speedEl.textContent =
        this.droneState.vel.length().toFixed(1) + ' m/s';
    }
    if (this.domRefs.batteryEl) {
      const batVal = Math.round(this.droneState.battery);
      this.domRefs.batteryEl.textContent = `BAT ${batVal}% ${
        this.droneState.flightPhase === 'LANDED' ? '⚡ CHG' : '⚡'
      }`;
      this.domRefs.batteryEl.className =
        batVal > 35
          ? 'text-emerald-600 font-bold'
          : batVal > 15
          ? 'text-amber-600 font-bold'
          : 'text-rose-600 font-bold animate-pulse';
    }
    if (this.domRefs.stationDistanceEl) {
      if (this.droneState.flightPhase === 'LANDED') {
        this.domRefs.stationDistanceEl.textContent = 'LANDED ON PAD';
      } else {
        this.domRefs.stationDistanceEl.textContent =
          minDistance < 6.0
            ? UI_TRANSLATIONS[store.lang].docked
            : `${minDistance.toFixed(0)}m`;
      }
    }

    this.drawRadarMinimap();
    this.updateSpatialWaypointProjections();
    this.updateRingChallengeCourse();
  }

  private drawRadarMinimap(): void {
    const canvas = this.domRefs.radarCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
    ctx.lineWidth = 1;
    [24, 48, 72].forEach((r) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    const scale = 0.42;
    const visited = useLabStore.getState().visitedIslands;

    STATIONS.forEach((st) => {
      const ix = cx + st.position.x * scale;
      const iy = cy + st.position.z * scale;
      const isAct = st.id === this.droneState.activeStationId;
      const isVis = visited.includes(st.id);
      ctx.fillStyle = isAct
        ? '#38bdf8'
        : isVis
        ? '#10b981'
        : 'rgba(148, 163, 184, 0.7)';
      ctx.beginPath();
      ctx.arc(ix, iy, isAct ? 5.2 : 3.6, 0, Math.PI * 2);
      ctx.fill();
    });

    const dx = cx + this.droneState.pos.x * scale;
    const dy = cy + this.droneState.pos.z * scale;
    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(-this.droneState.yaw);
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(0, -5.5);
    ctx.lineTo(-4, 4.5);
    ctx.lineTo(4, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private updateSpatialWaypointProjections(): void {
    if (!this.spatialMarkerElements.length) return;
    const halfW = window.innerWidth / 2;
    const halfH = window.innerHeight / 2;

    this.spatialMarkerElements.forEach((item) => {
      const worldPos = new THREE.Vector3(
        item.station.position.x,
        item.station.position.y + 15.5,
        item.station.position.z - 4.0
      );
      const dist = Math.round(this.droneState.pos.distanceTo(worldPos));
      const proj = worldPos.clone().project(this.camera);

      if (proj.z > 1.0 || dist < 18) {
        item.el.style.opacity = '0';
        item.el.style.pointerEvents = 'none';
      } else {
        const sx = proj.x * halfW + halfW;
        const sy = -proj.y * halfH + halfH;
        item.el.style.left = `${sx}px`;
        item.el.style.top = `${sy}px`;
        item.el.style.opacity =
          item.station.id === this.droneState.activeStationId ? '0.95' : '0.68';
        item.el.style.pointerEvents = 'auto';
        if (item.distEl) item.distEl.textContent = `${dist}m`;
      }
    });
  }

  private updateRingChallengeCourse(): void {
    if (!this.ringCourseActive) return;
    const elapsed = this.clock.getElapsedTime();
    this.ringGateMeshes.forEach((g, idx) => {
      g.innerGlow.rotation.z = elapsed * 1.8;
      const isCurrent = idx === this.activeRingIndex;
      g.outerRing.material.color.setHex(isCurrent ? 0x10b981 : 0xf43f5e);
      const s = isCurrent ? 1.0 + Math.sin(elapsed * 6.0) * 0.06 : 0.85;
      g.group.scale.set(s, s, s);
    });

    const currentGate = this.ringGateMeshes[this.activeRingIndex];
    if (
      currentGate &&
      this.droneState.pos.distanceTo(currentGate.group.position) < 4.5
    ) {
      audioSynth.playBeep(980, 0.09);
      this.activeRingIndex++;
      const store = useLabStore.getState();
      if (this.activeRingIndex >= this.ringGateMeshes.length) {
        const totalTime = (
          (performance.now() - this.ringCourseStartTime) /
          1000
        ).toFixed(1);
        store.showToast(`SKY-RING COURSE COMPLETE IN ${totalTime}s!`);
        this.toggleRingChallenge();
      } else {
        store.syncFlightStatus({
          ringGateLabel: `GATE ${this.activeRingIndex + 1}/${
            this.ringGateMeshes.length
          }`,
        });
        store.showToast(
          `GATE ${this.activeRingIndex}/${this.ringGateMeshes.length} CLEARED!`
        );
      }
    }
  }

  private onResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    const activeTag = document.activeElement?.tagName;
    if (activeTag && ['INPUT', 'TEXTAREA'].includes(activeTag)) return;

    this.keys[e.code] = true;
    const store = useLabStore.getState();

    if (e.code === 'KeyB') this.boostActive = true;
    if (e.code === 'KeyT') this.toggleLandingTakeoff();
    if (e.code === 'KeyH') this.triggerReturnToHome();
    if (e.code === 'KeyM') store.setHangarModalOpen(true);
    if (e.code === 'KeyP') this.captureAerialSnapshot();
    if (e.code === 'KeyG') this.toggleGuidedTour();
    if (e.code === 'KeyF') this.triggerLidarScan();
    if (e.code === 'KeyC') this.cycleCameraMode();
    if (e.code === 'KeyV') this.cycleAtmosphere();
    if (e.code === 'KeyR') this.toggleRingChallenge();
    if (e.code === 'KeyK') store.setTerminalModalOpen(true);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys[e.code] = false;
    if (e.code === 'KeyB') this.boostActive = false;
  };

  private onMouseDown = (e: MouseEvent): void => {
    this.camOrbit.isDragging = true;
    this.camOrbit.lastX = e.clientX;
    this.camOrbit.lastY = e.clientY;
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.camOrbit.isDragging) return;
    const dx = e.clientX - this.camOrbit.lastX;
    const dy = e.clientY - this.camOrbit.lastY;
    this.camOrbit.lastX = e.clientX;
    this.camOrbit.lastY = e.clientY;
    this.camOrbit.theta -= dx * 0.006;
    this.camOrbit.phi = THREE.MathUtils.clamp(
      this.camOrbit.phi + dy * 0.005,
      0.08,
      1.15
    );
  };

  private onMouseUp = (): void => {
    this.camOrbit.isDragging = false;
  };

  private onWheel = (e: WheelEvent): void => {
    this.camOrbit.distance = THREE.MathUtils.clamp(
      this.camOrbit.distance + e.deltaY * 0.01,
      4.5,
      22.0
    );
  };

  private onDoubleClick = (e: MouseEvent): void => {
    this.pointerNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.pointerNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.pointerNDC, this.camera);
    const islandGroups = this.archipelago.stationObjects.map((s) => s.group);
    const hits = this.raycaster.intersectObjects(islandGroups, true);
    if (hits.length > 0) {
      let hitObj: THREE.Object3D | null = hits[0].object;
      while (hitObj && hitObj.parent && !islandGroups.includes(hitObj as THREE.Group)) {
        hitObj = hitObj.parent;
      }
      const foundIdx = islandGroups.indexOf(hitObj as THREE.Group);
      if (foundIdx !== -1) {
        this.engageAutopilot(foundIdx);
      }
    }
  };

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);

    this.container.addEventListener('mousedown', this.onMouseDown);
    this.container.addEventListener('wheel', this.onWheel, { passive: true });
    this.container.addEventListener('dblclick', this.onDoubleClick);
  }

  private animate = (): void => {
    this.animFrameId = requestAnimationFrame(this.animate);
    const dt = this.clock.getDelta();
    this.updateDronePhysics(dt);
    this.updateCameraSystem(dt);
    this.updateEnvironmentAndHUD(dt);
    this.renderer.render(this.scene, this.camera);
  };

  public dispose(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);

    this.container.removeEventListener('mousedown', this.onMouseDown);
    this.container.removeEventListener('wheel', this.onWheel);
    this.container.removeEventListener('dblclick', this.onDoubleClick);
    this.renderer.dispose();
  }
}
