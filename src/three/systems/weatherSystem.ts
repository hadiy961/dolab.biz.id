import * as THREE from 'three';
import { WEATHER_PRESETS } from '../../data/flightAndWeather';
import { AtmosphereMode } from '../../types/lab';
import { createSkyGradientTexture } from '../textures';
import { DroneBuildResult } from '../droneBuilder';

export interface WindTelemetryState {
  angle: number;
  speedKt: number;
  gustFactor: number;
  turbulenceG: number;
}

export interface WeatherLightingContext {
  scene: THREE.Scene;
  skyDomeMesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  sunDirLight: THREE.DirectionalLight;
  hemiLight: THREE.HemisphereLight;
  celestialOrbGroup: THREE.Group;
  drone: DroneBuildResult;
  rainSystemGroup: THREE.Group;
  interiorGlowMaterials: THREE.MeshStandardMaterial[];
}

export function applyAtmospherePreset(
  mode: AtmosphereMode,
  ctx: WeatherLightingContext
): void {
  const bg = ctx.scene.background as THREE.Color;
  const fog = ctx.scene.fog as THREE.FogExp2;
  ctx.rainSystemGroup.visible = mode === 3;

  const orbCore = ctx.celestialOrbGroup.children[0] as THREE.Mesh<
    THREE.BufferGeometry,
    THREE.MeshBasicMaterial
  >;
  const orbHalo = ctx.celestialOrbGroup.children[1] as THREE.Mesh<
    THREE.BufferGeometry,
    THREE.MeshBasicMaterial
  >;

  if (mode === 0) {
    // 0: Serene Daylight
    bg.setHex(0xc8e0f4);
    fog.color.setHex(0xd8eaf7);
    fog.density = 0.0014;
    ctx.skyDomeMesh.material.map = createSkyGradientTexture('#60a5fa', '#bae6fd', '#f8fafc');
    ctx.sunDirLight.color.setHex(0xfffbeb);
    ctx.sunDirLight.intensity = 1.35;
    ctx.hemiLight.color.setHex(0xe0f2fe);
    ctx.celestialOrbGroup.visible = true;
    ctx.celestialOrbGroup.position.set(140, 165, -180);
    orbCore.material.color.setHex(0xfffbeb);
    orbHalo.material.color.setHex(0xfef08a);
    ctx.drone.droneLandingSpotLight.intensity = 1.2;
    ctx.drone.navSpotlightCone.visible = false;
    ctx.interiorGlowMaterials.forEach((m) => (m.emissiveIntensity = 0.45));
  } else if (mode === 1) {
    // 1: Golden Sunset
    bg.setHex(0xfed7aa);
    fog.color.setHex(0xffedd5);
    fog.density = 0.0016;
    ctx.skyDomeMesh.material.map = createSkyGradientTexture('#4f46e5', '#fb923c', '#fef3c7');
    ctx.sunDirLight.color.setHex(0xfdba74);
    ctx.sunDirLight.intensity = 1.5;
    ctx.hemiLight.color.setHex(0xfde68a);
    ctx.celestialOrbGroup.visible = true;
    ctx.celestialOrbGroup.position.set(-165, 58, -190);
    orbCore.material.color.setHex(0xffedd5);
    orbHalo.material.color.setHex(0xf97316);
    ctx.drone.droneLandingSpotLight.intensity = 2.0;
    ctx.drone.navSpotlightCone.visible = false;
    ctx.interiorGlowMaterials.forEach((m) => (m.emissiveIntensity = 0.85));
  } else if (mode === 2) {
    // 2: Calm Twilight
    bg.setHex(0x0f172a);
    fog.color.setHex(0x0f172a);
    fog.density = 0.0018;
    ctx.skyDomeMesh.material.map = createSkyGradientTexture('#020617', '#1e3a8a', '#334155');
    ctx.sunDirLight.color.setHex(0x93c5fd);
    ctx.sunDirLight.intensity = 0.78;
    ctx.hemiLight.color.setHex(0x38bdf8);
    ctx.celestialOrbGroup.visible = true;
    ctx.celestialOrbGroup.position.set(110, 145, -185);
    orbCore.material.color.setHex(0xe0f2fe);
    orbHalo.material.color.setHex(0x38bdf8);
    ctx.drone.droneLandingSpotLight.intensity = 3.8;
    ctx.drone.navSpotlightCone.visible = true;
    ctx.drone.navSpotlightCone.material.color.setHex(0x38bdf8);
    ctx.drone.navSpotlightCone.material.opacity = 0.16;
    ctx.interiorGlowMaterials.forEach((m) => (m.emissiveIntensity = 1.35));
  } else if (mode === 3) {
    // 3: Storm / High-Wind Squall
    bg.setHex(0x090d16);
    fog.color.setHex(0x111827);
    fog.density = 0.0038;
    ctx.skyDomeMesh.material.map = createSkyGradientTexture('#020617', '#0f172a', '#1e293b');
    ctx.sunDirLight.color.setHex(0x64748b);
    ctx.sunDirLight.intensity = 0.52;
    ctx.hemiLight.color.setHex(0x38bdf8);
    ctx.celestialOrbGroup.visible = false;
    ctx.drone.droneLandingSpotLight.intensity = 4.8;
    ctx.drone.navSpotlightCone.visible = true;
    ctx.drone.navSpotlightCone.material.color.setHex(0x38bdf8);
    ctx.drone.navSpotlightCone.material.opacity = 0.25;
    ctx.interiorGlowMaterials.forEach((m) => (m.emissiveIntensity = 1.55));
  } else {
    // 4: Dense Stratospheric Fog
    bg.setHex(0xcbd5e1);
    fog.color.setHex(0xcbd5e1);
    fog.density = 0.0105;
    ctx.skyDomeMesh.material.map = createSkyGradientTexture('#94a3b8', '#cbd5e1', '#e2e8f0');
    ctx.sunDirLight.color.setHex(0xf1f5f9);
    ctx.sunDirLight.intensity = 0.68;
    ctx.hemiLight.color.setHex(0xf8fafc);
    ctx.celestialOrbGroup.visible = false;
    ctx.drone.droneLandingSpotLight.intensity = 5.4;
    ctx.drone.navSpotlightCone.visible = true;
    ctx.drone.navSpotlightCone.material.color.setHex(0xfef08a);
    ctx.drone.navSpotlightCone.material.opacity = 0.32;
    ctx.interiorGlowMaterials.forEach((m) => (m.emissiveIntensity = 1.45));
  }

  ctx.skyDomeMesh.material.needsUpdate = true;
}

export function updateWindVectorState(
  elapsed: number,
  mode: AtmosphereMode,
  windState: WindTelemetryState
): void {
  const wxPreset = WEATHER_PRESETS[mode];
  windState.angle = elapsed * (mode === 3 ? 0.28 : 0.12);
  const gustWave = Math.sin(elapsed * 2.1) * 0.6 + Math.cos(elapsed * 4.7) * 0.4;
  windState.gustFactor = Math.max(0, gustWave);
  windState.speedKt = wxPreset.baseWindKt + gustWave * wxPreset.gustKt;
  windState.turbulenceG = wxPreset.turbulenceG * (0.75 + 0.5 * Math.abs(gustWave));
}

export function updateStormRainAndLightning(
  dt: number,
  dronePos: THREE.Vector3,
  rainSystemGroup: THREE.Group,
  rainSegments: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>,
  sunDirLight: THREE.DirectionalLight,
  lightningState: { intensity: number; nextTimer: number }
): void {
  rainSystemGroup.position.copy(dronePos);
  const posAttr = rainSegments.geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < posAttr.count; i += 2) {
    let y0 = posAttr.getY(i) - 48.0 * dt;
    let x0 = posAttr.getX(i) - 12.0 * dt;
    if (y0 < -22) {
      y0 = 32;
      x0 = (Math.random() - 0.5) * 90;
    }
    posAttr.setX(i, x0);
    posAttr.setY(i, y0);
    posAttr.setX(i + 1, x0 - 0.9);
    posAttr.setY(i + 1, y0 - 2.8);
  }
  posAttr.needsUpdate = true;

  lightningState.nextTimer -= dt;
  if (lightningState.nextTimer <= 0) {
    lightningState.intensity = 2.8;
    lightningState.nextTimer = 3.5 + Math.random() * 5.5;
  }
  if (lightningState.intensity > 0) {
    lightningState.intensity = Math.max(0, lightningState.intensity - dt * 9.0);
    sunDirLight.intensity = 0.52 + lightningState.intensity;
  }
}
