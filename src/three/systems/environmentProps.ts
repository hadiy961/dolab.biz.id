import * as THREE from 'three';
import { FlightPlanWaypoint } from '../../types/lab';

export interface BirdFlockItem {
  group: THREE.Group;
  leftWing: THREE.Mesh;
  rightWing: THREE.Mesh;
  angle: number;
  orbitRadius: number;
  baseAlt: number;
  speed: number;
  phase: number;
}

export interface RingGateHandle {
  group: THREE.Group;
  outerRing: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
  innerGlow: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
}

export interface CargoMarkersResult {
  cargoPickupCrateGroup: THREE.Group;
  cargoPickupCrateMat: THREE.MeshStandardMaterial;
  cargoPickupRingMat: THREE.MeshBasicMaterial;
  cargoDropzoneGroup: THREE.Group;
  cargoDropzoneRingMat: THREE.MeshBasicMaterial;
}

export interface StormRainResult {
  rainSystemGroup: THREE.Group;
  rainSegments: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>;
}

export function buildCloudSeaAndWildlife(scene: THREE.Scene): {
  cloudGroups: { group: THREE.Group; speed: number }[];
  birdFlock: BirdFlockItem[];
} {
  const cloudGroups: { group: THREE.Group; speed: number }[] = [];
  const birdFlock: BirdFlockItem[] = [];

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
    scene.add(cGroup);
    cloudGroups.push({ group: cGroup, speed: 0.6 + Math.random() * 1.1 });
  }

  const birdMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc, side: THREE.DoubleSide });
  for (let b = 0; b < 18; b++) {
    const bGroup = new THREE.Group();
    const leftWing = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.24), birdMat);
    leftWing.position.x = -0.32;
    const rightWing = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.24), birdMat);
    rightWing.position.x = 0.32;
    bGroup.add(leftWing, rightWing);

    scene.add(bGroup);
    birdFlock.push({
      group: bGroup,
      leftWing,
      rightWing,
      angle: (b / 18) * Math.PI * 2,
      orbitRadius: 35 + (b % 5) * 16,
      baseAlt: 18 + (b % 4) * 11,
      speed: 0.18 + (b % 3) * 0.06,
      phase: b * 0.9,
    });
  }

  return { cloudGroups, birdFlock };
}

export function buildLidarRing(
  scene: THREE.Scene
): THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial> {
  const lidarRingMesh = new THREE.Mesh(
    new THREE.RingGeometry(1.0, 1.8, 48),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  lidarRingMesh.rotation.x = -Math.PI / 2;
  scene.add(lidarRingMesh);
  return lidarRingMesh;
}

export function buildSkyRingChallengeGates(scene: THREE.Scene): RingGateHandle[] {
  const gateWaypoints = [
    { x: -28, y: 18, z: -18, rotY: 0.6 },
    { x: -64, y: 29, z: -38, rotY: 0.2 },
    { x: 0, y: 34, z: -46, rotY: -1.4 },
    { x: 68, y: 43, z: -32, rotY: 0.0 },
    { x: 64, y: 54, z: 38, rotY: 0.4 },
    { x: 0, y: 22, z: 32, rotY: 1.5 },
  ];

  return gateWaypoints.map((gw, idx) => {
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
    scene.add(gateGroup);
    return { group: gateGroup, outerRing, innerGlow };
  });
}

export function buildCargoGroundMarkers(scene: THREE.Scene): CargoMarkersResult {
  const cargoPickupCrateGroup = new THREE.Group();
  const cargoPickupCrateMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.65,
    roughness: 0.25,
    metalness: 0.6,
  });
  const crateBox = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.45, 0.85, 8),
    cargoPickupCrateMat
  );
  crateBox.position.y = 0.45;
  const cargoPickupRingMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
  });
  const pickupRing = new THREE.Mesh(
    new THREE.RingGeometry(1.2, 1.55, 32),
    cargoPickupRingMat
  );
  pickupRing.rotation.x = -Math.PI / 2;
  pickupRing.position.y = 0.05;
  cargoPickupCrateGroup.add(crateBox, pickupRing);
  cargoPickupCrateGroup.visible = false;
  scene.add(cargoPickupCrateGroup);

  const cargoDropzoneGroup = new THREE.Group();
  const cargoDropzoneRingMat = new THREE.MeshBasicMaterial({
    color: 0x10b981,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
  });
  const dropRingOuter = new THREE.Mesh(
    new THREE.RingGeometry(2.1, 2.55, 36),
    cargoDropzoneRingMat
  );
  dropRingOuter.rotation.x = -Math.PI / 2;
  dropRingOuter.position.y = 0.06;

  const dropBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(2.1, 2.1, 7.5, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  dropBeam.position.y = 3.75;
  cargoDropzoneGroup.add(dropRingOuter, dropBeam);
  cargoDropzoneGroup.visible = false;
  scene.add(cargoDropzoneGroup);

  return {
    cargoPickupCrateGroup,
    cargoPickupCrateMat,
    cargoPickupRingMat,
    cargoDropzoneGroup,
    cargoDropzoneRingMat,
  };
}

export function buildStormRainSystem(scene: THREE.Scene): StormRainResult {
  const rainSystemGroup = new THREE.Group();
  const dropCount = 360;
  const positions = new Float32Array(dropCount * 6);
  for (let i = 0; i < dropCount; i++) {
    const rx = (Math.random() - 0.5) * 90;
    const ry = Math.random() * 55 - 15;
    const rz = (Math.random() - 0.5) * 90;
    const idx = i * 6;
    positions[idx] = rx;
    positions[idx + 1] = ry;
    positions[idx + 2] = rz;
    positions[idx + 3] = rx - 0.8;
    positions[idx + 4] = ry - 2.6;
    positions[idx + 5] = rz - 0.4;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.LineBasicMaterial({
    color: 0x93c5fd,
    transparent: true,
    opacity: 0.48,
  });
  const rainSegments = new THREE.LineSegments(geo, mat);
  rainSystemGroup.add(rainSegments);
  rainSystemGroup.visible = false;
  scene.add(rainSystemGroup);
  return { rainSystemGroup, rainSegments };
}

export function rebuildFlightPlan3DVisuals(
  group: THREE.Group,
  waypoints: FlightPlanWaypoint[],
  loop: boolean,
  active: boolean,
  activeWaypointIdx: number
): void {
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }
  if (waypoints.length === 0) return;

  const pts: THREE.Vector3[] = waypoints.map(
    (wp) => new THREE.Vector3(wp.x, wp.cruiseAlt, wp.z)
  );
  if (loop && waypoints.length > 2) {
    pts.push(pts[0].clone());
  }

  if (pts.length >= 2) {
    const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const lineMat = new THREE.LineDashedMaterial({
      color: active ? 0x38bdf8 : 0x818cf8,
      dashSize: 2.2,
      gapSize: 1.1,
      transparent: true,
      opacity: active ? 0.9 : 0.55,
    });
    const routeLine = new THREE.Line(lineGeo, lineMat);
    routeLine.computeLineDistances();
    group.add(routeLine);
  }

  waypoints.forEach((wp, idx) => {
    const isCurrent = active && idx === activeWaypointIdx;
    const nodeMesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(isCurrent ? 1.45 : 0.95, 0),
      new THREE.MeshBasicMaterial({
        color: isCurrent ? 0x10b981 : 0x38bdf8,
        wireframe: !isCurrent,
      })
    );
    nodeMesh.position.set(wp.x, wp.cruiseAlt, wp.z);
    group.add(nodeMesh);
  });
}
