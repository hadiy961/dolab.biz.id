export type Language = 'id' | 'en';

export type FlightPhase = 'LANDED' | 'TAKING_OFF' | 'AIRBORNE' | 'LANDING';

export type FlightProfileKey = 'CINEMA' | 'SPORT' | 'ACRO';

export type DroneLiveryKey = 'pearl' | 'stealth' | 'rescue' | 'royal';

export type CameraMode = 0 | 1 | 2; // 0: Chase, 1: Cockpit, 2: Top-Down

export type AtmosphereMode = 0 | 1 | 2; // 0: Daylight, 1: Sunset, 2: Twilight

export type ProjectCategory = 'ALL' | 'AEROSPACE' | 'AI' | 'SPATIAL';

export interface Vec3Coords {
  x: number;
  y: number;
  z: number;
}

export interface StationMetadata {
  id: number;
  code: string;
  shortName: string;
  colorHex: number;
  badgeColor: string;
  position: Vec3Coords;
  islandRadius: number;
  islandDepth: number;
  hoverPoint: Vec3Coords;
  padPoint: Vec3Coords;
  lookAtPoint: Vec3Coords;
  title: {
    id: string;
    en: string;
  };
}

export interface ProjectCaseStudy {
  title: string;
  category: Exclude<ProjectCategory, 'ALL'>;
  tag: string;
  descId: string;
  descEn: string;
  stack: string;
  metrics: string;
}

export interface TechSkillBenchmark {
  name: string;
  pct: number;
  color: string;
  textCol: string;
  detailId: string;
  detailEn: string;
  bench: string;
}

export interface PublicationItem {
  title: string;
  venue: string;
  summaryId: string;
  summaryEn: string;
  code: string;
}

export interface CommTransmissionLog {
  sender: string;
  msg: string;
  time: string;
}

export interface IslandInteractiveState {
  fountainMode: number; // ISL-00: 0=Calm, 1=Crown Jets, 2=Zenith Pulse
  starTarget: number; // ISL-01: 0=Off, 1=Orion, 2=Vega, 3=Andromeda
  biodomeSpectrum: number; // ISL-02: 0=Emerald, 1=Bio-Cyan, 2=Solar-Amber
  turbineOverdrive: boolean;
  waterfallMode: number; // ISL-03: 0=Normal, 1=Torrent, 2=Anti-Gravity Reverse
  rainbowActive: boolean;
  helixMode: number; // ISL-04: 0=Idle, 1=Synapse Wave, 2=Quantum Overclock
  solarConverge: boolean; // ISL-05: Focus 10 mirror beams into fusion core
  hangarScanner: boolean; // ISL-06: Oscillating calibration laser arch
  lanternsActive: boolean; // ISL-07: Floating warm sky lanterns & sakura swirl
  sonicHarmony: number; // ISL-08: 0=Mute, 1=Ethereal Fifth, 2=Solar Arp, 3=Cosmos
  uplinkBeam: boolean; // ISL-09: Stratospheric deep-space light pillar
}

export interface FlightProfileConfig {
  speed: number;
  boost: number;
  yaw: number;
  tilt: number;
  damping: number;
}
