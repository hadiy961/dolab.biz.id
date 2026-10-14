import * as THREE from 'three';
import { STATIONS } from '../../data/stations';
import {
  AtmosphereMode,
  FlightPhase,
  IslandInteractiveState,
  StationMetadata,
} from '../../types/lab';
import { ArchipelagoBuildResult, StationSceneObject } from '../islandBuilders';
import { BirdFlockItem } from './environmentProps';

export function updateIslandAndWildlifeFX(params: {
  dt: number;
  elapsed: number;
  archipelago: ArchipelagoBuildResult;
  islandState: IslandInteractiveState;
  atmosphereMode: AtmosphereMode;
  cloudGroups: { group: THREE.Group; speed: number }[];
  birdFlock: BirdFlockItem[];
  cargoPickupCrateGroup: THREE.Group;
  cargoDropzoneGroup: THREE.Group;
  dronePos: THREE.Vector3;
  flightPhase: FlightPhase;
  activeStationId: number;
  targetStationId: number;
}): { closestStation: StationMetadata; minDistance: number } {
  const {
    dt,
    elapsed,
    archipelago,
    islandState,
    atmosphereMode,
    cloudGroups,
    birdFlock,
    cargoPickupCrateGroup,
    cargoDropzoneGroup,
    dronePos,
    flightPhase,
    activeStationId,
    targetStationId,
  } = params;
  const { islandFX } = archipelago;

  // 1. Cloud Drift
  const cloudSpeedMult = atmosphereMode === 3 ? 4.2 : atmosphereMode === 4 ? 1.8 : 1.0;
  cloudGroups.forEach((c) => {
    c.group.position.x += c.speed * cloudSpeedMult * dt;
    if (c.group.position.x > 160) c.group.position.x = -160;
  });

  // 2. Cargo Ground Beacons
  if (cargoPickupCrateGroup.visible) {
    const crateMesh = cargoPickupCrateGroup.children[0];
    if (crateMesh) {
      crateMesh.rotation.y = elapsed * 1.8;
      crateMesh.position.y = 0.55 + Math.sin(elapsed * 3.5) * 0.14;
    }
    const ringMesh = cargoPickupCrateGroup.children[1];
    if (ringMesh) {
      const s = 1.0 + Math.sin(elapsed * 5.0) * 0.12;
      ringMesh.scale.set(s, s, 1);
    }
  }
  if (cargoDropzoneGroup.visible) {
    const s = 1.0 + Math.sin(elapsed * 4.5) * 0.1;
    cargoDropzoneGroup.scale.set(s, 1, s);
  }

  // 3. Island 3D Interactive FX
  archipelago.windTurbineRotors.forEach((r) => {
    const stormMult = atmosphereMode === 3 ? 2.6 : 1.0;
    const mult = (islandState.turbineOverdrive ? 3.4 : 1.15) * stormMult;
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
      islandState.fountainMode === 2 ? 1.45 + Math.sin(elapsed * 3.0) * 0.12 : 0.85;
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

  archipelago.dynamicArchParts.forEach((part, idx) => {
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

  archipelago.waterfallDroplets.forEach((d) => {
    if (islandState.waterfallMode === 2) {
      d.mesh.position.y += d.speed * 0.85 * dt;
      if (d.mesh.position.y > d.topY + 6.0) d.mesh.position.y = d.bottomY;
    } else {
      const spdMult = islandState.waterfallMode === 1 ? 2.2 : 1.0;
      d.mesh.position.y -= d.speed * spdMult * dt;
      if (d.mesh.position.y < d.bottomY) d.mesh.position.y = d.topY;
    }
  });

  // 4. Bird Flock Orbit
  birdFlock.forEach((b) => {
    b.angle += b.speed * dt;
    b.group.position.set(
      Math.cos(b.angle) * b.orbitRadius,
      b.baseAlt + Math.sin(elapsed * 1.5 + b.phase) * 1.8,
      Math.sin(b.angle) * b.orbitRadius
    );
    b.group.rotation.y = -b.angle;
    const flap = Math.sin(elapsed * 9.0 + b.phase) * 0.45;
    b.leftWing.rotation.z = flap;
    b.rightWing.rotation.z = -flap;
  });

  // 5. Station Beacons & Closest Island Calculation
  let closestStation = STATIONS[0];
  let minDistance = Infinity;

  archipelago.stationObjects.forEach((obj: StationSceneObject, idx: number) => {
    obj.artifactMesh.rotation.y = elapsed * 0.7;
    obj.artifactMesh.position.y = obj.beaconY + Math.sin(elapsed * 1.8 + idx) * 0.35;
    obj.holoRing.position.y = obj.beaconY;
    obj.holoRing.rotation.z = -elapsed * 0.45;

    const padMat = obj.padBeaconRing.material as THREE.MeshBasicMaterial;
    if (flightPhase === 'LANDED' && activeStationId === obj.data.id) {
      padMat.color.setHex(0x10b981);
      padMat.opacity = 0.9;
    } else if (flightPhase === 'LANDING' && targetStationId === obj.data.id) {
      padMat.color.setHex(0xf59e0b);
      padMat.opacity = 0.45 + 0.45 * Math.sin(elapsed * 8.0);
    } else {
      padMat.color.setHex(obj.data.colorHex);
      padMat.opacity = 0.55;
    }

    const dist3D = dronePos.distanceTo(
      new THREE.Vector3(obj.data.hoverPoint.x, obj.data.hoverPoint.y, obj.data.hoverPoint.z)
    );
    if (dist3D < minDistance) {
      minDistance = dist3D;
      closestStation = obj.data;
    }
  });

  archipelago.skyPathLines.forEach((sp) => {
    const isTarget = sp.stationId === activeStationId || sp.stationId === targetStationId;
    (sp.line.material as THREE.LineDashedMaterial).opacity = isTarget ? 0.78 : 0.25;
  });

  archipelago.gravityRingMeshes.forEach((g, idx) => {
    (g.ring.material as THREE.MeshBasicMaterial).opacity =
      0.6 + 0.28 * Math.sin(elapsed * 2.4 + idx);
    g.core.scale.y = 0.9 + 0.15 * Math.sin(elapsed * 3.2 + idx);
  });

  return { closestStation, minDistance };
}
