import * as THREE from 'three';
import { StationMetadata } from '../../types/lab';

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

export type DynamicArchPart = {
  type: 'spinY' | 'tokamak' | 'sonic' | 'dish';
  mesh: THREE.Group;
  speed: number;
};

export interface ArchipelagoBuildResult {
  stationObjects: StationSceneObject[];
  windTurbineRotors: THREE.Group[];
  waterfallDroplets: { mesh: THREE.Mesh; topY: number; bottomY: number; speed: number }[];
  skyPathLines: { stationId: number; line: THREE.Line }[];
  gravityRingMeshes: { ring: THREE.Mesh; core: THREE.Mesh }[];
  interiorGlowMaterials: THREE.MeshStandardMaterial[];
  dynamicArchParts: DynamicArchPart[];
  islandFX: IslandFXHandles;
}

export interface IslandMaterialPalette {
  cliffRockMat: THREE.MeshStandardMaterial;
  deepRockMat: THREE.MeshStandardMaterial;
  grassTopMat: THREE.MeshStandardMaterial;
  travertineMat: THREE.MeshStandardMaterial;
  architecturalWhiteMat: THREE.MeshStandardMaterial;
  darkSteelMat: THREE.MeshStandardMaterial;
  warmWoodMat: THREE.MeshStandardMaterial;
  glassFacadeMat: THREE.MeshPhysicalMaterial;
  warmInteriorGlowMat: THREE.MeshStandardMaterial;
}

export function createIslandMaterialPalette(): IslandMaterialPalette {
  return {
    cliffRockMat: new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.88,
      metalness: 0.08,
      flatShading: true,
    }),
    deepRockMat: new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.92,
      metalness: 0.05,
      flatShading: true,
    }),
    grassTopMat: new THREE.MeshStandardMaterial({
      color: 0x86efac,
      roughness: 0.78,
      metalness: 0.02,
    }),
    travertineMat: new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.45,
      metalness: 0.1,
    }),
    architecturalWhiteMat: new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.3,
      metalness: 0.15,
    }),
    darkSteelMat: new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.75,
    }),
    warmWoodMat: new THREE.MeshStandardMaterial({
      color: 0xb45309,
      roughness: 0.65,
      metalness: 0.08,
    }),
    glassFacadeMat: new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.42,
      roughness: 0.1,
      metalness: 0.25,
      transmission: 0.4,
    }),
    warmInteriorGlowMat: new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.45,
      roughness: 0.4,
    }),
  };
}
