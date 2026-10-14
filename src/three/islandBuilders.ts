import * as THREE from 'three';
import { STATIONS } from '../data/stations';
import { StationMetadata } from '../types/lab';
import { createHelipadTexture, createSculptedRockCliffGeometry } from './textures';

export interface IslandFXHandles {
  fountainJets: { mesh: THREE.Mesh; phase: number }[];
  rotundaGlobe: THREE.Mesh | null;
  obsPivot: THREE.Group | null;
  obsLaser: THREE.Mesh | null;
  biodomeCoreMat: THREE.MeshStandardMaterial | null;
  rainbowMesh: THREE.Mesh | null;
  helixNodes: THREE.MeshStandardMaterial[];
  solarBeams: THREE.Line[];
  hangarScanRing: THREE.Mesh | null;
  skyLanterns: { mesh: THREE.Mesh; baseAngle: number; rad: number; speed: number }[];
  eqBars: { mesh: THREE.Mesh; index: number }[];
  uplinkPillar: THREE.Mesh | null;
}

export interface StationSceneObject {
  data: StationMetadata;
  group: THREE.Group;
  artifactMesh: THREE.Mesh;
  holoRing: THREE.Mesh;
  beaconY: number;
  padBeaconRing: THREE.Mesh;
}

export interface ArchipelagoBuildResult {
  stationObjects: StationSceneObject[];
  windTurbineRotors: THREE.Group[];
  waterfallDroplets: { mesh: THREE.Mesh; topY: number; bottomY: number; speed: number }[];
  skyPathLines: { stationId: number; line: THREE.Line }[];
  gravityRingMeshes: { ring: THREE.Mesh; core: THREE.Mesh }[];
  interiorGlowMaterials: THREE.MeshStandardMaterial[];
  dynamicArchParts: { type: 'spinY' | 'tokamak' | 'sonic' | 'dish'; mesh: THREE.Group; speed: number }[];
  islandFX: IslandFXHandles;
}

export function buildSkyArchipelago(scene: THREE.Scene): ArchipelagoBuildResult {
  const stationObjects: StationSceneObject[] = [];
  const windTurbineRotors: THREE.Group[] = [];
  const waterfallDroplets: { mesh: THREE.Mesh; topY: number; bottomY: number; speed: number }[] = [];
  const skyPathLines: { stationId: number; line: THREE.Line }[] = [];
  const gravityRingMeshes: { ring: THREE.Mesh; core: THREE.Mesh }[] = [];
  const interiorGlowMaterials: THREE.MeshStandardMaterial[] = [];
  const dynamicArchParts: { type: 'spinY' | 'tokamak' | 'sonic' | 'dish'; mesh: THREE.Group; speed: number }[] = [];

  const islandFX: IslandFXHandles = {
    fountainJets: [],
    rotundaGlobe: null,
    obsPivot: null,
    obsLaser: null,
    biodomeCoreMat: null,
    rainbowMesh: null,
    helixNodes: [],
    solarBeams: [],
    hangarScanRing: null,
    skyLanterns: [],
    eqBars: [],
    uplinkPillar: null,
  };

  const cliffRockMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.88,
    metalness: 0.08,
    flatShading: true,
  });
  const deepRockMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.92,
    metalness: 0.05,
    flatShading: true,
  });
  const grassTopMat = new THREE.MeshStandardMaterial({
    color: 0x86efac,
    roughness: 0.78,
    metalness: 0.02,
  });
  const travertineMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.45,
    metalness: 0.1,
  });
  const architecturalWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.3,
    metalness: 0.15,
  });
  const darkSteelMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.35,
    metalness: 0.75,
  });
  const warmWoodMat = new THREE.MeshStandardMaterial({
    color: 0xb45309,
    roughness: 0.65,
    metalness: 0.08,
  });
  const glassFacadeMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.42,
    roughness: 0.1,
    metalness: 0.25,
    transmission: 0.4,
  });
  const warmInteriorGlowMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.45,
    roughness: 0.4,
  });
  interiorGlowMaterials.push(warmInteriorGlowMat);

  STATIONS.forEach((st, idx) => {
    const islandGroup = new THREE.Group();
    islandGroup.position.set(st.position.x, st.position.y, st.position.z);

    const r = st.islandRadius;
    const d = st.islandDepth;

    // 1. Sculpted Floating Cliff Base
    const cliffGeo = createSculptedRockCliffGeometry(r, r * 0.36, d, 18);
    const cliffMesh = new THREE.Mesh(cliffGeo, cliffRockMat);
    cliffMesh.position.y = -d * 0.5;
    cliffMesh.receiveShadow = true;
    islandGroup.add(cliffMesh);

    const lowerSpireGeo = createSculptedRockCliffGeometry(r * 0.42, 0.8, d * 0.55, 12);
    const lowerSpire = new THREE.Mesh(lowerSpireGeo, deepRockMat);
    lowerSpire.position.y = -d * 0.82;
    islandGroup.add(lowerSpire);

    // Sub-Island Aero-Gravity Stabilizer Ring
    const gravAssembly = new THREE.Group();
    gravAssembly.position.y = -d * 0.54;
    const gravOuterRing = new THREE.Mesh(
      new THREE.TorusGeometry(r * 0.48, 0.22, 10, 36),
      darkSteelMat
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
      grassTopMat
    );
    meadowCap.position.y = 0.7;
    meadowCap.receiveShadow = true;
    islandGroup.add(meadowCap);

    const terraceDeck = new THREE.Mesh(
      new THREE.CylinderGeometry(r * 0.74, r * 0.78, 0.5, 28),
      travertineMat
    );
    terraceDeck.position.y = 1.65;
    terraceDeck.receiveShadow = true;
    islandGroup.add(terraceDeck);

    // 3. Dedicated Helipad Deck at Front of Island (+Z)
    const padLocalZ = 12.0;
    const helipadBase = new THREE.Mesh(
      new THREE.CylinderGeometry(4.2, 4.6, 0.45, 28),
      darkSteelMat
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

    const walkwayBridge = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.18, 8.5), travertineMat);
    walkwayBridge.position.set(0, 1.92, 5.2);
    walkwayBridge.receiveShadow = true;
    islandGroup.add(walkwayBridge);

    [-1.4, 1.4].forEach((bx) => {
      [2.5, 5.2, 7.8].forEach((bz) => {
        const bollard = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 0.55, 8),
          darkSteelMat
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
    const beaconHeights = [12.5, 15.0, 13.5, 13.0, 21.0, 16.0, 14.5, 18.0, 14.0, 35.5];
    const beaconY = beaconHeights[idx] || 14.0;

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

    // 5. Unique Architectural Complex per Island (00 - 09)
    const archGroup = new THREE.Group();
    archGroup.position.set(0, 1.9, -5.5);

    if (idx === 0) {
      const poolRim = new THREE.Mesh(new THREE.CylinderGeometry(8.2, 8.4, 0.24, 32), travertineMat);
      poolRim.position.y = 0.12;
      const poolWater = new THREE.Mesh(
        new THREE.CylinderGeometry(7.8, 7.8, 0.26, 32),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.35 })
      );
      poolWater.position.y = 0.14;
      archGroup.add(poolRim, poolWater);

      const coreFloor1 = new THREE.Mesh(
        new THREE.CylinderGeometry(4.8, 4.8, 3.6, 24),
        glassFacadeMat
      );
      coreFloor1.position.y = 1.9;
      const innerGlow1 = new THREE.Mesh(
        new THREE.CylinderGeometry(3.2, 3.2, 3.3, 20),
        warmInteriorGlowMat
      );
      innerGlow1.position.y = 1.9;
      const midSlab = new THREE.Mesh(
        new THREE.CylinderGeometry(5.6, 5.4, 0.35, 24),
        architecturalWhiteMat
      );
      midSlab.position.y = 3.8;
      const coreFloor2 = new THREE.Mesh(
        new THREE.CylinderGeometry(3.9, 3.9, 2.8, 24),
        glassFacadeMat
      );
      coreFloor2.position.y = 5.4;
      const timberRoof = new THREE.Mesh(new THREE.ConeGeometry(6.2, 2.2, 24), warmWoodMat);
      timberRoof.position.y = 7.8;
      archGroup.add(coreFloor1, innerGlow1, midSlab, coreFloor2, timberRoof);

      for (let c = 0; c < 8; c++) {
        const ang = (c / 8) * Math.PI * 2;
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 6.8, 8), darkSteelMat);
        col.position.set(Math.cos(ang) * 5.0, 3.5, Math.sin(ang) * 5.0);
        archGroup.add(col);

        const jetMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.18, 3.4, 8),
          new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.75 })
        );
        jetMesh.position.set(Math.cos(ang) * 6.8, 1.8, Math.sin(ang) * 6.8);
        archGroup.add(jetMesh);
        islandFX.fountainJets.push({ mesh: jetMesh, phase: c * 0.8 });
      }

      const holoGlobe = new THREE.Mesh(
        new THREE.SphereGeometry(2.6, 16, 12),
        new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          wireframe: true,
          transparent: true,
          opacity: 0.35,
        })
      );
      holoGlobe.position.y = 10.6;
      archGroup.add(holoGlobe);
      islandFX.rotundaGlobe = holoGlobe;
    } else if (idx === 1) {
      const groundWing = new THREE.Mesh(
        new THREE.BoxGeometry(10.5, 3.4, 6.2),
        architecturalWhiteMat
      );
      groundWing.position.set(-1.2, 1.7, 0);
      groundWing.castShadow = true;
      const glassStudio = new THREE.Mesh(new THREE.BoxGeometry(9.8, 2.6, 6.4), glassFacadeMat);
      glassStudio.position.set(-1.2, 1.7, 0);
      const studioGlow = new THREE.Mesh(new THREE.BoxGeometry(8.2, 2.2, 4.8), warmInteriorGlowMat);
      studioGlow.position.set(-1.2, 1.7, 0);

      const upperWing = new THREE.Mesh(
        new THREE.BoxGeometry(12.5, 3.0, 5.4),
        architecturalWhiteMat
      );
      upperWing.position.set(1.4, 4.9, 0.4);
      upperWing.castShadow = true;
      const upperGlass = new THREE.Mesh(new THREE.BoxGeometry(11.6, 2.2, 5.55), glassFacadeMat);
      upperGlass.position.set(1.4, 4.9, 0.4);

      const obsTower = new THREE.Mesh(
        new THREE.CylinderGeometry(3.2, 3.4, 7.2, 20),
        architecturalWhiteMat
      );
      obsTower.position.set(4.5, 3.6, -1.5);

      const obsPivot = new THREE.Group();
      obsPivot.position.set(4.5, 7.2, -1.5);
      const obsDome = new THREE.Mesh(
        new THREE.SphereGeometry(3.15, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.25, metalness: 0.65 })
      );
      const laserBeam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.22, 95, 10),
        new THREE.MeshBasicMaterial({ color: 0x818cf8, transparent: true, opacity: 0.75 })
      );
      laserBeam.position.set(0, 32, -32);
      laserBeam.rotation.x = -Math.PI / 4;
      laserBeam.visible = false;
      obsPivot.add(obsDome, laserBeam);
      islandFX.obsPivot = obsPivot;
      islandFX.obsLaser = laserBeam;

      archGroup.add(groundWing, glassStudio, studioGlow, upperWing, upperGlass, obsTower, obsPivot);
    } else if (idx === 2) {
      const mainDome = new THREE.Mesh(
        new THREE.SphereGeometry(5.6, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2),
        glassFacadeMat
      );
      const mainDomeFrame = new THREE.Mesh(
        new THREE.SphereGeometry(5.65, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, wireframe: true })
      );
      const biodomeInnerMat = new THREE.MeshStandardMaterial({
        color: 0x4ade80,
        emissive: 0x10b981,
        emissiveIntensity: 0.35,
        roughness: 0.6,
      });
      islandFX.biodomeCoreMat = biodomeInnerMat;
      const bioGlow = new THREE.Mesh(
        new THREE.CylinderGeometry(3.5, 4.2, 1.8, 16),
        biodomeInnerMat
      );
      bioGlow.position.y = 0.9;
      archGroup.add(mainDome, mainDomeFrame, bioGlow);

      const subDome = new THREE.Mesh(
        new THREE.SphereGeometry(3.4, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        glassFacadeMat
      );
      subDome.position.set(-6.2, 0, 1.8);
      archGroup.add(subDome);

      [-7.5, 7.8].forEach((tx) => {
        const mast = new THREE.Mesh(
          new THREE.CylinderGeometry(0.25, 0.55, 14.5, 12),
          architecturalWhiteMat
        );
        mast.position.set(tx, 7.25, -3.5);
        mast.castShadow = true;
        const nacelle = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 2.4), architecturalWhiteMat);
        nacelle.position.set(tx, 14.5, -3.2);
        const rotorHub = new THREE.Group();
        rotorHub.position.set(tx, 14.5, -2.0);
        for (let b = 0; b < 3; b++) {
          const bladeGroup = new THREE.Group();
          bladeGroup.rotation.z = (b / 3) * Math.PI * 2;
          const blade = new THREE.Mesh(
            new THREE.BoxGeometry(0.38, 5.2, 0.08),
            architecturalWhiteMat
          );
          blade.position.y = 2.6;
          bladeGroup.add(blade);
          rotorHub.add(bladeGroup);
        }
        windTurbineRotors.push(rotorHub);
        archGroup.add(mast, nacelle, rotorHub);
      });
    } else if (idx === 3) {
      const deck1 = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.65, 7.2), travertineMat);
      deck1.position.set(0, 1.6, 0);
      const lab1 = new THREE.Mesh(new THREE.BoxGeometry(9.2, 2.8, 5.4), glassFacadeMat);
      lab1.position.set(0, 3.3, -0.4);
      const glow1 = new THREE.Mesh(new THREE.BoxGeometry(7.6, 2.4, 4.2), warmInteriorGlowMat);
      glow1.position.set(0, 3.3, -0.4);

      const deck2 = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.6, 6.4), travertineMat);
      deck2.position.set(-1.2, 4.9, -0.6);
      const lab2 = new THREE.Mesh(new THREE.BoxGeometry(7.2, 2.5, 4.6), architecturalWhiteMat);
      lab2.position.set(-1.2, 6.4, -0.8);
      const roofDeck = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.45, 5.6), warmWoodMat);
      roofDeck.position.set(-1.2, 7.8, -0.8);

      const riverChannel = new THREE.Mesh(
        new THREE.BoxGeometry(3.6, 0.22, 16.5),
        new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.15, metalness: 0.3 })
      );
      riverChannel.position.set(3.2, 0.12, -2.5);

      const rainbowArc = new THREE.Mesh(
        new THREE.TorusGeometry(6.8, 0.35, 12, 36, Math.PI),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.42 })
      );
      rainbowArc.position.set(2.2, 1.5, -8.5);
      rainbowArc.rotation.y = Math.PI * 0.18;
      islandFX.rainbowMesh = rainbowArc;

      archGroup.add(deck1, lab1, glow1, deck2, lab2, roofDeck, riverChannel, rainbowArc);

      const dropMat = new THREE.MeshBasicMaterial({
        color: 0xe0f2fe,
        transparent: true,
        opacity: 0.78,
      });
      for (let w = 0; w < 28; w++) {
        const drop = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.35, 0.22), dropMat);
        drop.position.set(
          st.position.x + 2.0 + Math.random() * 2.4,
          st.position.y - Math.random() * 18.0,
          st.position.z - 16.2 + (Math.random() - 0.5) * 0.8
        );
        scene.add(drop);
        waterfallDroplets.push({
          mesh: drop,
          topY: st.position.y + 1.5,
          bottomY: st.position.y - 20.0,
          speed: 9.0 + Math.random() * 5.0,
        });
      }
    } else if (idx === 4) {
      const basePodium = new THREE.Mesh(
        new THREE.CylinderGeometry(5.8, 6.4, 2.2, 24),
        architecturalWhiteMat
      );
      basePodium.position.y = 1.1;
      archGroup.add(basePodium);

      const coreGlass = new THREE.Mesh(
        new THREE.CylinderGeometry(2.6, 2.6, 16.0, 20),
        glassFacadeMat
      );
      coreGlass.position.y = 9.0;
      const coreLight = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 15.2, 16),
        warmInteriorGlowMat
      );
      coreLight.position.y = 9.0;
      archGroup.add(coreGlass, coreLight);

      const helixGroup = new THREE.Group();
      for (let h = 0; h < 14; h++) {
        const yPos = 2.4 + h * 1.05;
        const angle = h * 0.48;
        const rad = 4.2;
        const x1 = Math.cos(angle) * rad;
        const z1 = Math.sin(angle) * rad;
        const x2 = Math.cos(angle + Math.PI) * rad;
        const z2 = Math.sin(angle + Math.PI) * rad;

        const rungNodeMat = new THREE.MeshStandardMaterial({
          color: 0xa855f7,
          emissive: 0x7e22ce,
          emissiveIntensity: 0.5,
          roughness: 0.2,
        });
        const n1 = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 12), rungNodeMat);
        n1.position.set(x1, yPos, z1);
        const n2 = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 12), rungNodeMat);
        n2.position.set(x2, yPos, z2);
        islandFX.helixNodes.push(rungNodeMat);

        const bridge = new THREE.Mesh(
          new THREE.BoxGeometry(rad * 2, 0.16, 0.45),
          architecturalWhiteMat
        );
        bridge.position.set(0, yPos, 0);
        bridge.rotation.y = -angle;
        helixGroup.add(n1, n2, bridge);
      }
      archGroup.add(helixGroup);
      dynamicArchParts.push({ type: 'spinY', mesh: helixGroup, speed: 0.35 });
    } else if (idx === 5) {
      const reactorPedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(3.2, 4.2, 3.6, 20),
        darkSteelMat
      );
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

      const mirrorMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        roughness: 0.08,
        metalness: 0.9,
      });
      const beamMat = new THREE.LineBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.75,
      });
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
      const hangarDeck = new THREE.Mesh(new THREE.BoxGeometry(13.5, 0.5, 10.5), darkSteelMat);
      hangarDeck.position.y = 0.25;
      archGroup.add(hangarDeck);

      for (let a = -1.5; a <= 1.5; a += 1.0) {
        const archRib = new THREE.Mesh(
          new THREE.TorusGeometry(6.2, 0.38, 12, 32, Math.PI),
          architecturalWhiteMat
        );
        archRib.position.set(0, 0.5, a * 2.8);
        archGroup.add(archRib);
      }

      const glassRoof = new THREE.Mesh(
        new THREE.CylinderGeometry(6.0, 6.0, 9.2, 24, 1, true, -Math.PI * 0.35, Math.PI * 0.7),
        glassFacadeMat
      );
      glassRoof.rotation.z = Math.PI / 2;
      glassRoof.rotation.y = Math.PI / 2;
      glassRoof.position.y = 0.5;
      archGroup.add(glassRoof);

      const calRing = new THREE.Mesh(
        new THREE.RingGeometry(2.8, 3.8, 36),
        new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.75,
          side: THREE.DoubleSide,
        })
      );
      calRing.rotation.x = -Math.PI / 2;
      calRing.position.y = 0.6;
      archGroup.add(calRing);
      islandFX.hangarScanRing = calRing;
    } else if (idx === 7) {
      const crimsonMat = new THREE.MeshStandardMaterial({
        color: 0xe11d48,
        roughness: 0.4,
        metalness: 0.2,
      });
      const roofSlateMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.5,
        metalness: 0.4,
      });

      for (let tier = 0; tier < 3; tier++) {
        const w = 7.2 - tier * 1.6;
        const yBase = tier * 3.4;
        const room = new THREE.Mesh(new THREE.BoxGeometry(w, 2.6, w), warmInteriorGlowMat);
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
        const sTrunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.22, 0.35, 2.4, 8),
          warmWoodMat
        );
        sTrunk.position.set(sx, 1.2, sz);
        const sCrown = new THREE.Mesh(new THREE.DodecahedronGeometry(2.1, 1), sakuraMat);
        sCrown.position.set(sx, 3.1, sz);
        sCrown.scale.y = 0.68;
        archGroup.add(sTrunk, sCrown);
      });

      const lanternMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
      for (let l = 0; l < 14; l++) {
        const lantern = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 0.2, 0.65, 10),
          lanternMat
        );
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
      for (let step = 0; step < 4; step++) {
        const outerR = 9.0 - step * 1.2;
        const tierRing = new THREE.Mesh(
          new THREE.CylinderGeometry(
            outerR,
            outerR + 0.4,
            0.7,
            28,
            1,
            false,
            Math.PI * 0.15,
            Math.PI * 1.7
          ),
          travertineMat
        );
        tierRing.rotation.y = -Math.PI * 0.85;
        tierRing.position.y = step * 0.7 + 0.35;
        archGroup.add(tierRing);
      }

      const sonicGroup = new THREE.Group();
      sonicGroup.position.y = 5.4;
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        roughness: 0.2,
        metalness: 0.85,
      });
      for (let rIdx = 0; rIdx < 3; rIdx++) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(2.2 + rIdx * 0.85, 0.12, 12, 36),
          goldMat
        );
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
      const baseTerminal = new THREE.Mesh(
        new THREE.CylinderGeometry(5.4, 6.2, 5.5, 16),
        glassFacadeMat
      );
      baseTerminal.position.y = 2.75;
      const termGlow = new THREE.Mesh(
        new THREE.CylinderGeometry(4.0, 4.4, 5.0, 12),
        warmInteriorGlowMat
      );
      termGlow.position.y = 2.75;
      const obsRing = new THREE.Mesh(
        new THREE.CylinderGeometry(6.4, 5.8, 0.8, 24),
        architecturalWhiteMat
      );
      obsRing.position.y = 5.8;

      const spireTower = new THREE.Mesh(
        new THREE.CylinderGeometry(0.65, 2.2, 22.0, 12),
        new THREE.MeshStandardMaterial({
          color: 0xf8fafc,
          roughness: 0.3,
          metalness: 0.7,
          wireframe: true,
        })
      );
      spireTower.position.y = 16.8;

      const spireCore = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.65, 24.0, 12),
        architecturalWhiteMat
      );
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

      archGroup.add(
        baseTerminal,
        termGlow,
        obsRing,
        spireTower,
        spireCore,
        topBeacon,
        uplinkPillar
      );

      [
        [-7.5, -2.0],
        [7.5, -2.0],
        [0, -8.5],
      ].forEach(([dx, dz], dIdx) => {
        const ped = new THREE.Mesh(
          new THREE.CylinderGeometry(0.45, 0.7, 2.6, 10),
          darkSteelMat
        );
        ped.position.set(dx, 1.3, dz);
        const dishPivot = new THREE.Group();
        dishPivot.position.set(dx, 2.8, dz);
        const dish = new THREE.Mesh(
          new THREE.SphereGeometry(2.4, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.42),
          architecturalWhiteMat
        );
        dish.rotation.x = Math.PI * 0.75;
        dishPivot.add(dish);
        archGroup.add(ped, dishPivot);
        dynamicArchParts.push({ type: 'dish', mesh: dishPivot, speed: 0.3 + dIdx * 0.1 });
      });
    }

    islandGroup.add(archGroup);

    // 6. Decorative Pine Trees around Island Perimeter
    for (let t = 0; t < 7; t++) {
      const angle = (t / 7) * Math.PI * 1.5 - Math.PI * 1.25;
      const dist = r * (0.68 + (t % 2) * 0.14);
      const tx = Math.cos(angle) * dist;
      const tz = Math.sin(angle) * dist;
      if (tz > 7.5 && Math.abs(tx) < 5.5) continue;

      const treeGroup = new THREE.Group();
      treeGroup.position.set(tx, 1.4, tz);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 1.4, 7), warmWoodMat);
      trunk.position.y = 0.7;
      const foliage1 = new THREE.Mesh(
        new THREE.ConeGeometry(1.25, 2.6, 8),
        new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 })
      );
      foliage1.position.y = 2.1;
      const foliage2 = new THREE.Mesh(
        new THREE.ConeGeometry(0.95, 2.1, 8),
        new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8 })
      );
      foliage2.position.y = 3.2;
      treeGroup.add(trunk, foliage1, foliage2);
      islandGroup.add(treeGroup);
    }

    scene.add(islandGroup);
    stationObjects.push({
      data: st,
      group: islandGroup,
      artifactMesh,
      holoRing,
      beaconY,
      padBeaconRing,
    });
  });

  // 7. Curved 3D Sky-Pathway Arcs from Central Hub (Island 00) to Islands 01-09
  const hubPos = new THREE.Vector3(
    STATIONS[0].hoverPoint.x,
    STATIONS[0].hoverPoint.y,
    STATIONS[0].hoverPoint.z
  );
  for (let i = 1; i < STATIONS.length; i++) {
    const dest = STATIONS[i];
    const destPos = new THREE.Vector3(dest.hoverPoint.x, dest.hoverPoint.y, dest.hoverPoint.z);
    const midPos = hubPos.clone().lerp(destPos, 0.5);
    midPos.y += 14.0;

    const curve = new THREE.QuadraticBezierCurve3(hubPos, midPos, destPos);
    const points = curve.getPoints(44);
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineDashedMaterial({
      color: dest.colorHex,
      dashSize: 1.6,
      gapSize: 1.1,
      transparent: true,
      opacity: 0.35,
    });
    const skyLine = new THREE.Line(lineGeo, lineMat);
    skyLine.computeLineDistances();
    scene.add(skyLine);
    skyPathLines.push({ stationId: i, line: skyLine });
  }

  return {
    stationObjects,
    windTurbineRotors,
    waterfallDroplets,
    skyPathLines,
    gravityRingMeshes,
    interiorGlowMaterials,
    dynamicArchParts,
    islandFX,
  };
}
