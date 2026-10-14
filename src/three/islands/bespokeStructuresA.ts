import * as THREE from 'three';
import { StationMetadata } from '../../types/lab';
import {
  DynamicArchPart,
  IslandFXHandles,
  IslandMaterialPalette,
} from './islandTypesAndMaterials';

export function buildBespokeStructuresA(
  idx: number,
  st: StationMetadata,
  archGroup: THREE.Group,
  scene: THREE.Scene,
  mats: IslandMaterialPalette,
  islandFX: IslandFXHandles,
  windTurbineRotors: THREE.Group[],
  waterfallDroplets: { mesh: THREE.Mesh; topY: number; bottomY: number; speed: number }[],
  dynamicArchParts: DynamicArchPart[]
): void {
  if (idx === 0) {
    // ISL-00: Central Sanctuary Rotunda
    const poolRim = new THREE.Mesh(new THREE.CylinderGeometry(8.2, 8.4, 0.24, 32), mats.travertineMat);
    poolRim.position.y = 0.12;
    const poolWater = new THREE.Mesh(
      new THREE.CylinderGeometry(7.8, 7.8, 0.26, 32),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.35 })
    );
    poolWater.position.y = 0.14;
    archGroup.add(poolRim, poolWater);

    const coreFloor1 = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 4.8, 3.6, 24), mats.glassFacadeMat);
    coreFloor1.position.y = 1.9;
    const innerGlow1 = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 3.3, 20), mats.warmInteriorGlowMat);
    innerGlow1.position.y = 1.9;
    const midSlab = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 5.4, 0.35, 24), mats.architecturalWhiteMat);
    midSlab.position.y = 3.8;
    const coreFloor2 = new THREE.Mesh(new THREE.CylinderGeometry(3.9, 3.9, 2.8, 24), mats.glassFacadeMat);
    coreFloor2.position.y = 5.4;
    const timberRoof = new THREE.Mesh(new THREE.ConeGeometry(6.2, 2.2, 24), mats.warmWoodMat);
    timberRoof.position.y = 7.8;
    archGroup.add(coreFloor1, innerGlow1, midSlab, coreFloor2, timberRoof);

    for (let c = 0; c < 8; c++) {
      const ang = (c / 8) * Math.PI * 2;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 6.8, 8), mats.darkSteelMat);
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
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.35 })
    );
    holoGlobe.position.y = 10.6;
    archGroup.add(holoGlobe);
    islandFX.rotundaGlobe = holoGlobe;
  } else if (idx === 1) {
    // ISL-01: Cantilevered Bio & Observatory
    const groundWing = new THREE.Mesh(new THREE.BoxGeometry(10.5, 3.4, 6.2), mats.architecturalWhiteMat);
    groundWing.position.set(-1.2, 1.7, 0);
    groundWing.castShadow = true;
    const glassStudio = new THREE.Mesh(new THREE.BoxGeometry(9.8, 2.6, 6.4), mats.glassFacadeMat);
    glassStudio.position.set(-1.2, 1.7, 0);
    const studioGlow = new THREE.Mesh(new THREE.BoxGeometry(8.2, 2.2, 4.8), mats.warmInteriorGlowMat);
    studioGlow.position.set(-1.2, 1.7, 0);

    const upperWing = new THREE.Mesh(new THREE.BoxGeometry(12.5, 3.0, 5.4), mats.architecturalWhiteMat);
    upperWing.position.set(1.4, 4.9, 0.4);
    upperWing.castShadow = true;
    const upperGlass = new THREE.Mesh(new THREE.BoxGeometry(11.6, 2.2, 5.55), mats.glassFacadeMat);
    upperGlass.position.set(1.4, 4.9, 0.4);

    const obsTower = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 7.2, 20), mats.architecturalWhiteMat);
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
    // ISL-02: Geodesic R&D Biodome & Wind Lab
    const mainDome = new THREE.Mesh(
      new THREE.SphereGeometry(5.6, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2),
      mats.glassFacadeMat
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
    const bioGlow = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4.2, 1.8, 16), biodomeInnerMat);
    bioGlow.position.y = 0.9;
    archGroup.add(mainDome, mainDomeFrame, bioGlow);

    const subDome = new THREE.Mesh(
      new THREE.SphereGeometry(3.4, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      mats.glassFacadeMat
    );
    subDome.position.set(-6.2, 0, 1.8);
    archGroup.add(subDome);

    [-7.5, 7.8].forEach((tx) => {
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.55, 14.5, 12), mats.architecturalWhiteMat);
      mast.position.set(tx, 7.25, -3.5);
      mast.castShadow = true;
      const nacelle = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 2.4), mats.architecturalWhiteMat);
      nacelle.position.set(tx, 14.5, -3.2);
      const rotorHub = new THREE.Group();
      rotorHub.position.set(tx, 14.5, -2.0);
      for (let b = 0; b < 3; b++) {
        const bladeGroup = new THREE.Group();
        bladeGroup.rotation.z = (b / 3) * Math.PI * 2;
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.38, 5.2, 0.08), mats.architecturalWhiteMat);
        blade.position.y = 2.6;
        bladeGroup.add(blade);
        rotorHub.add(bladeGroup);
      }
      windTurbineRotors.push(rotorHub);
      archGroup.add(mast, nacelle, rotorHub);
    });
  } else if (idx === 3) {
    // ISL-03: Hydro-Cascade Waterfall Terrace
    const deck1 = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.65, 7.2), mats.travertineMat);
    deck1.position.set(0, 1.6, 0);
    const lab1 = new THREE.Mesh(new THREE.BoxGeometry(9.2, 2.8, 5.4), mats.glassFacadeMat);
    lab1.position.set(0, 3.3, -0.4);
    const glow1 = new THREE.Mesh(new THREE.BoxGeometry(7.6, 2.4, 4.2), mats.warmInteriorGlowMat);
    glow1.position.set(0, 3.3, -0.4);

    const deck2 = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.6, 6.4), mats.travertineMat);
    deck2.position.set(-1.2, 4.9, -0.6);
    const lab2 = new THREE.Mesh(new THREE.BoxGeometry(7.2, 2.5, 4.6), mats.architecturalWhiteMat);
    lab2.position.set(-1.2, 6.4, -0.8);
    const roofDeck = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.45, 5.6), mats.warmWoodMat);
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

    const dropMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.78 });
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
    // ISL-04: Helix Neural AI & Vision Spire
    const basePodium = new THREE.Mesh(new THREE.CylinderGeometry(5.8, 6.4, 2.2, 24), mats.architecturalWhiteMat);
    basePodium.position.y = 1.1;
    archGroup.add(basePodium);

    const coreGlass = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 16.0, 20), mats.glassFacadeMat);
    coreGlass.position.y = 9.0;
    const coreLight = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 15.2, 16), mats.warmInteriorGlowMat);
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

      const bridge = new THREE.Mesh(new THREE.BoxGeometry(rad * 2, 0.16, 0.45), mats.architecturalWhiteMat);
      bridge.position.set(0, yPos, 0);
      bridge.rotation.y = -angle;
      helixGroup.add(n1, n2, bridge);
    }
    archGroup.add(helixGroup);
    dynamicArchParts.push({ type: 'spinY', mesh: helixGroup, speed: 0.35 });
  }
}
