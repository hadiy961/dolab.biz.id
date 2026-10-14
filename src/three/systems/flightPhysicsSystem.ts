import * as THREE from 'three';
import { STATIONS } from '../../data/stations';
import { FLIGHT_PROFILES } from '../../data/flightAndWeather';
import { UI_TRANSLATIONS } from '../../data/translations';
import { audioSynth } from '../../services/audioSynth';
import { LabStoreState } from '../../store/useLabStore';
import {
  AtmosphereMode,
  CameraMode,
  FlightPhase,
  FlightProfileKey,
  PayloadMission,
} from '../../types/lab';
import { DroneBuildResult } from '../droneBuilder';
import { updateWindVectorState, WindTelemetryState } from './weatherSystem';

export interface DronePhysicsState {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  yaw: number;
  yawRate: number;
  pitch: number;
  roll: number;
  rotorThrottle: number;
  flightPhase: FlightPhase;
  autopilot: boolean;
  targetStationId: number;
  activeStationId: number;
  pendingAutopilotStationId: number | null;
  pendingFlightPlanStart: boolean;
  takeoffTargetY: number;
  cameraMode: CameraMode;
  atmosphereMode: AtmosphereMode;
  battery: number;
}

export interface CameraOrbitState {
  theta: number;
  phi: number;
  distance: number;
  isDragging: boolean;
  lastX: number;
  lastY: number;
}

export function stepDronePhysics(params: {
  dt: number;
  elapsed: number;
  droneState: DronePhysicsState;
  windState: WindTelemetryState;
  drone: DroneBuildResult;
  keys: Record<string, boolean>;
  boostActive: boolean;
  wingmanSwarmActive: boolean;
  currentFlightProfile: FlightProfileKey;
  store: LabStoreState;
  activeCargo: PayloadMission | null;
  onStopGuidedTour: () => void;
  onStopFlightPlan: () => void;
  onSyncFlightPlanVisuals: () => void;
  onInitiateAutoTakeoff: () => void;
  onEngageAutopilot: (stationId: number) => void;
  onTriggerReturnToHome: (isLowBattery: boolean) => void;
  onEvaluateCargoPad: (landedStationId: number) => void;
}): void {
  const {
    dt,
    elapsed,
    droneState,
    windState,
    drone,
    keys,
    boostActive,
    wingmanSwarmActive,
    currentFlightProfile,
    store,
    activeCargo,
    onStopGuidedTour,
    onStopFlightPlan,
    onSyncFlightPlanVisuals,
    onInitiateAutoTakeoff,
    onEngageAutopilot,
    onTriggerReturnToHome,
    onEvaluateCargoPad,
  } = params;

  const delta = Math.min(dt, 0.05);
  const cargoSpeedMult = activeCargo ? activeCargo.speedMultiplier : 1.0;
  const cargoDampingMult = activeCargo ? activeCargo.dampingMultiplier : 1.0;
  const cargoTiltMult = activeCargo ? activeCargo.tiltMultiplier : 1.0;
  const cargoDrainMult = activeCargo ? activeCargo.batteryDrainMultiplier : 1.0;

  updateWindVectorState(elapsed, droneState.atmosphereMode, windState);

  const manualForward =
    (keys['KeyW'] || keys['ArrowUp'] ? 1 : 0) - (keys['KeyS'] || keys['ArrowDown'] ? 1 : 0);
  const manualStrafe =
    (keys['KeyD'] || keys['ArrowRight'] ? 1 : 0) - (keys['KeyA'] || keys['ArrowLeft'] ? 1 : 0);
  const manualAlt =
    (keys['Space'] ? 1 : 0) - (keys['ShiftLeft'] || keys['ShiftRight'] ? 1 : 0);
  const manualYaw = (keys['KeyQ'] ? 1 : 0) - (keys['KeyE'] ? 1 : 0);
  const hasManualInput =
    manualForward !== 0 || manualStrafe !== 0 || manualAlt !== 0 || manualYaw !== 0;

  if (hasManualInput && droneState.autopilot) {
    droneState.autopilot = false;
    onStopGuidedTour();
    if (store.flightPlanActive) onStopFlightPlan();
    store.syncFlightStatus({ autopilot: false });
    store.showToast(UI_TRANSLATIONS[store.lang].manualMode);
  }

  let localForwardInput = 0;
  let localRightInput = 0;

  if (droneState.flightPhase === 'LANDED') {
    droneState.rotorThrottle = THREE.MathUtils.lerp(droneState.rotorThrottle, 0.0, delta * 3.5);
    droneState.vel.set(0, 0, 0);
    droneState.battery = Math.min(100, droneState.battery + delta * 4.5);

    if (store.bootCompleted && (keys['Space'] || manualForward !== 0 || manualStrafe !== 0)) {
      onInitiateAutoTakeoff();
    }
  } else if (droneState.flightPhase === 'TAKING_OFF') {
    droneState.rotorThrottle = THREE.MathUtils.lerp(
      droneState.rotorThrottle,
      1.0,
      delta * (3.2 * cargoSpeedMult)
    );
    if (droneState.rotorThrottle > 0.65) {
      const dy = droneState.takeoffTargetY - droneState.pos.y;
      droneState.vel.y = THREE.MathUtils.clamp(dy * 2.4, 1.2, 6.5) * cargoSpeedMult;
      droneState.pos.y += droneState.vel.y * delta;

      if (Math.abs(droneState.takeoffTargetY - droneState.pos.y) < 0.25) {
        droneState.pos.y = droneState.takeoffTargetY;
        droneState.vel.set(0, 0, 0);
        droneState.flightPhase = 'AIRBORNE';

        if (droneState.pendingFlightPlanStart) {
          droneState.pendingFlightPlanStart = false;
          droneState.autopilot = true;
          store.syncFlightStatus({ flightPhase: 'AIRBORNE', autopilot: true });
        } else if (droneState.pendingAutopilotStationId !== null) {
          const nextId = droneState.pendingAutopilotStationId;
          droneState.pendingAutopilotStationId = null;
          onEngageAutopilot(nextId);
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
  } else if (droneState.flightPhase === 'LANDING') {
    droneState.rotorThrottle = THREE.MathUtils.lerp(droneState.rotorThrottle, 0.85, delta * 3.0);
    const st = STATIONS[droneState.targetStationId];
    const padVec = new THREE.Vector3(st.padPoint.x, st.padPoint.y, st.padPoint.z);
    const horizDist = Math.hypot(padVec.x - droneState.pos.x, padVec.z - droneState.pos.z);

    if (horizDist > 0.45) {
      const approachTarget = new THREE.Vector3(
        padVec.x,
        Math.max(droneState.pos.y, padVec.y + 3.2),
        padVec.z
      );
      const stepVel = approachTarget
        .sub(droneState.pos)
        .normalize()
        .multiplyScalar(Math.min(14.0, horizDist * 2.6) * cargoSpeedMult);
      droneState.vel.lerp(stepVel, delta * 5.0);
      droneState.pos.addScaledVector(droneState.vel, delta);
    } else {
      droneState.pos.x = THREE.MathUtils.lerp(droneState.pos.x, padVec.x, delta * 6.0);
      droneState.pos.z = THREE.MathUtils.lerp(droneState.pos.z, padVec.z, delta * 6.0);
      droneState.vel.set(0, -2.4 * cargoSpeedMult, 0);
      droneState.pos.y += droneState.vel.y * delta;

      if (droneState.pos.y <= padVec.y + 0.04) {
        droneState.pos.set(padVec.x, padVec.y, padVec.z);
        droneState.vel.set(0, 0, 0);
        droneState.flightPhase = 'LANDED';
        droneState.activeStationId = st.id;
        store.syncFlightStatus({ flightPhase: 'LANDED', activeStationId: st.id });
        store.markIslandVisited(st.id);
        store.showToast(UI_TRANSLATIONS[store.lang].landedMsg);
        audioSynth.playBeep(440, 0.12);
        onEvaluateCargoPad(st.id);
      }
    }

    const targetYaw = Math.atan2(
      -(st.lookAtPoint.x - droneState.pos.x),
      -(st.lookAtPoint.z - droneState.pos.z)
    );
    let yawDiff = targetYaw - droneState.yaw;
    while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
    while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
    droneState.yaw += yawDiff * delta * 4.5;
  } else if (droneState.flightPhase === 'AIRBORNE') {
    droneState.rotorThrottle = THREE.MathUtils.lerp(droneState.rotorThrottle, 1.0, delta * 4.0);

    if (
      store.flightPlanActive &&
      droneState.autopilot &&
      store.flightPlanWaypoints.length > 0
    ) {
      const wpList = store.flightPlanWaypoints;
      const currentIdx = Math.min(store.activeWaypointIdx, wpList.length - 1);
      const currentWp = wpList[currentIdx] || wpList[0];
      const toWp = new THREE.Vector3(currentWp.x, currentWp.cruiseAlt, currentWp.z).sub(
        droneState.pos
      );
      const dist = toWp.length();

      if (dist > 1.8) {
        const segMaxSpeed = 24.0 * (currentWp.speedPct / 100) * cargoSpeedMult;
        const desiredSpeed = Math.min(segMaxSpeed, Math.max(4.0, dist * 1.35));
        droneState.vel.lerp(toWp.normalize().multiplyScalar(desiredSpeed), delta * 3.6);

        const targetYaw = Math.atan2(-droneState.vel.x, -droneState.vel.z);
        let yawDiff = targetYaw - droneState.yaw;
        while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
        while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
        droneState.yaw += yawDiff * delta * 4.0;
        localForwardInput = Math.min(1.1, droneState.vel.length() / 18.0);
      } else {
        audioSynth.playBeep(880, 0.06);
        if (currentWp.stationId !== null) {
          droneState.activeStationId = currentWp.stationId;
          store.markIslandVisited(currentWp.stationId);
          store.syncFlightStatus({ activeStationId: currentWp.stationId });
        }

        if (currentIdx + 1 < wpList.length) {
          const nextIdx = currentIdx + 1;
          store.syncFlightStatus({ activeWaypointIdx: nextIdx });
          onSyncFlightPlanVisuals();
          const nextWp = wpList[nextIdx];
          store.showToast(
            `WAYPOINT ${nextIdx}/${wpList.length} CLEARED → NEXT: ${nextWp.label} (${nextWp.cruiseAlt}m)`
          );
        } else if (store.flightPlanLoop) {
          store.syncFlightStatus({ activeWaypointIdx: 0 });
          onSyncFlightPlanVisuals();
          store.showToast('PATROL LOOP COMPLETED — RESTARTING LEG 1');
        } else {
          droneState.autopilot = false;
          store.syncFlightStatus({ flightPlanActive: false, autopilot: false });
          onSyncFlightPlanVisuals();
          store.showToast('FLIGHT PLAN COMPLETE — HOLDING AT FINAL WAYPOINT');
        }
      }
    } else if (droneState.autopilot) {
      const targetSt = STATIONS[droneState.targetStationId];
      const hoverDest = new THREE.Vector3(
        targetSt.hoverPoint.x,
        targetSt.hoverPoint.y,
        targetSt.hoverPoint.z
      );
      const horizDist = Math.hypot(
        hoverDest.x - droneState.pos.x,
        hoverDest.z - droneState.pos.z
      );
      const arcHeightBoost = Math.min(18.0, horizDist * 0.22);
      const toTarget = new THREE.Vector3(
        hoverDest.x,
        hoverDest.y + arcHeightBoost,
        hoverDest.z
      ).sub(droneState.pos);
      const dist = toTarget.length();

      if (dist > 0.65) {
        const desiredSpeed = Math.min(28.0, Math.max(3.5, dist * 1.45)) * cargoSpeedMult;
        droneState.vel.lerp(toTarget.normalize().multiplyScalar(desiredSpeed), delta * 3.8);

        const targetYaw =
          horizDist > 7.0
            ? Math.atan2(-droneState.vel.x, -droneState.vel.z)
            : Math.atan2(
                -(targetSt.lookAtPoint.x - droneState.pos.x),
                -(targetSt.lookAtPoint.z - droneState.pos.z)
              );
        let yawDiff = targetYaw - droneState.yaw;
        while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
        while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
        droneState.yaw += yawDiff * delta * 4.2;
        localForwardInput = Math.min(1.0, droneState.vel.length() / 18.0);
      } else {
        droneState.vel.multiplyScalar(0.82);
        droneState.autopilot = false;
        droneState.activeStationId = targetSt.id;
        store.syncFlightStatus({ autopilot: false, activeStationId: targetSt.id });
        store.markIslandVisited(targetSt.id);
        store.showToast(`${UI_TRANSLATIONS[store.lang].docked}: ${targetSt.shortName}`);
      }
    } else {
      const prof = FLIGHT_PROFILES[currentFlightProfile] || FLIGHT_PROFILES.SPORT;
      const yawAccel = prof.yaw * (activeCargo ? 0.85 : 1.0);
      droneState.yawRate = THREE.MathUtils.lerp(
        droneState.yawRate,
        manualYaw * yawAccel,
        delta * 7.0
      );
      droneState.yaw += droneState.yawRate * delta;

      const speedMult = (boostActive ? prof.boost : prof.speed) * cargoSpeedMult;
      const forwardVec = new THREE.Vector3(-Math.sin(droneState.yaw), 0, -Math.cos(droneState.yaw));
      const rightVec = new THREE.Vector3(Math.cos(droneState.yaw), 0, -Math.sin(droneState.yaw));

      const accel = new THREE.Vector3();
      accel.addScaledVector(forwardVec, manualForward * speedMult);
      accel.addScaledVector(rightVec, manualStrafe * speedMult);
      accel.y = manualAlt * 18.0 * cargoSpeedMult;

      droneState.vel.addScaledVector(accel, delta);
      const effectiveDamping = THREE.MathUtils.clamp(prof.damping * cargoDampingMult, 0.04, 0.45);
      droneState.vel.multiplyScalar(Math.pow(effectiveDamping, delta));

      localForwardInput = manualForward * (boostActive ? 1.35 : 1.0);
      localRightInput = manualStrafe;
    }

    const baseDrain = boostActive ? 1.15 : 0.18 + droneState.vel.length() * 0.012;
    droneState.battery = Math.max(5.0, droneState.battery - baseDrain * cargoDrainMult * delta);
    if (
      droneState.battery <= 12.0 &&
      droneState.flightPhase === 'AIRBORNE' &&
      !droneState.autopilot
    ) {
      onTriggerReturnToHome(true);
    }

    const windPushScale = droneState.autopilot ? 0.05 : 0.16;
    const windForce = (windState.speedKt / 10.0) * windPushScale;
    droneState.vel.x += Math.cos(windState.angle) * windForce * delta * 12.0;
    droneState.vel.z += Math.sin(windState.angle) * windForce * delta * 12.0;

    if (droneState.atmosphereMode === 3) {
      droneState.vel.y += Math.sin(elapsed * 5.8 + droneState.pos.x * 0.05) * 2.4 * delta;
    }

    droneState.pos.addScaledVector(droneState.vel, delta);
    droneState.pos.x = THREE.MathUtils.clamp(droneState.pos.x, -260, 260);
    droneState.pos.z = THREE.MathUtils.clamp(droneState.pos.z, -240, 240);
    droneState.pos.y = THREE.MathUtils.clamp(droneState.pos.y, -28, 138);

    STATIONS.forEach((st) => {
      const dx = droneState.pos.x - st.position.x;
      const dz = droneState.pos.z - st.position.z;
      const distHoriz = Math.hypot(dx, dz);
      const deckTopY = st.padPoint.y;
      const cliffBottomY = st.position.y - st.islandDepth;

      if (
        distHoriz < st.islandRadius * 0.96 &&
        droneState.pos.y > cliffBottomY &&
        droneState.pos.y < deckTopY
      ) {
        if (droneState.pos.y > deckTopY - 2.6) {
          droneState.pos.y = deckTopY;
          if (droneState.vel.y < 0) droneState.vel.y = 0;
          if (manualAlt < 0 && !droneState.autopilot) {
            droneState.activeStationId = st.id;
            droneState.vel.set(0, 0, 0);
            droneState.flightPhase = 'LANDED';
            store.syncFlightStatus({ flightPhase: 'LANDED', activeStationId: st.id });
            store.markIslandVisited(st.id);
            store.showToast(UI_TRANSLATIONS[store.lang].landedMsg);
            onEvaluateCargoPad(st.id);
          }
        } else {
          const pushAngle = Math.atan2(dz, dx);
          droneState.pos.x = st.position.x + Math.cos(pushAngle) * (st.islandRadius * 0.97);
          droneState.pos.z = st.position.z + Math.sin(pushAngle) * (st.islandRadius * 0.97);
        }
      }

      const bldX = st.position.x;
      const bldZ = st.position.z - 5.5;
      const distToBld = Math.hypot(droneState.pos.x - bldX, droneState.pos.z - bldZ);
      const bldRoofY = st.position.y + (st.id === 9 ? 31.0 : 12.5);
      const bldRadius = 6.8;
      if (distToBld < bldRadius && droneState.pos.y >= deckTopY && droneState.pos.y < bldRoofY) {
        const pushAng = Math.atan2(droneState.pos.z - bldZ, droneState.pos.x - bldX);
        droneState.pos.x = bldX + Math.cos(pushAng) * bldRadius;
        droneState.pos.z = bldZ + Math.sin(pushAng) * bldRadius;
      }
    });
  }

  const hoverBob = droneState.flightPhase === 'LANDED' ? 0 : Math.sin(elapsed * 3.2) * 0.09;
  drone.droneGroup.position.set(droneState.pos.x, droneState.pos.y + hoverBob, droneState.pos.z);

  const profTilt = (FLIGHT_PROFILES[currentFlightProfile] || FLIGHT_PROFILES.SPORT).tilt * cargoTiltMult;
  const stormBuffetPitch =
    droneState.flightPhase === 'LANDED' ? 0 : Math.sin(elapsed * 11.5) * windState.turbulenceG * 0.14;
  const stormBuffetRoll =
    droneState.flightPhase === 'LANDED' ? 0 : Math.cos(elapsed * 9.3) * windState.turbulenceG * 0.18;

  droneState.pitch = THREE.MathUtils.lerp(
    droneState.pitch,
    droneState.flightPhase === 'LANDED' ? 0 : -localForwardInput * profTilt + stormBuffetPitch,
    delta * 8.0
  );
  droneState.roll = THREE.MathUtils.lerp(
    droneState.roll,
    droneState.flightPhase === 'LANDED' ? 0 : -localRightInput * profTilt + stormBuffetRoll,
    delta * 8.0
  );

  drone.droneGroup.rotation.order = 'YXZ';
  drone.droneGroup.rotation.y = droneState.yaw;
  drone.droneGroup.rotation.x = droneState.pitch;
  drone.droneGroup.rotation.z = droneState.roll;

  if (drone.cargoPodGroup.visible) {
    drone.cargoPodGroup.rotation.x = -droneState.pitch * 0.55 + Math.sin(elapsed * 4.5) * 0.06;
    drone.cargoPodGroup.rotation.z = -droneState.roll * 0.55 + Math.cos(elapsed * 3.8) * 0.06;
  }

  drone.gimbalGroup.rotation.x = -droneState.pitch * 0.85;
  drone.gimbalGroup.rotation.z = -droneState.roll * 0.85;

  const spinSpeed = droneState.rotorThrottle * (boostActive ? 55.0 : 38.0);
  drone.droneRotors.forEach((r) => (r.group.rotation.y += spinSpeed * r.dir * delta));
  drone.droneBlurDiscs.forEach(
    (disc) => ((disc.material as THREE.MeshBasicMaterial).opacity = droneState.rotorThrottle * 0.32)
  );

  audioSynth.updateRotorSound(droneState.rotorThrottle, droneState.vel.length());

  if (wingmanSwarmActive && drone.wingmanDrones.length) {
    const rightVec = new THREE.Vector3(Math.cos(droneState.yaw), 0, -Math.sin(droneState.yaw));
    const backVec = new THREE.Vector3(Math.sin(droneState.yaw), 0, Math.cos(droneState.yaw));
    drone.wingmanDrones.forEach((w, idx) => {
      const targetPos = droneState.pos
        .clone()
        .addScaledVector(rightVec, w.side * 2.5)
        .addScaledVector(backVec, 2.2)
        .add(new THREE.Vector3(0, 0.35 + Math.sin(elapsed * 4.0 + idx) * 0.15, 0));
      w.pos.lerp(targetPos, delta * 5.5);
      w.group.position.copy(w.pos);
      w.group.rotation.set(droneState.pitch * 0.85, droneState.yaw, droneState.roll * 0.85);
      w.prop.rotation.y += delta * 42.0;
    });
  }
}

export function stepCameraSystem(params: {
  dt: number;
  elapsed: number;
  camera: THREE.PerspectiveCamera;
  droneState: DronePhysicsState;
  camOrbit: CameraOrbitState;
  windState: WindTelemetryState;
  boostActive: boolean;
}): void {
  const { dt, elapsed, camera, droneState, camOrbit, windState, boostActive } = params;
  const delta = Math.min(dt, 0.05);
  const targetFov = boostActive ? 68 : 58;
  if (Math.abs(camera.fov - targetFov) > 0.1) {
    camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, delta * 6.0);
    camera.updateProjectionMatrix();
  }

  const isAirborne = droneState.flightPhase !== 'LANDED';
  const turbG = isAirborne ? windState.turbulenceG : 0;
  const shakeX = (Math.sin(elapsed * 23.0) * 0.5 + Math.cos(elapsed * 37.0) * 0.5) * turbG;
  const shakeY = (Math.cos(elapsed * 29.0) * 0.5 + Math.sin(elapsed * 41.0) * 0.5) * turbG;

  if (droneState.cameraMode === 0) {
    const totalYaw = droneState.yaw + camOrbit.theta;
    const dist = droneState.flightPhase === 'LANDED' ? 6.8 : camOrbit.distance;
    const heightOffset = Math.sin(camOrbit.phi) * dist;
    const horizRadius = Math.cos(camOrbit.phi) * dist;

    camera.position.lerp(
      new THREE.Vector3(
        droneState.pos.x + Math.sin(totalYaw) * horizRadius + shakeX * 0.18,
        droneState.pos.y + heightOffset + 1.1 + shakeY * 0.18,
        droneState.pos.z + Math.cos(totalYaw) * horizRadius
      ),
      delta * 7.5
    );
    camera.lookAt(
      droneState.pos.x - Math.sin(droneState.yaw) * 2.4,
      droneState.pos.y + 0.45,
      droneState.pos.z - Math.cos(droneState.yaw) * 2.4
    );
  } else if (droneState.cameraMode === 1) {
    const fpvOffset = new THREE.Vector3(0, -0.1, -1.15).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      droneState.yaw
    );
    camera.position.copy(droneState.pos).add(fpvOffset);
    camera.lookAt(
      droneState.pos.x - Math.sin(droneState.yaw) * 25 + shakeX * 2.2,
      droneState.pos.y - 1.5 + shakeY * 2.2,
      droneState.pos.z - Math.cos(droneState.yaw) * 25
    );
    camera.rotation.z += shakeX * 0.06;
  } else {
    camera.position.lerp(
      new THREE.Vector3(droneState.pos.x, droneState.pos.y + 32, droneState.pos.z + 10),
      delta * 5.0
    );
    camera.lookAt(droneState.pos);
  }
}
