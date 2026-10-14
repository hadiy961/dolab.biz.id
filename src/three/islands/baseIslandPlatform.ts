import * as THREE from 'three';
import { StationMetadata } from '../../types/lab';
import { createHelipadTexture, createSculptedRockCliffGeometry } from '../textures';
import { IslandMaterialPalette, StationSceneObject } from './islandTypesAndMaterials';

const BEACON_HEIGHTS = [12.5, 15.0, 13.5, 13.0, 21.0, 16.0, 14.5, 18.0, 14.0, 35.5];

export function buildBaseIslandPlatform(
  st: StationMetadata,
  idx: number,
  mats: IslandMaterialPalette,
  gravityRingMeshes: { ring: THREE.Mesh; core: THREE.Mesh }[]
): Omit<StationSceneObject, 'data'> {
  const islandGroup = new THREE.Group();
  islandGroup.position.set(st.position.x, st.position.y, st.position.z);

  const r = st.islandRadius;
  const d = st.islandDepth;

  // 1. Sculpted Floating Cliff Base
  const cliffGeo = createSculptedRockCliffGeometry(r, r * 0.36, d, 18);
  const cliffMesh = new THREE.Mesh(cliffGeo, mats.cliffRockMat);
  cliffMesh.position.y = -d * 0.5;
  cliffMesh.receiveShadow = true;
  islandGroup.add(cliffMesh);

  const lowerSpireGeo = createSculptedRockCliffGeometry(r * 0.42, 0.8, d * 0.55, 12);
  const lowerSpire = new THREE.Mesh(lowerSpireGeo, mats.deepRockMat);
  lowerSpire.position.y = -d * 0.82;
  islandGroup.add(lowerSpire);

  // Sub-Island Aero-Gravity Stabilizer Ring
  const gravAssembly = new THREE.Group();
  gravAssembly.position.y = -d * 0.54;
  const gravOuterRing = new THREE.Mesh(
    new THREE.TorusGeometry(r * 0.48, 0.22, 10, 36),
    mats.darkSteelMat
  );
  gravOuterRing.rotation.x = Math.PI / 2;
  gravAssembly.add(gravOuterRing);

  const gravGlowRing = new THREE.Mesh(
    new THREE.TorusGeometry(r * 0.43, 0.09, 8, 36),
    new THREE.MeshBasicMaterial({ color: st.colorHex, transparent: true, opacity: 0.78 })
  );
  gravGlowRing.rotation.x = Math.PI / 2;
  gravAssembly.add(gravGlowRing);

  const gravCore = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 0.45, 2.8, 12),
    new THREE.MeshBasicMaterial({ color: st.colorHex, transparent: true, opacity: 0.65 })
  );
  gravCore.position.y = -1.2;
  gravAssembly.add(gravCore);
  islandGroup.add(gravAssembly);
  gravityRingMeshes.push({ ring: gravGlowRing, core: gravCore });

  // 2. Lush Top Meadow Cap & Travertine Terrace Deck
  const meadowCap = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.98, r * 1.01, 1.4, 28),
    mats.grassTopMat
  );
  meadowCap.position.y = 0.7;
  meadowCap.receiveShadow = true;
  islandGroup.add(meadowCap);

  const terraceDeck = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.74, r * 0.78, 0.5, 28),
    mats.travertineMat
  );
  terraceDeck.position.y = 1.65;
  terraceDeck.receiveShadow = true;
  islandGroup.add(terraceDeck);

  // 3. Dedicated Helipad Deck at Front of Island (+Z)
  const padLocalZ = 12.0;
  const helipadBase = new THREE.Mesh(
    new THREE.CylinderGeometry(4.2, 4.6, 0.45, 28),
    mats.darkSteelMat
  );
  helipadBase.position.set(0, 1.72, padLocalZ);
  helipadBase.receiveShadow = true;
  islandGroup.add(helipadBase);

  const accentCss = '#' + st.colorHex.toString(16).padStart(6, '0');
  const padTopDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(3.85, 3.85, 0.06, 32),
    new THREE.MeshStandardMaterial({
      map: createHelipadTexture(st.code, accentCss),
      roughness: 0.55,
      metalness: 0.2,
    })
  );
  padTopDisc.position.set(0, 1.96, padLocalZ);
  padTopDisc.receiveShadow = true;
  islandGroup.add(padTopDisc);

  const padBeaconRing = new THREE.Mesh(
    new THREE.RingGeometry(3.95, 4.18, 36),
    new THREE.MeshBasicMaterial({
      color: st.colorHex,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
    })
  );
  padBeaconRing.rotation.x = -Math.PI / 2;
  padBeaconRing.position.set(0, 1.98, padLocalZ);
  islandGroup.add(padBeaconRing);

  const walkwayBridge = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.18, 8.5), mats.travertineMat);
  walkwayBridge.position.set(0, 1.92, 5.2);
  walkwayBridge.receiveShadow = true;
  islandGroup.add(walkwayBridge);

  [-1.4, 1.4].forEach((bx) => {
    [2.5, 5.2, 7.8].forEach((bz) => {
      const bollard = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.55, 8),
        mats.darkSteelMat
      );
      bollard.position.set(bx, 2.2, bz);
      const bollardLight = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 8, 8),
        new THREE.MeshBasicMaterial({ color: st.colorHex })
      );
      bollardLight.position.set(bx, 2.5, bz);
      islandGroup.add(bollard, bollardLight);
    });
  });

  st.padPoint.x = st.position.x;
  st.padPoint.y = st.position.y + 1.98;
  st.padPoint.z = st.position.z + padLocalZ;
  st.hoverPoint.x = st.position.x;
  st.hoverPoint.y = st.position.y + 5.2;
  st.hoverPoint.z = st.position.z + padLocalZ;
  st.lookAtPoint.x = st.position.x;
  st.lookAtPoint.y = st.position.y + 4.5;
  st.lookAtPoint.z = st.position.z - 4.5;

  // 4. Elevated Beacon Crystal & Holo Ring above Building Roof
  const beaconY = BEACON_HEIGHTS[idx] || 14.0;
  const holoRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.1, 0.06, 16, 48),
    new THREE.MeshStandardMaterial({ color: st.colorHex, roughness: 0.2, metalness: 0.8 })
  );
  holoRing.rotation.x = Math.PI / 2;
  holoRing.position.set(0, beaconY, -5.5);
  islandGroup.add(holoRing);

  const artifactMesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.95, 0),
    new THREE.MeshStandardMaterial({
      color: st.colorHex,
      roughness: 0.15,
      metalness: 0.6,
      wireframe: true,
    })
  );
  artifactMesh.position.set(0, beaconY, -5.5);
  islandGroup.add(artifactMesh);

  // 5. Decorative Pine Trees around Island Perimeter
  const foliageMat1 = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 });
  const foliageMat2 = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8 });

  for (let t = 0; t < 7; t++) {
    const angle = (t / 7) * Math.PI * 1.5 - Math.PI * 1.25;
    const dist = r * (0.68 + (t % 2) * 0.14);
    const tx = Math.cos(angle) * dist;
    const tz = Math.sin(angle) * dist;
    if (tz > 7.5 && Math.abs(tx) < 5.5) continue;

    const treeGroup = new THREE.Group();
    treeGroup.position.set(tx, 1.4, tz);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 1.4, 7), mats.warmWoodMat);
    trunk.position.y = 0.7;
    const foliage1 = new THREE.Mesh(new THREE.ConeGeometry(1.25, 2.6, 8), foliageMat1);
    foliage1.position.y = 2.1;
    const foliage2 = new THREE.Mesh(new THREE.ConeGeometry(0.95, 2.1, 8), foliageMat2);
    foliage2.position.y = 3.2;
    treeGroup.add(trunk, foliage1, foliage2);
    islandGroup.add(treeGroup);
  }

  return { group: islandGroup, artifactMesh, holoRing, beaconY, padBeaconRing };
}
