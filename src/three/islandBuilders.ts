import * as THREE from 'three';
import { STATIONS } from '../data/stations';
import {
  ArchipelagoBuildResult,
  createIslandMaterialPalette,
  DynamicArchPart,
  IslandFXHandles,
  StationSceneObject,
} from './islands/islandTypesAndMaterials';
import { buildBaseIslandPlatform } from './islands/baseIslandPlatform';
import { buildBespokeStructuresA } from './islands/bespokeStructuresA';
import { buildBespokeStructuresB } from './islands/bespokeStructuresB';

export type {
  IslandFXHandles,
  StationSceneObject,
  ArchipelagoBuildResult,
} from './islands/islandTypesAndMaterials';

export function buildSkyArchipelago(scene: THREE.Scene): ArchipelagoBuildResult {
  const stationObjects: StationSceneObject[] = [];
  const windTurbineRotors: THREE.Group[] = [];
  const waterfallDroplets: { mesh: THREE.Mesh; topY: number; bottomY: number; speed: number }[] = [];
  const skyPathLines: { stationId: number; line: THREE.Line }[] = [];
  const gravityRingMeshes: { ring: THREE.Mesh; core: THREE.Mesh }[] = [];
  const dynamicArchParts: DynamicArchPart[] = [];

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

  const mats = createIslandMaterialPalette();
  const interiorGlowMaterials = [mats.warmInteriorGlowMat];

  STATIONS.forEach((st, idx) => {
    const base = buildBaseIslandPlatform(st, idx, mats, gravityRingMeshes);
    const archGroup = new THREE.Group();
    archGroup.position.set(0, 1.9, -5.5);

    if (idx <= 4) {
      buildBespokeStructuresA(
        idx,
        st,
        archGroup,
        scene,
        mats,
        islandFX,
        windTurbineRotors,
        waterfallDroplets,
        dynamicArchParts
      );
    } else {
      buildBespokeStructuresB(idx, archGroup, mats, islandFX, dynamicArchParts);
    }

    base.group.add(archGroup);
    scene.add(base.group);
    stationObjects.push({ data: st, ...base });
  });

  // Curved 3D Sky-Pathway Arcs from Central Hub (Island 00) to Islands 01-09
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
