import * as THREE from 'three';
import {
  DynamicArchPart,
  IslandFXHandles,
  IslandMaterialPalette,
} from './islandTypesAndMaterials';

export function buildBespokeStructuresB(
  idx: number,
  archGroup: THREE.Group,
  mats: IslandMaterialPalette,
  islandFX: IslandFXHandles,
  dynamicArchParts: DynamicArchPart[]
): void {
  if (idx === 5) {
    // ISL-05: Heliostat Solar Array & Fusion Core
    const reactorPedestal = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 4.2, 3.6, 20), mats.darkSteelMat);
    reactorPedestal.position.y = 1.8;
    archGroup.add(reactorPedestal);

    const tokamakGroup = new THREE.Group();
    tokamakGroup.position.y = 7.2;
    const outerTorus = new THREE.Mesh(
      new THREE.TorusGeometry(3.4, 0.65, 16, 40),
      new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xeab308,
        emissiveIntensity: 0.7,
        roughness: 0.2,
        metalness: 0.8,
      })
    );
    outerTorus.rotation.x = Math.PI / 2;
    const innerCore = new THREE.Mesh(
      new THREE.SphereGeometry(1.65, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    tokamakGroup.add(outerTorus, innerCore);
    archGroup.add(tokamakGroup);
    dynamicArchParts.push({ type: 'tokamak', mesh: tokamakGroup, speed: 0.9 });

    const mirrorMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.08, metalness: 0.9 });
    const beamMat = new THREE.LineBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.75 });
    for (let m = 0; m < 10; m++) {
      const ang = (m / 10) * Math.PI * 2;
      const dist = 8.4;
      const mx = Math.cos(ang) * dist;
      const mz = Math.sin(ang) * dist;
      const mGroup = new THREE.Group();
      mGroup.position.set(mx, 1.2, mz);
      mGroup.lookAt(0, 7.2, 0);
      const panel = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.8, 0.12), mirrorMat);
      mGroup.add(panel);
      archGroup.add(mGroup);

      const beamGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(mx, 1.4, mz),
        new THREE.Vector3(0, 7.2, 0),
      ]);
      const beamLine = new THREE.Line(beamGeo, beamMat);
      archGroup.add(beamLine);
      islandFX.solarBeams.push(beamLine);
    }
  } else if (idx === 6) {
    // ISL-06: Avionics Hangar & Customizer Lab
    const hangarDeck = new THREE.Mesh(new THREE.BoxGeometry(13.5, 0.5, 10.5), mats.darkSteelMat);
    hangarDeck.position.y = 0.25;
    archGroup.add(hangarDeck);

    for (let a = -1.5; a <= 1.5; a += 1.0) {
      const archRib = new THREE.Mesh(
        new THREE.TorusGeometry(6.2, 0.38, 12, 32, Math.PI),
        mats.architecturalWhiteMat
      );
      archRib.position.set(0, 0.5, a * 2.8);
      archGroup.add(archRib);
    }

    const glassRoof = new THREE.Mesh(
      new THREE.CylinderGeometry(6.0, 6.0, 9.2, 24, 1, true, -Math.PI * 0.35, Math.PI * 0.7),
      mats.glassFacadeMat
    );
    glassRoof.rotation.z = Math.PI / 2;
    glassRoof.rotation.y = Math.PI / 2;
    glassRoof.position.y = 0.5;
    archGroup.add(glassRoof);

    const calRing = new THREE.Mesh(
      new THREE.RingGeometry(2.8, 3.8, 36),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75, side: THREE.DoubleSide })
    );
    calRing.rotation.x = -Math.PI / 2;
    calRing.position.y = 0.6;
    archGroup.add(calRing);
    islandFX.hangarScanRing = calRing;
  } else if (idx === 7) {
    // ISL-07: Zen Pagoda & Sakura Sky-Garden
    const crimsonMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.4, metalness: 0.2 });
    const roofSlateMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.4 });

    for (let tier = 0; tier < 3; tier++) {
      const w = 7.2 - tier * 1.6;
      const yBase = tier * 3.4;
      const room = new THREE.Mesh(new THREE.BoxGeometry(w, 2.6, w), mats.warmInteriorGlowMat);
      room.position.y = yBase + 1.3;
      const eaves = new THREE.Mesh(new THREE.ConeGeometry(w * 0.95, 1.4, 4), roofSlateMat);
      eaves.rotation.y = Math.PI / 4;
      eaves.position.y = yBase + 3.1;
      archGroup.add(room, eaves);
    }

    const toriiGroup = new THREE.Group();
    toriiGroup.position.set(0, 0, 6.2);
    const pL = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 4.2, 12), crimsonMat);
    pL.position.set(-2.1, 2.1, 0);
    const pR = pL.clone();
    pR.position.x = 2.1;
    const topBeam = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.35, 0.45), crimsonMat);
    topBeam.position.y = 4.1;
    const subBeam = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.22, 0.3), crimsonMat);
    subBeam.position.y = 3.3;
    toriiGroup.add(pL, pR, topBeam, subBeam);
    archGroup.add(toriiGroup);

    const sakuraMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.7 });
    [
      [-6.5, -2.0],
      [6.5, -2.0],
      [-5.8, 3.5],
      [5.8, 3.5],
    ].forEach(([sx, sz]) => {
      const sTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, 2.4, 8), mats.warmWoodMat);
      sTrunk.position.set(sx, 1.2, sz);
      const sCrown = new THREE.Mesh(new THREE.DodecahedronGeometry(2.1, 1), sakuraMat);
      sCrown.position.set(sx, 3.1, sz);
      sCrown.scale.y = 0.68;
      archGroup.add(sTrunk, sCrown);
    });

    const lanternMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
    for (let l = 0; l < 14; l++) {
      const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.2, 0.65, 10), lanternMat);
      const ang = (l / 14) * Math.PI * 2;
      const rad = 3.5 + (l % 3) * 2.2;
      lantern.position.set(Math.cos(ang) * rad, 3.0 + (l % 5) * 3.2, Math.sin(ang) * rad);
      archGroup.add(lantern);
      islandFX.skyLanterns.push({
        mesh: lantern,
        baseAngle: ang,
        rad,
        speed: 1.2 + (l % 3) * 0.45,
      });
    }
  } else if (idx === 8) {
    // ISL-08: Acoustic Amphitheater & Kinetic Stage
    for (let step = 0; step < 4; step++) {
      const outerR = 9.0 - step * 1.2;
      const tierRing = new THREE.Mesh(
        new THREE.CylinderGeometry(outerR, outerR + 0.4, 0.7, 28, 1, false, Math.PI * 0.15, Math.PI * 1.7),
        mats.travertineMat
      );
      tierRing.rotation.y = -Math.PI * 0.85;
      tierRing.position.y = step * 0.7 + 0.35;
      archGroup.add(tierRing);
    }

    const sonicGroup = new THREE.Group();
    sonicGroup.position.y = 5.4;
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.2, metalness: 0.85 });
    for (let rIdx = 0; rIdx < 3; rIdx++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2 + rIdx * 0.85, 0.12, 12, 36), goldMat);
      ring.rotation.x = rIdx * 0.6;
      ring.rotation.y = rIdx * 0.8;
      sonicGroup.add(ring);
    }
    archGroup.add(sonicGroup);
    dynamicArchParts.push({ type: 'sonic', mesh: sonicGroup, speed: 0.8 });

    const eqMat = new THREE.MeshStandardMaterial({
      color: 0x2dd4bf,
      emissive: 0x0d9488,
      emissiveIntensity: 0.6,
    });
    for (let q = 0; q < 12; q++) {
      const qAng = Math.PI * 0.8 + (q / 11) * Math.PI * 1.4;
      const eqBar = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.0, 0.55), eqMat);
      eqBar.position.set(Math.cos(qAng) * 5.2, 2.0, Math.sin(qAng) * 5.2);
      archGroup.add(eqBar);
      islandFX.eqBars.push({ mesh: eqBar, index: q });
    }
  } else if (idx === 9) {
    // ISL-09: Stratosphere Summit & Deep-Space Array
    const baseTerminal = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 6.2, 5.5, 16), mats.glassFacadeMat);
    baseTerminal.position.y = 2.75;
    const termGlow = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 4.4, 5.0, 12), mats.warmInteriorGlowMat);
    termGlow.position.y = 2.75;
    const obsRing = new THREE.Mesh(new THREE.CylinderGeometry(6.4, 5.8, 0.8, 24), mats.architecturalWhiteMat);
    obsRing.position.y = 5.8;

    const spireTower = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 2.2, 22.0, 12),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.7, wireframe: true })
    );
    spireTower.position.y = 16.8;

    const spireCore = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.65, 24.0, 12), mats.architecturalWhiteMat);
    spireCore.position.y = 17.8;

    const topBeacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b })
    );
    topBeacon.position.y = 30.2;

    const uplinkPillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 1.35, 180, 16),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.55 })
    );
    uplinkPillar.position.y = 115.0;
    uplinkPillar.visible = false;
    islandFX.uplinkPillar = uplinkPillar;

    archGroup.add(baseTerminal, termGlow, obsRing, spireTower, spireCore, topBeacon, uplinkPillar);

    [
      [-7.5, -2.0],
      [7.5, -2.0],
      [0, -8.5],
    ].forEach(([dx, dz], dIdx) => {
      const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.7, 2.6, 10), mats.darkSteelMat);
      ped.position.set(dx, 1.3, dz);
      const dishPivot = new THREE.Group();
      dishPivot.position.set(dx, 2.8, dz);
      const dish = new THREE.Mesh(
        new THREE.SphereGeometry(2.4, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.42),
        mats.architecturalWhiteMat
      );
      dish.rotation.x = Math.PI * 0.75;
      dishPivot.add(dish);
      archGroup.add(ped, dishPivot);
      dynamicArchParts.push({ type: 'dish', mesh: dishPivot, speed: 0.3 + dIdx * 0.1 });
    });
  }
}
