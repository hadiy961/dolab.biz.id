import {
  AtmosphereMode,
  FlightProfileConfig,
  FlightProfileKey,
  WeatherPresetMetadata,
} from '../types/lab';

export const FLIGHT_PROFILES: Record<FlightProfileKey, FlightProfileConfig> = {
  CINEMA: { speed: 16.0, boost: 26.0, yaw: 1.4, tilt: 0.14, damping: 0.25 },
  SPORT: { speed: 25.0, boost: 42.0, yaw: 2.2, tilt: 0.24, damping: 0.18 },
  ACRO: { speed: 34.0, boost: 56.0, yaw: 3.1, tilt: 0.38, damping: 0.12 },
};

export const WEATHER_PRESETS: Record<AtmosphereMode, WeatherPresetMetadata> = {
  0: {
    mode: 0,
    code: 'DAYLIGHT',
    name: { id: 'Cerah Tenang', en: 'Serene Daylight' },
    baseWindKt: 3.2,
    gustKt: 1.1,
    turbulenceG: 0.02,
    visibilityPct: 100,
    autoSpotlight: false,
  },
  1: {
    mode: 1,
    code: 'SUNSET',
    name: { id: 'Senja Keemasan', en: 'Golden Sunset' },
    baseWindKt: 5.4,
    gustKt: 2.2,
    turbulenceG: 0.05,
    visibilityPct: 92,
    autoSpotlight: false,
  },
  2: {
    mode: 2,
    code: 'TWILIGHT',
    name: { id: 'Malam Siber', en: 'Calm Twilight' },
    baseWindKt: 4.5,
    gustKt: 1.8,
    turbulenceG: 0.04,
    visibilityPct: 80,
    autoSpotlight: true,
  },
  3: {
    mode: 3,
    code: 'STORM',
    name: { id: 'Badai & Angin Kencang', en: 'Storm / High-Wind' },
    baseWindKt: 22.5,
    gustKt: 11.5,
    turbulenceG: 0.65,
    visibilityPct: 42,
    autoSpotlight: true,
  },
  4: {
    mode: 4,
    code: 'DENSE_FOG',
    name: { id: 'Kabut Tebal Stratosfer', en: 'Dense Fog' },
    baseWindKt: 9.8,
    gustKt: 4.6,
    turbulenceG: 0.22,
    visibilityPct: 16,
    autoSpotlight: true,
  },
};

export type FlightPlanPresetKey = 'energy-loop' | 'summit-recon' | 'full-perimeter';

export const PRESET_FLIGHT_PLANS: Record<
  FlightPlanPresetKey,
  { id: number; altOffset: number; speedPct: number }[]
> = {
  'energy-loop': [
    { id: 5, altOffset: 10, speedPct: 105 },
    { id: 2, altOffset: 12, speedPct: 115 },
    { id: 4, altOffset: 14, speedPct: 100 },
    { id: 0, altOffset: 8, speedPct: 90 },
  ],
  'summit-recon': [
    { id: 1, altOffset: 12, speedPct: 100 },
    { id: 7, altOffset: 15, speedPct: 110 },
    { id: 9, altOffset: 18, speedPct: 125 },
    { id: 8, altOffset: 10, speedPct: 95 },
  ],
  'full-perimeter': [
    { id: 0, altOffset: 8, speedPct: 100 },
    { id: 1, altOffset: 10, speedPct: 110 },
    { id: 5, altOffset: 12, speedPct: 115 },
    { id: 7, altOffset: 12, speedPct: 110 },
    { id: 6, altOffset: 10, speedPct: 105 },
    { id: 2, altOffset: 12, speedPct: 115 },
    { id: 8, altOffset: 10, speedPct: 110 },
    { id: 4, altOffset: 12, speedPct: 110 },
    { id: 9, altOffset: 16, speedPct: 125 },
    { id: 3, altOffset: 10, speedPct: 100 },
  ],
};
